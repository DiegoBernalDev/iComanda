import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMD3Theme } from '@/hooks/use-md3-theme';
import { Card, Chip, FAB } from '@/components/md3';
import { useAuth } from '@/context/auth';
import { MOCK_MESAS } from '@/constants/mock';

export default function MeseroHome() {
  const { colors, typography, shape } = useMD3Theme();
  const s = useMemo(() => makeStyles(colors, shape), [colors, shape]);
  const { profile, signOut } = useAuth();

  const totalMesas   = MOCK_MESAS.length;
  const mesasActivas = MOCK_MESAS.filter(m => m.activa).length;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      {/* Top App Bar manual sin componente para mayor control */}
      <View style={[s.appBar, { backgroundColor: colors.surface, borderBottomColor: colors.outlineVariant }]}>
        <View>
          <Text style={[typography.titleLarge, { color: colors.onSurface }]}>
            Hola, {profile?.nombre?.split(' ')[0] ?? 'Mesero'}
          </Text>
          <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, textTransform: 'capitalize' }]}>
            {new Date().toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
        </View>
        <Pressable onPress={signOut} style={[s.iconBtn, { borderRadius: shape.full }]}
          android_ripple={{ color: colors.onSurface + '1F', borderless: true, radius: 24 }}>
          <Ionicons name="log-out-outline" size={24} color={colors.onSurfaceVariant} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Stats row */}
        <View style={s.statsRow}>
          <StatCard colors={colors} typography={typography} shape={shape}
            icon="grid-outline" value={totalMesas} label="Mesas" color={colors.primary} />
          <StatCard colors={colors} typography={typography} shape={shape}
            icon="checkmark-circle-outline" value={mesasActivas} label="Libres" color={colors.tertiary} />
          <StatCard colors={colors} typography={typography} shape={shape}
            icon="receipt-outline" value={0} label="Pedidos" color={colors.secondary} />
        </View>

        {/* Acciones */}
        <Text style={[typography.titleMedium, s.sectionLabel, { color: colors.onSurface }]}>Acciones</Text>
        <View style={s.actionsGrid}>
          {[
            { icon: 'add-circle-outline' as const, label: 'Nuevo pedido',  color: colors.primaryContainer,   on: colors.onPrimaryContainer },
            { icon: 'list-outline'        as const, label: 'Mis pedidos',   color: colors.secondaryContainer, on: colors.onSecondaryContainer },
            { icon: 'restaurant-outline'  as const, label: 'Ver menú',      color: colors.tertiaryContainer,  on: colors.onTertiaryContainer },
            { icon: 'person-outline'      as const, label: 'Mi perfil',     color: colors.surfaceVariant,     on: colors.onSurfaceVariant },
          ].map(a => (
            <Pressable key={a.label} style={[s.actionCard, { backgroundColor: a.color, borderRadius: shape.large }]}
              android_ripple={{ color: a.on + '30' }}>
              <Ionicons name={a.icon} size={28} color={a.on} />
              <Text style={[typography.labelLarge, { color: a.on, marginTop: 8 }]}>{a.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Mesas */}
        <Text style={[typography.titleMedium, s.sectionLabel, { color: colors.onSurface }]}>Estado de mesas</Text>
        <View style={s.mesasGrid}>
          {MOCK_MESAS.map(mesa => (
            <Card key={mesa.id} variant={mesa.activa ? 'elevated' : 'filled'} style={s.mesaCard}>
              <View style={[s.mesaTop]}>
                <View style={[s.mesaIconBg, {
                  backgroundColor: mesa.activa ? colors.primaryContainer : colors.surfaceVariant,
                  borderRadius: shape.medium,
                }]}>
                  <Ionicons name="grid-outline" size={20}
                    color={mesa.activa ? colors.onPrimaryContainer : colors.onSurfaceVariant} />
                </View>
                <Chip
                  label={mesa.activa ? 'Libre' : 'Inactiva'}
                  selected={mesa.activa}
                  variant="filter"
                />
              </View>
              <Text style={[typography.titleMedium, { color: colors.onSurface, marginTop: 8 }]}>
                Mesa {mesa.numero}
              </Text>
              <View style={s.mesaCapRow}>
                <Ionicons name="people-outline" size={14} color={colors.onSurfaceVariant} />
                <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>
                  {mesa.capacidad} personas
                </Text>
              </View>
            </Card>
          ))}
        </View>

      </ScrollView>

      {/* FAB */}
      <FAB icon="add" onPress={() => {}} style={s.fab} />
    </SafeAreaView>
  );
}

function StatCard({ colors, typography, shape, icon, value, label, color }: any) {
  return (
    <View style={[{ flex: 1, backgroundColor: colors.surfaceContainerHigh, borderRadius: shape.medium, padding: 16, alignItems: 'center', gap: 4 }]}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[typography.headlineSmall, { color: colors.onSurface }]}>{value}</Text>
      <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant }]}>{label}</Text>
    </View>
  );
}

const makeStyles = (colors: any, shape: any) => StyleSheet.create({
  safe:    { flex: 1 },
  appBar:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  iconBtn: { padding: 12 },
  scroll:  { padding: 16, paddingBottom: 96 },

  statsRow:    { flexDirection: 'row', gap: 8, marginBottom: 24 },
  sectionLabel:{ marginBottom: 12, marginTop: 4 },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  actionCard:  { width: '47.5%', padding: 20, alignItems: 'flex-start' },

  mesasGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mesaCard:   { width: '47.5%', padding: 16 },
  mesaTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mesaIconBg: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  mesaCapRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },

  fab: { position: 'absolute', right: 16, bottom: 24 },
});
