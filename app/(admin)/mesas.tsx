import { View, Text, ScrollView, StyleSheet, Pressable, Modal, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMD3Theme } from '@/hooks/use-md3-theme';
import { TopAppBar, Card, TextField, Button, Chip, Enter, SoftToggle } from '@/components/md3';
import { Mesa } from '@/constants/mock';
import { useAuth } from '@/context/auth';
import { getAdminRestaurant } from '@/lib/admin';
import { supabase } from '@/lib/supabase';
import Animated, {
  FadeOut,
  LinearTransition,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type TableRow = {
  id: string;
  restaurant_id: string;
  numero: number;
  capacidad: number;
  activa: boolean;
};

const toMesa = (table: TableRow): Mesa => ({
  id: table.id,
  numero: table.numero,
  capacidad: table.capacidad,
  activa: table.activa,
});

const sortMesas = (items: Mesa[]) => [...items].sort((a, b) => a.numero - b.numero);

const upsertMesa = (items: Mesa[], mesa: Mesa) => {
  const exists = items.some(item => item.id === mesa.id);
  const next = exists
    ? items.map(item => item.id === mesa.id ? mesa : item)
    : [...items, mesa];

  return sortMesas(next);
};

type MesaCardItemProps = {
  mesa: Mesa;
  index: number;
  cardWidth: number;
  colors: ReturnType<typeof useMD3Theme>['colors'];
  typography: ReturnType<typeof useMD3Theme>['typography'];
  shape: ReturnType<typeof useMD3Theme>['shape'];
  saving: boolean;
  styles: ReturnType<typeof makeStyles>;
  onEdit: (mesa: Mesa) => void;
  onToggle: (mesa: Mesa) => void;
  onDelete: (id: string) => void;
};

function MesaCardItem({
  mesa,
  index,
  cardWidth,
  colors,
  typography,
  shape,
  saving,
  styles,
  onEdit,
  onToggle,
  onDelete,
}: MesaCardItemProps) {
  const activeProgress = useSharedValue(mesa.activa ? 1 : 0);

  useEffect(() => {
    activeProgress.value = withTiming(mesa.activa ? 1 : 0, { duration: 220 });
  }, [mesa.activa, activeProgress]);

  const cardStateStyle = useAnimatedStyle(() => ({
    opacity: interpolate(activeProgress.value, [0, 1], [0.72, 1]),
  }));

  const iconStateStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      activeProgress.value,
      [0, 1],
      [colors.surfaceVariant, colors.primary],
    ),
  }));

  const badgeStateStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      activeProgress.value,
      [0, 1],
      [colors.surfaceVariant, colors.tertiaryContainer],
    ),
  }));

  return (
    <Enter delay={80 + index * 50} style={{ width: cardWidth }}>
      <Animated.View
        layout={LinearTransition.springify().damping(18).stiffness(180)}
        exiting={FadeOut.duration(180)}
        style={cardStateStyle}
      >
        <Card
          variant="outlined"
          style={styles.mesaCard}
        >
          <View style={styles.mesaTop}>
            <Animated.View style={[styles.mesaIconBg, iconStateStyle, { borderRadius: shape.medium }]}>
              <Ionicons name="grid-outline" size={20}
                color={mesa.activa ? colors.onPrimary : colors.onSurfaceVariant} />
            </Animated.View>
            <Animated.View style={[
              styles.statusBadge,
              badgeStateStyle,
              { borderRadius: shape.full },
            ]}>
              <Ionicons
                name={mesa.activa ? 'checkmark' : 'pause-outline'}
                size={13}
                color={mesa.activa ? colors.onTertiaryContainer : colors.onSurfaceVariant}
              />
              <Text
                style={[
                  typography.labelSmall,
                  { color: mesa.activa ? colors.onTertiaryContainer : colors.onSurfaceVariant },
                ]}
                numberOfLines={1}
              >
                {mesa.activa ? 'Activa' : 'Inactiva'}
              </Text>
            </Animated.View>
          </View>

          <View style={styles.mesaBody}>
            <Text style={[typography.titleMedium, { color: colors.onSurface }]} numberOfLines={1}>
              Mesa {mesa.numero}
            </Text>
            <View style={styles.capRow}>
              <Ionicons name="people-outline" size={14} color={colors.onSurfaceVariant} />
              <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                {mesa.capacidad} personas
              </Text>
            </View>
          </View>

          <View style={[styles.actions, { borderTopColor: colors.outlineVariant }]}>
            <Pressable onPress={() => onEdit(mesa)}
              style={[styles.actionBtn, { borderRadius: shape.full }]}
              android_ripple={{ color: colors.onSurface + '1F', borderless: true, radius: 18 }}>
              <Ionicons name="create-outline" size={18} color={colors.onSurfaceVariant} />
            </Pressable>
            <Pressable onPress={() => onToggle(mesa)}
              disabled={saving}
              style={[styles.actionBtn, styles.toggleActionBtn, { borderRadius: shape.full }]}
              android_ripple={{ color: colors.onSurface + '1F', borderless: true, radius: 18 }}>
              <SoftToggle active={mesa.activa}>
                <Ionicons name={mesa.activa ? 'pause-circle-outline' : 'play-circle-outline'} size={18}
                  color={mesa.activa ? colors.tertiary : colors.primary} />
              </SoftToggle>
            </Pressable>
            <Pressable onPress={() => onDelete(mesa.id)}
              disabled={saving}
              style={[styles.actionBtn, { borderRadius: shape.full }]}
              android_ripple={{ color: colors.error + '1F', borderless: true, radius: 18 }}>
              <Ionicons name="trash-outline" size={18} color={colors.error} />
            </Pressable>
          </View>
        </Card>
      </Animated.View>
    </Enter>
  );
}

export default function MesasScreen() {
  const { colors, typography, shape } = useMD3Theme();
  const s = useMemo(() => makeStyles(colors, shape), [colors, shape]);
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const cardWidth = (width - 40) / 2;

  const [mesas, setMesas]               = useState<Mesa[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando]         = useState<Mesa | null>(null);
  const [numero, setNumero]             = useState('');
  const [capacidad, setCapacidad]       = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving]             = useState(false);
  const [savingId, setSavingId]         = useState<string | null>(null);
  const [error, setError]               = useState('');

  const abrirCrear  = () => { setEditando(null); setNumero(''); setCapacidad(''); setModalVisible(true); };
  const abrirEditar = (m: Mesa) => { setEditando(m); setNumero(String(m.numero)); setCapacidad(String(m.capacidad)); setModalVisible(true); };

  const cargarMesas = useCallback(async () => {
    setInitialLoading(true);
    setError('');

    const restaurant = await getAdminRestaurant(user?.id ?? null);

    if (!restaurant) {
      setError('Primero registra los datos del restaurante.');
      setInitialLoading(false);
      return;
    }

    setRestaurantId(restaurant.id);

    const { data, error: tablesError } = await supabase
      .from('tables')
      .select('id, restaurant_id, numero, capacidad, activa')
      .eq('restaurant_id', restaurant.id)
      .order('numero', { ascending: true });

    if (tablesError) setError(tablesError.message);
    else setMesas((data ?? []).map(table => toMesa(table)));

    setInitialLoading(false);
  }, [user?.id]);

  useEffect(() => {
    cargarMesas();
  }, [cargarMesas]);

  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel(`admin-mesas-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tables',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        payload => {
          if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as Pick<TableRow, 'id'>;
            setMesas(prev => prev.filter(mesa => mesa.id !== oldRow.id));
            return;
          }

          const newRow = payload.new as TableRow;
          setMesas(prev => upsertMesa(prev, toMesa(newRow)));
        },
      )
      .subscribe(status => {
        if (status === 'CHANNEL_ERROR') {
          setError('No se pudo conectar la actualización en tiempo real de mesas.');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);

  const guardar = async () => {
    if (!numero || !capacidad || !restaurantId) return;

    const numeroMesa = parseInt(numero, 10);
    const capacidadMesa = parseInt(capacidad, 10);
    if (!Number.isFinite(numeroMesa) || !Number.isFinite(capacidadMesa)) return;

    setSaving(true);
    setError('');
    let saved = false;

    if (editando) {
      const { data, error: updateError } = await supabase
        .from('tables')
        .update({ numero: numeroMesa, capacidad: capacidadMesa })
        .eq('id', editando.id)
        .select('id, restaurant_id, numero, capacidad, activa')
        .single();

      if (updateError) setError(updateError.message);
      else {
        setMesas(prev => upsertMesa(prev, toMesa(data)));
        saved = true;
      }
    } else {
      const { data, error: insertError } = await supabase
        .from('tables')
        .insert({ restaurant_id: restaurantId, numero: numeroMesa, capacidad: capacidadMesa, activa: true })
        .select('id, restaurant_id, numero, capacidad, activa')
        .single();

      if (insertError) setError(insertError.message);
      else {
        setMesas(prev => upsertMesa(prev, toMesa(data)));
        saved = true;
      }
    }

    setSaving(false);
    if (saved) setModalVisible(false);
  };

  const eliminar = async (id: string) => {
    setSavingId(id);
    setError('');
    const previous = mesas;
    setMesas(prev => prev.filter(m => m.id !== id));

    const { error: deleteError } = await supabase.from('tables').delete().eq('id', id);
    if (deleteError) {
      setMesas(previous);
      setError(deleteError.message);
    }

    setSavingId(null);
  };

  const toggleActiva = async (mesa: Mesa) => {
    const nextActiva = !mesa.activa;
    setSavingId(mesa.id);
    setError('');
    setMesas(prev => prev.map(m => m.id === mesa.id ? { ...m, activa: nextActiva } : m));

    const { error: updateError } = await supabase
      .from('tables')
      .update({ activa: nextActiva })
      .eq('id', mesa.id);

    if (updateError) {
      setMesas(prev => prev.map(m => m.id === mesa.id ? { ...m, activa: mesa.activa } : m));
      setError(updateError.message);
    }

    setSavingId(null);
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <TopAppBar
        title="Mesas"
        onBack={() => router.back()}
        trailing={
          <Pressable onPress={abrirCrear}
            style={[s.addBtn, { backgroundColor: colors.primaryContainer, borderRadius: shape.medium }]}
            android_ripple={{ color: colors.onPrimaryContainer + '30' }}>
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

        {/* Summary chips */}
        <Enter delay={0}>
          <View style={s.chips}>
            <Chip label={`${mesas.length} total`}                            icon="grid-outline"             />
            <Chip label={`${mesas.filter(m => m.activa).length} activas`}   icon="checkmark-circle-outline" selected />
            <Chip label={`${mesas.filter(m => !m.activa).length} inactivas`} icon="close-circle-outline"    />
          </View>
        </Enter>

        {/* Grid */}
        {initialLoading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <View style={s.grid}>
          {mesas.map((mesa, i) => (
            <MesaCardItem
              key={mesa.id}
              mesa={mesa}
              index={i}
              cardWidth={cardWidth}
              colors={colors}
              typography={typography}
              shape={shape}
              saving={savingId === mesa.id}
              styles={s}
              onEdit={abrirEditar}
              onToggle={toggleActiva}
              onDelete={eliminar}
            />
          ))}
          </View>
        )}
      </ScrollView>

      {/* Modal nueva / editar mesa */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, {
            backgroundColor: colors.surfaceContainerHigh,
            borderTopLeftRadius: shape.extraLarge,
            borderTopRightRadius: shape.extraLarge,
          }]}>
            <View style={[s.handle, { backgroundColor: colors.onSurfaceVariant + '40' }]} />

            <Text style={[typography.titleLarge, { color: colors.onSurface, marginBottom: 24 }]}>
              {editando ? 'Editar mesa' : 'Nueva mesa'}
            </Text>

            <TextField
              label="Número de mesa"
              variant="outlined"
              value={numero}
              onChangeText={setNumero}
              leadingIcon="grid-outline"
              keyboardType="numeric"
              containerColor={colors.surfaceContainerHigh}
            />
            <View style={{ marginTop: 16 }}>
              <TextField
                label="Capacidad (personas)"
                variant="outlined"
                value={capacidad}
                onChangeText={setCapacidad}
                leadingIcon="people-outline"
                keyboardType="numeric"
                containerColor={colors.surfaceContainerHigh}
              />
            </View>

            {error ? (
              <View style={[s.errorBanner, { backgroundColor: colors.errorContainer, borderRadius: shape.small, marginTop: 12, marginBottom: 0 }]}>
                <Ionicons name="alert-circle-outline" size={14} color={colors.onErrorContainer} />
                <Text style={[typography.bodySmall, { color: colors.onErrorContainer, flex: 1 }]}>{error}</Text>
              </View>
            ) : null}

            <View style={s.modalActions}>
              <Button label="Cancelar" variant="text"   onPress={() => setModalVisible(false)} style={{ flex: 1 }} />
              <Button label={saving ? 'Guardando...' : editando ? 'Guardar' : 'Crear'} variant="filled"
                icon={editando ? 'save-outline' : 'add-circle-outline'}
                onPress={guardar} disabled={saving} style={{ flex: 2 }} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any, shape: any) => StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },

  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 14 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, marginBottom: 12 },
  loadingBox:  { paddingVertical: 32 },

  addBtn: { padding: 8 },

  grid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mesaCard:   { minHeight: 156, padding: 0, borderWidth: 1, borderColor: colors.outlineVariant },
  mesaTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, paddingBottom: 0 },
  mesaIconBg: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  statusBadge:{ flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: 86, paddingHorizontal: 9, paddingVertical: 5 },
  mesaBody:   { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 14, flex: 1, gap: 5 },
  capRow:     { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actions:    { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 8, paddingVertical: 7 },
  actionBtn:  { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 34 },
  toggleActionBtn: { transform: [{ translateY: -1 }] },

  modalOverlay: { flex: 1, backgroundColor: '#00000055', justifyContent: 'flex-end' },
  modalCard:    { padding: 24, paddingTop: 12 },
  handle:       { width: 32, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 8, marginTop: 24 },
});
