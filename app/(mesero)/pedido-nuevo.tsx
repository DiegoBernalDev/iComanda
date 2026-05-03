import { Button, Card, Chip, Enter, TopAppBar } from '@/components/md3';
import { useAuth } from '@/context/auth';
import { useMD3Theme } from '@/hooks/use-md3-theme';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type TableRow = { id: string; numero: number; activa: boolean };
type MenuItem = {
  id: string;
  nombre: string;
  precio: number;
  categoria: string | null;
  disponible: boolean;
};
type MetodoPago = 'efectivo' | 'qr' | 'tarjeta';

const PAYMENT_OPTIONS: { value: MetodoPago; label: string }[] = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'qr', label: 'QR' },
  { value: 'tarjeta', label: 'Tarjeta' },
];

export default function NuevoPedidoScreen() {
  const { colors, typography, shape } = useMD3Theme();
  const s = useMemo(() => makeStyles(colors, shape), [colors, shape]);
  const { user } = useAuth();

  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [tables, setTables] = useState<TableRow[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<MetodoPago>('efectivo');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    const { data: restaurants, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(1);

    if (restaurantError) {
      setError(restaurantError.message);
      setLoading(false);
      return;
    }

    const currentRestaurantId = restaurants?.[0]?.id ?? null;
    if (!currentRestaurantId) {
      setError('No hay restaurante registrado.');
      setLoading(false);
      return;
    }
    setRestaurantId(currentRestaurantId);

    const [{ data: tablesData, error: tablesError }, { data: menuData, error: menuError }] =
      await Promise.all([
        supabase
          .from('tables')
          .select('id, numero, activa')
          .eq('restaurant_id', currentRestaurantId)
          .eq('activa', true)
          .order('numero', { ascending: true }),
        supabase
          .from('menu_items')
          .select('id, nombre, precio, categoria, disponible')
          .eq('restaurant_id', currentRestaurantId)
          .eq('disponible', true)
          .order('categoria', { ascending: true, nullsFirst: false })
          .order('nombre', { ascending: true }),
      ]);

    if (tablesError || menuError) {
      setError(tablesError?.message ?? menuError?.message ?? 'No se pudo cargar el pedido.');
      setLoading(false);
      return;
    }

    setTables((tablesData ?? []) as TableRow[]);
    setMenu((menuData ?? []) as MenuItem[]);
    setSelectedTableId((tablesData ?? [])[0]?.id ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .map(([menuId, quantity]) => {
          const item = menu.find((row) => row.id === menuId);
          if (!item || quantity <= 0) return null;
          return { item, quantity };
        })
        .filter(Boolean) as { item: MenuItem; quantity: number }[],
    [cart, menu],
  );

  const total = useMemo(
    () => cartItems.reduce((sum, row) => sum + row.item.precio * row.quantity, 0),
    [cartItems],
  );

  const changeQuantity = (menuId: string, delta: number) => {
    setCart((prev) => {
      const nextValue = Math.max((prev[menuId] ?? 0) + delta, 0);
      const next = { ...prev };
      if (nextValue === 0) delete next[menuId];
      else next[menuId] = nextValue;
      return next;
    });
  };

  const createOrder = async () => {
    if (!user?.id) {
      setError('No se encontró tu sesión.');
      return;
    }
    if (!restaurantId || !selectedTableId) {
      setError('Selecciona una mesa para crear el pedido.');
      return;
    }
    if (cartItems.length === 0) {
      setError('Agrega al menos un ítem al pedido.');
      return;
    }

    setSaving(true);
    setError('');

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        restaurant_id: restaurantId,
        table_id: selectedTableId,
        mesero_id: user.id,
        estado: 'activa',
        metodo_pago: paymentMethod,
        total,
      })
      .select('id')
      .single();

    if (orderError || !order) {
      const duplicateActiveOrder = orderError?.code === '23505';
      setError(
        duplicateActiveOrder
          ? 'Esa mesa ya tiene una orden activa.'
          : orderError?.message ?? 'No se pudo crear la orden.',
      );
      setSaving(false);
      return;
    }

    const orderItemsPayload = cartItems.map((row) => ({
      order_id: order.id,
      menu_item_id: row.item.id,
      nombre: row.item.nombre,
      precio_unitario: row.item.precio,
      cantidad: row.quantity,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItemsPayload);
    if (itemsError) {
      setError(`La orden se creó pero falló el detalle: ${itemsError.message}`);
      setSaving(false);
      return;
    }

    setSaving(false);
    router.replace({ pathname: '/(mesero)/pedido/[id]', params: { id: order.id } });
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <TopAppBar title="Nuevo pedido" onBack={() => router.back()} />

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

        {loading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <>
            <Enter delay={0}>
              <Text style={[typography.titleMedium, { color: colors.onSurface, marginBottom: 8 }]}>
                Mesa
              </Text>
            </Enter>
            <View style={s.chips}>
              {tables.map((table) => (
                <Chip
                  key={table.id}
                  label={`Mesa ${table.numero}`}
                  variant="filter"
                  selected={selectedTableId === table.id}
                  onPress={() => setSelectedTableId(table.id)}
                />
              ))}
            </View>

            <Enter delay={60}>
              <Text style={[typography.titleMedium, { color: colors.onSurface, marginBottom: 8 }]}>
                Método de pago
              </Text>
            </Enter>
            <View style={s.chips}>
              {PAYMENT_OPTIONS.map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  variant="filter"
                  selected={paymentMethod === option.value}
                  onPress={() => setPaymentMethod(option.value)}
                />
              ))}
            </View>

            <Enter delay={120}>
              <Text style={[typography.titleMedium, { color: colors.onSurface, marginBottom: 10 }]}>
                Menú disponible
              </Text>
            </Enter>

            {menu.map((item, index) => {
              const quantity = cart[item.id] ?? 0;
              return (
                <Enter key={item.id} delay={140 + index * 20}>
                  <Card variant="outlined" style={s.itemCard}>
                    <View style={s.itemMain}>
                      <View style={s.itemInfo}>
                        <Text style={[typography.titleSmall, { color: colors.onSurface }]}>
                          {item.nombre}
                        </Text>
                        <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>
                          {item.categoria || 'Sin categoría'} · Bs {item.precio.toFixed(2)}
                        </Text>
                      </View>
                      <View style={s.quantityBox}>
                        <Pressable
                          onPress={() => changeQuantity(item.id, -1)}
                          style={[s.qtyBtn, { borderRadius: shape.full }]}
                        >
                          <Ionicons name="remove" size={14} color={colors.onSurfaceVariant} />
                        </Pressable>
                        <Text style={[typography.labelLarge, { color: colors.onSurface }]}>
                          {quantity}
                        </Text>
                        <Pressable
                          onPress={() => changeQuantity(item.id, 1)}
                          style={[s.qtyBtn, { borderRadius: shape.full }]}
                        >
                          <Ionicons name="add" size={14} color={colors.primary} />
                        </Pressable>
                      </View>
                    </View>
                  </Card>
                </Enter>
              );
            })}

            <Card variant="filled" style={s.summaryCard}>
              <Text style={[typography.titleMedium, { color: colors.onSurface }]}>Resumen</Text>
              <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>
                {cartItems.length} ítem(s) seleccionados
              </Text>
              <Text style={[typography.headlineSmall, { color: colors.primary, marginTop: 6 }]}>
                Bs {total.toFixed(2)}
              </Text>
              <View style={{ marginTop: 14 }}>
                <Button
                  label={saving ? 'Creando pedido...' : 'Crear pedido'}
                  variant="filled"
                  icon="checkmark-circle-outline"
                  onPress={createOrder}
                  disabled={saving}
                />
              </View>
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any, shape: any) =>
  StyleSheet.create({
    safe: { flex: 1 },
    scroll: { padding: 16, paddingBottom: 40 },
    chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 16 },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      padding: 10,
      marginBottom: 12,
    },
    loadingBox: { paddingVertical: 32 },
    itemCard: { marginBottom: 8, padding: 0 },
    itemMain: {
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    itemInfo: { flex: 1, gap: 2 },
    quantityBox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    qtyBtn: {
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceVariant,
    },
    summaryCard: { marginTop: 16, padding: 16 },
  });
