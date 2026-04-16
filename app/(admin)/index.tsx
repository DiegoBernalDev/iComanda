import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppTheme } from '@/hooks/use-app-theme';
import { MOCK_ADMIN_SESION, MOCK_USUARIOS, MOCK_MESAS, MOCK_RESTAURANTE } from '@/constants/mock';

const usuariosActivos = MOCK_USUARIOS.filter((u) => u.activo).length;
const mesasActivas    = MOCK_MESAS.filter((m) => m.activa).length;

export default function AdminHome() {
  const t = useAppTheme();
  const s = useMemo(() => makeStyles(t), [t]);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <View style={s.rolePill}>
              <Ionicons name="shield-checkmark-outline" size={12} color={t.brand.primary} />
              <Text style={s.rolePillText}>Administrador</Text>
            </View>
            <Text style={s.greeting}>Hola, {MOCK_ADMIN_SESION.nombre.split(' ')[0]}</Text>
            <Text style={s.restaurant}>{MOCK_RESTAURANTE.nombre}</Text>
          </View>
          <TouchableOpacity style={s.logoutBtn} onPress={() => router.replace('/login')}>
            <Ionicons name="log-out-outline" size={22} color={t.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <StatCard t={t} icon="people-outline" color={t.brand.indigo}   value={MOCK_USUARIOS.length} label="Usuarios" />
          <StatCard t={t} icon="person-outline" color={t.brand.success}  value={usuariosActivos}      label="Activos"  />
          <StatCard t={t} icon="grid-outline"   color={t.brand.primary}  value={mesasActivas}         label="Mesas"    />
        </View>

        {/* Módulos */}
        <Text style={s.sectionTitle}>Panel de administración</Text>
        <View style={s.modulesGrid}>
          <ModuleCard t={t} icon="people-outline"       label="Usuarios"     description="Crear, activar y gestionar cuentas" color={t.brand.indigo}   onPress={() => router.push('/(admin)/usuarios')} />
          <ModuleCard t={t} icon="grid-outline"         label="Mesas"        description="CRUD de mesas del restaurante"      color={t.brand.primary}  onPress={() => router.push('/(admin)/mesas')} />
          <ModuleCard t={t} icon="storefront-outline"   label="Restaurante"  description="Nombre, slug y configuración"       color={t.brand.success}  onPress={() => router.push('/(admin)/restaurante')} />
          <ModuleCard t={t} icon="receipt-outline"      label="Pedidos"      description="Disponible en Sprint 2"             color={t.textMuted}      onPress={() => {}} disabled />
        </View>

        {/* Info restaurante */}
        <Text style={s.sectionTitle}>Restaurante actual</Text>
        <View style={s.infoCard}>
          <InfoRow t={t} icon="storefront-outline" label="Nombre"    value={MOCK_RESTAURANTE.nombre}     />
          <InfoRow t={t} icon="link-outline"       label="Slug"      value={`/${MOCK_RESTAURANTE.slug}`} />
          <InfoRow t={t} icon="location-outline"   label="Dirección" value={MOCK_RESTAURANTE.direccion}  />
          <InfoRow t={t} icon="call-outline"       label="Teléfono"  value={MOCK_RESTAURANTE.telefono}   />
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

function ModuleCard({ t, icon, label, description, color, onPress, disabled }: { t: ReturnType<typeof useAppTheme>; icon: keyof typeof Ionicons.glyphMap; label: string; description: string; color: string; onPress: () => void; disabled?: boolean }) {
  const s = useMemo(() => makeStyles(t), [t]);
  return (
    <TouchableOpacity style={[s.moduleCard, disabled && s.moduleDisabled]} onPress={onPress} activeOpacity={disabled ? 1 : 0.8}>
      <View style={[s.moduleIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={26} color={disabled ? t.textMuted : color} />
      </View>
      <Text style={[s.moduleLabel, disabled && s.textDisabled]}>{label}</Text>
      <Text style={[s.moduleDesc, disabled && s.textDisabled]}>{description}</Text>
      {!disabled && <Ionicons name="chevron-forward-outline" size={14} color={color} style={s.moduleArrow} />}
    </TouchableOpacity>
  );
}

function InfoRow({ t, icon, label, value }: { t: ReturnType<typeof useAppTheme>; icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  const s = useMemo(() => makeStyles(t), [t]);
  return (
    <View style={s.infoRow}>
      <Ionicons name={icon} size={16} color={t.textMuted} style={{ width: 22 }} />
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const makeStyles = (t: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  safe:   { flex: 1, backgroundColor: t.background },
  scroll: { padding: 20, paddingBottom: 40 },

  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  rolePill:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: t.brand.primaryFade, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 6 },
  rolePillText:{ fontSize: 11, fontWeight: '600', color: t.brand.primary },
  greeting:    { fontSize: 22, fontWeight: '700', color: t.text },
  restaurant:  { fontSize: 13, color: t.textMuted, marginTop: 2 },
  logoutBtn:   { backgroundColor: t.surface, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: t.border },

  statsRow:  { flexDirection: 'row', gap: 10, marginBottom: 28 },
  statCard:  { flex: 1, backgroundColor: t.surface, borderRadius: 14, padding: 14, alignItems: 'center', gap: 4, borderWidth: 1, ...(t.shadow as object) },
  statValue: { fontSize: 22, fontWeight: '700', color: t.text },
  statLabel: { fontSize: 11, color: t.textMuted },

  sectionTitle: { fontSize: 16, fontWeight: '600', color: t.textTertiary, marginBottom: 12 },

  modulesGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  moduleCard:    { width: '47.5%', backgroundColor: t.surface, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: t.border },
  moduleDisabled:{ opacity: 0.45 },
  moduleIcon:    { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  moduleLabel:   { fontSize: 15, fontWeight: '600', color: t.text, marginBottom: 4 },
  moduleDesc:    { fontSize: 12, color: t.textMuted, lineHeight: 16 },
  moduleArrow:   { position: 'absolute', top: 18, right: 18 },
  textDisabled:  { color: t.textMuted },

  infoCard: { backgroundColor: t.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: t.border, gap: 14 },
  infoRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoLabel:{ fontSize: 13, color: t.textMuted, width: 72 },
  infoValue:{ flex: 1, fontSize: 13, color: t.text, fontWeight: '500' },
});
