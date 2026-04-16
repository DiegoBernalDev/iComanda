import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { MOCK_USUARIOS, Usuario, Role } from '@/constants/mock';

export default function UsuariosScreen() {
  const [usuarios, setUsuarios] = useState<Usuario[]>(MOCK_USUARIOS);
  const [modalVisible, setModalVisible] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState<Role>('mesero');

  const toggleActivo = (id: string) => {
    setUsuarios((prev) =>
      prev.map((u) => (u.id === id ? { ...u, activo: !u.activo } : u))
    );
  };

  const crearUsuario = () => {
    if (!nombre || !email) return;
    const nuevo: Usuario = {
      id: `u${Date.now()}`,
      nombre,
      email,
      rol,
      activo: true,
      creadoEn: new Date().toISOString().slice(0, 10),
    };
    setUsuarios((prev) => [...prev, nuevo]);
    setNombre('');
    setEmail('');
    setRol('mesero');
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back-outline" size={22} color="#F3F4F6" />
        </TouchableOpacity>
        <Text style={styles.title}>Usuarios</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Resumen */}
        <View style={styles.summaryRow}>
          <SummaryChip icon="people-outline"  color="#6366F1" label={`${usuarios.length} total`}                              />
          <SummaryChip icon="checkmark-circle-outline" color="#10B981" label={`${usuarios.filter((u) => u.activo).length} activos`}  />
          <SummaryChip icon="close-circle-outline"     color="#EF4444" label={`${usuarios.filter((u) => !u.activo).length} inactivos`} />
        </View>

        {/* Lista */}
        <View style={styles.list}>
          {usuarios.map((u) => (
            <View key={u.id} style={styles.userCard}>
              <View style={[styles.avatar, { backgroundColor: u.rol === 'admin' ? '#6366F122' : '#E85D0422' }]}>
                <Ionicons
                  name={u.rol === 'admin' ? 'shield-checkmark-outline' : 'person-outline'}
                  size={20}
                  color={u.rol === 'admin' ? '#6366F1' : '#E85D04'}
                />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{u.nombre}</Text>
                <Text style={styles.userEmail}>{u.email}</Text>
                <View style={styles.userMeta}>
                  <View style={[styles.rolBadge, u.rol === 'admin' ? styles.rolAdmin : styles.rolMesero]}>
                    <Text style={styles.rolBadgeText}>{u.rol}</Text>
                  </View>
                  <Text style={styles.fecha}>Desde {u.creadoEn}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.toggleBtn, u.activo ? styles.toggleActivo : styles.toggleInactivo]}
                onPress={() => toggleActivo(u.id)}
              >
                <Ionicons
                  name={u.activo ? 'pause-outline' : 'play-outline'}
                  size={16}
                  color={u.activo ? '#10B981' : '#6B7280'}
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Modal nuevo usuario */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nuevo usuario</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-outline" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Nombre completo</Text>
            <TextInput
              style={styles.input}
              placeholder="Juan Pérez"
              placeholderTextColor="#4B5563"
              value={nombre}
              onChangeText={setNombre}
            />

            <Text style={styles.inputLabel}>Correo electrónico</Text>
            <TextInput
              style={styles.input}
              placeholder="juan@restaurante.com"
              placeholderTextColor="#4B5563"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Rol</Text>
            <View style={styles.rolSelector}>
              {(['mesero', 'admin'] as Role[]).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.rolOption, rol === r && styles.rolOptionSelected]}
                  onPress={() => setRol(r)}
                >
                  <Ionicons
                    name={r === 'admin' ? 'shield-checkmark-outline' : 'person-outline'}
                    size={16}
                    color={rol === r ? '#E85D04' : '#6B7280'}
                  />
                  <Text style={[styles.rolOptionText, rol === r && styles.rolOptionTextSelected]}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.createBtn} onPress={crearUsuario}>
              <Ionicons name="person-add-outline" size={18} color="#fff" />
              <Text style={styles.createBtnText}>Crear usuario</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SummaryChip({ icon, color, label }: { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }) {
  return (
    <View style={[styles.chip, { borderColor: color + '44' }]}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={[styles.chipText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F0F0F' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1F2937',
  },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: '700', color: '#F3F4F6' },
  addBtn: {
    backgroundColor: '#E85D04', borderRadius: 10, padding: 8,
    ...Platform.select({
      ios: { shadowColor: '#E85D04', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 6 },
      android: { elevation: 5 },
    }),
  },

  scroll: { padding: 20, paddingBottom: 40 },

  // Summary
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: '#1A1A1A',
  },
  chipText: { fontSize: 12, fontWeight: '600' },

  // Lista
  list: { gap: 10 },
  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#1A1A1A', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#2A2A2A',
  },
  avatar: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  userInfo: { flex: 1, gap: 2 },
  userName: { fontSize: 15, fontWeight: '600', color: '#F3F4F6' },
  userEmail: { fontSize: 12, color: '#6B7280' },
  userMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  rolBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  rolAdmin: { backgroundColor: '#6366F122' },
  rolMesero: { backgroundColor: '#E85D0422' },
  rolBadgeText: { fontSize: 11, fontWeight: '600', color: '#9CA3AF' },
  fecha: { fontSize: 11, color: '#4B5563' },
  toggleBtn: { padding: 10, borderRadius: 10, borderWidth: 1 },
  toggleActivo: { borderColor: '#10B98133', backgroundColor: '#10B98111' },
  toggleInactivo: { borderColor: '#2A2A2A', backgroundColor: '#1F2937' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#1A1A1A', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, borderTopWidth: 1, borderColor: '#2A2A2A',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#F3F4F6' },
  inputLabel: { fontSize: 13, fontWeight: '500', color: '#9CA3AF', marginBottom: 6 },
  input: {
    backgroundColor: '#262626', borderWidth: 1, borderColor: '#333',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#F3F4F6', marginBottom: 16,
  },
  rolSelector: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  rolOption: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#262626', borderWidth: 1, borderColor: '#333', borderRadius: 12, paddingVertical: 12,
  },
  rolOptionSelected: { borderColor: '#E85D04', backgroundColor: '#E85D0415' },
  rolOptionText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
  rolOptionTextSelected: { color: '#E85D04' },
  createBtn: {
    backgroundColor: '#E85D04', borderRadius: 12, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
