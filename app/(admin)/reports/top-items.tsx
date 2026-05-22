import { Button, Card, Chip, Enter, TopAppBar } from '@/components/md3';
import { DatePickerField } from '@/components/md3/date-picker-field';
import { useMD3Theme } from '@/hooks/use-md3-theme';
import { ReportPreset, getRangeForPreset } from '@/lib/report-periods';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type TopItemRow = {
  menu_item_id: string | null;
  name: string;
  total_qty: number;
  total_revenue: number;
};

const formatMoney = (value: number) => `Bs ${value.toFixed(2)}`;

export default function AdminTopItemsScreen() {
  const { colors, typography, shape } = useMD3Theme();
  const s = useMemo(() => makeStyles(colors, shape), [colors, shape]);
  const [preset, setPreset] = useState<ReportPreset>('today');
  const [fromDate, setFromDate] = useState(getRangeForPreset('today').from);
  const [toDate, setToDate] = useState(getRangeForPreset('today').to);
  const [items, setItems] = useState<TopItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const applyPreset = (nextPreset: ReportPreset) => {
    setPreset(nextPreset);
    const range = getRangeForPreset(nextPreset);
    setFromDate(range.from);
    setToDate(range.to);
  };

  const load = useCallback(async () => {
    if (!fromDate || !toDate) return;
    setLoading(true);
    setError('');

    const { data, error: fetchError } = await supabase.rpc('get_top_items', {
      date_from: fromDate,
      date_to: toDate,
      item_limit: 10,
    });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setItems((data ?? []) as TopItemRow[]);
    setLoading(false);
  }, [fromDate, toDate]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <TopAppBar title="Top platos" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {error ? (
          <View style={[s.errorBanner, { backgroundColor: colors.errorContainer, borderRadius: shape.small }]}> 
            <Ionicons name="alert-circle-outline" size={14} color={colors.onErrorContainer} />
            <Text style={[typography.bodySmall, { color: colors.onErrorContainer, flex: 1 }]}>{error}</Text>
          </View>
        ) : null}

        <Enter delay={0}>
          <View style={s.chipsRow}>
            <Chip label="Hoy" variant="filter" selected={preset === 'today'} onPress={() => applyPreset('today')} />
            <Chip label="Semana" variant="filter" selected={preset === 'week'} onPress={() => applyPreset('week')} />
            <Chip label="Mes" variant="filter" selected={preset === 'month'} onPress={() => applyPreset('month')} />
            <Chip label="Personalizado" variant="filter" selected={preset === 'custom'} onPress={() => applyPreset('custom')} />
          </View>
        </Enter>

        {preset === 'custom' ? (
          <Enter delay={40}>
            <Card variant="outlined" style={s.filterCard}>
              <DatePickerField label="Desde" value={fromDate} onDateChange={setFromDate} color={colors.onSurface} />
              <DatePickerField label="Hasta" value={toDate} onDateChange={setToDate} color={colors.onSurface} />
              <Button label="Aplicar rango" variant="filled" icon="calendar-outline" onPress={load} disabled={!fromDate || !toDate || loading} />
            </Card>
          </Enter>
        ) : null}

        {loading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : items.length === 0 ? (
          <Card variant="outlined" style={s.emptyCard}>
            <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}>No hay platos vendidos en el periodo seleccionado.</Text>
          </Card>
        ) : (
          items.map((item, index) => (
            <Enter key={`${item.menu_item_id ?? item.name}-${index}`} delay={80 + index * 24}>
              <Card variant="outlined" style={s.itemCard}>
                <View style={s.itemRow}>
                  <View style={s.rankBadge}>
                    <Text style={[typography.labelLarge, { color: colors.primary }]}>#{index + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.titleSmall, { color: colors.onSurface }]}>{item.name}</Text>
                    <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>{item.total_qty} unidad(es)</Text>
                  </View>
                  <Text style={[typography.titleMedium, { color: colors.primary }]}>{formatMoney(item.total_revenue)}</Text>
                </View>
              </Card>
            </Enter>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any, shape: any) => StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40, gap: 10 },
  chipsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 8 },
  filterCard: { padding: 14 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, marginBottom: 12 },
  loadingBox: { paddingVertical: 32 },
  emptyCard: { padding: 16 },
  itemCard: { padding: 14, marginTop: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rankBadge: { width: 42, alignItems: 'center', justifyContent: 'center' },
});
