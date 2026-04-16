import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { MOCK_ADMIN_SESION, MOCK_USUARIOS, MOCK_MESAS, MOCK_RESTAURANTE } from '@/constants/mock';

const usuariosActivos = MOCK_USUARIOS.filter((u) => u.activo).length;
const mesasActivas = MOCK_MESAS.filter((m) => m.activa).length;

export default function AdminHome() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <View style={styles.rolePill}>
              <Ionicons name="shield-checkmark-outline" size={12} color="#E85D04" />
              <Text style={styles.rolePillText}>Administrador</Text>
            </View>
            <Text style={styles.greeting}>Hola, {MOCK_ADMIN_SESION.nombre.split(' ')[0]}</Text>
            <Text style={styles.restaurant}>{MOCK_RESTAURANTE.nombre}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={() => router.replace('/login')}>
            <Ionicons name="log-out-outline" size={22} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard icon="people-outline"      color="#6366F1" value={MOCK_USUARIOS.length} label="Usuarios" />
          <StatCard icon="person-outline"      color="#10B981" value={usuariosActivos}       label="Activos"  />
          <StatCard icon="grid-outline"        color="#E85D04" value={mesasActivas}          label="Mesas"    />
        </View>

        {/* Módulos */}
        <Text style={styles.sectionTitle}>Panel de administración</Text>
        <View style={styles.modulesGrid}>
          <ModuleCard
            icon="people-outline"
            label="Usuarios"
            description="Crear, activar y gestionar cuentas"
            color="#6366F1"
            onPress={() => router.push('/(admin)/usuarios')}
          />
          <ModuleCard
            icon="grid-outline"
            label="Mesas"
            description="CRUD de mesas del restaurante"
            color="#E85D04"
            onPress={() => router.push('/(admin)/mesas')}
          />
          <ModuleCard
            icon="storefront-outline"
            label="Restaurante"
            description="Nombre, slug y configuración"
            color="#10B981"
            onPress={() => router.push('/(admin)/restaurante')}
          />
          <ModuleCard
            icon="receipt-outline"
            label="Pedidos"
            description="Disponible en Sprint 2"
            color="#6B7280"
            onPress={() => {}}
            disabled
          />
        </View>

        {/* Info restaurante */}
        <Text style={styles.sectionTitle}>Restaurante actual</Text>
        <View style={styles.infoCard}>
          <InfoRow icon="storefront-outline" label="Nombre"    value={MOCK_RESTAURANTE.nombre}    />
          <InfoRow icon="link-outline"       label="Slug"      value={`/${MOCK_RESTAURANTE.slug}`} />
          <InfoRow icon="location-outline"   label="Dirección" value={MOCK_RESTAURANTE.direccion} />
          <InfoRow icon="call-outline"       label="Teléfono"  value={MOCK_RESTAURANTE.telefono}  />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon, color, value, label }: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  value: number;
  label: string;
}) {
  return (
    <View style={[styles.statCard, { borderColor: color + '55' }]}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ModuleCard({ icon, label, description, color, onPress, disabled }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  color: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.moduleCard, disabled && styles.moduleDisabled]}
      onPress={onPress}
      activeOpacity={disabled ? 1 : 0.8}
    >
      <View style={[styles.moduleIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={26} color={disabled ? '#4B5563' : color} />
      </View>
      <Text style={[styles.moduleLabel, disabled && styles.textDisabled]}>{label}</Text>
      <Text style={[styles.moduleDesc, disabled && styles.textDisabled]}>{description}</Text>
      {!disabled && (
        <Ionicons name="chevron-forward-outline" size={14} color={color} style={styles.moduleArrow} />
      )}
    </TouchableOpacity>
  );
}

function InfoRow({ icon, label, value }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color="#6B7280" style={{ width: 22 }} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F0F0F' },
  scroll: { padding: 20, paddingBottom: 40 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  rolePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#E85D0422', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    alignSelf: 'flex-start', marginBottom: 6,
  },
  rolePillText: { fontSize: 11, fontWeight: '600', color: '#E85D04' },
  greeting: { fontSize: 22, fontWeight: '700', color: '#F3F4F6' },
  restaurant: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  logoutBtn: {
    backgroundColor: '#1A1A1A', borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: '#2A2A2A',
  },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  statCard: {
    flex: 1, backgroundColor: '#1A1A1A', borderRadius: 14, padding: 14,
    alignItems: 'center', gap: 4, borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  statValue: { fontSize: 22, fontWeight: '700', color: '#F3F4F6' },
  statLabel: { fontSize: 11, color: '#6B7280' },

  // Sección
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#9CA3AF', marginBottom: 12 },

  // Módulos
  modulesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  moduleCard: {
    width: '47.5%', backgroundColor: '#1A1A1A', borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: '#2A2A2A',
  },
  moduleDisabled: { opacity: 0.45 },
  moduleIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  moduleLabel: { fontSize: 15, fontWeight: '600', color: '#F3F4F6', marginBottom: 4 },
  moduleDesc: { fontSize: 12, color: '#6B7280', lineHeight: 16 },
  moduleArrow: { position: 'absolute', top: 18, right: 18 },
  textDisabled: { color: '#4B5563' },

  // Info card
  infoCard: {
    backgroundColor: '#1A1A1A', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#2A2A2A', gap: 14,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoLabel: { fontSize: 13, color: '#6B7280', width: 72 },
  infoValue: { flex: 1, fontSize: 13, color: '#E5E7EB', fontWeight: '500' },
});
