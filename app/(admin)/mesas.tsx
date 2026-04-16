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
import { MOCK_MESAS, Mesa } from '@/constants/mock';

export default function MesasScreen() {
  const [mesas, setMesas] = useState<Mesa[]>(MOCK_MESAS);
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState<Mesa | null>(null);
  const [numero, setNumero] = useState('');
  const [capacidad, setCapacidad] = useState('');

  const abrirCrear = () => {
    setEditando(null);
    setNumero('');
    setCapacidad('');
    setModalVisible(true);
  };

  const abrirEditar = (mesa: Mesa) => {
    setEditando(mesa);
    setNumero(String(mesa.numero));
    setCapacidad(String(mesa.capacidad));
    setModalVisible(true);
  };

  const guardar = () => {
    if (!numero || !capacidad) return;
    if (editando) {
      setMesas((prev) =>
        prev.map((m) =>
          m.id === editando.id
            ? { ...m, numero: parseInt(numero), capacidad: parseInt(capacidad) }
            : m
        )
      );
    } else {
      const nueva: Mesa = {
        id: `m${Date.now()}`,
        numero: parseInt(numero),
        capacidad: parseInt(capacidad),
        activa: true,
      };
      setMesas((prev) => [...prev, nueva]);
    }
    setModalVisible(false);
  };

  const eliminar = (id: string) => {
    setMesas((prev) => prev.filter((m) => m.id !== id));
  };

  const toggleActiva = (id: string) => {
    setMesas((prev) => prev.map((m) => (m.id === id ? { ...m, activa: !m.activa } : m)));
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back-outline" size={22} color="#F3F4F6" />
        </TouchableOpacity>
        <Text style={styles.title}>Mesas</Text>
        <TouchableOpacity style={styles.addBtn} onPress={abrirCrear}>
          <Ionicons name="add-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Resumen */}
        <View style={styles.summaryRow}>
          <SummaryChip icon="grid-outline"          color="#E85D04" label={`${mesas.length} total`}                                />
          <SummaryChip icon="checkmark-circle-outline" color="#10B981" label={`${mesas.filter((m) => m.activa).length} activas`}  />
          <SummaryChip icon="close-circle-outline"     color="#EF4444" label={`${mesas.filter((m) => !m.activa).length} inactivas`} />
        </View>

        {/* Grid de mesas */}
        <View style={styles.grid}>
          {mesas.map((mesa) => (
            <View key={mesa.id} style={[styles.mesaCard, !mesa.activa && styles.mesaInactiva]}>
              <View style={styles.mesaTop}>
                <View style={[styles.mesaIconBg, { backgroundColor: mesa.activa ? '#E85D0422' : '#1F293744' }]}>
                  <Ionicons name="grid-outline" size={22} color={mesa.activa ? '#E85D04' : '#4B5563'} />
                </View>
                <View style={[styles.estadoBadge, mesa.activa ? styles.estadoActiva : styles.estadoInactiva]}>
                  <Text style={[styles.estadoText, { color: mesa.activa ? '#10B981' : '#6B7280' }]}>
                    {mesa.activa ? 'Activa' : 'Inactiva'}
                  </Text>
                </View>
              </View>

              <Text style={[styles.mesaNum, !mesa.activa && styles.textInactivo]}>Mesa {mesa.numero}</Text>
              <View style={styles.mesaCapRow}>
                <Ionicons name="people-outline" size={13} color="#6B7280" />
                <Text style={styles.mesaCap}>{mesa.capacidad} personas</Text>
              </View>

              {/* Acciones */}
              <View style={styles.mesaActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => abrirEditar(mesa)}>
                  <Ionicons name="create-outline" size={16} color="#6366F1" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => toggleActiva(mesa.id)}>
                  <Ionicons
                    name={mesa.activa ? 'pause-outline' : 'play-outline'}
                    size={16}
                    color={mesa.activa ? '#F59E0B' : '#10B981'}
                  />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => eliminar(mesa.id)}>
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Modal crear/editar */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editando ? 'Editar mesa' : 'Nueva mesa'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-outline" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Número de mesa</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 7"
              placeholderTextColor="#4B5563"
              value={numero}
              onChangeText={setNumero}
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Capacidad (personas)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 4"
              placeholderTextColor="#4B5563"
              value={capacidad}
              onChangeText={setCapacidad}
              keyboardType="numeric"
            />

            <TouchableOpacity style={styles.saveBtn} onPress={guardar}>
              <Ionicons name={editando ? 'save-outline' : 'add-circle-outline'} size={18} color="#fff" />
              <Text style={styles.saveBtnText}>{editando ? 'Guardar cambios' : 'Crear mesa'}</Text>
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

  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#1A1A1A',
  },
  chipText: { fontSize: 12, fontWeight: '600' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  mesaCard: {
    width: '47.5%', backgroundColor: '#1A1A1A', borderRadius: 16,
    padding: 14, borderWidth: 1, borderColor: '#2A2A2A', gap: 6,
  },
  mesaInactiva: { borderColor: '#1F2937', backgroundColor: '#141414' },
  mesaTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  mesaIconBg: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  estadoBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  estadoActiva: { backgroundColor: '#10B98122' },
  estadoInactiva: { backgroundColor: '#1F293722' },
  estadoText: { fontSize: 10, fontWeight: '700' },
  mesaNum: { fontSize: 16, fontWeight: '700', color: '#F3F4F6' },
  textInactivo: { color: '#4B5563' },
  mesaCapRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  mesaCap: { fontSize: 12, color: '#6B7280' },
  mesaActions: { flexDirection: 'row', gap: 6, marginTop: 8 },
  actionBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 8,
    backgroundColor: '#262626', borderRadius: 8, borderWidth: 1, borderColor: '#333',
  },
  deleteBtn: { borderColor: '#EF444422', backgroundColor: '#EF444411' },

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
    backgroundColor: '#262626', borderWidth: 1, borderColor: '#333', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#F3F4F6', marginBottom: 16,
  },
  saveBtn: {
    backgroundColor: '#E85D04', borderRadius: 12, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
