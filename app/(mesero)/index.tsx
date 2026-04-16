import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppTheme } from '@/hooks/use-app-theme';
import { MOCK_USUARIO_SESION, MOCK_MESAS } from '@/constants/mock';

const totalMesas   = MOCK_MESAS.length;
const mesasActivas = MOCK_MESAS.filter((m) => m.activa).length;

export default function MeseroHome() {
  const t = useAppTheme();
  const s = useMemo(() => makeStyles(t), [t]);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>Hola, {MOCK_USUARIO_SESION.nombre.split(' ')[0]} 👋</Text>
            <Text style={s.subGreeting}>
              Turno activo — {new Date().toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>
          <TouchableOpacity style={s.logoutBtn} onPress={() => router.replace('/login')}>
            <Ionicons name="log-out-outline" size={22} color={t.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <StatCard t={t} icon="grid-outline"             color={t.brand.primary}  value={totalMesas}   label="Total mesas"  />
          <StatCard t={t} icon="checkmark-circle-outline" color={t.brand.success}  value={mesasActivas} label="Disponibles" />
          <StatCard t={t} icon="receipt-outline"          color={t.brand.indigo}   value={0}            label="Pedidos hoy" />
        </View>

        {/* Acciones */}
        <Text style={s.sectionTitle}>Acciones</Text>
        <View style={s.actionsGrid}>
          <ActionCard t={t} icon="add-circle-outline"  label="Nuevo pedido" color={t.brand.primary} onPress={() => {}} />
          <ActionCard t={t} icon="list-outline"        label="Mis pedidos"  color={t.brand.indigo}  onPress={() => {}} />
          <ActionCard t={t} icon="restaurant-outline"  label="Ver menú"     color={t.brand.success} onPress={() => {}} />
          <ActionCard t={t} icon="person-outline"      label="Mi perfil"    color={t.brand.warning} onPress={() => {}} />
        </View>

        {/* Mesas */}
        <Text style={s.sectionTitle}>Estado de mesas</Text>
        <View style={s.mesasGrid}>
          {MOCK_MESAS.map((mesa) => (
            <View key={mesa.id} style={[s.mesaCard, !mesa.activa && s.mesaInactiva]}>
              <Ionicons name="grid-outline" size={22} color={mesa.activa ? t.brand.primary : t.textMuted} />
              <Text style={[s.mesaNum, !mesa.activa && s.textInactivo]}>Mesa {mesa.numero}</Text>
              <Text style={[s.mesaCap, !mesa.activa && s.textInactivo]}>{mesa.capacidad} personas</Text>
              <View style={[s.mesaBadge, mesa.activa ? s.badgeActiva : s.badgeInactiva]}>
                <Text style={[s.mesaBadgeText, { color: mesa.activa ? t.brand.success : t.textMuted }]}>
                  {mesa.activa ? 'Libre' : 'Inactiva'}
                </Text>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ t, icon, color, value, label }: { t: ReturnType<typeof useAppTheme>; icon: keyof typeof Ionicons.glyphMap; color: string; value: number; label: string }) {
  const s = useMemo(() => makeStyles(t), [t]);
  return (
    <View style={[s.statCard, { borderColor: color + '55' }]}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function ActionCard({ t, icon, label, color, onPress }: { t: ReturnType<typeof useAppTheme>; icon: keyof typeof Ionicons.glyphMap; label: string; color: string; onPress: () => void }) {
  const s = useMemo(() => makeStyles(t), [t]);
  return (
    <TouchableOpacity style={s.actionCard} onPress={onPress} activeOpacity={0.8}>
      <View style={[s.actionIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={26} color={color} />
      </View>
      <Text style={s.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const makeStyles = (t: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  safe:   { flex: 1, backgroundColor: t.background },
  scroll: { padding: 20, paddingBottom: 40 },

  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  greeting:    { fontSize: 22, fontWeight: '700', color: t.text },
  subGreeting: { fontSize: 13, color: t.textMuted, marginTop: 2, textTransform: 'capitalize' },
  logoutBtn:   { backgroundColor: t.surface, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: t.border },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  statCard: {
    flex: 1, backgroundColor: t.surface, borderRadius: 14, padding: 14,
    alignItems: 'center', gap: 4, borderWidth: 1, ...(t.shadow as object),
  },
  statValue: { fontSize: 22, fontWeight: '700', color: t.text },
  statLabel: { fontSize: 11, color: t.textMuted, textAlign: 'center' },

  sectionTitle: { fontSize: 16, fontWeight: '600', color: t.textTertiary, marginBottom: 12 },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  actionCard:  { width: '47.5%', backgroundColor: t.surface, borderRadius: 16, padding: 18, alignItems: 'center', gap: 10, borderWidth: 1, borderColor: t.border },
  actionIcon:  { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 14, fontWeight: '500', color: t.text, textAlign: 'center' },

  mesasGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  mesaCard:    { width: '47.5%', backgroundColor: t.surface, borderRadius: 14, padding: 16, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: t.border },
  mesaInactiva:{ borderColor: t.border, backgroundColor: t.surfaceAlt, opacity: 0.6 },
  mesaNum:     { fontSize: 15, fontWeight: '600', color: t.text, marginTop: 4 },
  mesaCap:     { fontSize: 12, color: t.textMuted },
  textInactivo:{ color: t.textMuted },
  mesaBadge:   { marginTop: 6, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeActiva: { backgroundColor: t.brand.successFade },
  badgeInactiva:{ backgroundColor: t.surfaceAlt },
  mesaBadgeText:{ fontSize: 11, fontWeight: '600' },
});
