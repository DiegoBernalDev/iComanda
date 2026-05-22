import { Button, Card, Chip, Enter } from '@/components/md3';
import { useAuth } from '@/context/auth';
import { useMD3Theme } from '@/hooks/use-md3-theme';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type KitchenOrder = {
  id: string;
  table_id: string;
  estado: 'activa' | 'lista' | 'entregada' | 'cancelada';
  created_at: string;
  tableNumber: number | null;
  items: { id: string; nombre: string; cantidad: number }[];
};

export default function ChefDashboardScreen() {
  const { colors, typography, shape } = useMD3Theme();
  const s = useMemo(() => makeStyles(colors, shape), [colors, shape]);
  const { profile, signOut } = useAuth();
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadOrders = useCallback(async () => {
    setError('');

    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('id, table_id, estado, created_at')
      .in('estado', ['activa', 'lista'])
      .order('created_at', { ascending: true });

    if (ordersError) {
      setError(ordersError.message);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const rawOrders = (ordersData ?? []) as Omit<KitchenOrder, 'tableNumber' | 'items'>[];
    const orderIds = rawOrders.map((order) => order.id);
    const tableIds = [...new Set(rawOrders.map((order) => order.table_id))];

    const [{ data: tablesData }, { data: itemsData, error: itemsError }] = await Promise.all([
      tableIds.length
        ? supabase.from('tables').select('id, numero').in('id', tableIds)
        : Promise.resolve({ data: [] }),
      orderIds.length
        ? supabase.from('order_items').select('id, order_id, nombre, cantidad').in('order_id', orderIds).order('created_at', { ascending: true })
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (itemsError) {
      setError(itemsError.message);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const tableMap = new Map<string, number>((tablesData ?? []).map((table) => [table.id, table.numero]));
    const itemsByOrder = new Map<string, { id: string; nombre: string; cantidad: number }[]>();

    for (const item of (itemsData ?? []) as { id: string; order_id: string; nombre: string; cantidad: number }[]) {
      const bucket = itemsByOrder.get(item.order_id) ?? [];
      bucket.push({ id: item.id, nombre: item.nombre, cantidad: item.cantidad });
      itemsByOrder.set(item.order_id, bucket);
    }

    setOrders(rawOrders.map((order) => ({
      ...order,
      tableNumber: tableMap.get(order.table_id) ?? null,
      items: itemsByOrder.get(order.id) ?? [],
    })));
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const channel = supabase
      .channel('chef-dashboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => loadOrders())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => loadOrders())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadOrders]);

  const markReady = async (orderId: string) => {
    setBusyId(orderId);
    setError('');

    const { error: updateError } = await supabase
      .from('orders')
      .update({ estado: 'lista', closed_at: null })
      .eq('id', orderId)
      .eq('estado', 'activa');

    setBusyId(null);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    loadOrders();
  };

  const activeCount = orders.filter((order) => order.estado === 'activa').length;
  const readyCount = orders.filter((order) => order.estado === 'lista').length;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <View style={[s.appBar, { backgroundColor: colors.surface, borderBottomColor: colors.outlineVariant }]}>
        <View style={{ flex: 1 }}>
          <View style={[s.rolePill, { borderRadius: shape.full, backgroundColor: colors.primaryContainer }]}> 
            <Ionicons name="restaurant-outline" size={12} color={colors.onPrimaryContainer} />
            <Text style={[typography.labelSmall, { color: colors.onPrimaryContainer }]}>Cocina</Text>
          </View>
          <Text style={[typography.titleLarge, { color: colors.onSurface, marginTop: 4 }]}>Hola, {profile?.nombre?.split(' ')[0] ?? 'Chef'}</Text>
          <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>Gestiona pedidos en preparación y listos.</Text>
        </View>
        <Button label="Salir" variant="text" icon="log-out-outline" onPress={signOut} />
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadOrders(); }} tintColor={colors.primary} />}
      >
        {error ? (
          <View style={[s.errorBanner, { backgroundColor: colors.errorContainer, borderRadius: shape.small }]}> 
            <Ionicons name="alert-circle-outline" size={14} color={colors.onErrorContainer} />
            <Text style={[typography.bodySmall, { color: colors.onErrorContainer, flex: 1 }]}>{error}</Text>
          </View>
        ) : null}

        <Enter delay={0}>
          <View style={s.chipsRow}>
            <Chip label={`${activeCount} en preparación`} selected icon="flame-outline" />
            <Chip label={`${readyCount} listos`} icon="checkmark-circle-outline" />
          </View>
        </Enter>

        {loading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : orders.length === 0 ? (
          <Card variant="outlined" style={s.emptyCard}>
            <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}>No hay pedidos pendientes para cocina.</Text>
          </Card>
        ) : (
          orders.map((order, index) => (
            <Enter key={order.id} delay={70 + index * 20}>
              <Card variant="outlined" style={s.orderCard}>
                <View style={s.orderHead}>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.titleMedium, { color: colors.onSurface }]}>Mesa {order.tableNumber ?? '-'}</Text>
                    <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>#{order.id.slice(0, 8)} · {new Date(order.created_at).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}</Text>
                  </View>
                  <View style={[s.statusBadge, { borderRadius: shape.full, backgroundColor: order.estado === 'lista' ? colors.tertiaryContainer : colors.primaryContainer }]}> 
                    <Text style={[typography.labelSmall, { color: order.estado === 'lista' ? colors.onTertiaryContainer : colors.onPrimaryContainer }]}>
                      {order.estado === 'lista' ? 'Lista' : 'Preparando'}
                    </Text>
                  </View>
                </View>

                <View style={s.itemsList}>
                  {order.items.map((item) => (
                    <View key={item.id} style={s.itemRow}>
                      <Text style={[typography.bodyMedium, { color: colors.onSurface, flex: 1 }]}>{item.nombre}</Text>
                      <Text style={[typography.labelLarge, { color: colors.onSurfaceVariant }]}>x{item.cantidad}</Text>
                    </View>
                  ))}
                </View>

                <Button
                  label={busyId === order.id ? 'Actualizando...' : order.estado === 'lista' ? 'Ya está listo' : 'Marcar listo'}
                  variant={order.estado === 'lista' ? 'outlined' : 'filled'}
                  icon="checkmark-circle-outline"
                  onPress={() => markReady(order.id)}
                  disabled={busyId === order.id || order.estado === 'lista'}
                />
              </Card>
            </Enter>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any, shape: any) => StyleSheet.create({
  safe: { flex: 1 },
  appBar: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 10 },
  rolePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start' },
  scroll: { padding: 16, paddingBottom: 40, gap: 10 },
  chipsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 8 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, marginBottom: 12 },
  loadingBox: { paddingVertical: 32 },
  emptyCard: { padding: 16 },
  orderCard: { padding: 14, gap: 12, marginBottom: 8 },
  orderHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6 },
  itemsList: { gap: 6 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
