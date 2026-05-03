import { Card, Chip, Enter, PressScale, TopAppBar } from '@/components/md3';
import { useMD3Theme } from '@/hooks/use-md3-theme';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type OrderSummary = {
  id: string;
  table_id: string;
  estado: 'activa' | 'entregada' | 'cancelada';
  metodo_pago: 'efectivo' | 'qr' | 'tarjeta' | null;
  total: number;
  created_at: string;
  tableNumber: number | null;
};

const PAYMENT_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  qr: 'QR',
  tarjeta: 'Tarjeta',
};

export default function MeseroPedidosScreen() {
  const { colors, typography, shape } = useMD3Theme();
  const s = useMemo(() => makeStyles(colors, shape), [colors, shape]);

  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');

    const { data, error: fetchError } = await supabase
      .from('orders')
      .select('id, table_id, estado, metodo_pago, total, created_at')
      .eq('estado', 'activa')
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    const ordersData = (data ?? []) as Omit<OrderSummary, 'tableNumber'>[];
    const tableIds = [...new Set(ordersData.map((order) => order.table_id))];

    const { data: tablesData } = await supabase
      .from('tables')
      .select('id, numero')
      .in('id', tableIds);

    const tableNumberMap = new Map<string, number>(
      (tablesData ?? []).map((table) => [table.id, table.numero]),
    );

    setOrders(ordersData.map((order) => ({ ...order, tableNumber: tableNumberMap.get(order.table_id) ?? null })));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const channel = supabase
      .channel('mesero-pedidos-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => loadOrders())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => loadOrders())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadOrders]);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <TopAppBar
        title="Mis pedidos"
        onBack={() => router.back()}
        trailing={
          <Pressable
            onPress={() => router.push('/(mesero)/pedido-nuevo')}
            style={[s.addBtn, { borderRadius: shape.medium, backgroundColor: colors.primaryContainer }]}
            android_ripple={{ color: colors.onPrimaryContainer + '30' }}
          >
            <Ionicons name="add" size={20} color={colors.onPrimaryContainer} />
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {error ? (
          <View
            style={[
              s.errorBanner,
              { backgroundColor: colors.errorContainer, borderRadius: shape.small },
            ]}
          >
            <Ionicons name="alert-circle-outline" size={14} color={colors.onErrorContainer} />
            <Text style={[typography.bodySmall, { color: colors.onErrorContainer, flex: 1 }]}>
              {error}
            </Text>
          </View>
        ) : null}

        <Enter delay={0}>
          <View style={s.chips}>
            <Chip label={`${orders.length} activos`} selected icon="receipt-outline" />
          </View>
        </Enter>

        {loading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : orders.length === 0 ? (
          <Card variant="outlined" style={s.emptyCard}>
            <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}>
              No tienes pedidos activos.
            </Text>
          </Card>
        ) : (
          orders.map((order, index) => (
            <Enter key={order.id} delay={80 + index * 25}>
              <PressScale
                onPress={() =>
                  router.push({ pathname: '/(mesero)/pedido/[id]', params: { id: order.id } })
                }
                style={[
                  s.orderCard,
                  {
                    borderRadius: shape.large,
                    backgroundColor: colors.surfaceContainerLow,
                    borderColor: colors.outlineVariant,
                  },
                ]}
                android_ripple={{ color: colors.onSurface + '1F' }}
              >
                <View style={s.orderMain}>
                  <View>
                    <Text style={[typography.titleSmall, { color: colors.onSurface }]}>
                      Mesa {order.tableNumber ?? '-'}
                    </Text>
                    <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>
                      {new Date(order.created_at).toLocaleString('es-BO')}
                    </Text>
                  </View>
                  <View style={s.orderRight}>
                    <Text style={[typography.titleSmall, { color: colors.primary }]}>
                      Bs {order.total.toFixed(2)}
                    </Text>
                    <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>
                      {order.metodo_pago ? PAYMENT_LABELS[order.metodo_pago] : 'Sin método'}
                    </Text>
                  </View>
                </View>
              </PressScale>
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
    scroll: { padding: 16, gap: 10, paddingBottom: 40 },
    addBtn: { padding: 8 },
    chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 8 },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      padding: 10,
      marginBottom: 12,
    },
    loadingBox: { paddingVertical: 28 },
    emptyCard: { padding: 16 },
    orderCard: {
      padding: 14,
      borderWidth: 1,
      marginBottom: 8,
    },
    orderMain: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    orderRight: { alignItems: 'flex-end' },
  });
