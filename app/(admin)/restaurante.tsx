import { View, Text, ScrollView, StyleSheet, Pressable, Platform } from 'react-native';
import { useState, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMD3Theme } from '@/hooks/use-md3-theme';
import { TopAppBar, Card, TextField, Button, Surface } from '@/components/md3';
import { MOCK_RESTAURANTE, Restaurante } from '@/constants/mock';

export default function RestauranteScreen() {
  const { colors, typography, shape } = useMD3Theme();
  const s = useMemo(() => makeStyles(colors, shape), [colors, shape]);

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
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <TopAppBar
        title="Restaurante"
        onBack={() => router.back()}
        trailing={
          !editando ? (
            <Pressable onPress={iniciarEdicion}
              style={[s.editBtn, { backgroundColor: colors.secondaryContainer, borderRadius: shape.medium }]}
              android_ripple={{ color: colors.onSecondaryContainer + '30' }}>
              <Ionicons name="create-outline" size={20} color={colors.onSecondaryContainer} />
            </Pressable>
          ) : <View style={{ width: 40 }} />
        }
      />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Banner */}
        <Surface elevation="level2" style={[s.banner, { borderRadius: shape.extraLarge }]}>
          <View style={[s.bannerIcon, { backgroundColor: colors.primaryContainer, borderRadius: shape.large }]}>
            <Ionicons name="storefront-outline" size={36} color={colors.onPrimaryContainer} />
          </View>
          <Text style={[typography.headlineSmall, { color: colors.onSurface, marginTop: 8, textAlign: 'center' }]}>
            {restaurante.nombre}
          </Text>
          <View style={[s.slugPill, { backgroundColor: colors.surfaceVariant, borderRadius: shape.full }]}>
            <Ionicons name="link-outline" size={12} color={colors.onSurfaceVariant} />
            <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }]}>
              /{restaurante.slug}
            </Text>
          </View>
        </Surface>

        {/* Success banner */}
        {guardado && (
          <View style={[s.successBanner, { backgroundColor: colors.tertiaryContainer, borderRadius: shape.medium }]}>
            <Ionicons name="checkmark-circle-outline" size={16} color={colors.onTertiaryContainer} />
            <Text style={[typography.bodySmall, { color: colors.onTertiaryContainer }]}>Cambios guardados correctamente</Text>
          </View>
        )}

        {/* Info card */}
        <Text style={[typography.titleMedium, { color: colors.onSurface, marginBottom: 12 }]}>Información general</Text>

        {editando ? (
          <View style={s.fieldsEdit}>
            <TextField label="Nombre" variant="outlined" value={form.nombre}
              onChangeText={v => setForm(f => ({ ...f, nombre: v }))} leadingIcon="storefront-outline" />
            <TextField label="Slug" variant="outlined" value={form.slug}
              onChangeText={v => setForm(f => ({ ...f, slug: v.toLowerCase().replace(/\s/g, '-') }))}
              leadingIcon="link-outline" supportingText="Solo letras, números y guiones" />
            <TextField label="Dirección" variant="outlined" value={form.direccion}
              onChangeText={v => setForm(f => ({ ...f, direccion: v }))} leadingIcon="location-outline" />
            <TextField label="Teléfono" variant="outlined" value={form.telefono}
              onChangeText={v => setForm(f => ({ ...f, telefono: v }))} leadingIcon="call-outline" keyboardType="phone-pad" />
          </View>
        ) : (
          <Card variant="outlined" style={{ padding: 0, overflow: 'hidden' }}>
            {[
              { icon: 'storefront-outline' as const, label: 'Nombre',    value: restaurante.nombre    },
              { icon: 'link-outline'        as const, label: 'Slug',      value: `/${restaurante.slug}` },
              { icon: 'location-outline'    as const, label: 'Dirección', value: restaurante.direccion },
              { icon: 'call-outline'        as const, label: 'Teléfono',  value: restaurante.telefono  },
            ].map((row, i, arr) => (
              <View key={row.label} style={[s.infoRow, i < arr.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.outlineVariant }]}>
                <Ionicons name={row.icon} size={16} color={colors.onSurfaceVariant} style={{ width: 24 }} />
                <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, width: 76 }]}>{row.label}</Text>
                <Text style={[typography.bodyMedium, { color: colors.onSurface, flex: 1 }]} numberOfLines={1}>{row.value}</Text>
              </View>
            ))}
          </Card>
        )}

        {/* URL preview */}
        <Card variant="filled" style={[s.previewCard, { borderRadius: shape.large }]}>
          <View style={s.previewHeader}>
            <Ionicons name="globe-outline" size={16} color={colors.onSurfaceVariant} />
            <Text style={[typography.labelLarge, { color: colors.onSurfaceVariant }]}>URL carta pública</Text>
          </View>
          <Text style={[typography.bodyMedium, { color: colors.onSurface, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginTop: 6 }]}>
            icomanda.app/<Text style={{ color: colors.primary, fontWeight: '700' }}>
              {editando ? form.slug : restaurante.slug}
            </Text>
          </Text>
          <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginTop: 4 }]}>
            Disponible tras configurar el QR en Sprint 3
          </Text>
        </Card>

        {/* Edit actions */}
        {editando && (
          <View style={s.editActions}>
            <Button label="Cancelar" variant="outlined" onPress={cancelar} style={{ flex: 1 }} />
            <Button label="Guardar"  variant="filled"  icon="save-outline" onPress={guardar} style={{ flex: 2 }} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any, shape: any) => StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { padding: 16, gap: 16, paddingBottom: 40 },

  editBtn: { padding: 8 },

  banner:     { alignItems: 'center', padding: 28, gap: 8 },
  bannerIcon: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
  slugPill:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 5 },

  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },

  fieldsEdit: { gap: 16 },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16 },

  previewCard:   { padding: 16 },
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  editActions: { flexDirection: 'row', gap: 8 },
});
