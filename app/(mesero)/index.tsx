import { Card, Counter, Enter, FAB, PressScale } from '@/components/md3';
import { Mesa } from '@/constants/mock';
import { useAuth } from '@/context/auth';
import { useMD3Theme } from '@/hooks/use-md3-theme';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type TableRow = {
  id: string;
  restaurant_id: string;
  numero: number;
  capacidad: number;
  activa: boolean;
};

const toMesa = (table: TableRow): Mesa => ({
  id: table.id,
  numero: table.numero,
  capacidad: table.capacidad,
  activa: table.activa,
});

const sortMesas = (items: Mesa[]) => [...items].sort((a, b) => a.numero - b.numero);

const upsertMesa = (items: Mesa[], mesa: Mesa) => {
  const exists = items.some(item => item.id === mesa.id);
  const next = exists
    ? items.map(item => item.id === mesa.id ? mesa : item)
    : [...items, mesa];

  return sortMesas(next);
};

export default function MeseroHome() {
  const { colors, typography, shape } = useMD3Theme();
  const s = useMemo(() => makeStyles(colors, shape), [colors, shape]);
  const { width } = useWindowDimensions();
  const { profile, signOut } = useAuth();
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantNombre, setRestaurantNombre] = useState('');
  const [restaurantLogo, setRestaurantLogo] = useState('');

  const totalMesas   = mesas.length;
  const mesasActivas = mesas.filter(m => m.activa).length;
  const cardWidth = (width - 40) / 2;

  const cargarMesas = useCallback(async () => {
    setLoading(true);
    setError('');

    const { data: restaurants } = await supabase
      .from('restaurants')
      .select('id, nombre, logo_url')
      .order('created_at', { ascending: true })
      .limit(1);

    const restaurant = restaurants?.[0];

    if (!restaurant) {
      setError('No hay restaurante registrado.');
      setLoading(false);
      return;
    }

    setRestaurantId(restaurant.id);
    setRestaurantNombre(restaurant.nombre ?? '');
    setRestaurantLogo((restaurant as { logo_url?: string | null }).logo_url ?? '');

    const { data, error: fetchError } = await supabase
      .from('tables')
      .select('id, restaurant_id, numero, capacidad, activa')
      .eq('restaurant_id', restaurant.id)
      .order('numero', { ascending: true });

    if (fetchError) setError(fetchError.message);
    else setMesas((data ?? []).map(table => toMesa(table)));

    setLoading(false);
  }, []);

  useEffect(() => {
    cargarMesas();
  }, [cargarMesas]);

  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel(`mesero-mesas-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tables',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        payload => {
          if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as Pick<TableRow, 'id'>;
            setMesas(prev => prev.filter(mesa => mesa.id !== oldRow.id));
            return;
          }

          const newRow = payload.new as TableRow;
          setMesas(prev => upsertMesa(prev, toMesa(newRow)));
        },
      )
      .subscribe(status => {
        if (status === 'CHANNEL_ERROR') {
          setError('No se pudo conectar la actualización en tiempo real de mesas.');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      {/* Top App Bar manual sin componente para mayor control */}
      <View style={[s.appBar, { backgroundColor: colors.surface, borderBottomColor: colors.outlineVariant }]}>
        <View style={s.appBarLeft}>
          {restaurantLogo ? (
            <Image source={{ uri: restaurantLogo }} style={[s.headerLogo, { borderRadius: shape.full }]} contentFit="cover" />
          ) : (
            <View style={[s.headerLogo, s.headerLogoFallback, { borderRadius: shape.full, backgroundColor: colors.primaryContainer }]}>
              <Ionicons name="restaurant-outline" size={20} color={colors.onPrimaryContainer} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={[typography.titleLarge, { color: colors.onSurface }]} numberOfLines={1}>
              Hola, {profile?.nombre?.split(' ')[0] ?? 'Mesero'}
            </Text>
            <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
              {restaurantNombre || new Date().toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>
        </View>
        <Pressable onPress={signOut} style={[s.iconBtn, { borderRadius: shape.full }]}
          android_ripple={{ color: colors.onSurface + '1F', borderless: true, radius: 24 }}>
          <Ionicons name="log-out-outline" size={24} color={colors.onSurfaceVariant} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Stats row */}
        <Enter delay={0}>
          <View style={s.statsRow}>
            <StatCard colors={colors} typography={typography} shape={shape}
              icon="grid-outline" value={totalMesas} label="Mesas" color={colors.primary} />
            <StatCard colors={colors} typography={typography} shape={shape}
              icon="checkmark-circle-outline" value={mesasActivas} label="Libres" color={colors.tertiary} />
            <StatCard colors={colors} typography={typography} shape={shape}
              icon="receipt-outline" value={0} label="Pedidos" color={colors.secondary} />
          </View>
        </Enter>

        {/* Acciones */}
        <Enter delay={80}>
          <Text style={[typography.titleMedium, s.sectionLabel, { color: colors.onSurface }]}>Acciones</Text>
        </Enter>
        <View style={s.actionsGrid}>
          {[
            { icon: 'add-circle-outline' as const, label: 'Nuevo pedido',  color: colors.primaryContainer,   on: colors.onPrimaryContainer, route: '/(mesero)/pedido-nuevo' },
            { icon: 'list-outline'        as const, label: 'Mis pedidos',   color: colors.secondaryContainer, on: colors.onSecondaryContainer, route: '/(mesero)/pedidos' },
            { icon: 'restaurant-outline'  as const, label: 'Ver menú',      color: colors.tertiaryContainer,  on: colors.onTertiaryContainer, route: '/(mesero)/menu' },
            { icon: 'person-outline'      as const, label: 'Mi perfil',     color: colors.surfaceVariant,     on: colors.onSurfaceVariant, route: null },
          ].map((a, i) => (
            <Enter key={a.label} delay={120 + i * 50} style={s.actionCardWrap}>
              <PressScale onPress={a.route ? () => router.push(a.route as any) : undefined}
                style={[s.actionCard, { backgroundColor: a.color, borderRadius: shape.large, opacity: a.route ? 1 : 0.7 }]}
                android_ripple={{ color: a.on + '30' }}>
                <Ionicons name={a.icon} size={28} color={a.on} />
                <Text style={[typography.labelLarge, { color: a.on, marginTop: 8 }]}>{a.label}</Text>
              </PressScale>
            </Enter>
          ))}
        </View>

        {/* Mesas */}
        <Enter delay={300}>
          <Text style={[typography.titleMedium, s.sectionLabel, { color: colors.onSurface }]}>Estado de mesas</Text>
        </Enter>
        {error ? (
          <View style={[s.errorBanner, { backgroundColor: colors.errorContainer, borderRadius: shape.medium }]}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.onErrorContainer} />
            <Text style={[typography.bodySmall, { color: colors.onErrorContainer, flex: 1 }]}>{error}</Text>
          </View>
        ) : null}
        {loading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <View style={s.mesasGrid}>
          {mesas.map((mesa, i) => (
            <Enter key={mesa.id} delay={340 + i * 45} style={{ width: cardWidth }}>
              <Card
                variant="outlined"
                style={[
                  s.mesaCard,
                  ...(mesa.activa ? [] : [s.mesaCardInactive]),
                ]}
              >
                <View style={s.mesaTop}>
                  <View style={[s.mesaIconBg, {
                    backgroundColor: mesa.activa ? colors.primary : colors.surfaceVariant,
                    borderRadius: shape.medium,
                  }]}>
                    <Ionicons name="grid-outline" size={20}
                      color={mesa.activa ? colors.onPrimary : colors.onSurfaceVariant} />
                  </View>
                  <View style={[
                    s.statusBadge,
                    {
                      backgroundColor: mesa.activa ? colors.tertiaryContainer : colors.surfaceVariant,
                      borderRadius: shape.full,
                    },
                  ]}>
                    <Ionicons
                      name={mesa.activa ? 'checkmark' : 'pause-outline'}
                      size={13}
                      color={mesa.activa ? colors.onTertiaryContainer : colors.onSurfaceVariant}
                    />
                    <Text
                      style={[
                        typography.labelSmall,
                        { color: mesa.activa ? colors.onTertiaryContainer : colors.onSurfaceVariant },
                      ]}
                      numberOfLines={1}
                    >
                      {mesa.activa ? 'Libre' : 'Inactiva'}
                    </Text>
                  </View>
                </View>

                <View style={s.mesaBody}>
                  <Text style={[typography.titleMedium, { color: colors.onSurface }]} numberOfLines={1}>
                    Mesa {mesa.numero}
                  </Text>
                  <View style={s.mesaCapRow}>
                    <Ionicons name="people-outline" size={14} color={colors.onSurfaceVariant} />
                    <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                      {mesa.capacidad} personas
                    </Text>
                  </View>
                </View>
              </Card>
            </Enter>
          ))}
          </View>
        )}

      </ScrollView>

      {/* FAB */}
      <FAB icon="add" onPress={() => router.push('/(mesero)/pedido-nuevo')} style={s.fab} />
    </SafeAreaView>
  );
}

function StatCard({ colors, typography, shape, icon, value, label, color }: any) {
  return (
    <View style={[{ flex: 1, backgroundColor: colors.surfaceContainerHigh, borderRadius: shape.medium, padding: 16, alignItems: 'center', gap: 4 }]}>
      <Ionicons name={icon} size={22} color={color} />
      <Counter value={value} style={[typography.headlineSmall, { color: colors.onSurface }]} />
      <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant }]}>{label}</Text>
    </View>
  );
}

const makeStyles = (colors: any, shape: any) => StyleSheet.create({
  safe:    { flex: 1 },
  appBar:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 8 },
  appBarLeft:{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  headerLogo:{ width: 44, height: 44 },
  headerLogoFallback: { alignItems: 'center', justifyContent: 'center' },
  iconBtn: { padding: 12 },
  scroll:  { padding: 16, paddingBottom: 96 },

  statsRow:    { flexDirection: 'row', gap: 8, marginBottom: 24 },
  sectionLabel:{ marginBottom: 12, marginTop: 4 },

  actionsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  actionCardWrap: { width: '47.5%' },
  actionCard:     { padding: 20, alignItems: 'flex-start' },

  mesasGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mesaCard:     { minHeight: 128, padding: 0, borderWidth: 1, borderColor: colors.outlineVariant },
  mesaCardInactive: { opacity: 0.78 },
  mesaTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, paddingBottom: 0 },
  mesaIconBg:   { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  statusBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: 88, paddingHorizontal: 9, paddingVertical: 5 },
  mesaBody:     { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 14, gap: 5 },
  mesaCapRow:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  errorBanner:{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, marginBottom: 12 },
  loadingBox: { paddingVertical: 32 },

  fab: { position: 'absolute', right: 16, bottom: 24 },
});
