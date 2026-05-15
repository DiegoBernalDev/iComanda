import { Card } from '@/components/md3';
import { useMD3Theme } from '@/hooks/use-md3-theme';
import { supabasePublic } from '@/lib/supabase-public';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type MenuRow = {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  categoria: string | null;
  imagen_url: string | null;
};

export default function PublicMenuPage() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { colors, typography, shape } = useMD3Theme();
  const s = useMemo(() => makeStyles(colors, shape), [colors, shape]);
  const [restaurantName, setRestaurantName] = useState('');
  const [items, setItems] = useState<MenuRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!slug) return;

      setLoading(true);
      setError('');

      const { data: restaurant, error: restaurantError } = await supabasePublic
        .from('restaurants')
        .select('id, nombre')
        .eq('slug', slug)
        .maybeSingle();

      if (restaurantError || !restaurant) {
        setError('No encontramos esta carta. Verifica el código QR.');
        setLoading(false);
        return;
      }

      setRestaurantName(restaurant.nombre ?? '');

      const { data: menuItems, error: menuError } = await supabasePublic
        .from('menu_items')
        .select('id, nombre, descripcion, precio, categoria, imagen_url')
        .eq('restaurant_id', restaurant.id)
        .eq('disponible', true)
        .order('categoria', { ascending: true, nullsFirst: false })
        .order('nombre', { ascending: true });

      if (menuError) {
        setError(menuError.message);
        setLoading(false);
        return;
      }

      setItems((menuItems ?? []) as MenuRow[]);
      setLoading(false);
    };

    load();
  }, [slug]);

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
          {restaurantName || 'Carta digital'}
        </Text>
        <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginBottom: 12 }]}>
          Menú disponible
        </Text>

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
                <Card key={item.id} variant="outlined" style={[s.itemCard, { borderRadius: shape.large, borderColor: colors.outlineVariant }]}>
                  {item.imagen_url ? (
                    <Image source={{ uri: item.imagen_url }} style={s.image} contentFit="cover" />
                  ) : (
                    <View style={[s.image, s.placeholder, { backgroundColor: colors.surfaceVariant }]}>
                      <Ionicons name="image-outline" size={24} color={colors.onSurfaceVariant} />
                    </View>
                  )}
                  <View style={s.itemBody}>
                    <Text style={[typography.titleSmall, { color: colors.onSurface }]}>{item.nombre}</Text>
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
    image: { width: '100%', height: 160 },
    placeholder: { alignItems: 'center', justifyContent: 'center' },
    itemBody: { padding: 12, gap: 6 },
  });

