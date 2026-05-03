import { Button, Card, Chip, Enter, TextField, TopAppBar } from '@/components/md3';
import { useAuth } from '@/context/auth';
import { useMD3Theme } from '@/hooks/use-md3-theme';
import { getAdminRestaurant } from '@/lib/admin';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Expense = {
  id: string;
  descripcion: string;
  monto: number;
  fecha: string;
  created_at: string;
};

type DateFilter = '7d' | '30d' | 'all';

const todayIso = () => new Date().toISOString().slice(0, 10);
const shiftDaysIso = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
};

export default function AdminGastosScreen() {
  const { colors, typography, shape } = useMD3Theme();
  const s = useMemo(() => makeStyles(colors, shape), [colors, shape]);
  const { profile } = useAuth();

  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [filter, setFilter] = useState<DateFilter>('7d');
  const [fromDate, setFromDate] = useState(shiftDaysIso(7));
  const [toDate, setToDate] = useState(todayIso());

  const [formVisible, setFormVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState(todayIso());
  const [formError, setFormError] = useState('');

  const applyFilterPreset = (nextFilter: DateFilter) => {
    setFilter(nextFilter);
    if (nextFilter === '7d') {
      setFromDate(shiftDaysIso(7));
      setToDate(todayIso());
      return;
    }
    if (nextFilter === '30d') {
      setFromDate(shiftDaysIso(30));
      setToDate(todayIso());
      return;
    }
    // 'all': mostrar campos de filtro custom, inicializar con valores
    setFromDate('');
    setToDate('');
  };

  // Helper para formatear fecha a display
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  // Helper para parsear desde display a ISO
  const parseDateFromDisplay = (displayStr: string) => {
    const parts = displayStr.split('/');
    if (parts.length !== 3) return '';
    const [d, m, y] = parts;
    if (!y || !m || !d || y.length !== 4) return '';
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  };

  const loadExpenses = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    setError('');

    let query = supabase
      .from('expenses')
      .select('id, descripcion, monto, fecha, created_at')
      .eq('restaurant_id', restaurantId)
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false });

    if (fromDate) query = query.gte('fecha', fromDate);
    if (toDate) query = query.lte('fecha', toDate);

    const { data, error: fetchError } = await query;
    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setExpenses((data ?? []) as Expense[]);
    setLoading(false);
  }, [restaurantId, fromDate, toDate]);

  useEffect(() => {
    const loadRestaurant = async () => {
      const restaurant = await getAdminRestaurant(profile?.id ?? null);
      if (!restaurant?.id) {
        setRestaurantId(null);
        setExpenses([]);
        setLoading(false);
        setError('No se encontró restaurante para gestionar gastos.');
        return;
      }
      setRestaurantId(restaurant.id);
    };
    loadRestaurant();
  }, [profile?.id]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  useEffect(() => {
    if (!restaurantId) return;
    const channel = supabase
      .channel(`admin-expenses-${restaurantId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses', filter: `restaurant_id=eq.${restaurantId}` },
        () => loadExpenses(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, loadExpenses]);

  const openCreateModal = () => {
    setEditingExpense(null);
    setDescripcion('');
    setMonto('');
    setFecha(todayIso());
    setFormError('');
    setFormVisible(true);
  };

  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setDescripcion(expense.descripcion);
    setMonto(String(expense.monto));
    setFecha(expense.fecha);
    setFormError('');
    setFormVisible(true);
  };

  const saveExpense = async () => {
    const trimmedDescription = descripcion.trim();
    const parsedAmount = Number(monto);

    // Validar descripción
    if (!trimmedDescription) {
      setFormError('La descripción es obligatoria.');
      return;
    }
    // Validar monto
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFormError('El monto debe ser mayor a 0.');
      return;
    }
    // Validar fecha (debe ser ISO format internamente)
    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      setFormError('La fecha es inválida.');
      return;
    }
    if (!restaurantId) {
      setFormError('No se encontró el restaurante.');
      return;
    }

    setSaving(true);
    setFormError('');

    if (editingExpense) {
      const { error: updateError } = await supabase
        .from('expenses')
        .update({
          descripcion: trimmedDescription,
          monto: parsedAmount,
          fecha,
        })
        .eq('id', editingExpense.id);

      if (updateError) {
        setFormError(updateError.message);
        setSaving(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase.from('expenses').insert({
        restaurant_id: restaurantId,
        descripcion: trimmedDescription,
        monto: parsedAmount,
        fecha,
        created_by: profile?.id ?? null,
      });

      if (insertError) {
        setFormError(insertError.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setFormVisible(false);
    setEditingExpense(null);
    loadExpenses();
  };

  const confirmDelete = async () => {
    if (!deletingExpense) return;
    setSaving(true);
    setError('');

    const { error: deleteError } = await supabase.from('expenses').delete().eq('id', deletingExpense.id);
    if (deleteError) {
      setError(deleteError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setDeleteVisible(false);
    setDeletingExpense(null);
    loadExpenses();
  };

  const totalPeriodo = useMemo(() => expenses.reduce((sum, expense) => sum + expense.monto, 0), [expenses]);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <TopAppBar title="Gastos" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {error ? (
          <View style={[s.errorBanner, { backgroundColor: colors.errorContainer, borderRadius: shape.small }]}>
            <Ionicons name="alert-circle-outline" size={14} color={colors.onErrorContainer} />
            <Text style={[typography.bodySmall, { color: colors.onErrorContainer, flex: 1 }]}>{error}</Text>
          </View>
        ) : null}

        {/* Botón "Nuevo gasto" prominente */}
        <Enter delay={0}>
          <Button
            label="Nuevo gasto"
            variant="filled"
            icon="add"
            onPress={openCreateModal}
            style={s.newExpenseButton}
          />
        </Enter>

        {/* Filtros por presets */}
        <Enter delay={20}>
          <View style={s.chipsRow}>
            <Chip label="7 días" variant="filter" selected={filter === '7d'} onPress={() => applyFilterPreset('7d')} />
            <Chip label="30 días" variant="filter" selected={filter === '30d'} onPress={() => applyFilterPreset('30d')} />
            <Chip label="Todo" variant="filter" selected={filter === 'all'} onPress={() => applyFilterPreset('all')} />
          </View>
        </Enter>

        {/* Filtro por rango de fechas - Solo visible cuando "Todo" está seleccionado */}
        {filter === 'all' && (
          <Enter delay={40}>
            <Card variant="outlined" style={s.filterCard}>
              <Text style={[typography.titleSmall, { color: colors.onSurface }]}>Filtrar por rango de fechas</Text>
              
              {/* Campos de fecha con formato DD/MM/YYYY */}
              <TextField
                label="Desde (DD/MM/YYYY)"
                value={fromDate ? formatDateDisplay(fromDate) : ''}
                onChangeText={(value) => {
                  const isoDate = parseDateFromDisplay(value);
                  setFromDate(isoDate);
                }}
                placeholder="01/01/2024"
              />
              <TextField
                label="Hasta (DD/MM/YYYY)"
                value={toDate ? formatDateDisplay(toDate) : ''}
                onChangeText={(value) => {
                  const isoDate = parseDateFromDisplay(value);
                  setToDate(isoDate);
                }}
                placeholder={new Date().toLocaleDateString('es-ES')}
              />
              
              <Button label="Aplicar" variant="tonal" onPress={loadExpenses} style={{ alignSelf: 'flex-start' }} />
            </Card>
          </Enter>
        )}

        {/* Resumen del período */}
        <Enter delay={80}>
          <Card variant="filled" style={s.summaryCard}>
            <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>
              {filter === '7d' ? 'Últimos 7 días' : filter === '30d' ? 'Últimos 30 días' : 'Período seleccionado'}
            </Text>
            <Text style={[typography.headlineSmall, { color: colors.primary }]}>Bs {totalPeriodo.toFixed(2)}</Text>
          </Card>
        </Enter>

        {/* Lista de gastos */}
        {loading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : expenses.length === 0 ? (
          <Card variant="outlined" style={s.emptyCard}>
            <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}>
              No hay gastos registrados para este rango.
            </Text>
          </Card>
        ) : (
          expenses.map((expense, index) => (
            <Enter key={expense.id} delay={120 + index * 20}>
              <Card variant="outlined" style={s.expenseCard}>
                <View style={s.expenseHead}>
                  <View style={s.expenseInfo}>
                    <Text style={[typography.titleSmall, { color: colors.onSurface }]}>{expense.descripcion}</Text>
                    <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>
                      Fecha: {formatDateDisplay(expense.fecha)}
                    </Text>
                  </View>
                  <Text style={[typography.titleMedium, { color: colors.primary }]}>Bs {expense.monto.toFixed(2)}</Text>
                </View>
                <View style={s.expenseActions}>
                  <Button label="Editar" variant="text" icon="create-outline" onPress={() => openEditModal(expense)} style={{ flex: 1 }} />
                  <Button
                    label="Eliminar"
                    variant="outlined"
                    icon="trash-outline"
                    onPress={() => {
                      setDeletingExpense(expense);
                      setDeleteVisible(true);
                    }}
                    style={{ flex: 1 }}
                  />
                </View>
              </Card>
            </Enter>
          ))
        )}
      </ScrollView>

      {/* Modal: Crear/Editar gasto */}
      <Modal visible={formVisible} transparent animationType="fade">
        <View style={s.centeredOverlay}>
          <View style={[s.modalCard, { backgroundColor: colors.surfaceContainerHigh, borderRadius: shape.large }]}>
            <Text style={[typography.titleMedium, { color: colors.onSurface }]}>
              {editingExpense ? 'Editar gasto' : 'Nuevo gasto'}
            </Text>
            {formError ? (
              <View style={[s.errorBanner, { backgroundColor: colors.errorContainer, borderRadius: shape.small, marginBottom: 2 }]}>
                <Ionicons name="alert-circle-outline" size={14} color={colors.onErrorContainer} />
                <Text style={[typography.bodySmall, { color: colors.onErrorContainer, flex: 1 }]}>{formError}</Text>
              </View>
            ) : null}
            <TextField label="Descripción" value={descripcion} onChangeText={setDescripcion} />
            <TextField label="Monto" value={monto} onChangeText={setMonto} keyboardType="decimal-pad" />
            
            {/* Fecha con formato DD/MM/YYYY */}
            <TextField
              label="Fecha (DD/MM/YYYY)"
              value={fecha ? formatDateDisplay(fecha) : ''}
              onChangeText={(value) => {
                const isoDate = parseDateFromDisplay(value);
                if (isoDate) setFecha(isoDate);
              }}
              placeholder={new Date().toLocaleDateString('es-ES')}
            />
            
            <View style={s.modalActions}>
              <Button
                label="Cancelar"
                variant="text"
                onPress={() => {
                  if (saving) return;
                  setFormVisible(false);
                  setEditingExpense(null);
                }}
                style={{ flex: 1 }}
              />
              <Button
                label={saving ? 'Guardando...' : 'Guardar'}
                variant="filled"
                onPress={saveExpense}
                disabled={saving}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Confirmar eliminación */}
      <Modal visible={deleteVisible} transparent animationType="fade">
        <View style={s.centeredOverlay}>
          <View style={[s.modalCard, { backgroundColor: colors.surfaceContainerHigh, borderRadius: shape.large }]}>
            <Text style={[typography.titleMedium, { color: colors.onSurface }]}>Eliminar gasto</Text>
            <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>
              Esta acción eliminará el gasto seleccionado y no se puede deshacer.
            </Text>
            <View style={s.modalActions}>
              <Button
                label="Volver"
                variant="text"
                onPress={() => {
                  if (saving) return;
                  setDeleteVisible(false);
                  setDeletingExpense(null);
                }}
                style={{ flex: 1 }}
              />
              <Button
                label={saving ? 'Eliminando...' : 'Eliminar'}
                variant="filled"
                onPress={confirmDelete}
                disabled={saving}
                style={{ flex: 1 }}
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
    scroll: { padding: 16, paddingBottom: 40, gap: 12 },
    newExpenseButton: { paddingVertical: 6 },
    chipsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    filterCard: { padding: 14, gap: 12, borderWidth: 1, borderColor: colors.outline },
    summaryCard: { padding: 14 },
    loadingBox: { paddingVertical: 32 },
    emptyCard: { padding: 16 },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      padding: 10,
      marginBottom: 12,
    },
    expenseCard: { padding: 14, gap: 12, marginBottom: 8 },
    expenseHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    expenseInfo: { flex: 1, gap: 2 },
    expenseActions: { flexDirection: 'row', gap: 8 },
    centeredOverlay: {
      flex: 1,
      backgroundColor: '#00000055',
      justifyContent: 'center',
      padding: 24,
    },
    modalCard: { padding: 16, gap: 10 },
    modalActions: { flexDirection: 'row', gap: 8, marginTop: 2 },
  });
