import { Button, Card, Chip, Enter, TopAppBar } from '@/components/md3';
import { useAuth } from '@/context/auth';
import { useMD3Theme } from '@/hooks/use-md3-theme';
import { getAdminRestaurant } from '@/lib/admin';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type QrOrder = {
  id: string;
  table_id: string;
  total: number;
  created_at: string;
  estado: 'activa' | 'entregada' | 'cancelada';
  pago_confirmado: boolean;
  tableNumber: number | null;
};

export default function AdminPagosQrScreen() {
  const { colors, typography, shape } = useMD3Theme();
  const s = useMemo(() => makeStyles(colors, shape), [colors, shape]);
  const { profile } = useAuth();

  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [orders, setOrders] = useState<QrOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadOrders = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    setError('');

    const { data, error: fetchError } = await supabase
      .from('orders')
      .select('id, table_id, total, created_at, estado, pago_confirmado')
      .eq('restaurant_id', restaurantId)
      .eq('metodo_pago', 'qr')
      .eq('estado', 'activa')
      .eq('pago_confirmado', false)
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    const orderRows = (data ?? []) as Omit<QrOrder, 'tableNumber'>[];
    if (orderRows.length === 0) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const tableIds = [...new Set(orderRows.map((order) => order.table_id))];
    const { data: tableData, error: tableError } = await supabase
      .from('tables')
      .select('id, numero')
      .in('id', tableIds);

    if (tableError) {
      setError(tableError.message);
      setLoading(false);
      return;
    }

    const tableMap = new Map<string, number>((tableData ?? []).map((table) => [table.id, table.numero]));
    setOrders(orderRows.map((order) => ({ ...order, tableNumber: tableMap.get(order.table_id) ?? null })));
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => {
    const loadRestaurant = async () => {
      const restaurant = await getAdminRestaurant(profile?.id ?? null);
      if (!restaurant?.id) {
        setRestaurantId(null);
        setOrders([]);
        setLoading(false);
        setError('No se encontró restaurante para cargar pagos QR.');
        return;
      }
      setRestaurantId(restaurant.id);
    };

    loadRestaurant();
  }, [profile?.id]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (!restaurantId) return;
    const channel = supabase
      .channel(`admin-qr-payments-${restaurantId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}` },
        () => loadOrders(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, loadOrders]);

  const confirmPayment = async (orderId: string) => {
    setConfirmingId(orderId);
    setError('');

    const { error: updateError } = await supabase
      .from('orders')
      .update({ pago_confirmado: true })
      .eq('id', orderId);

    if (updateError) {
      setError(updateError.message);
      setConfirmingId(null);
      return;
    }

    setConfirmingId(null);
    loadOrders();
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <TopAppBar title="Pagos QR" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {error ? (
          <View style={[s.errorBanner, { backgroundColor: colors.errorContainer, borderRadius: shape.small }]}>
            <Ionicons name="alert-circle-outline" size={14} color={colors.onErrorContainer} />
            <Text style={[typography.bodySmall, { color: colors.onErrorContainer, flex: 1 }]}>{error}</Text>
          </View>
        ) : null}

        <Enter delay={0}>
          <View style={s.chipsRow}>
            <Chip label={`${orders.length} pendientes`} selected icon="qr-code-outline" />
          </View>
        </Enter>

        {loading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : orders.length === 0 ? (
          <Card variant="outlined" style={s.emptyCard}>
            <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}>
              No hay pagos QR pendientes.
            </Text>
          </Card>
        ) : (
          orders.map((order, index) => (
            <Enter key={order.id} delay={80 + index * 24}>
              <Card variant="outlined" style={s.itemCard}>
                <View style={s.itemHead}>
                  <View style={s.itemInfo}>
                    <Text style={[typography.titleSmall, { color: colors.onSurface }]}>
                      Mesa {order.tableNumber ?? '-'}
                    </Text>
                    <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>
                      {new Date(order.created_at).toLocaleString('es-BO')}
                    </Text>
                  </View>
                  <Text style={[typography.titleMedium, { color: colors.primary }]}>Bs {order.total.toFixed(2)}</Text>
                </View>
                <Button
                  label={confirmingId === order.id ? 'Confirmando...' : 'Confirmar pago'}
                  variant="filled"
                  icon="checkmark-circle-outline"
                  onPress={() => confirmPayment(order.id)}
                  disabled={confirmingId === order.id}
                />
              </Card>
            </Enter>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any, shape: any) =>
  StyleSheet.create({
    safe: { flex: 1 },
    scroll: { padding: 16, paddingBottom: 40, gap: 10 },
    chipsRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
    loadingBox: { paddingVertical: 32 },
    emptyCard: { padding: 16 },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      padding: 10,
      marginBottom: 12,
    },
    itemCard: { padding: 14, gap: 12, marginBottom: 8 },
    itemHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    itemInfo: { flex: 1, gap: 2 },
  });
