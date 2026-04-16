import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { MOCK_RESTAURANTE, Restaurante } from '@/constants/mock';

export default function RestauranteScreen() {
  const [restaurante, setRestaurante] = useState<Restaurante>(MOCK_RESTAURANTE);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState<Restaurante>(MOCK_RESTAURANTE);
  const [guardado, setGuardado] = useState(false);

  const iniciarEdicion = () => {
    setForm({ ...restaurante });
    setEditando(true);
    setGuardado(false);
  };

  const guardar = () => {
    setRestaurante({ ...form });
    setEditando(false);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2500);
  };

  const cancelar = () => {
    setForm({ ...restaurante });
    setEditando(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back-outline" size={22} color="#F3F4F6" />
        </TouchableOpacity>
        <Text style={styles.title}>Restaurante</Text>
        {!editando ? (
          <TouchableOpacity style={styles.editBtn} onPress={iniciarEdicion}>
            <Ionicons name="create-outline" size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerIcon}>
            <Ionicons name="storefront-outline" size={36} color="#E85D04" />
          </View>
          <Text style={styles.bannerName}>{restaurante.nombre}</Text>
          <View style={styles.slugPill}>
            <Ionicons name="link-outline" size={12} color="#9CA3AF" />
            <Text style={styles.slugText}>/{restaurante.slug}</Text>
          </View>
        </View>

        {/* Notificación guardado */}
        {guardado && (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
            <Text style={styles.successText}>Cambios guardados correctamente</Text>
          </View>
        )}

        {/* Formulario / Vista */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Información general</Text>

          <Field
            icon="storefront-outline"
            label="Nombre del restaurante"
            value={editando ? form.nombre : restaurante.nombre}
            editable={editando}
            onChangeText={(v) => setForm((f) => ({ ...f, nombre: v }))}
          />
          <Field
            icon="link-outline"
            label="Slug (URL pública)"
            value={editando ? form.slug : restaurante.slug}
            editable={editando}
            onChangeText={(v) => setForm((f) => ({ ...f, slug: v.toLowerCase().replace(/\s/g, '-') }))}
            hint="Solo letras, números y guiones"
          />
          <Field
            icon="location-outline"
            label="Dirección"
            value={editando ? form.direccion : restaurante.direccion}
            editable={editando}
            onChangeText={(v) => setForm((f) => ({ ...f, direccion: v }))}
          />
          <Field
            icon="call-outline"
            label="Teléfono"
            value={editando ? form.telefono : restaurante.telefono}
            editable={editando}
            onChangeText={(v) => setForm((f) => ({ ...f, telefono: v }))}
            keyboardType="phone-pad"
            last
          />
        </View>

        {/* URL pública preview */}
        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <Ionicons name="globe-outline" size={16} color="#6366F1" />
            <Text style={styles.previewTitle}>URL carta pública</Text>
          </View>
          <Text style={styles.previewUrl}>
            icomanda.app/<Text style={styles.previewSlug}>{editando ? form.slug : restaurante.slug}</Text>
          </Text>
          <Text style={styles.previewNote}>Disponible tras configurar el QR en Sprint 3</Text>
        </View>

        {/* Botones edición */}
        {editando && (
          <View style={styles.editActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={cancelar}>
              <Ionicons name="close-outline" size={18} color="#9CA3AF" />
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={guardar}>
              <Ionicons name="save-outline" size={18} color="#fff" />
              <Text style={styles.saveBtnText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ icon, label, value, editable, onChangeText, hint, keyboardType, last }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  editable: boolean;
  onChangeText: (v: string) => void;
  hint?: string;
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
  last?: boolean;
}) {
  return (
    <View style={[styles.field, !last && styles.fieldBorder]}>
      <View style={styles.fieldLabel}>
        <Ionicons name={icon} size={15} color="#6B7280" />
        <Text style={styles.fieldLabelText}>{label}</Text>
      </View>
      {editable ? (
        <>
          <TextInput
            style={styles.fieldInput}
            value={value}
            onChangeText={onChangeText}
            placeholderTextColor="#4B5563"
            keyboardType={keyboardType ?? 'default'}
          />
          {hint && <Text style={styles.fieldHint}>{hint}</Text>}
        </>
      ) : (
        <Text style={styles.fieldValue}>{value}</Text>
      )}
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
  editBtn: {
    backgroundColor: '#6366F1', borderRadius: 10, padding: 8,
    ...Platform.select({
      ios: { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 6 },
      android: { elevation: 5 },
    }),
  },

  scroll: { padding: 20, paddingBottom: 40 },

  // Banner
  banner: {
    alignItems: 'center', backgroundColor: '#1A1A1A', borderRadius: 20,
    padding: 28, marginBottom: 16, borderWidth: 1, borderColor: '#2A2A2A', gap: 8,
  },
  bannerIcon: {
    width: 72, height: 72, borderRadius: 20, backgroundColor: '#E85D0422',
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  bannerName: { fontSize: 20, fontWeight: '700', color: '#F3F4F6', textAlign: 'center' },
  slugPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#262626', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: '#333',
  },
  slugText: { fontSize: 13, color: '#9CA3AF', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },

  // Success
  successBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#10B98122', borderRadius: 12, padding: 12,
    marginBottom: 16, borderWidth: 1, borderColor: '#10B98144',
  },
  successText: { fontSize: 13, color: '#10B981', fontWeight: '500' },

  // Card
  card: {
    backgroundColor: '#1A1A1A', borderRadius: 16, borderWidth: 1, borderColor: '#2A2A2A', marginBottom: 16,
  },
  cardTitle: { fontSize: 13, fontWeight: '600', color: '#6B7280', padding: 16, paddingBottom: 0 },

  // Fields
  field: { paddingHorizontal: 16, paddingVertical: 14 },
  fieldBorder: { borderBottomWidth: 1, borderBottomColor: '#262626' },
  fieldLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  fieldLabelText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  fieldValue: { fontSize: 15, color: '#F3F4F6', fontWeight: '500' },
  fieldInput: {
    fontSize: 15, color: '#F3F4F6', backgroundColor: '#262626',
    borderWidth: 1, borderColor: '#333', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  fieldHint: { fontSize: 11, color: '#4B5563', marginTop: 4 },

  // Preview URL
  previewCard: {
    backgroundColor: '#1A1A1A', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#6366F133', marginBottom: 20, gap: 6,
  },
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  previewTitle: { fontSize: 13, fontWeight: '600', color: '#6366F1' },
  previewUrl: {
    fontSize: 14, color: '#9CA3AF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  previewSlug: { color: '#E85D04', fontWeight: '700' },
  previewNote: { fontSize: 11, color: '#4B5563' },

  // Botones edición
  editActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#1A1A1A', borderRadius: 12, paddingVertical: 14,
    borderWidth: 1, borderColor: '#2A2A2A',
  },
  cancelBtnText: { color: '#9CA3AF', fontSize: 15, fontWeight: '600' },
  saveBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#E85D04', borderRadius: 12, paddingVertical: 14,
    ...Platform.select({
      ios: { shadowColor: '#E85D04', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
      android: { elevation: 6 },
    }),
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
