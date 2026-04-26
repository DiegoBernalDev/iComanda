import { View, Text, ScrollView, StyleSheet, Pressable, Platform, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import { Image } from 'expo-image';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useMD3Theme } from '@/hooks/use-md3-theme';
import { TopAppBar, Card, TextField, Button, Surface, Pop, PressScale, Enter } from '@/components/md3';
import { Restaurante } from '@/constants/mock';
import { useAuth } from '@/context/auth';
import { getAdminRestaurant } from '@/lib/admin';
import { supabase } from '@/lib/supabase';

type RestaurantRow = {
  id: string;
  nombre: string;
  slug: string;
  direccion: string | null;
  telefono: string | null;
  logo_url: string | null;
};

type RestauranteForm = Restaurante & { logoUrl: string };

const toRestaurante = (restaurant: RestaurantRow): RestauranteForm => ({
  id: restaurant.id,
  nombre: restaurant.nombre,
  slug: restaurant.slug,
  direccion: restaurant.direccion ?? '',
  telefono: restaurant.telefono ?? '',
  logoUrl: restaurant.logo_url ?? '',
});

const EMPTY_RESTAURANTE: RestauranteForm = {
  id: '',
  nombre: '',
  slug: '',
  direccion: '',
  telefono: '',
  logoUrl: '',
};

export default function RestauranteScreen() {
  const { colors, typography, shape } = useMD3Theme();
  const s = useMemo(() => makeStyles(colors, shape), [colors, shape]);
  const { user } = useAuth();

  const [restaurante, setRestaurante] = useState<RestauranteForm>(EMPTY_RESTAURANTE);
  const [editando, setEditando]       = useState(false);
  const [form, setForm]               = useState<RestauranteForm>(EMPTY_RESTAURANTE);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving]           = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [guardado, setGuardado]       = useState(false);
  const [error, setError]             = useState('');

  const cargarRestaurante = useCallback(async () => {
    setInitialLoading(true);
    setError('');

    const data = await getAdminRestaurant(user?.id ?? null);

    if (data) {
      const nextRestaurante = toRestaurante(data);
      setRestaurante(nextRestaurante);
      setForm(nextRestaurante);
    }

    setInitialLoading(false);
  }, [user?.id]);

  useEffect(() => {
    cargarRestaurante();
  }, [cargarRestaurante]);

  const iniciarEdicion = () => { setForm({ ...restaurante }); setEditando(true); setGuardado(false); };
  const guardar = async () => {
    if (!form.nombre.trim() || !form.slug.trim()) {
      setError('El nombre y el slug son obligatorios.');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      nombre: form.nombre.trim(),
      slug: form.slug.trim(),
      direccion: form.direccion.trim() || null,
      telefono: form.telefono.trim() || null,
      logo_url: form.logoUrl.trim() || null,
    };

    const query = !restaurante.id
      ? supabase.from('restaurants').insert({ ...payload, owner_id: user?.id ?? null })
      : supabase.from('restaurants').update(payload).eq('id', restaurante.id);

    const { data, error: saveError } = await query
      .select('id, nombre, slug, direccion, telefono, logo_url')
      .single();

    setSaving(false);

    if (saveError) {
      setError(saveError.message);
      return;
    }

    const nextRestaurante = toRestaurante(data);
    setRestaurante(nextRestaurante);
    setForm(nextRestaurante);
    setEditando(false);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2500);
  };
  const cancelar = () => { setForm({ ...restaurante }); setEditando(false); };

  const elegirLogo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Necesitamos permiso para acceder a tus fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploadingLogo(true);
    setError('');

    try {
      const asset = result.assets[0];
      const ext = (asset.uri.split('.').pop() || 'jpg').toLowerCase();
      const filePath = `logos/${Date.now()}.${ext}`;
      const formData = new FormData();
      formData.append('file', { uri: asset.uri, name: filePath, type: `image/${ext}` } as any);

      const { error: uploadError } = await supabase.storage
        .from('archivos')
        .upload(filePath, formData, { contentType: `image/${ext}`, upsert: true });

      if (uploadError) throw uploadError;

      const { data: pub } = supabase.storage.from('archivos').getPublicUrl(filePath);
      setForm(f => ({ ...f, logoUrl: pub.publicUrl }));
    } catch (e: any) {
      setError(e?.message ?? 'No pudimos subir la imagen.');
    } finally {
      setUploadingLogo(false);
    }
  };

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

      <KeyboardAvoidingView
        style={s.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
      <ScrollView
        contentContainerStyle={[s.scroll, editando && s.scrollEditing]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {initialLoading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : null}

        {error ? (
          <View style={[s.errorBanner, { backgroundColor: colors.errorContainer, borderRadius: shape.medium }]}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.onErrorContainer} />
            <Text style={[typography.bodySmall, { color: colors.onErrorContainer, flex: 1 }]}>{error}</Text>
          </View>
        ) : null}

        {/* Banner */}
        <Enter delay={0} distance={14}>
        <Surface elevation="level2" style={[s.banner, { borderRadius: shape.extraLarge }]}>
          {editando ? (
            <PressScale onPress={elegirLogo} style={[s.bannerLogoWrap, { borderRadius: shape.large }]}>
              {form.logoUrl ? (
                <Image source={{ uri: form.logoUrl }} style={[s.bannerLogo, { borderRadius: shape.large }]} contentFit="cover" />
              ) : (
                <View style={[s.bannerIcon, { backgroundColor: colors.primaryContainer, borderRadius: shape.large }]}>
                  {uploadingLogo
                    ? <ActivityIndicator color={colors.onPrimaryContainer} />
                    : <Ionicons name="camera-outline" size={32} color={colors.onPrimaryContainer} />}
                </View>
              )}
              <View style={[s.cameraBadge, { backgroundColor: colors.primary, borderColor: colors.surface }]}>
                <Ionicons name={uploadingLogo ? 'hourglass-outline' : 'camera-outline'} size={14} color={colors.onPrimary} />
              </View>
            </PressScale>
          ) : restaurante.logoUrl ? (
            <Image source={{ uri: restaurante.logoUrl }} style={[s.bannerLogo, { borderRadius: shape.large }]} contentFit="cover" />
          ) : (
            <View style={[s.bannerIcon, { backgroundColor: colors.primaryContainer, borderRadius: shape.large }]}>
              <Ionicons name="storefront-outline" size={36} color={colors.onPrimaryContainer} />
            </View>
          )}
          <Text style={[typography.headlineSmall, { color: colors.onSurface, marginTop: 8, textAlign: 'center' }]}>
            {(editando ? form.nombre : restaurante.nombre) || 'Restaurante'}
          </Text>
          <View style={[s.slugPill, { backgroundColor: colors.surfaceVariant, borderRadius: shape.full }]}>
            <Ionicons name="link-outline" size={12} color={colors.onSurfaceVariant} />
            <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }]}>
              /{(editando ? form.slug : restaurante.slug) || 'sin-slug'}
            </Text>
          </View>
        </Surface>
        </Enter>

        {/* Success banner */}
        {guardado && (
          <Pop>
            <View style={[s.successBanner, { backgroundColor: colors.tertiaryContainer, borderRadius: shape.medium }]}>
              <Ionicons name="checkmark-circle-outline" size={16} color={colors.onTertiaryContainer} />
              <Text style={[typography.bodySmall, { color: colors.onTertiaryContainer }]}>Cambios guardados correctamente</Text>
            </View>
          </Pop>
        )}

        {/* Info card */}
        <Enter delay={80}>
          <Text style={[typography.titleMedium, { color: colors.onSurface, marginBottom: 12 }]}>Información general</Text>
        </Enter>

        {editando ? (
          <Enter delay={120}>
          <View style={s.fieldsEdit}>
            <TextField label="Nombre" variant="outlined" value={form.nombre}
              onChangeText={v => setForm(f => ({ ...f, nombre: v }))} leadingIcon="storefront-outline" containerColor={colors.background} />
            <TextField label="Slug" variant="outlined" value={form.slug}
              onChangeText={v => setForm(f => ({ ...f, slug: v.toLowerCase().replace(/\s/g, '-') }))}
              leadingIcon="link-outline" supportingText="Solo letras, números y guiones" containerColor={colors.background} />
            <TextField label="Dirección" variant="outlined" value={form.direccion}
              onChangeText={v => setForm(f => ({ ...f, direccion: v }))} leadingIcon="location-outline" containerColor={colors.background} />
            <TextField label="Teléfono" variant="outlined" value={form.telefono}
              onChangeText={v => setForm(f => ({ ...f, telefono: v }))} leadingIcon="call-outline" keyboardType="phone-pad" containerColor={colors.background} />
          </View>
          </Enter>
        ) : (
          <Enter delay={120}>
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
          </Enter>
        )}

        {/* URL preview */}
        <Enter delay={180}>
        <Card variant="outlined" style={[s.previewCard, { borderRadius: shape.large }]}>
          <View style={s.previewHeader}>
            <Ionicons name="globe-outline" size={16} color={colors.primary} />
            <Text style={[typography.labelLarge, { color: colors.onSurfaceVariant }]}>URL carta pública</Text>
          </View>
          <Text style={[typography.bodyMedium, { color: colors.onSurface, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginTop: 6 }]}>
            icomanda.app/<Text style={{ color: colors.primary, fontWeight: '700' }}>
              {(editando ? form.slug : restaurante.slug) || '...'}
            </Text>
          </Text>
          <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginTop: 4 }]}>
            Esta será la dirección pública de la carta.
          </Text>
        </Card>
        </Enter>

      </ScrollView>
      {editando && (
        <View style={[s.editActions, { backgroundColor: colors.background, borderTopColor: colors.outlineVariant }]}>
          <Button label="Cancelar" variant="outlined" onPress={cancelar} style={{ flex: 1 }} />
          <Button label={saving ? 'Guardando...' : 'Guardar'} variant="filled" icon="save-outline" onPress={guardar} disabled={saving} style={{ flex: 2 }} />
        </View>
      )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any, shape: any) => StyleSheet.create({
  safe:   { flex: 1 },
  keyboard: { flex: 1 },
  scroll: { padding: 16, gap: 16, paddingBottom: 40 },
  scrollEditing: { paddingBottom: 180 },

  editBtn: { padding: 8 },

  banner:        { alignItems: 'center', padding: 28, gap: 8 },
  bannerIcon:    { width: 96, height: 96, alignItems: 'center', justifyContent: 'center' },
  bannerLogo:    { width: 96, height: 96 },
  bannerLogoWrap:{ width: 96, height: 96, position: 'relative' },
  cameraBadge:   { position: 'absolute', bottom: -2, right: -2, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  slugPill:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 5 },

  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
  errorBanner:   { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
  loadingBox:    { paddingVertical: 24 },

  fieldsEdit: { gap: 16 },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16 },

  previewCard:   { padding: 16 },
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  editActions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
