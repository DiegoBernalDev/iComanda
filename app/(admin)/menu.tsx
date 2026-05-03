import { Button, Card, Chip, Enter, TextField, TopAppBar } from '@/components/md3';
import { useAuth } from '@/context/auth';
import { useMD3Theme } from '@/hooks/use-md3-theme';
import { getAdminRestaurant } from '@/lib/admin';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type MenuItem = {
  id: string;
  restaurant_id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  categoria: string | null;
  imagen_url: string | null;
  disponible: boolean;
};

type MenuForm = {
  id: string | null;
  nombre: string;
  descripcion: string;
  precio: string;
  categoria: string;
  imagen_url: string;
};

const EMPTY_FORM: MenuForm = {
  id: null,
  nombre: '',
  descripcion: '',
  precio: '',
  categoria: '',
  imagen_url: '',
};

const formatPrice = (value: number) =>
  `Bs ${value.toFixed(2)}`;

export default function AdminMenuScreen() {
  const { colors, typography, shape } = useMD3Theme();
  const s = useMemo(() => makeStyles(colors, shape), [colors, shape]);
  const { user } = useAuth();

  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | string>('all');

  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState<MenuForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [categoryStep, setCategoryStep] = useState<'select' | 'new' | null>(null);
  const [newCategory, setNewCategory] = useState('');

  const categories = useMemo(() => {
    const values = new Set<string>();
    items.forEach((item) => {
      if (item.categoria?.trim()) values.add(item.categoria.trim());
    });
    return [...values].sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((item) => (item.categoria ?? '') === filter);
  }, [items, filter]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    const restaurant = await getAdminRestaurant(user?.id ?? null);
    if (!restaurant) {
      setError('Primero registra los datos del restaurante.');
      setLoading(false);
      return;
    }

    setRestaurantId(restaurant.id);

    const { data, error: fetchError } = await supabase
      .from('menu_items')
      .select(
        'id, restaurant_id, nombre, descripcion, precio, categoria, imagen_url, disponible',
      )
      .eq('restaurant_id', restaurant.id)
      .order('categoria', { ascending: true, nullsFirst: false })
      .order('nombre', { ascending: true });

    if (fetchError) setError(fetchError.message);
    else setItems((data ?? []) as MenuItem[]);

    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setError('');
    setModalVisible(true);
  };

  const openEdit = (item: MenuItem) => {
    setForm({
      id: item.id,
      nombre: item.nombre,
      descripcion: item.descripcion ?? '',
      precio: String(item.precio),
      categoria: item.categoria ?? '',
      imagen_url: item.imagen_url ?? '',
    });
    setError('');
    setModalVisible(true);
  };

  const pickImage = async () => {
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

    const asset = result.assets[0];
    setUploadingImage(true);
    setError('');

    try {
      const ext = (asset.uri.split('.').pop() || 'jpg').toLowerCase();
      const filePath = `menu/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const formData = new FormData();
      formData.append('file', { uri: asset.uri, name: filePath, type: `image/${ext}` } as any);

      const { error: uploadError } = await supabase.storage
        .from('archivos')
        .upload(filePath, formData, { contentType: `image/${ext}`, upsert: true });
      if (uploadError) throw uploadError;

      const { data: pub } = supabase.storage.from('archivos').getPublicUrl(filePath);
      setForm((prev) => ({ ...prev, imagen_url: pub.publicUrl }));
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo subir la imagen.');
    } finally {
      setUploadingImage(false);
    }
  };

  const saveItem = async () => {
    if (!restaurantId) {
      setError('No se encontró el restaurante para guardar cambios.');
      return;
    }

    const price = Number(form.precio.replace(',', '.'));
    if (!form.nombre.trim() || !Number.isFinite(price) || price < 0) {
      setError('Nombre y precio válido son obligatorios.');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      precio: price,
      categoria: form.categoria.trim() || null,
      imagen_url: form.imagen_url.trim() || null,
    };

    const query = form.id
      ? supabase.from('menu_items').update(payload).eq('id', form.id)
      : supabase.from('menu_items').insert({ ...payload, restaurant_id: restaurantId });

    const { data, error: saveError } = await query
      .select(
        'id, restaurant_id, nombre, descripcion, precio, categoria, imagen_url, disponible',
      )
      .single();

    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }

    const savedItem = data as MenuItem;
    setItems((prev) => {
      const exists = prev.some((item) => item.id === savedItem.id);
      const next = exists
        ? prev.map((item) => (item.id === savedItem.id ? savedItem : item))
        : [...prev, savedItem];
      return next.sort((a, b) => a.nombre.localeCompare(b.nombre));
    });
    setModalVisible(false);
  };

  const toggleAvailable = async (item: MenuItem) => {
    setSavingId(item.id);
    setError('');

    const nextValue = !item.disponible;
    setItems((prev) =>
      prev.map((row) => (row.id === item.id ? { ...row, disponible: nextValue } : row)),
    );

    const { error: updateError } = await supabase
      .from('menu_items')
      .update({ disponible: nextValue })
      .eq('id', item.id);

    if (updateError) {
      setItems((prev) =>
        prev.map((row) => (row.id === item.id ? { ...row, disponible: item.disponible } : row)),
      );
      setError(updateError.message);
    }
    setSavingId(null);
  };

  const removeItem = async (id: string) => {
    setSavingId(id);
    setError('');
    const previous = items;
    setItems((prev) => prev.filter((item) => item.id !== id));

    const { error: deleteError } = await supabase.from('menu_items').delete().eq('id', id);
    if (deleteError) {
      setItems(previous);
      setError(deleteError.message);
    }

    setSavingId(null);
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <TopAppBar
        title="Menú"
        onBack={() => router.back()}
        trailing={
          <Pressable
            onPress={openCreate}
            style={[
              s.addBtn,
              {
                backgroundColor: colors.primaryContainer,
                borderRadius: shape.medium,
              },
            ]}
            android_ripple={{ color: colors.onPrimaryContainer + '30' }}
          >
            <Ionicons name="add" size={22} color={colors.onPrimaryContainer} />
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {error ? (
          <View
            style={[
              s.errorBanner,
              { backgroundColor: colors.errorContainer, borderRadius: shape.small },
            ]}
          >
            <Ionicons name="alert-circle-outline" size={14} color={colors.onErrorContainer} />
            <Text style={[typography.bodySmall, { color: colors.onErrorContainer, flex: 1 }]}>
              {error}
            </Text>
          </View>
        ) : null}

        <Enter delay={0}>
          <View style={s.chips}>
            <Chip
              label="Todas"
              variant="filter"
              selected={filter === 'all'}
              onPress={() => setFilter('all')}
            />
            {categories.map((category) => (
              <Chip
                key={category}
                label={category}
                variant="filter"
                selected={filter === category}
                onPress={() => setFilter(category)}
              />
            ))}
          </View>
        </Enter>

        {loading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : filteredItems.length === 0 ? (
          <Card variant="outlined" style={s.emptyCard}>
            <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}>
              No hay ítems en esta categoría.
            </Text>
          </Card>
        ) : (
          filteredItems.map((item, index) => (
            <Enter key={item.id} delay={80 + index * 35}>
              <Card variant="outlined" style={s.itemCard}>
                <View style={s.itemMain}>
                  {item.imagen_url ? (
                    <Image
                      source={{ uri: item.imagen_url }}
                      style={[s.itemImage, { borderRadius: shape.medium }]}
                      contentFit="cover"
                    />
                  ) : (
                    <View
                      style={[
                        s.itemImage,
                        {
                          borderRadius: shape.medium,
                          backgroundColor: colors.surfaceVariant,
                          alignItems: 'center',
                          justifyContent: 'center',
                        },
                      ]}
                    >
                      <Ionicons name="image-outline" size={22} color={colors.onSurfaceVariant} />
                    </View>
                  )}
                  <View style={s.itemBody}>
                    <Text style={[typography.titleMedium, { color: colors.onSurface }]}>
                      {item.nombre}
                    </Text>
                    <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>
                      {item.categoria || 'Sin categoría'} · {formatPrice(item.precio)}
                    </Text>
                    <Text
                      style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}
                      numberOfLines={2}
                    >
                      {item.descripcion || 'Sin descripción'}
                    </Text>
                  </View>
                  <View
                    style={[
                      s.badge,
                      {
                        borderRadius: shape.full,
                        backgroundColor: item.disponible
                          ? colors.tertiaryContainer
                          : colors.surfaceVariant,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        typography.labelSmall,
                        {
                          color: item.disponible
                            ? colors.onTertiaryContainer
                            : colors.onSurfaceVariant,
                        },
                      ]}
                    >
                      {item.disponible ? 'Disponible' : 'No disponible'}
                    </Text>
                  </View>
                </View>

                <View style={[s.actions, { borderTopColor: colors.outlineVariant }]}>
                  <Pressable
                    onPress={() => openEdit(item)}
                    style={[s.actionBtn, { borderRadius: shape.full }]}
                    android_ripple={{ color: colors.onSurface + '1F', borderless: true, radius: 18 }}
                  >
                    <Ionicons name="create-outline" size={18} color={colors.onSurfaceVariant} />
                  </Pressable>
                  <Pressable
                    onPress={() => toggleAvailable(item)}
                    disabled={savingId === item.id}
                    style={[s.actionBtn, { borderRadius: shape.full }]}
                    android_ripple={{ color: colors.onSurface + '1F', borderless: true, radius: 18 }}
                  >
                    {savingId === item.id ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Ionicons
                        name={item.disponible ? 'pause-outline' : 'play-outline'}
                        size={18}
                        color={colors.primary}
                      />
                    )}
                  </Pressable>
                  <Pressable
                    onPress={() => removeItem(item.id)}
                    disabled={savingId === item.id}
                    style={[s.actionBtn, { borderRadius: shape.full }]}
                    android_ripple={{ color: colors.error + '1F', borderless: true, radius: 18 }}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </Pressable>
                </View>
              </Card>
            </Enter>
          ))
        )}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View
            style={[
              s.modalCard,
              {
                backgroundColor: colors.surfaceContainerHigh,
                borderTopLeftRadius: shape.extraLarge,
                borderTopRightRadius: shape.extraLarge,
              },
            ]}
          >
            <View style={[s.handle, { backgroundColor: colors.onSurfaceVariant + '40' }]} />
            <Text style={[typography.titleLarge, { color: colors.onSurface, marginBottom: 20 }]}>
              {form.id ? 'Editar ítem' : 'Nuevo ítem'}
            </Text>

            {error ? (
              <View style={[s.errorBanner, { backgroundColor: colors.errorContainer, borderRadius: shape.medium, marginBottom: 16 }]}>
                <Ionicons name="alert-circle-outline" size={16} color={colors.onErrorContainer} />
                <Text style={[typography.bodySmall, { color: colors.onErrorContainer, flex: 1 }]}>{error}</Text>
              </View>
            ) : null}

            <TextField
              label="Nombre"
              variant="outlined"
              value={form.nombre}
              onChangeText={(value) => setForm((prev) => ({ ...prev, nombre: value }))}
              leadingIcon="restaurant-outline"
              containerColor={colors.surfaceContainerHigh}
            />
            <View style={{ marginTop: 14 }}>
              <TextField
                label="Precio (Bs)"
                variant="outlined"
                value={form.precio}
                onChangeText={(value) => setForm((prev) => ({ ...prev, precio: value }))}
                leadingIcon="cash-outline"
                keyboardType="decimal-pad"
                containerColor={colors.surfaceContainerHigh}
              />
            </View>
            <View style={{ marginTop: 14 }}>
              <Pressable
                onPress={() => setCategoryStep('select')}
                style={[
                  s.categorySelector,
                  {
                    borderColor: colors.outline,
                    borderWidth: 1,
                    borderRadius: shape.medium,
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: colors.surfaceContainerHigh,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <Ionicons name="pricetags-outline" size={20} color={colors.onSurfaceVariant} />
                  <Text
                    style={[
                      typography.bodyMedium,
                      {
                        color: form.categoria ? colors.onSurface : colors.onSurfaceVariant,
                      },
                    ]}
                  >
                    {form.categoria || 'Seleccionar categoría'}
                  </Text>
                </View>
                <Ionicons name="chevron-down-outline" size={20} color={colors.onSurfaceVariant} />
              </Pressable>
            </View>

            <Modal visible={categoryStep === 'select'} transparent animationType="slide">
              <View style={s.modalOverlay}>
                <View
                  style={[
                    s.categoryModalCard,
                    {
                      backgroundColor: colors.surfaceContainerHigh,
                      borderTopLeftRadius: shape.extraLarge,
                      borderTopRightRadius: shape.extraLarge,
                    },
                  ]}
                >
                  <View style={[s.handle, { backgroundColor: colors.onSurfaceVariant + '40' }]} />
                  <Text style={[typography.titleLarge, { color: colors.onSurface, marginBottom: 16 }]}>
                    Categoría
                  </Text>

                  <ScrollView style={{ maxHeight: 300, marginBottom: 12 }}>
                    {categories.map((cat) => (
                      <Pressable
                        key={cat}
                        onPress={() => {
                          setForm((prev) => ({ ...prev, categoria: cat }));
                          setCategoryStep(null);
                        }}
                        style={[
                          s.categoryOption,
                          {
                            backgroundColor:
                              form.categoria === cat ? colors.primaryContainer : 'transparent',
                            paddingHorizontal: 16,
                            paddingVertical: 12,
                            borderRadius: shape.small,
                            marginBottom: 6,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            typography.bodyMedium,
                            {
                              color:
                                form.categoria === cat ? colors.onPrimaryContainer : colors.onSurface,
                            },
                          ]}
                        >
                          {cat}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>

                  <View style={{ borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.outlineVariant, paddingTop: 12 }}>
                    <Pressable
                      onPress={() => {
                        setCategoryStep('new');
                        setNewCategory('');
                      }}
                      style={[
                        s.newCategoryOption,
                        {
                          backgroundColor: colors.tertiaryContainer,
                          paddingHorizontal: 16,
                          paddingVertical: 12,
                          borderRadius: shape.small,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 12,
                        },
                      ]}
                    >
                      <Ionicons name="add-circle-outline" size={20} color={colors.onTertiaryContainer} />
                      <Text
                        style={[
                          typography.bodyMedium,
                          { color: colors.onTertiaryContainer },
                        ]}
                      >
                        Nueva categoría
                      </Text>
                    </Pressable>
                  </View>

                  <Button
                    label="Cerrar"
                    variant="text"
                    onPress={() => setCategoryStep(null)}
                    style={{ marginTop: 12 }}
                  />
                </View>
              </View>
            </Modal>

            <Modal visible={categoryStep === 'new'} transparent animationType="slide">
              <View style={s.modalOverlay}>
                <View
                  style={[
                    s.categoryModalCard,
                    {
                      backgroundColor: colors.surfaceContainerHigh,
                      borderTopLeftRadius: shape.extraLarge,
                      borderTopRightRadius: shape.extraLarge,
                    },
                  ]}
                >
                  <View style={[s.handle, { backgroundColor: colors.onSurfaceVariant + '40' }]} />
                  <Text style={[typography.titleLarge, { color: colors.onSurface, marginBottom: 16 }]}>
                    Nueva categoría
                  </Text>

                  <TextField
                    label="Nombre de la categoría"
                    variant="outlined"
                    value={newCategory}
                    onChangeText={setNewCategory}
                    containerColor={colors.surfaceContainerHigh}
                  />

                  <View style={s.modalActions}>
                    <Button
                      label="Cancelar"
                      variant="text"
                      onPress={() => {
                        setCategoryStep('select');
                        setNewCategory('');
                      }}
                      style={{ flex: 1 }}
                    />
                    <Button
                      label="Guardar"
                      variant="filled"
                      onPress={() => {
                        if (newCategory.trim()) {
                          setForm((prev) => ({ ...prev, categoria: newCategory.trim() }));
                          setCategoryStep(null);
                          setNewCategory('');
                        }
                      }}
                      disabled={!newCategory.trim()}
                      style={{ flex: 2 }}
                    />
                  </View>
                </View>
              </View>
            </Modal>
            <View style={{ marginTop: 14 }}>
              <TextField
                label="Descripción"
                variant="outlined"
                value={form.descripcion}
                onChangeText={(value) => setForm((prev) => ({ ...prev, descripcion: value }))}
                leadingIcon="document-text-outline"
                multiline
                containerColor={colors.surfaceContainerHigh}
              />
            </View>

            <View style={{ marginTop: 14 }}>
              <Button
                label={uploadingImage ? 'Subiendo imagen...' : 'Seleccionar imagen'}
                variant="outlined"
                icon="image-outline"
                onPress={pickImage}
                disabled={uploadingImage}
              />
            </View>

            {form.imagen_url ? (
              <Image
                source={{ uri: form.imagen_url }}
                style={[s.previewImage, { borderRadius: shape.medium }]}
                contentFit="cover"
              />
            ) : null}

            <View style={s.modalActions}>
              <Button
                label="Cancelar"
                variant="text"
                onPress={() => {
                  setModalVisible(false);
                  setError('');
                }}
                style={{ flex: 1 }}
              />
              <Button
                label={saving ? 'Guardando...' : 'Guardar'}
                variant="filled"
                icon="save-outline"
                onPress={saveItem}
                disabled={saving}
                style={{ flex: 2 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any, shape: any) =>
  StyleSheet.create({
    safe: { flex: 1 },
    scroll: { padding: 16, gap: 10, paddingBottom: 40 },
    addBtn: { padding: 8 },
    chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 8 },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      padding: 10,
      marginBottom: 12,
    },
    loadingBox: { paddingVertical: 28 },
    emptyCard: { padding: 16 },
    itemCard: { padding: 0, overflow: 'hidden' },
    itemMain: { padding: 12, flexDirection: 'row', gap: 10, alignItems: 'center' },
    itemImage: { width: 58, height: 58 },
    itemBody: { flex: 1, gap: 2 },
    badge: { paddingHorizontal: 10, paddingVertical: 3 },
    actions: {
      borderTopWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      paddingHorizontal: 8,
      paddingVertical: 6,
    },
    actionBtn: {
      flex: 1,
      minHeight: 34,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: '#00000055',
      justifyContent: 'flex-end',
    },
    modalCard: { padding: 24, paddingTop: 12 },
    categoryModalCard: { padding: 24, paddingTop: 12, maxHeight: '80%' },
    handle: {
      width: 32,
      height: 4,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 20,
    },
    categorySelector: {},
    categoryOption: {},
    newCategoryOption: {},
    previewImage: { width: '100%', height: 120, marginTop: 14 },
    modalActions: { flexDirection: 'row', gap: 8, marginTop: 22 },
  });
