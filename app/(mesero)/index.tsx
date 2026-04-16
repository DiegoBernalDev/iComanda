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
import { MOCK_USUARIO_SESION, MOCK_MESAS } from '@/constants/mock';

const totalMesas = MOCK_MESAS.length;
const mesasActivas = MOCK_MESAS.filter((m) => m.activa).length;

export default function MeseroHome() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola, {MOCK_USUARIO_SESION.nombre.split(' ')[0]} 👋</Text>
            <Text style={styles.subGreeting}>Turno activo — {new Date().toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={() => router.replace('/login')}>
            <Ionicons name="log-out-outline" size={22} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor: '#E85D04' }]}>
            <Ionicons name="grid-outline" size={20} color="#E85D04" />
            <Text style={styles.statValue}>{totalMesas}</Text>
            <Text style={styles.statLabel}>Total mesas</Text>
          </View>
          <View style={[styles.statCard, { borderColor: '#10B981' }]}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
            <Text style={styles.statValue}>{mesasActivas}</Text>
            <Text style={styles.statLabel}>Disponibles</Text>
          </View>
          <View style={[styles.statCard, { borderColor: '#6366F1' }]}>
            <Ionicons name="receipt-outline" size={20} color="#6366F1" />
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Pedidos hoy</Text>
          </View>
        </View>

        {/* Accesos rápidos */}
        <Text style={styles.sectionTitle}>Acciones</Text>
        <View style={styles.actionsGrid}>
          <ActionCard
            icon="add-circle-outline"
            label="Nuevo pedido"
            color="#E85D04"
            onPress={() => {}}
          />
          <ActionCard
            icon="list-outline"
            label="Mis pedidos"
            color="#6366F1"
            onPress={() => {}}
          />
          <ActionCard
            icon="restaurant-outline"
            label="Ver menú"
            color="#10B981"
            onPress={() => {}}
          />
          <ActionCard
            icon="person-outline"
            label="Mi perfil"
            color="#F59E0B"
            onPress={() => {}}
          />
        </View>

        {/* Mesas */}
        <Text style={styles.sectionTitle}>Estado de mesas</Text>
        <View style={styles.mesasGrid}>
          {MOCK_MESAS.map((mesa) => (
            <View
              key={mesa.id}
              style={[styles.mesaCard, !mesa.activa && styles.mesaInactiva]}
            >
              <Ionicons
                name="grid-outline"
                size={22}
                color={mesa.activa ? '#E85D04' : '#4B5563'}
              />
              <Text style={[styles.mesaNum, !mesa.activa && styles.textInactivo]}>
                Mesa {mesa.numero}
              </Text>
              <Text style={[styles.mesaCap, !mesa.activa && styles.textInactivo]}>
                {mesa.capacidad} personas
              </Text>
              <View style={[styles.mesaBadge, mesa.activa ? styles.badgeActiva : styles.badgeInactiva]}>
                <Text style={styles.mesaBadgeText}>{mesa.activa ? 'Libre' : 'Inactiva'}</Text>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function ActionCard({ icon, label, color, onPress }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.actionIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={26} color={color} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F0F0F' },
  scroll: { padding: 20, paddingBottom: 40 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  greeting: { fontSize: 22, fontWeight: '700', color: '#F3F4F6' },
  subGreeting: { fontSize: 13, color: '#6B7280', marginTop: 2, textTransform: 'capitalize' },
  logoutBtn: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  statCard: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  statValue: { fontSize: 22, fontWeight: '700', color: '#F3F4F6' },
  statLabel: { fontSize: 11, color: '#6B7280', textAlign: 'center' },

  // Sección
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#9CA3AF', marginBottom: 12 },

  // Acciones
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  actionCard: {
    width: '47.5%',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  actionIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 14, fontWeight: '500', color: '#E5E7EB', textAlign: 'center' },

  // Mesas
  mesasGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  mesaCard: {
    width: '47.5%',
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  mesaInactiva: { borderColor: '#1F2937', backgroundColor: '#141414' },
  mesaNum: { fontSize: 15, fontWeight: '600', color: '#F3F4F6', marginTop: 4 },
  mesaCap: { fontSize: 12, color: '#6B7280' },
  textInactivo: { color: '#4B5563' },
  mesaBadge: { marginTop: 6, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeActiva: { backgroundColor: '#065F4622' },
  badgeInactiva: { backgroundColor: '#1F293722' },
  mesaBadgeText: { fontSize: 11, fontWeight: '600', color: '#10B981' },
});
