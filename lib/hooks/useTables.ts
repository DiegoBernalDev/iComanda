import { useAuth } from '@/context/auth';
import { supabase } from '@/lib/supabase';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';
type TableStatus = 'libre' | 'pendiente' | 'listo' | 'entregado' | 'cliente-llama';

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

type OrderRow = {
  id: string;
  table_id: string;
  estado: 'activa' | 'lista' | 'entregada' | 'cancelada';
  created_at: string;
};

type TableRow = {
  id: string;
  numero: number;
  capacidad: number;
  activa: boolean;
};

type TableCallRow = {
  id: string;
  table_id: string;
  atendida: boolean;
  created_at: string;
};

const MAX_RECONNECT_MS = 30_000;

export function useTables() {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<RestaurantInfo | null>(null);
  const [tables, setTables] = useState<TableState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
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

    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);

    const [{ data: tableRows, error: tableError }, { data: orders, error: orderError }, { data: calls, error: callError }] =
      await Promise.all([
        supabase
          .from('tables')
          .select('id, numero, capacidad, activa')
          .eq('restaurant_id', nextRestaurant.id)
          .order('numero', { ascending: true }),
        supabase
          .from('orders')
          .select('id, table_id, estado, created_at')
          .eq('restaurant_id', nextRestaurant.id)
          .eq('mesero_id', user.id)
          .gte('created_at', dayStart.toISOString())
          .order('created_at', { ascending: false }),
        supabase
          .from('table_calls')
          .select('id, table_id, atendida, created_at')
          .eq('restaurant_id', nextRestaurant.id)
          .eq('atendida', false)
          .order('created_at', { ascending: false }),
      ]);

    if (tableError || orderError || callError) {
      setError(tableError?.message ?? orderError?.message ?? callError?.message ?? 'No se pudieron cargar las mesas.');
      setLoading(false);
      return;
    }

    const tableData = (tableRows ?? []) as TableRow[];
    const orderData = (orders ?? []) as OrderRow[];
    const callData = (calls ?? []) as TableCallRow[];

    const latestByTable = new Map<string, OrderRow>();
    for (const order of orderData) {
      if (!latestByTable.has(order.table_id)) latestByTable.set(order.table_id, order);
    }

    const activeByTable = new Map<string, OrderRow>();
    for (const order of orderData) {
      if (order.estado === 'activa' || order.estado === 'lista') {
        if (!activeByTable.has(order.table_id)) activeByTable.set(order.table_id, order);
      }
    }

    const callByTable = new Map<string, TableCallRow>();
    for (const call of callData) {
      if (!callByTable.has(call.table_id)) callByTable.set(call.table_id, call);
    }

    const nextTables: TableState[] = tableData.map((table) => {
      const activeOrder = activeByTable.get(table.id) ?? null;
      const latestOrder = latestByTable.get(table.id) ?? null;
      const activeCall = callByTable.get(table.id) ?? null;

      let status: TableStatus = 'libre';
      if (activeCall) status = 'cliente-llama';
      else if (activeOrder?.estado === 'lista') status = 'listo';
      else if (activeOrder?.estado === 'activa') status = 'pendiente';
      else if (latestOrder?.estado === 'entregada') status = 'entregado';

      return {
        ...table,
        status,
        activeOrderId: activeOrder?.id ?? null,
        activeCallId: activeCall?.id ?? null,
      };
    });

    setTables(nextTables);
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
      .channel(`waiter-orders-${user.id}-${reconnectNonce}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `mesero_id=eq.${user.id}` },
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
      .channel(`waiter-table-calls-${user.id}-${reconnectNonce}`)
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

  const stats = useMemo(() => ({
    totalMesas: tables.length,
    libres: tables.filter((table) => table.status === 'libre').length,
    pendientes: tables.filter((table) => table.status === 'pendiente' || table.status === 'listo').length,
  }), [tables]);

  return {
    restaurant,
    tables,
    loading,
    error,
    connectionStatus,
    stats,
    refresh: load,
    markCallAttended,
  };
}

