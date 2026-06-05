import { CallWaiterButton } from '@/components/customer/CallWaiterButton';
import { Card } from '@/components/md3';
import { useMD3Theme } from '@/hooks/use-md3-theme';
import { supabasePublic } from '@/lib/supabase-public';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type MenuRow = {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  categoria: string | null;
  imagen_url: string | null;
  disponible: boolean;
  agotado: boolean;
};

export default function TableSessionPage() {
  const { slug, tableId } = useLocalSearchParams<{ slug: string; tableId: string }>();
  const { colors, typography, shape } = useMD3Theme();
  const s = useMemo(() => makeStyles(colors, shape), [colors, shape]);

  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState('');
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [items, setItems] = useState<MenuRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMenu = useCallback(async (nextRestaurantId: string) => {
    const { data: menuItems, error: menuError } = await supabasePublic
      .from('menu_items')
      .select('id, nombre, descripcion, precio, categoria, imagen_url, disponible, agotado')
      .eq('disponible', true)
      .eq('restaurant_id', nextRestaurantId)
      .order('categoria', { ascending: true, nullsFirst: false })
      .order('nombre', { ascending: true });

    if (menuError) {
      setError(menuError.message);
      return false;
    }

    setItems((menuItems ?? []) as MenuRow[]);
    return true;
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      if (!slug || !tableId) return;
      setLoading(true);
      setError('');

      const { data: restaurant, error: restaurantError } = await supabasePublic
        .from('restaurants')
        .select('id, nombre')
        .eq('slug', slug)
        .maybeSingle();

      if (restaurantError || !restaurant) {
        setError('Mesa o restaurante no válido.');
        setLoading(false);
        return;
      }

      const { data: table, error: tableError } = await supabasePublic
        .from('tables')
        .select('*')
        .eq('id', tableId)
        .eq('restaurant_id', restaurant.id)
        .maybeSingle();

      if (tableError || !table || table.deprecated) {
        setError('Mesa o restaurante no válido.');
        setLoading(false);
        return;
      }

      setRestaurantId(restaurant.id);
      setRestaurantName(restaurant.nombre ?? '');
      setTableNumber(table.numero ?? null);

      const menuLoaded = await loadMenu(restaurant.id);
      if (!menuLoaded) {
        setLoading(false);
        return;
      }

      setLoading(false);
    };

    bootstrap();
  }, [slug, tableId, loadMenu]);

  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabasePublic
      .channel(`public-table-menu-${restaurantId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menu_items', filter: `restaurant_id=eq.${restaurantId}` },
        () => {
          loadMenu(restaurantId);
        },
      )
      .subscribe();

    return () => {
      supabasePublic.removeChannel(channel);
    };
  }, [restaurantId, loadMenu]);

  const grouped = useMemo(() => {
    const buckets = new Map<string, MenuRow[]>();
    for (const item of items) {
      const category = item.categoria?.trim() || 'Sin categoría';
      if (!buckets.has(category)) buckets.set(category, []);
      buckets.get(category)!.push(item);
    }
    return [...buckets.entries()];
  }, [items]);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[typography.headlineSmall, { color: colors.onSurface }]}>
          {restaurantName || 'Carta de mesa'}
        </Text>
        <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>
          Mesa {tableNumber ?? '-'}
        </Text>

        {restaurantId ? (
          <CallWaiterButton
            tableId={tableId}
            restaurantId={restaurantId}
            colors={colors}
            typography={typography}
          />
        ) : null}

        {loading ? (
          <View style={s.loading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : error ? (
          <Card variant="outlined" style={[s.errorCard, { borderColor: colors.error }]}>
            <Text style={[typography.bodyMedium, { color: colors.error }]}>{error}</Text>
          </Card>
        ) : (
          grouped.map(([category, rows]) => (
            <View key={category} style={s.group}>
              <Text style={[typography.titleMedium, { color: colors.onSurface, marginBottom: 8 }]}>{category}</Text>
              {rows.map((item) => (
                <Card
                  key={item.id}
                  variant="outlined"
                  style={[
                    s.itemCard,
                    { borderRadius: shape.large, borderColor: colors.outlineVariant, opacity: item.agotado ? 0.55 : 1 },
                  ]}
                >
                  {item.imagen_url ? (
                    <Image source={{ uri: item.imagen_url }} style={s.image} contentFit="cover" />
                  ) : (
                    <View style={[s.image, s.placeholder, { backgroundColor: colors.surfaceVariant }]}>
                      <Ionicons name="image-outline" size={24} color={colors.onSurfaceVariant} />
                    </View>
                  )}
                  <View style={s.itemBody}>
                    <View style={s.titleRow}>
                      <Text style={[typography.titleSmall, { color: colors.onSurface, flex: 1 }]}>{item.nombre}</Text>
                      {item.agotado ? (
                        <View style={[s.badge, { borderRadius: shape.full, backgroundColor: colors.errorContainer }]}> 
                          <Text style={[typography.labelSmall, { color: colors.onErrorContainer }]}>Agotado</Text>
                        </View>
                      ) : null}
                    </View>
                    {item.descripcion ? (
                      <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>{item.descripcion}</Text>
                    ) : null}
                    <Text style={[typography.labelLarge, { color: colors.primary }]}>Bs {item.precio.toFixed(2)}</Text>
                  </View>
                </Card>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any, shape: any) =>
  StyleSheet.create({
    safe: { flex: 1 },
    scroll: { padding: 16, gap: 10, paddingBottom: 24 },
    loading: { paddingVertical: 24 },
    errorCard: { padding: 14, borderWidth: 1 },
    group: { gap: 8, marginBottom: 8 },
    itemCard: { overflow: 'hidden', borderWidth: 1 },
    image: { width: '100%', height: 148 },
    placeholder: { alignItems: 'center', justifyContent: 'center' },
    itemBody: { padding: 12, gap: 6 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    badge: { paddingHorizontal: 8, paddingVertical: 4 },
  });

