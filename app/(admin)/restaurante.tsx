import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform } from 'react-native';
import { useState, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppTheme } from '@/hooks/use-app-theme';
import { MOCK_RESTAURANTE, Restaurante } from '@/constants/mock';

export default function RestauranteScreen() {
  const t = useAppTheme();
  const s = useMemo(() => makeStyles(t), [t]);

  const [restaurante, setRestaurante] = useState<Restaurante>(MOCK_RESTAURANTE);
  const [editando, setEditando]       = useState(false);
  const [form, setForm]               = useState<Restaurante>(MOCK_RESTAURANTE);
  const [guardado, setGuardado]       = useState(false);

  const iniciarEdicion = () => { setForm({ ...restaurante }); setEditando(true); setGuardado(false); };
  const guardar = () => {
    setRestaurante({ ...form }); setEditando(false); setGuardado(true);
    setTimeout(() => setGuardado(false), 2500);
  };
  const cancelar = () => { setForm({ ...restaurante }); setEditando(false); };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back-outline" size={22} color={t.text} />
        </TouchableOpacity>
        <Text style={s.title}>Restaurante</Text>
        {!editando ? (
          <TouchableOpacity style={s.editBtn} onPress={iniciarEdicion}>
            <Ionicons name="create-outline" size={20} color="#fff" />
          </TouchableOpacity>
        ) : <View style={{ width: 36 }} />}
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <View style={s.banner}>
          <View style={s.bannerIcon}>
            <Ionicons name="storefront-outline" size={36} color={t.brand.primary} />
          </View>
          <Text style={s.bannerName}>{restaurante.nombre}</Text>
          <View style={s.slugPill}>
            <Ionicons name="link-outline" size={12} color={t.textTertiary} />
            <Text style={s.slugText}>/{restaurante.slug}</Text>
          </View>
        </View>

        {guardado && (
          <View style={s.successBanner}>
            <Ionicons name="checkmark-circle-outline" size={16} color={t.brand.success} />
            <Text style={s.successText}>Cambios guardados correctamente</Text>
          </View>
        )}

        <View style={s.card}>
          <Text style={s.cardTitle}>Información general</Text>
          <Field t={t} icon="storefront-outline" label="Nombre"    value={editando ? form.nombre    : restaurante.nombre}    editable={editando} onChangeText={(v) => setForm((f) => ({ ...f, nombre: v }))} />
          <Field t={t} icon="link-outline"       label="Slug"      value={editando ? form.slug      : restaurante.slug}      editable={editando} onChangeText={(v) => setForm((f) => ({ ...f, slug: v.toLowerCase().replace(/\s/g, '-') }))} hint="Solo letras, números y guiones" />
          <Field t={t} icon="location-outline"   label="Dirección" value={editando ? form.direccion : restaurante.direccion} editable={editando} onChangeText={(v) => setForm((f) => ({ ...f, direccion: v }))} />
          <Field t={t} icon="call-outline"       label="Teléfono"  value={editando ? form.telefono  : restaurante.telefono}  editable={editando} onChangeText={(v) => setForm((f) => ({ ...f, telefono: v }))} keyboardType="phone-pad" last />
        </View>

        <View style={s.previewCard}>
          <View style={s.previewHeader}>
            <Ionicons name="globe-outline" size={16} color={t.brand.indigo} />
            <Text style={s.previewTitle}>URL carta pública</Text>
          </View>
          <Text style={s.previewUrl}>
            icomanda.app/<Text style={s.previewSlug}>{editando ? form.slug : restaurante.slug}</Text>
          </Text>
          <Text style={s.previewNote}>Disponible tras configurar el QR en Sprint 3</Text>
        </View>

        {editando && (
          <View style={s.editActions}>
            <TouchableOpacity style={s.cancelBtn} onPress={cancelar}>
              <Ionicons name="close-outline" size={18} color={t.textTertiary} />
              <Text style={s.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.saveBtn} onPress={guardar}>
              <Ionicons name="save-outline" size={18} color="#fff" />
              <Text style={s.saveBtnText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ t, icon, label, value, editable, onChangeText, hint, keyboardType, last }: {
  t: ReturnType<typeof useAppTheme>; icon: keyof typeof Ionicons.glyphMap; label: string; value: string;
  editable: boolean; onChangeText: (v: string) => void; hint?: string; keyboardType?: 'default' | 'phone-pad'; last?: boolean;
}) {
  const s = useMemo(() => makeStyles(t), [t]);
  return (
    <View style={[s.field, !last && s.fieldBorder]}>
      <View style={s.fieldLabel}>
        <Ionicons name={icon} size={15} color={t.textMuted} />
        <Text style={s.fieldLabelText}>{label}</Text>
      </View>
      {editable ? (
        <>
          <TextInput style={s.fieldInput} value={value} onChangeText={onChangeText} placeholderTextColor={t.textMuted} keyboardType={keyboardType ?? 'default'} />
          {hint && <Text style={s.fieldHint}>{hint}</Text>}
        </>
      ) : (
        <Text style={s.fieldValue}>{value}</Text>
      )}
    </View>
  );
}

const makeStyles = (t: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: t.border },
  backBtn:{ padding: 4 },
  title:  { fontSize: 18, fontWeight: '700', color: t.text },
  editBtn:{ backgroundColor: t.brand.indigo, borderRadius: 10, padding: 8, ...Platform.select({ ios: { shadowColor: t.brand.indigo, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 6 }, android: { elevation: 5 } }) },

  scroll: { padding: 20, paddingBottom: 40 },

  banner:     { alignItems: 'center', backgroundColor: t.surface, borderRadius: 20, padding: 28, marginBottom: 16, borderWidth: 1, borderColor: t.border, gap: 8 },
  bannerIcon: { width: 72, height: 72, borderRadius: 20, backgroundColor: t.brand.primaryFade, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  bannerName: { fontSize: 20, fontWeight: '700', color: t.text, textAlign: 'center' },
  slugPill:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: t.surfaceAlt, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: t.border },
  slugText:   { fontSize: 13, color: t.textTertiary, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },

  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: t.brand.successFade, borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: t.brand.successBorder },
  successText:   { fontSize: 13, color: t.brand.success, fontWeight: '500' },

  card:      { backgroundColor: t.surface, borderRadius: 16, borderWidth: 1, borderColor: t.border, marginBottom: 16 },
  cardTitle: { fontSize: 13, fontWeight: '600', color: t.textMuted, padding: 16, paddingBottom: 0 },

  field:         { paddingHorizontal: 16, paddingVertical: 14 },
  fieldBorder:   { borderBottomWidth: 1, borderBottomColor: t.surfaceAlt },
  fieldLabel:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  fieldLabelText:{ fontSize: 12, color: t.textMuted, fontWeight: '500' },
  fieldValue:    { fontSize: 15, color: t.text, fontWeight: '500' },
  fieldInput:    { fontSize: 15, color: t.text, backgroundColor: t.surfaceInput, borderWidth: 1, borderColor: t.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  fieldHint:     { fontSize: 11, color: t.textMuted, marginTop: 4 },

  previewCard:   { backgroundColor: t.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: t.brand.indigoBorder, marginBottom: 20, gap: 6 },
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  previewTitle:  { fontSize: 13, fontWeight: '600', color: t.brand.indigo },
  previewUrl:    { fontSize: 14, color: t.textTertiary, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  previewSlug:   { color: t.brand.primary, fontWeight: '700' },
  previewNote:   { fontSize: 11, color: t.textMuted },

  editActions: { flexDirection: 'row', gap: 10 },
  cancelBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: t.surface, borderRadius: 12, paddingVertical: 14, borderWidth: 1, borderColor: t.border },
  cancelBtnText:{ color: t.textTertiary, fontSize: 15, fontWeight: '600' },
  saveBtn:     { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: t.brand.primary, borderRadius: 12, paddingVertical: 14, ...Platform.select({ ios: { shadowColor: t.brand.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 }, android: { elevation: 6 } }) },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
