import { Button, Card, Chip, Enter, TextField, TopAppBar } from '@/components/md3';
import { useAuth } from '@/context/auth';
import { useMD3Theme } from '@/hooks/use-md3-theme';
import { getAdminRestaurant } from '@/lib/admin';
import { sanitizeIntegerInput, sanitizeTextOnlyInput } from '@/lib/form-sanitizers';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type MaterialRow = {
  id: string;
  nombre: string;
  unidad: string;
  stock_minimo: number;
  activo: boolean;
  created_at: string;
  current_stock: number;
};

type MovementRow = {
  id: string;
  material_id: string;
  movement_type: 'consumo' | 'reposicion';
  quantity: number;
  reason: string | null;
  notes: string | null;
  created_at: string;
};

const MOVEMENT_REASONS = {
  consumo: ['Uso diario', 'Rotura', 'Merma'],
  reposicion: ['Compra', 'Reposición manual'],
} as const;

export default function AdminInventarioScreen() {
  const { colors, typography, shape } = useMD3Theme();
  const s = useMemo(() => makeStyles(colors, shape), [colors, shape]);
  const { profile } = useAuth();

  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [movements, setMovements] = useState<MovementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [materialModalVisible, setMaterialModalVisible] = useState(false);
  const [movementModalVisible, setMovementModalVisible] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialRow | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<MaterialRow | null>(null);

  const [materialName, setMaterialName] = useState('');
  const [materialUnit, setMaterialUnit] = useState('unidad');
  const [minimumStock, setMinimumStock] = useState('0');
  const [movementType, setMovementType] = useState<'consumo' | 'reposicion'>('consumo');
  const [movementQuantity, setMovementQuantity] = useState('1');
  const [movementReason, setMovementReason] = useState('');
  const [movementNotes, setMovementNotes] = useState('');

  const loadInventory = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    setError('');

    const [{ data: materialData, error: materialError }, { data: movementData, error: movementError }] = await Promise.all([
      supabase
        .from('materials')
        .select('id, nombre, unidad, stock_minimo, activo, created_at')
        .eq('restaurant_id', restaurantId)
        .eq('activo', true)
        .order('nombre', { ascending: true }),
      supabase
        .from('material_stock_movements')
        .select('id, material_id, movement_type, quantity, reason, notes, created_at')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(500),
    ]);

    if (materialError || movementError) {
      setError(materialError?.message ?? movementError?.message ?? 'No se pudo cargar el inventario.');
      setLoading(false);
      return;
    }

    const movementRows = (movementData ?? []) as MovementRow[];
    const stockByMaterial = new Map<string, number>();
    for (const movement of movementRows) {
      const signedQuantity = movement.movement_type === 'reposicion' ? movement.quantity : -movement.quantity;
      stockByMaterial.set(movement.material_id, (stockByMaterial.get(movement.material_id) ?? 0) + signedQuantity);
    }

    setMaterials(
      ((materialData ?? []) as Omit<MaterialRow, 'current_stock'>[]).map((material) => ({
        ...material,
        current_stock: stockByMaterial.get(material.id) ?? 0,
      })),
    );
    setMovements(movementRows);
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => {
    const loadRestaurant = async () => {
      const restaurant = await getAdminRestaurant(profile?.id ?? null);
      if (!restaurant?.id) {
        setError('No se encontró restaurante para gestionar inventario.');
        setLoading(false);
        return;
      }

      setRestaurantId(restaurant.id);
    };

    loadRestaurant();
  }, [profile?.id]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel(`admin-inventory-${restaurantId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'materials', filter: `restaurant_id=eq.${restaurantId}` },
        () => loadInventory(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'material_stock_movements', filter: `restaurant_id=eq.${restaurantId}` },
        () => loadInventory(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, loadInventory]);

  const lowStockCount = useMemo(
    () => materials.filter((material) => material.current_stock <= material.stock_minimo).length,
    [materials],
  );

  const openMaterialModal = (material?: MaterialRow) => {
    setEditingMaterial(material ?? null);
    setMaterialName(sanitizeTextOnlyInput(material?.nombre ?? ''));
    setMaterialUnit(sanitizeTextOnlyInput(material?.unidad ?? 'unidad'));
    setMinimumStock(sanitizeIntegerInput(`${material?.stock_minimo ?? 0}`));
    setMaterialModalVisible(true);
  };

  const openMovementModal = (material: MaterialRow, type: 'consumo' | 'reposicion') => {
    setSelectedMaterial(material);
    setMovementType(type);
    setMovementQuantity('1');
    setMovementReason(sanitizeTextOnlyInput(MOVEMENT_REASONS[type][0]));
    setMovementNotes('');
    setMovementModalVisible(true);
  };

  const saveMaterial = async () => {
    const trimmedName = sanitizeTextOnlyInput(materialName).trim();
    const trimmedUnit = sanitizeTextOnlyInput(materialUnit).trim() || 'unidad';
    const parsedMinimum = Number(minimumStock);

    if (!restaurantId) {
      setError('No se encontró el restaurante.');
      return;
    }

    if (!trimmedName) {
      setError('Ingresa el nombre del material.');
      return;
    }

    if (!Number.isFinite(parsedMinimum) || parsedMinimum < 0) {
      setError('El stock mínimo debe ser un número válido.');
      return;
    }

    setSaving(true);
    setError('');

    const { error: saveError } = editingMaterial
      ? await supabase
        .from('materials')
        .update({ nombre: trimmedName, unidad: trimmedUnit, stock_minimo: parsedMinimum })
        .eq('id', editingMaterial.id)
        .eq('restaurant_id', restaurantId)
      : await supabase.from('materials').insert({
        restaurant_id: restaurantId,
        nombre: trimmedName,
        unidad: trimmedUnit,
        stock_minimo: parsedMinimum,
      });

    setSaving(false);

    if (saveError) {
      setError(saveError.message);
      return;
    }

    setMaterialModalVisible(false);
    setEditingMaterial(null);
    loadInventory();
  };

  const deactivateMaterial = async () => {
    if (!editingMaterial || !restaurantId) return;

    setSaving(true);
    setError('');

    const { error: updateError } = await supabase
      .from('materials')
      .update({ activo: false })
      .eq('id', editingMaterial.id)
      .eq('restaurant_id', restaurantId);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMaterialModalVisible(false);
    setEditingMaterial(null);
    loadInventory();
  };

  const registerMovement = async () => {
    const parsedQuantity = Number(movementQuantity);
    const trimmedReason = sanitizeTextOnlyInput(movementReason).trim();

    if (!selectedMaterial || !restaurantId) {
      setError('Selecciona un material válido.');
      return;
    }

    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      setError('La cantidad debe ser mayor a 0.');
      return;
    }

    setSaving(true);
    setError('');

    const { error: insertError } = await supabase.from('material_stock_movements').insert({
      material_id: selectedMaterial.id,
      restaurant_id: restaurantId,
      movement_type: movementType,
      quantity: parsedQuantity,
      reason: trimmedReason || null,
      notes: movementNotes.trim() || null,
      created_by: profile?.id ?? null,
    });

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setMovementModalVisible(false);
    setSelectedMaterial(null);
    loadInventory();
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <TopAppBar
        title="Inventario"
        onBack={() => router.back()}
        trailing={
          <Pressable
            onPress={() => openMaterialModal()}
            style={[s.addBtn, { borderRadius: shape.medium, backgroundColor: colors.primaryContainer }]}
            android_ripple={{ color: colors.onPrimaryContainer + '30' }}
          >
            <Ionicons name="add" size={22} color={colors.onPrimaryContainer} />
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {error ? (
          <View style={[s.errorBanner, { backgroundColor: colors.errorContainer, borderRadius: shape.small }]}>
            <Ionicons name="alert-circle-outline" size={14} color={colors.onErrorContainer} />
            <Text style={[typography.bodySmall, { color: colors.onErrorContainer, flex: 1 }]}>{error}</Text>
          </View>
        ) : null}

        <Enter delay={0}>
          <View style={s.chipsRow}>
            <Chip label={`${materials.length} materiales`} selected icon="cube-outline" />
            <Chip label={`${lowStockCount} con stock bajo`} icon="alert-outline" />
          </View>
        </Enter>

        {loading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : materials.length === 0 ? (
          <Card variant="outlined" style={s.emptyCard}>
            <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}>Aún no registraste materiales físicos.</Text>
          </Card>
        ) : (
          materials.map((material, index) => {
            const lowStock = material.current_stock <= material.stock_minimo;
            return (
              <Enter key={material.id} delay={70 + index * 24}>
                <Card variant="outlined" style={s.materialCard}>
                  <View style={s.materialHead}>
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.titleSmall, { color: colors.onSurface }]}>{material.nombre}</Text>
                      <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>
                        Mínimo: {material.stock_minimo} {material.unidad}
                      </Text>
                    </View>
                    <View style={[s.stockBadge, { borderRadius: shape.full, backgroundColor: lowStock ? colors.errorContainer : colors.tertiaryContainer }]}>
                      <Text style={[typography.labelLarge, { color: lowStock ? colors.onErrorContainer : colors.onTertiaryContainer }]}>
                        {material.current_stock} {material.unidad}
                      </Text>
                    </View>
                  </View>
                  <View style={s.materialActions}>
                    <Button label="Consumo" variant="outlined" icon="remove-outline" onPress={() => openMovementModal(material, 'consumo')} style={{ flex: 1 }} />
                    <Button label="Reposición" variant="filled" icon="add-outline" onPress={() => openMovementModal(material, 'reposicion')} style={{ flex: 1 }} />
                  </View>
                  <Button label="Editar material" variant="tonal" icon="create-outline" onPress={() => openMaterialModal(material)} />
                </Card>
              </Enter>
            );
          })
        )}

        <Enter delay={180}>
          <Text style={[typography.titleMedium, { color: colors.onSurface, marginTop: 8 }]}>Movimientos recientes</Text>
        </Enter>
        {movements.length === 0 ? (
          <Card variant="outlined" style={s.emptyCard}>
            <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}>Todavía no hay movimientos registrados.</Text>
          </Card>
        ) : (
          movements.map((movement, index) => {
            const material = materials.find((item) => item.id === movement.material_id);
            const isIncoming = movement.movement_type === 'reposicion';
            return (
              <Enter key={movement.id} delay={210 + index * 18}>
                <Card variant="outlined" style={s.movementCard}>
                  <View style={s.movementHead}>
                    <Text style={[typography.titleSmall, { color: colors.onSurface, flex: 1 }]}>{material?.nombre ?? 'Material'}</Text>
                    <Text style={[typography.labelLarge, { color: isIncoming ? colors.tertiary : colors.error }]}>
                      {isIncoming ? '+' : '-'}{movement.quantity}
                    </Text>
                  </View>
                  <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>
                    {movement.movement_type === 'reposicion' ? 'Reposición' : 'Consumo'} · {movement.reason || 'Sin motivo'}
                  </Text>
                  {movement.notes ? (
                    <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>{movement.notes}</Text>
                  ) : null}
                </Card>
              </Enter>
            );
          })
        )}
      </ScrollView>

      <Modal visible={materialModalVisible} transparent animationType="slide" onRequestClose={() => setMaterialModalVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { backgroundColor: colors.surfaceContainerHigh, borderTopLeftRadius: shape.extraLarge, borderTopRightRadius: shape.extraLarge }]}> 
            <View style={[s.handle, { backgroundColor: colors.onSurfaceVariant + '40' }]} />
            <Text style={[typography.titleLarge, { color: colors.onSurface, marginBottom: 20 }]}>{editingMaterial ? 'Editar material' : 'Nuevo material'}</Text>
            <TextField label="Nombre" variant="outlined" value={materialName} onChangeText={(value) => setMaterialName(sanitizeTextOnlyInput(value))} leadingIcon="cube-outline" containerColor={colors.surfaceContainerHigh} />
            <View style={{ marginTop: 14 }}>
              <TextField label="Unidad" variant="outlined" value={materialUnit} onChangeText={(value) => setMaterialUnit(sanitizeTextOnlyInput(value))} leadingIcon="layers-outline" containerColor={colors.surfaceContainerHigh} />
            </View>
            <View style={{ marginTop: 14 }}>
              <TextField label="Stock mínimo" variant="outlined" value={minimumStock} onChangeText={(value) => setMinimumStock(sanitizeIntegerInput(value))} leadingIcon="alert-outline" keyboardType="numeric" containerColor={colors.surfaceContainerHigh} />
            </View>
            {editingMaterial ? (
              <Button label="Desactivar material" variant="outlined" icon="archive-outline" onPress={deactivateMaterial} disabled={saving} style={{ marginTop: 16 }} />
            ) : null}
            <View style={s.modalActions}>
              <Button label="Cancelar" variant="text" onPress={() => { setMaterialModalVisible(false); setEditingMaterial(null); }} style={{ flex: 1 }} />
              <Button label={saving ? 'Guardando...' : editingMaterial ? 'Guardar' : 'Crear'} variant="filled" icon="checkmark-outline" onPress={saveMaterial} disabled={saving} style={{ flex: 1.4 }} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={movementModalVisible} transparent animationType="slide" onRequestClose={() => setMovementModalVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { backgroundColor: colors.surfaceContainerHigh, borderTopLeftRadius: shape.extraLarge, borderTopRightRadius: shape.extraLarge }]}> 
            <View style={[s.handle, { backgroundColor: colors.onSurfaceVariant + '40' }]} />
            <Text style={[typography.titleLarge, { color: colors.onSurface, marginBottom: 8 }]}>
              {movementType === 'reposicion' ? 'Registrar reposición' : 'Registrar consumo'}
            </Text>
            <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginBottom: 18 }]}>
              {selectedMaterial?.nombre ?? 'Material'}
            </Text>
            <View style={s.chipsRow}>
              {MOVEMENT_REASONS[movementType].map((reason) => (
                <Chip key={reason} label={reason} variant="filter" selected={movementReason === reason} onPress={() => setMovementReason(reason)} />
              ))}
            </View>
            <TextField label="Cantidad" variant="outlined" value={movementQuantity} onChangeText={(value) => setMovementQuantity(sanitizeIntegerInput(value))} leadingIcon={movementType === 'reposicion' ? 'add-outline' : 'remove-outline'} keyboardType="numeric" containerColor={colors.surfaceContainerHigh} />
            <View style={{ marginTop: 14 }}>
              <TextField label="Motivo" variant="outlined" value={movementReason} onChangeText={(value) => setMovementReason(sanitizeTextOnlyInput(value))} leadingIcon="document-text-outline" containerColor={colors.surfaceContainerHigh} />
            </View>
            <View style={{ marginTop: 14 }}>
              <TextField label="Notas" variant="outlined" value={movementNotes} onChangeText={setMovementNotes} leadingIcon="create-outline" containerColor={colors.surfaceContainerHigh} multiline />
            </View>
            <View style={s.modalActions}>
              <Button label="Cancelar" variant="text" onPress={() => setMovementModalVisible(false)} style={{ flex: 1 }} />
              <Button label={saving ? 'Guardando...' : 'Registrar'} variant="filled" icon="checkmark-outline" onPress={registerMovement} disabled={saving} style={{ flex: 1.4 }} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any, shape: any) => StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40, gap: 10 },
  addBtn: { padding: 8 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, marginBottom: 12 },
  chipsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 10 },
  loadingBox: { paddingVertical: 32 },
  emptyCard: { padding: 16 },
  materialCard: { padding: 14, gap: 12, marginBottom: 8 },
  materialHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stockBadge: { paddingHorizontal: 12, paddingVertical: 8 },
  materialActions: { flexDirection: 'row', gap: 8 },
  movementCard: { padding: 14, gap: 6, marginTop: 8 },
  movementHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalOverlay: { flex: 1, backgroundColor: '#00000055', justifyContent: 'flex-end' },
  modalCard: { padding: 24, paddingTop: 12 },
  handle: { width: 32, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 8, marginTop: 22 },
});
