import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Platform } from 'react-native';
import { useState, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppTheme } from '@/hooks/use-app-theme';
import { MOCK_MESAS, Mesa } from '@/constants/mock';

export default function MesasScreen() {
  const t = useAppTheme();
  const s = useMemo(() => makeStyles(t), [t]);

  const [mesas, setMesas]             = useState<Mesa[]>(MOCK_MESAS);
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando]       = useState<Mesa | null>(null);
  const [numero, setNumero]           = useState('');
  const [capacidad, setCapacidad]     = useState('');

  const abrirCrear  = () => { setEditando(null); setNumero(''); setCapacidad(''); setModalVisible(true); };
  const abrirEditar = (m: Mesa) => { setEditando(m); setNumero(String(m.numero)); setCapacidad(String(m.capacidad)); setModalVisible(true); };

  const guardar = () => {
    if (!numero || !capacidad) return;
    if (editando) {
      setMesas((prev) => prev.map((m) => m.id === editando.id ? { ...m, numero: parseInt(numero), capacidad: parseInt(capacidad) } : m));
    } else {
      setMesas((prev) => [...prev, { id: `m${Date.now()}`, numero: parseInt(numero), capacidad: parseInt(capacidad), activa: true }]);
    }
    setModalVisible(false);
  };

  const eliminar    = (id: string) => setMesas((prev) => prev.filter((m) => m.id !== id));
  const toggleActiva = (id: string) => setMesas((prev) => prev.map((m) => m.id === id ? { ...m, activa: !m.activa } : m));

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back-outline" size={22} color={t.text} />
        </TouchableOpacity>
        <Text style={s.title}>Mesas</Text>
        <TouchableOpacity style={s.addBtn} onPress={abrirCrear}>
          <Ionicons name="add-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.summaryRow}>
          <SummaryChip t={t} icon="grid-outline"             color={t.brand.primary} label={`${mesas.length} total`}                               />
          <SummaryChip t={t} icon="checkmark-circle-outline" color={t.brand.success} label={`${mesas.filter((m) => m.activa).length} activas`}  />
          <SummaryChip t={t} icon="close-circle-outline"     color={t.brand.danger}  label={`${mesas.filter((m) => !m.activa).length} inactivas`} />
        </View>

        <View style={s.grid}>
          {mesas.map((mesa) => (
            <View key={mesa.id} style={[s.mesaCard, !mesa.activa && s.mesaInactiva]}>
              <View style={s.mesaTop}>
                <View style={[s.mesaIconBg, { backgroundColor: mesa.activa ? t.brand.primaryFade : t.surfaceAlt }]}>
                  <Ionicons name="grid-outline" size={22} color={mesa.activa ? t.brand.primary : t.textMuted} />
                </View>
                <View style={[s.estadoBadge, mesa.activa ? s.estadoActiva : s.estadoInactiva]}>
                  <Text style={[s.estadoText, { color: mesa.activa ? t.brand.success : t.textMuted }]}>
                    {mesa.activa ? 'Activa' : 'Inactiva'}
                  </Text>
                </View>
              </View>
              <Text style={[s.mesaNum, !mesa.activa && s.textInactivo]}>Mesa {mesa.numero}</Text>
              <View style={s.mesaCapRow}>
                <Ionicons name="people-outline" size={13} color={t.textMuted} />
                <Text style={s.mesaCap}>{mesa.capacidad} personas</Text>
              </View>
              <View style={s.mesaActions}>
                <TouchableOpacity style={s.actionBtn} onPress={() => abrirEditar(mesa)}>
                  <Ionicons name="create-outline" size={16} color={t.brand.indigo} />
                </TouchableOpacity>
                <TouchableOpacity style={s.actionBtn} onPress={() => toggleActiva(mesa.id)}>
                  <Ionicons name={mesa.activa ? 'pause-outline' : 'play-outline'} size={16} color={mesa.activa ? t.brand.warning : t.brand.success} />
                </TouchableOpacity>
                <TouchableOpacity style={[s.actionBtn, s.deleteBtn]} onPress={() => eliminar(mesa.id)}>
                  <Ionicons name="trash-outline" size={16} color={t.brand.danger} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{editando ? 'Editar mesa' : 'Nueva mesa'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-outline" size={24} color={t.textTertiary} />
              </TouchableOpacity>
            </View>
            <Text style={s.inputLabel}>Número de mesa</Text>
            <TextInput style={s.input} placeholder="Ej: 7" placeholderTextColor={t.textMuted} value={numero} onChangeText={setNumero} keyboardType="numeric" />
            <Text style={s.inputLabel}>Capacidad (personas)</Text>
            <TextInput style={s.input} placeholder="Ej: 4" placeholderTextColor={t.textMuted} value={capacidad} onChangeText={setCapacidad} keyboardType="numeric" />
            <TouchableOpacity style={s.saveBtn} onPress={guardar}>
              <Ionicons name={editando ? 'save-outline' : 'add-circle-outline'} size={18} color="#fff" />
              <Text style={s.saveBtnText}>{editando ? 'Guardar cambios' : 'Crear mesa'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SummaryChip({ t, icon, color, label }: { t: ReturnType<typeof useAppTheme>; icon: keyof typeof Ionicons.glyphMap; color: string; label: string }) {
  const s = useMemo(() => makeStyles(t), [t]);
  return (
    <View style={[s.chip, { borderColor: color + '44' }]}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={[s.chipText, { color }]}>{label}</Text>
    </View>
  );
}

const makeStyles = (t: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: t.border },
  backBtn:{ padding: 4 },
  title:  { fontSize: 18, fontWeight: '700', color: t.text },
  addBtn: { backgroundColor: t.brand.primary, borderRadius: 10, padding: 8, ...Platform.select({ ios: { shadowColor: t.brand.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 6 }, android: { elevation: 5 } }) },

  scroll: { padding: 20, paddingBottom: 40 },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  chip:       { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: t.surface },
  chipText:   { fontSize: 12, fontWeight: '600' },

  grid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  mesaCard:    { width: '47.5%', backgroundColor: t.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: t.border, gap: 6 },
  mesaInactiva:{ opacity: 0.55 },
  mesaTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  mesaIconBg:  { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  estadoBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  estadoActiva:  { backgroundColor: t.brand.successFade },
  estadoInactiva:{ backgroundColor: t.surfaceAlt },
  estadoText:  { fontSize: 10, fontWeight: '700' },
  mesaNum:     { fontSize: 16, fontWeight: '700', color: t.text },
  textInactivo:{ color: t.textMuted },
  mesaCapRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  mesaCap:     { fontSize: 12, color: t.textMuted },
  mesaActions: { flexDirection: 'row', gap: 6, marginTop: 8 },
  actionBtn:   { flex: 1, alignItems: 'center', paddingVertical: 8, backgroundColor: t.surfaceAlt, borderRadius: 8, borderWidth: 1, borderColor: t.border },
  deleteBtn:   { borderColor: t.brand.dangerBorder, backgroundColor: t.brand.dangerFade },

  modalOverlay: { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  modalCard:    { backgroundColor: t.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderTopWidth: 1, borderColor: t.border },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle:   { fontSize: 18, fontWeight: '700', color: t.text },
  inputLabel:   { fontSize: 13, fontWeight: '500', color: t.textTertiary, marginBottom: 6 },
  input:        { backgroundColor: t.surfaceInput, borderWidth: 1, borderColor: t.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: t.text, marginBottom: 16 },
  saveBtn:      { backgroundColor: t.brand.primary, borderRadius: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveBtnText:  { color: '#fff', fontSize: 16, fontWeight: '700' },
});
