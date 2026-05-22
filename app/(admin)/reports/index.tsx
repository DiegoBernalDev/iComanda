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

type FinancialReport = {
  date_from: string;
  date_to: string;
  gross_income: number;
  total_expenses: number;
  net_income: number;
};

type WaiterSalesRow = {
  mesero_id: string;
  waiter_name: string;
  orders_count: number;
  total_sales: number;
};

const formatMoney = (value: number) => `Bs ${value.toFixed(2)}`;

export default function AdminReportsScreen() {
  const { colors, typography, shape } = useMD3Theme();
  const s = useMemo(() => makeStyles(colors, shape), [colors, shape]);
  const [preset, setPreset] = useState<ReportPreset>('today');
  const [fromDate, setFromDate] = useState(getRangeForPreset('today').from);
  const [toDate, setToDate] = useState(getRangeForPreset('today').to);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [waiterSales, setWaiterSales] = useState<WaiterSalesRow[]>([]);

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

    const [{ data: reportData, error: reportError }, { data: waiterData, error: waiterError }] = await Promise.all([
      supabase.rpc('get_report', { date_from: fromDate, date_to: toDate }),
      supabase.rpc('get_waiter_sales', { date_from: fromDate, date_to: toDate }),
    ]);

    if (reportError || waiterError) {
      setError(reportError?.message ?? waiterError?.message ?? 'No se pudieron cargar los reportes.');
      setLoading(false);
      return;
    }

    setReport((reportData ?? {
      date_from: fromDate,
      date_to: toDate,
      gross_income: 0,
      total_expenses: 0,
      net_income: 0,
    }) as FinancialReport);
    setWaiterSales((waiterData ?? []) as WaiterSalesRow[]);
    setLoading(false);
  }, [fromDate, toDate]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <TopAppBar title="Reportes" onBack={() => router.back()} />

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

        {loading || !report ? (
          <View style={s.loadingBox}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <>
            <Enter delay={80}>
              <View style={s.metricsGrid}>
                {[
                  { label: 'Ingreso bruto', value: formatMoney(report.gross_income), icon: 'cash-outline', tone: colors.primaryContainer, on: colors.onPrimaryContainer },
                  { label: 'Egresos', value: formatMoney(report.total_expenses), icon: 'receipt-outline', tone: colors.secondaryContainer, on: colors.onSecondaryContainer },
                  { label: 'Neto', value: formatMoney(report.net_income), icon: 'trending-up-outline', tone: colors.tertiaryContainer, on: colors.onTertiaryContainer },
                ].map((item) => (
                  <Card key={item.label} variant="outlined" style={[s.metricCard, { backgroundColor: item.tone, borderRadius: shape.large }]}> 
                    <Ionicons name={item.icon as any} size={18} color={item.on} />
                    <Text style={[typography.labelMedium, { color: item.on + 'CC' }]}>{item.label}</Text>
                    <Text style={[typography.titleLarge, { color: item.on }]}>{item.value}</Text>
                  </Card>
                ))}
              </View>
            </Enter>

            <Enter delay={120}>
              <View style={s.sectionHeader}>
                <Text style={[typography.titleMedium, { color: colors.onSurface }]}>Ventas por mesero</Text>
                <Button label="Top platos" variant="tonal" icon="bar-chart-outline" onPress={() => router.push('/(admin)/reports/top-items' as any)} />
              </View>
            </Enter>

            {waiterSales.length === 0 ? (
              <Card variant="outlined" style={s.emptyCard}>
                <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}>No hay ventas pagadas en el periodo seleccionado.</Text>
              </Card>
            ) : (
              waiterSales.map((row, index) => (
                <Enter key={row.mesero_id} delay={150 + index * 30}>
                  <Card variant="outlined" style={s.waiterCard}>
                    <View style={s.waiterRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[typography.titleSmall, { color: colors.onSurface }]}>{row.waiter_name}</Text>
                        <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>{row.orders_count} pedido(s) pagados</Text>
                      </View>
                      <Text style={[typography.titleMedium, { color: colors.primary }]}>{formatMoney(row.total_sales)}</Text>
                    </View>
                  </Card>
                </Enter>
              ))
            )}
          </>
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
  metricsGrid: { gap: 8 },
  metricCard: { padding: 16, gap: 8, borderWidth: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 6 },
  emptyCard: { padding: 16, marginTop: 6 },
  waiterCard: { padding: 14, marginTop: 8 },
  waiterRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
