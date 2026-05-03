import { Button, Card, Enter, TopAppBar } from '@/components/md3';
import { useAuth } from '@/context/auth';
import { useMD3Theme } from '@/hooks/use-md3-theme';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type OrderRow = {
  id: string;
  restaurant_id: string;
  table_id: string;
  estado: 'activa' | 'entregada' | 'cancelada';
  metodo_pago: 'efectivo' | 'qr' | 'tarjeta' | null;
  pago_confirmado: boolean;
  total: number;
  created_at: string;
  tableNumber: number | null;
};

type OrderItem = {
  id: string;
  menu_item_id: string | null;
  nombre: string;
  precio_unitario: number;
  cantidad: number;
};

type MenuItem = {
  id: string;
  nombre: string;
  precio: number;
  categoria: string | null;
  disponible: boolean;
};

type MetodoPago = 'efectivo' | 'qr' | 'tarjeta';
const PAYMENT_LABELS: Record<MetodoPago, string> = {
  efectivo: 'Efectivo',
  qr: 'QR',
  tarjeta: 'Tarjeta',
};

export default function PedidoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { role } = useAuth();
  const { colors, typography, shape } = useMD3Theme();
  const s = useMemo(() => makeStyles(colors, shape), [colors, shape]);

  const [order, setOrder] = useState<OrderRow | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<'entregada' | 'cancelada' | null>(null);
  const [addCart, setAddCart] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState('');

  const loadOrder = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');

    const [{ data: orderData, error: orderError }, { data: itemData, error: itemError }] =
      await Promise.all([
        supabase
          .from('orders')
          .select('id, restaurant_id, estado, metodo_pago, pago_confirmado, total, created_at, table_id')
          .eq('id', id)
          .single(),
        supabase
          .from('order_items')
          .select('id, menu_item_id, nombre, precio_unitario, cantidad')
          .eq('order_id', id)
          .order('created_at', { ascending: true }),
      ]);

    if (orderError || itemError) {
      setError(orderError?.message ?? itemError?.message ?? 'No se pudo cargar el pedido.');
      setLoading(false);
      return;
    }

    const rawOrder = orderData as Omit<OrderRow, 'tableNumber'>;
    const { data: tableData } = await supabase
      .from('tables')
      .select('id, numero')
      .eq('id', rawOrder.table_id)
      .maybeSingle();

    setOrder({ ...rawOrder, tableNumber: tableData?.numero ?? null });
    setItems((itemData ?? []) as OrderItem[]);

    const { data: menuData, error: menuError } = await supabase
      .from('menu_items')
      .select('id, nombre, precio, categoria, disponible')
      .eq('restaurant_id', rawOrder.restaurant_id)
      .eq('disponible', true)
      .order('categoria', { ascending: true, nullsFirst: false })
      .order('nombre', { ascending: true });

    if (!menuError) setMenu((menuData ?? []) as MenuItem[]);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`mesero-pedido-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `id=eq.${id}` }, () => loadOrder())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items', filter: `order_id=eq.${id}` }, () => loadOrder())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, loadOrder]);

  const addTotal = useMemo(
    () =>
      Object.entries(addCart).reduce((sum, [menuId, quantity]) => {
        const item = menu.find((row) => row.id === menuId);
        if (!item || quantity <= 0) return sum;
        return sum + item.precio * quantity;
      }, 0),
    [addCart, menu],
  );

  const changeAddQuantity = (menuId: string, delta: number) => {
    setAddCart((prev) => {
      const nextValue = Math.max((prev[menuId] ?? 0) + delta, 0);
      const next = { ...prev };
      if (nextValue === 0) delete next[menuId];
      else next[menuId] = nextValue;
      return next;
    });
  };

  const saveAddedItems = async () => {
    if (!id || !order) return;
    const entries = Object.entries(addCart).filter(([, quantity]) => quantity > 0);
    if (entries.length === 0) {
      setError('Selecciona al menos un ítem para agregar.');
      return;
    }

    const payload = entries
      .map(([menuId, quantity]) => {
        const menuItem = menu.find((row) => row.id === menuId);
        if (!menuItem) return null;
        return {
          order_id: id,
          menu_item_id: menuItem.id,
          nombre: menuItem.nombre,
          precio_unitario: menuItem.precio,
          cantidad: quantity,
        };
      })
      .filter(Boolean) as {
      order_id: string;
      menu_item_id: string;
      nombre: string;
      precio_unitario: number;
      cantidad: number;
    }[];

    if (payload.length === 0) {
      setError('No hay ítems válidos para agregar.');
      return;
    }

    setSaving(true);
    setError('');

    const { error: insertError } = await supabase.from('order_items').insert(payload);
    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    const nextTotal = order.total + addTotal;
    const { error: updateError } = await supabase
      .from('orders')
      .update({ total: nextTotal })
      .eq('id', id);

    if (updateError) {
      setError(`Los ítems se agregaron, pero falló actualizar total: ${updateError.message}`);
      setSaving(false);
      return;
    }

    setSaving(false);
    setAddCart({});
    setAddModalVisible(false);
    loadOrder();
  };

  const requestStatusChange = (nextStatus: 'entregada' | 'cancelada') => {
    setPendingStatus(nextStatus);
    setStatusModalVisible(true);
  };

  const confirmStatusChange = async () => {
    if (!id || !pendingStatus || !order || order.estado !== 'activa') return;
    setUpdatingStatus(true);
    setError('');

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        estado: pendingStatus,
        closed_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      setError(updateError.message);
      setUpdatingStatus(false);
      return;
    }

    setUpdatingStatus(false);
    setStatusModalVisible(false);
    setPendingStatus(null);
    loadOrder();
  };

  const canManageStatus = order?.estado === 'activa' && (role === 'mesero' || role === 'admin');
  const qrPayload = useMemo(() => {
    if (!order || order.metodo_pago !== 'qr') return '';
    return `ICOMANDA|ORDER:${order.id}|TOTAL:${order.total.toFixed(2)}|TABLE:${order.tableNumber ?? '-'}`;
  }, [order]);
  const qrImageUrl = useMemo(
    () =>
      qrPayload
        ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrPayload)}`
        : '',
    [qrPayload],
  );

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <TopAppBar title="Detalle del pedido" onBack={() => router.back()} />

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

        {loading || !order ? (
          <View style={s.loadingBox}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <>
            <Enter delay={0}>
              <Card variant="filled" style={s.summaryCard}>
                <Text style={[typography.titleMedium, { color: colors.onSurface }]}>
                  Mesa {order.tableNumber ?? '-'}
                </Text>
                <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>
                  {new Date(order.created_at).toLocaleString('es-BO')}
                </Text>
                <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>
                  Pago: {order.metodo_pago ? PAYMENT_LABELS[order.metodo_pago] : 'Sin método'}
                </Text>
                {order.metodo_pago === 'qr' ? (
                  <Text style={[typography.bodySmall, { color: order.pago_confirmado ? colors.tertiary : colors.error }]}>
                    {order.pago_confirmado ? 'Pago QR confirmado' : 'Pago QR pendiente'}
                  </Text>
                ) : null}
                <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>
                  Estado: {order.estado === 'activa' ? 'Activa' : order.estado === 'entregada' ? 'Entregada' : 'Cancelada'}
                </Text>
                <Text style={[typography.headlineSmall, { color: colors.primary, marginTop: 8 }]}>
                  Bs {order.total.toFixed(2)}
                </Text>
              </Card>
            </Enter>

            {order.metodo_pago === 'qr' ? (
              <Enter delay={40}>
                <Card variant="outlined" style={s.qrCard}>
                  <Text style={[typography.titleSmall, { color: colors.onSurface }]}>Código QR de pago</Text>
                  {qrImageUrl ? <Image source={{ uri: qrImageUrl }} style={s.qrImage} contentFit="contain" /> : null}
                  <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>
                    Este QR es fijo para confirmar el cobro del pedido.
                  </Text>
                </Card>
              </Enter>
            ) : null}

            {canManageStatus ? (
              <Enter delay={55}>
                <View style={s.statusActions}>
                  <Button
                    label={updatingStatus ? 'Procesando...' : 'Marcar entregada'}
                    variant="filled"
                    icon="checkmark-circle-outline"
                    onPress={() => requestStatusChange('entregada')}
                    disabled={updatingStatus}
                    style={{ flex: 1 }}
                  />
                  <Button
                    label="Cancelar pedido"
                    variant="outlined"
                    icon="close-circle-outline"
                    onPress={() => requestStatusChange('cancelada')}
                    disabled={updatingStatus}
                    style={{ flex: 1 }}
                  />
                </View>
              </Enter>
            ) : null}

            <Enter delay={70}>
              <View style={s.sectionRow}>
                <Text style={[typography.titleMedium, { color: colors.onSurface }]}>Ítems</Text>
                <Button
                  label="Agregar"
                  variant="tonal"
                  icon="add"
                  onPress={() => setAddModalVisible(true)}
                  disabled={order.estado !== 'activa'}
                />
              </View>
            </Enter>

            {items.length === 0 ? (
              <Card variant="outlined" style={s.emptyCard}>
                <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}>
                  Esta orden aún no tiene ítems.
                </Text>
              </Card>
            ) : (
              items.map((item, index) => (
                <Enter key={item.id} delay={100 + index * 20}>
                  <Card variant="outlined" style={s.itemCard}>
                    <View style={s.itemMain}>
                      <View style={s.itemInfo}>
                        <Text style={[typography.titleSmall, { color: colors.onSurface }]}>
                          {item.nombre}
                        </Text>
                        <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>
                          Bs {item.precio_unitario.toFixed(2)} x {item.cantidad}
                        </Text>
                      </View>
                      <Text style={[typography.titleSmall, { color: colors.primary }]}>
                        Bs {(item.precio_unitario * item.cantidad).toFixed(2)}
                      </Text>
                    </View>
                  </Card>
                </Enter>
              ))
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={addModalVisible} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View
            style={[
              s.modalCard,
              {
                backgroundColor: colors.surfaceContainerHigh,
                borderTopLeftRadius: shape.extraLarge,
                borderTopRightRadius: shape.extraLarge,
              },
            ]}
          >
            <View style={[s.handle, { backgroundColor: colors.onSurfaceVariant + '40' }]} />
            <Text style={[typography.titleLarge, { color: colors.onSurface, marginBottom: 18 }]}>
              Agregar ítems
            </Text>

            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {menu.map((menuItem) => {
                const quantity = addCart[menuItem.id] ?? 0;
                return (
                  <Card key={menuItem.id} variant="outlined" style={s.modalItemCard}>
                    <View style={s.itemMain}>
                      <View style={s.itemInfo}>
                        <Text style={[typography.titleSmall, { color: colors.onSurface }]}>
                          {menuItem.nombre}
                        </Text>
                        <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>
                          Bs {menuItem.precio.toFixed(2)}
                        </Text>
                      </View>
                      <View style={s.quantityBox}>
                        <Pressable
                          onPress={() => changeAddQuantity(menuItem.id, -1)}
                          style={[s.qtyBtn, { borderRadius: shape.full }]}
                        >
                          <Ionicons name="remove" size={14} color={colors.onSurfaceVariant} />
                        </Pressable>
                        <Text style={[typography.labelLarge, { color: colors.onSurface }]}>
                          {quantity}
                        </Text>
                        <Pressable
                          onPress={() => changeAddQuantity(menuItem.id, 1)}
                          style={[s.qtyBtn, { borderRadius: shape.full }]}
                        >
                          <Ionicons name="add" size={14} color={colors.primary} />
                        </Pressable>
                      </View>
                    </View>
                  </Card>
                );
              })}
            </ScrollView>

            <View style={s.addFooter}>
              <Text style={[typography.titleMedium, { color: colors.onSurface }]}>
                + Bs {addTotal.toFixed(2)}
              </Text>
              <View style={s.modalActions}>
                <Button
                  label="Cancelar"
                  variant="text"
                  onPress={() => {
                    setAddModalVisible(false);
                    setAddCart({});
                  }}
                  style={{ flex: 1 }}
                />
                <Button
                  label={saving ? 'Guardando...' : 'Agregar'}
                  variant="filled"
                  icon="checkmark-outline"
                  onPress={saveAddedItems}
                  disabled={saving}
                  style={{ flex: 2 }}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={statusModalVisible} transparent animationType="fade">
        <View style={s.centeredOverlay}>
          <View style={[s.confirmModalCard, { backgroundColor: colors.surfaceContainerHigh, borderRadius: shape.large }]}>
            <Text style={[typography.titleMedium, { color: colors.onSurface }]}>
              {pendingStatus === 'cancelada' ? 'Cancelar pedido' : 'Marcar pedido entregado'}
            </Text>
            <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>
              {pendingStatus === 'cancelada'
                ? 'Esta acción cerrará el pedido y lo marcará como cancelado.'
                : 'Esta acción cerrará el pedido y lo marcará como entregado.'}
            </Text>
            <View style={s.modalActions}>
              <Button
                label="Volver"
                variant="text"
                onPress={() => {
                  if (updatingStatus) return;
                  setStatusModalVisible(false);
                  setPendingStatus(null);
                }}
                style={{ flex: 1 }}
              />
              <Button
                label={updatingStatus ? 'Guardando...' : 'Confirmar'}
                variant="filled"
                onPress={confirmStatusChange}
                disabled={updatingStatus}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any, shape: any) =>
  StyleSheet.create({
    safe: { flex: 1 },
    scroll: { padding: 16, gap: 10, paddingBottom: 40 },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      padding: 10,
      marginBottom: 12,
    },
    loadingBox: { paddingVertical: 28 },
    summaryCard: { padding: 16, marginBottom: 14 },
    sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statusActions: { flexDirection: 'row', gap: 8, marginBottom: 10 },
    emptyCard: { marginTop: 12, padding: 16 },
    itemCard: { marginTop: 8, padding: 0 },
    itemMain: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      padding: 12,
    },
    itemInfo: { flex: 1, gap: 2 },
    modalOverlay: {
      flex: 1,
      backgroundColor: '#00000055',
      justifyContent: 'flex-end',
    },
    modalCard: { padding: 24, paddingTop: 12 },
    centeredOverlay: {
      flex: 1,
      backgroundColor: '#00000055',
      justifyContent: 'center',
      padding: 24,
    },
    confirmModalCard: {
      padding: 16,
      gap: 12,
    },
    handle: {
      width: 32,
      height: 4,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 20,
    },
    modalItemCard: { marginBottom: 8, padding: 0 },
    quantityBox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    qtyBtn: {
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceVariant,
    },
    addFooter: { marginTop: 10, gap: 10 },
    modalActions: { flexDirection: 'row', gap: 8 },
    qrCard: { padding: 14, marginBottom: 8, gap: 8 },
    qrImage: { width: 180, height: 180, alignSelf: 'center' },
  });
