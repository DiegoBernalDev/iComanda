import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Platform } from 'react-native';
import { useState, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppTheme } from '@/hooks/use-app-theme';
import { MOCK_USUARIOS, Usuario, Role } from '@/constants/mock';

export default function UsuariosScreen() {
  const t = useAppTheme();
  const s = useMemo(() => makeStyles(t), [t]);

  const [usuarios, setUsuarios]       = useState<Usuario[]>(MOCK_USUARIOS);
  const [modalVisible, setModalVisible] = useState(false);
  const [nombre, setNombre]           = useState('');
  const [email, setEmail]             = useState('');
  const [rol, setRol]                 = useState<Role>('mesero');

  const toggleActivo = (id: string) =>
    setUsuarios((prev) => prev.map((u) => (u.id === id ? { ...u, activo: !u.activo } : u)));

  const crearUsuario = () => {
    if (!nombre || !email) return;
    setUsuarios((prev) => [...prev, { id: `u${Date.now()}`, nombre, email, rol, activo: true, creadoEn: new Date().toISOString().slice(0, 10) }]);
    setNombre(''); setEmail(''); setRol('mesero'); setModalVisible(false);
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back-outline" size={22} color={t.text} />
        </TouchableOpacity>
        <Text style={s.title}>Usuarios</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.summaryRow}>
          <SummaryChip t={t} icon="people-outline"          color={t.brand.indigo}  label={`${usuarios.length} total`}                                />
          <SummaryChip t={t} icon="checkmark-circle-outline" color={t.brand.success} label={`${usuarios.filter((u) => u.activo).length} activos`}  />
          <SummaryChip t={t} icon="close-circle-outline"    color={t.brand.danger}  label={`${usuarios.filter((u) => !u.activo).length} inactivos`} />
        </View>

        <View style={s.list}>
          {usuarios.map((u) => (
            <View key={u.id} style={s.userCard}>
              <View style={[s.avatar, { backgroundColor: u.rol === 'admin' ? t.brand.indigoFade : t.brand.primaryFade }]}>
                <Ionicons name={u.rol === 'admin' ? 'shield-checkmark-outline' : 'person-outline'} size={20} color={u.rol === 'admin' ? t.brand.indigo : t.brand.primary} />
              </View>
              <View style={s.userInfo}>
                <Text style={s.userName}>{u.nombre}</Text>
                <Text style={s.userEmail}>{u.email}</Text>
                <View style={s.userMeta}>
                  <View style={[s.rolBadge, u.rol === 'admin' ? s.rolAdmin : s.rolMesero]}>
                    <Text style={s.rolBadgeText}>{u.rol}</Text>
                  </View>
                  <Text style={s.fecha}>Desde {u.creadoEn}</Text>
                </View>
              </View>
              <TouchableOpacity style={[s.toggleBtn, u.activo ? s.toggleActivo : s.toggleInactivo]} onPress={() => toggleActivo(u.id)}>
                <Ionicons name={u.activo ? 'pause-outline' : 'play-outline'} size={16} color={u.activo ? t.brand.success : t.textMuted} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Nuevo usuario</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-outline" size={24} color={t.textTertiary} />
              </TouchableOpacity>
            </View>

            <Text style={s.inputLabel}>Nombre completo</Text>
            <TextInput style={s.input} placeholder="Juan Pérez" placeholderTextColor={t.textMuted} value={nombre} onChangeText={setNombre} />

            <Text style={s.inputLabel}>Correo electrónico</Text>
            <TextInput style={s.input} placeholder="juan@restaurante.com" placeholderTextColor={t.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

            <Text style={s.inputLabel}>Rol</Text>
            <View style={s.rolSelector}>
              {(['mesero', 'admin'] as Role[]).map((r) => (
                <TouchableOpacity key={r} style={[s.rolOption, rol === r && s.rolOptionSelected]} onPress={() => setRol(r)}>
                  <Ionicons name={r === 'admin' ? 'shield-checkmark-outline' : 'person-outline'} size={16} color={rol === r ? t.brand.primary : t.textMuted} />
                  <Text style={[s.rolOptionText, rol === r && s.rolOptionTextSelected]}>{r.charAt(0).toUpperCase() + r.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={s.createBtn} onPress={crearUsuario}>
              <Ionicons name="person-add-outline" size={18} color="#fff" />
              <Text style={s.createBtnText}>Crear usuario</Text>
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
  addBtn: {
    backgroundColor: t.brand.primary, borderRadius: 10, padding: 8,
    ...Platform.select({ ios: { shadowColor: t.brand.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 6 }, android: { elevation: 5 } }),
  },

  scroll: { padding: 20, paddingBottom: 40 },

  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  chip:       { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: t.surface },
  chipText:   { fontSize: 12, fontWeight: '600' },

  list:     { gap: 10 },
  userCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: t.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: t.border },
  avatar:   { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  userInfo: { flex: 1, gap: 2 },
  userName: { fontSize: 15, fontWeight: '600', color: t.text },
  userEmail:{ fontSize: 12, color: t.textMuted },
  userMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  rolBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  rolAdmin: { backgroundColor: t.brand.indigoFade },
  rolMesero:{ backgroundColor: t.brand.primaryFade },
  rolBadgeText: { fontSize: 11, fontWeight: '600', color: t.textTertiary },
  fecha:    { fontSize: 11, color: t.textMuted },
  toggleBtn:     { padding: 10, borderRadius: 10, borderWidth: 1 },
  toggleActivo:  { borderColor: t.brand.successBorder, backgroundColor: t.brand.successFade },
  toggleInactivo:{ borderColor: t.border, backgroundColor: t.surfaceAlt },

  modalOverlay: { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  modalCard:    { backgroundColor: t.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderTopWidth: 1, borderColor: t.border },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle:   { fontSize: 18, fontWeight: '700', color: t.text },
  inputLabel:   { fontSize: 13, fontWeight: '500', color: t.textTertiary, marginBottom: 6 },
  input:        { backgroundColor: t.surfaceInput, borderWidth: 1, borderColor: t.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: t.text, marginBottom: 16 },
  rolSelector:  { flexDirection: 'row', gap: 10, marginBottom: 20 },
  rolOption:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: t.surfaceInput, borderWidth: 1, borderColor: t.border, borderRadius: 12, paddingVertical: 12 },
  rolOptionSelected:    { borderColor: t.brand.primary, backgroundColor: t.brand.primaryFade },
  rolOptionText:        { fontSize: 14, fontWeight: '500', color: t.textMuted },
  rolOptionTextSelected:{ color: t.brand.primary },
  createBtn:    { backgroundColor: t.brand.primary, borderRadius: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  createBtnText:{ color: '#fff', fontSize: 16, fontWeight: '700' },
});
