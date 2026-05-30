import { useAuth } from '@/context/auth';
import { supabase } from '@/lib/supabase';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';
type TableStatus = 'libre' | 'pendiente' | 'listo' | 'pendiente-pago' | 'listo-limpiar' | 'cliente-llama';

export type ReadyOrderState = {
  id: string;
  tableId: string;
  tableNumber: number;
  createdAt: string;
};

export type TableState = {
  id: string;
  numero: number;
  capacidad: number;
  activa: boolean;
  status: TableStatus;
  activeOrderId: string | null;
  activeCallId: string | null;
};

type RestaurantInfo = {
  id: string;
  nombre: string;
  logo_url: string | null;
};

type TableRow = {
  id: string;
  numero: number;
  capacidad: number;
  activa: boolean;
  last_cleared_at: string | null;
  active_order_id: string | null;
  active_order_owner_id: string | null;
  active_order_estado: 'activa' | 'lista' | null;
  active_order_created_at: string | null;
  latest_delivered_order_id: string | null;
  latest_delivered_closed_at: string | null;
  latest_delivered_pago_confirmado: boolean | null;
  active_call_id: string | null;
};

const MAX_RECONNECT_MS = 30_000;

export function useTables() {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<RestaurantInfo | null>(null);
  const [tables, setTables] = useState<TableState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [readyOrders, setReadyOrders] = useState<ReadyOrderState[]>([]);
  const [reconnectNonce, setReconnectNonce] = useState(0);
  const reconnectDelayMs = useRef(1000);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError('');

    const { data: restaurants, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, nombre, logo_url')
      .order('created_at', { ascending: true })
      .limit(1);

    if (restaurantError || !restaurants?.[0]) {
      setError(restaurantError?.message ?? 'No se encontró restaurante.');
      setLoading(false);
      return;
    }

    const nextRestaurant = restaurants[0] as RestaurantInfo;
    setRestaurant(nextRestaurant);

    const { data: tableRows, error: tableError } = await supabase.rpc('get_waiter_table_state_snapshot', {
      p_restaurant_id: nextRestaurant.id,
    });

    if (tableError) {
      setError(tableError.message ?? 'No se pudieron cargar las mesas.');
      setLoading(false);
      return;
    }

    const tableData = (tableRows ?? []) as TableRow[];

    const nextTables: TableState[] = tableData.map((table) => {
      const activeOrderId = table.active_order_owner_id === user.id ? table.active_order_id : null;
      const isDeliveredPendingCleanup =
        !!table.latest_delivered_closed_at
        && (!table.last_cleared_at || table.latest_delivered_closed_at > table.last_cleared_at);
      const isAwaitingPayment = isDeliveredPendingCleanup && !table.latest_delivered_pago_confirmado;
      const isReadyToClean = isDeliveredPendingCleanup && !!table.latest_delivered_pago_confirmado;

      let status: TableStatus = 'libre';
      if (table.active_call_id) status = 'cliente-llama';
      else if (table.active_order_estado === 'lista') status = 'listo';
      else if (table.active_order_estado === 'activa') status = 'pendiente';
      else if (isAwaitingPayment) status = 'pendiente-pago';
      else if (isReadyToClean) status = 'listo-limpiar';

      return {
        ...table,
        status,
        activeOrderId,
        activeCallId: table.active_call_id,
      };
    });

    setTables(nextTables);
    setReadyOrders(
      nextTables
        .filter((table) => table.status === 'listo' && table.activeOrderId)
        .map((table) => ({
          id: table.activeOrderId!,
          tableId: table.id,
          tableNumber: table.numero,
          createdAt: tableData.find((row) => row.id === table.id)?.active_order_created_at ?? '',
        }))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    );
    setLoading(false);
  }, [user?.id]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimer.current) return;

    setConnectionStatus('reconnecting');
    const delay = reconnectDelayMs.current;
    reconnectTimer.current = setTimeout(() => {
      reconnectTimer.current = null;
      reconnectDelayMs.current = Math.min(reconnectDelayMs.current * 2, MAX_RECONNECT_MS);
      setReconnectNonce((prev) => prev + 1);
      load();
    }, delay);
  }, [load]);

  const clearReconnect = useCallback(() => {
    reconnectDelayMs.current = 1000;
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!restaurant?.id || !user?.id) return;

    const ordersChannel = supabase
      .channel(`waiter-orders-${restaurant.id}-${user.id}-${reconnectNonce}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurant.id}` },
        () => {
          load();
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          clearReconnect();
          setConnectionStatus('connected');
          return;
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          scheduleReconnect();
        }
      });

    const callsChannel = supabase
      .channel(`waiter-table-calls-${restaurant.id}-${user.id}-${reconnectNonce}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'table_calls' },
        () => {
          load();
        },
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          scheduleReconnect();
        }
      });

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(callsChannel);
    };
  }, [restaurant?.id, user?.id, reconnectNonce, clearReconnect, scheduleReconnect, load]);

  useEffect(() => () => clearReconnect(), [clearReconnect]);

  const markCallAttended = useCallback(async (callId: string) => {
    const { error: updateError } = await supabase
      .from('table_calls')
      .update({ atendida: true, atendida_at: new Date().toISOString() })
      .eq('id', callId);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    load();
  }, [load]);

  const clearTable = useCallback(async (tableId: string) => {
    const { error: updateError } = await supabase.rpc('clear_table_after_payment', {
      p_table_id: tableId,
    });

    if (updateError) {
      setError(updateError.message);
      return;
    }

    load();
  }, [load]);

  const stats = useMemo(() => ({
    totalMesas: tables.length,
    libres: tables.filter((table) => table.status === 'libre').length,
    pendientes: tables.filter((table) => table.status === 'pendiente' || table.status === 'listo').length,
    porCobrar: tables.filter((table) => table.status === 'pendiente-pago').length,
    listasParaLimpiar: tables.filter((table) => table.status === 'listo-limpiar').length,
  }), [tables]);

  return {
    restaurant,
    tables,
    loading,
    error,
    connectionStatus,
    readyOrders,
    stats,
    refresh: load,
    markCallAttended,
    clearTable,
  };
}

