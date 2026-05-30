import { Button, Card, Chip, Enter } from '@/components/md3';
import { useAuth } from '@/context/auth';
import { useMD3Theme } from '@/hooks/use-md3-theme';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
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

type ChefMenuItem = {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  categoria: string | null;
  imagen_url: string | null;
  disponible: boolean;
  agotado: boolean;
};

export default function ChefDashboardScreen() {
  const { colors, typography, shape } = useMD3Theme();
  const s = useMemo(() => makeStyles(colors, shape), [colors, shape]);
  const { profile, signOut } = useAuth();
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [menuItems, setMenuItems] = useState<ChefMenuItem[]>([]);
  const [mode, setMode] = useState<'orders' | 'menu'>('orders');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyMenuId, setBusyMenuId] = useState<string | null>(null);
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

  const loadMenuItems = useCallback(async () => {
    setError('');

    const { data: restaurants, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(1);

    if (restaurantError || !restaurants?.[0]) {
      setError(restaurantError?.message ?? 'No se encontró restaurante para cargar platos.');
      setRefreshing(false);
      return;
    }

    const { data, error: menuError } = await supabase
      .from('menu_items')
      .select('id, nombre, descripcion, precio, categoria, imagen_url, disponible, agotado')
      .eq('restaurant_id', restaurants[0].id)
      .eq('disponible', true)
      .order('categoria', { ascending: true, nullsFirst: false })
      .order('nombre', { ascending: true });

    if (menuError) {
      setError(menuError.message);
      setRefreshing(false);
      return;
    }

    setMenuItems((data ?? []) as ChefMenuItem[]);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadOrders();
    loadMenuItems();
  }, [loadOrders, loadMenuItems]);

  useEffect(() => {
    const channel = supabase
      .channel('chef-dashboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => loadOrders())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => loadOrders())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => loadMenuItems())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadOrders, loadMenuItems]);

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

  const toggleSoldOut = async (item: ChefMenuItem) => {
    const nextValue = !item.agotado;
    setBusyMenuId(item.id);
    setError('');
    setMenuItems((prev) => prev.map((row) => (row.id === item.id ? { ...row, agotado: nextValue } : row)));

    const { error: updateError } = await supabase.rpc('set_menu_item_sold_out', {
      p_menu_item_id: item.id,
      p_agotado: nextValue,
    });

    setBusyMenuId(null);

    if (updateError) {
      setMenuItems((prev) => prev.map((row) => (row.id === item.id ? { ...row, agotado: item.agotado } : row)));
      setError(updateError.message);
      return;
    }

    loadMenuItems();
  };

  const activeCount = orders.filter((order) => order.estado === 'activa').length;
  const readyCount = orders.filter((order) => order.estado === 'lista').length;
  const soldOutCount = menuItems.filter((item) => item.agotado).length;

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); if (mode === 'orders') loadOrders(); else loadMenuItems(); }} tintColor={colors.primary} />}
      >
        {error ? (
          <View style={[s.errorBanner, { backgroundColor: colors.errorContainer, borderRadius: shape.small }]}> 
            <Ionicons name="alert-circle-outline" size={14} color={colors.onErrorContainer} />
            <Text style={[typography.bodySmall, { color: colors.onErrorContainer, flex: 1 }]}>{error}</Text>
          </View>
        ) : null}

        <Enter delay={0}>
          <View style={s.modeRow}>
            <View style={s.modeChip}><Chip label="Pedidos" variant="filter" selected={mode === 'orders'} onPress={() => setMode('orders')} icon="receipt-outline" /></View>
            <View style={s.modeChip}><Chip label="Disponibilidad" variant="filter" selected={mode === 'menu'} onPress={() => setMode('menu')} icon="restaurant-outline" /></View>
          </View>
        </Enter>

        <Enter delay={40}>
          <View style={s.chipsRow}>
            {mode === 'orders' ? (
              <>
                <Chip label={`${activeCount} en preparación`} selected icon="flame-outline" />
                <Chip label={`${readyCount} listos`} icon="checkmark-circle-outline" />
              </>
            ) : (
              <>
                <Chip label={`${menuItems.length} platos activos`} selected icon="list-outline" />
                <Chip label={`${soldOutCount} agotados`} icon="close-circle-outline" />
              </>
            )}
          </View>
        </Enter>

        {loading && mode === 'orders' ? (
              <View style={s.loadingBox}>
                <ActivityIndicator color={colors.primary} />
              </View>
        ) : mode === 'orders' && orders.length === 0 ? (
              <Card variant="outlined" style={s.emptyCard}>
                <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}>No hay pedidos pendientes para cocina.</Text>
              </Card>
        ) : mode === 'orders' ? (
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
        ) : menuItems.length === 0 ? (
              <Card variant="outlined" style={s.emptyCard}>
                <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}>No hay platos activos para gestionar.</Text>
              </Card>
        ) : (
              menuItems.map((item, index) => (
                <Enter key={item.id} delay={70 + index * 20}>
                  <Card variant="outlined" style={[s.menuCard, { opacity: item.agotado ? 0.68 : 1 }]}> 
                    <View style={s.menuRow}>
                      {item.imagen_url ? (
                        <Image source={{ uri: item.imagen_url }} style={[s.menuImage, { borderRadius: shape.medium }]} contentFit="cover" />
                      ) : (
                        <View style={[s.menuImage, s.placeholder, { borderRadius: shape.medium, backgroundColor: colors.surfaceVariant }]}> 
                          <Ionicons name="image-outline" size={22} color={colors.onSurfaceVariant} />
                        </View>
                      )}
                      <View style={{ flex: 1, gap: 3 }}>
                        <View style={s.menuTitleRow}>
                          <Text style={[typography.titleSmall, { color: colors.onSurface, flex: 1 }]}>{item.nombre}</Text>
                          <View style={[s.statusBadge, { borderRadius: shape.full, backgroundColor: item.agotado ? colors.errorContainer : colors.tertiaryContainer }]}> 
                            <Text style={[typography.labelSmall, { color: item.agotado ? colors.onErrorContainer : colors.onTertiaryContainer }]}> 
                              {item.agotado ? 'Agotado' : 'Disponible'}
                            </Text>
                          </View>
                        </View>
                        <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>{item.categoria || 'Sin categoría'} · Bs {item.precio.toFixed(2)}</Text>
                        <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]} numberOfLines={2}>{item.descripcion || 'Sin descripción'}</Text>
                      </View>
                    </View>
                    <Button
                      label={busyMenuId === item.id ? 'Actualizando...' : item.agotado ? 'Marcar disponible' : 'Marcar agotado'}
                      variant={item.agotado ? 'filled' : 'outlined'}
                      icon={item.agotado ? 'checkmark-circle-outline' : 'close-circle-outline'}
                      onPress={() => toggleSoldOut(item)}
                      disabled={busyMenuId === item.id}
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
  modeRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  modeChip: { flex: 1, justifyContent: 'center' },
  chipsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 8 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, marginBottom: 12 },
  loadingBox: { paddingVertical: 32 },
  emptyCard: { padding: 16 },
  orderCard: { padding: 14, gap: 12, marginBottom: 8 },
  orderHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6 },
  itemsList: { gap: 6 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  menuCard: { padding: 14, gap: 12, marginBottom: 8 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  menuTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  menuImage: { width: 64, height: 64 },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
});
