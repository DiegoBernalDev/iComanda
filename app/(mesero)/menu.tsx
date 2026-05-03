import { Card, Chip, Enter, TopAppBar } from '@/components/md3';
import { useMD3Theme } from '@/hooks/use-md3-theme';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type MenuItem = {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  categoria: string | null;
  imagen_url: string | null;
  disponible: boolean;
};

export default function MeseroMenuScreen() {
  const { colors, typography, shape } = useMD3Theme();
  const s = useMemo(() => makeStyles(colors, shape), [colors, shape]);

  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | string>('all');

  const categories = useMemo(() => {
    const values = new Set<string>();
    items.forEach((item) => {
      if (item.categoria?.trim()) values.add(item.categoria.trim());
    });
    return [...values].sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((item) => (item.categoria ?? '') === filter);
  }, [items, filter]);

  const loadMenu = useCallback(async () => {
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

    const restaurantId = restaurants?.[0]?.id;
    if (!restaurantId) {
      setError('No hay restaurante registrado.');
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from('menu_items')
      .select('id, nombre, descripcion, precio, categoria, imagen_url, disponible')
      .eq('restaurant_id', restaurantId)
      .eq('disponible', true)
      .order('categoria', { ascending: true, nullsFirst: false })
      .order('nombre', { ascending: true });

    if (fetchError) setError(fetchError.message);
    else setItems((data ?? []) as MenuItem[]);

    setLoading(false);
  }, []);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <TopAppBar title="Menú disponible" onBack={() => router.back()} />

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
            <Chip
              label="Todas"
              variant="filter"
              selected={filter === 'all'}
              onPress={() => setFilter('all')}
            />
            {categories.map((category) => (
              <Chip
                key={category}
                label={category}
                variant="filter"
                selected={filter === category}
                onPress={() => setFilter(category)}
              />
            ))}
          </View>
        </Enter>

        {loading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : filteredItems.length === 0 ? (
          <Card variant="outlined" style={s.emptyCard}>
            <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}>
              No hay ítems disponibles.
            </Text>
          </Card>
        ) : (
          filteredItems.map((item, index) => (
            <Enter key={item.id} delay={70 + index * 30}>
              <Card variant="outlined" style={s.itemCard}>
                <View style={s.itemMain}>
                  {item.imagen_url ? (
                    <Image
                      source={{ uri: item.imagen_url }}
                      style={[s.itemImage, { borderRadius: shape.medium }]}
                      contentFit="cover"
                    />
                  ) : (
                    <View
                      style={[
                        s.itemImage,
                        {
                          borderRadius: shape.medium,
                          backgroundColor: colors.surfaceVariant,
                          alignItems: 'center',
                          justifyContent: 'center',
                        },
                      ]}
                    >
                      <Ionicons name="image-outline" size={20} color={colors.onSurfaceVariant} />
                    </View>
                  )}
                  <View style={s.itemBody}>
                    <Text style={[typography.titleMedium, { color: colors.onSurface }]}>
                      {item.nombre}
                    </Text>
                    <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>
                      {item.categoria || 'Sin categoría'} · Bs {item.precio.toFixed(2)}
                    </Text>
                    <Text
                      style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}
                      numberOfLines={2}
                    >
                      {item.descripcion || 'Sin descripción'}
                    </Text>
                  </View>
                </View>
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
    scroll: { padding: 16, gap: 10, paddingBottom: 40 },
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
    itemCard: { padding: 0, overflow: 'hidden' },
    itemMain: { padding: 12, flexDirection: 'row', gap: 10, alignItems: 'center' },
    itemImage: { width: 56, height: 56 },
    itemBody: { flex: 1, gap: 2 },
  });
