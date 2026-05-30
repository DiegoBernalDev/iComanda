import { Button, Card, Chip, Enter, TopAppBar } from '@/components/md3';
import { DatePickerField } from '@/components/md3/date-picker-field';
import { useAuth } from '@/context/auth';
import { useMD3Theme } from '@/hooks/use-md3-theme';
import { getAdminRestaurant } from '@/lib/admin';
import { exportReportAsPdfWeb, type PaymentMethodSalesRow } from '@/lib/report-export';
import { ReportPreset, getRangeForPreset } from '@/lib/report-periods';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
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

type MetodoPago = 'efectivo' | 'qr' | 'tarjeta';

const PAYMENT_META: Record<MetodoPago, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  efectivo: { label: 'Efectivo', icon: 'cash-outline' },
  qr: { label: 'QR', icon: 'qr-code-outline' },
  tarjeta: { label: 'Tarjeta', icon: 'card-outline' },
};

const formatMoney = (value: number) => `Bs ${value.toFixed(2)}`;

export default function AdminReportsScreen() {
  const { colors, typography, shape } = useMD3Theme();
  const s = useMemo(() => makeStyles(colors, shape), [colors, shape]);
  const { profile } = useAuth();
  const [preset, setPreset] = useState<ReportPreset>('today');
  const [fromDate, setFromDate] = useState(getRangeForPreset('today').from);
  const [toDate, setToDate] = useState(getRangeForPreset('today').to);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [waiterSales, setWaiterSales] = useState<WaiterSalesRow[]>([]);
  const [paymentMethodSales, setPaymentMethodSales] = useState<PaymentMethodSalesRow[]>([]);

  const applyPreset = (nextPreset: ReportPreset) => {
    setPreset(nextPreset);
    const range = getRangeForPreset(nextPreset);
    setFromDate(range.from);
    setToDate(range.to);
  };

  const load = useCallback(async () => {
    if (!fromDate || !toDate || !restaurantId) return;
    setLoading(true);
    setError('');

    const [{ data: orders, error: ordersError }, { data: expenses, error: expensesError }, { data: profiles, error: profilesError }] = await Promise.all([
      supabase
        .from('orders')
        .select('id, mesero_id, total, estado, metodo_pago, pago_confirmado, paid_at')
        .eq('restaurant_id', restaurantId)
        .eq('estado', 'entregada')
        .eq('pago_confirmado', true)
        .not('paid_at', 'is', null)
        .gte('paid_at', `${fromDate}T00:00:00`)
        .lte('paid_at', `${toDate}T23:59:59.999`),
      supabase
        .from('expenses')
        .select('id, monto, fecha')
        .eq('restaurant_id', restaurantId)
        .gte('fecha', fromDate)
        .lte('fecha', toDate),
      supabase.from('profiles').select('id, nombre'),
    ]);

    if (ordersError || expensesError || profilesError) {
      setError(ordersError?.message ?? expensesError?.message ?? profilesError?.message ?? 'No se pudieron cargar los reportes.');
      setLoading(false);
      return;
    }

    const grossIncome = (orders ?? []).reduce((sum, order) => sum + Number(order.total ?? 0), 0);
    const totalExpenses = (expenses ?? []).reduce((sum, expense) => sum + Number(expense.monto ?? 0), 0);
    const profileMap = new Map((profiles ?? []).map((item) => [item.id, item.nombre]));
    const waiterMap = new Map();
    const paymentMap = new Map<PaymentMethodSalesRow['method'], PaymentMethodSalesRow>();

    for (const method of Object.keys(PAYMENT_META) as MetodoPago[]) {
      paymentMap.set(method, {
        method,
        label: PAYMENT_META[method].label,
        orders_count: 0,
        total_sales: 0,
      });
    }

    for (const order of orders ?? []) {
      const current = waiterMap.get(order.mesero_id) ?? { mesero_id: order.mesero_id, waiter_name: profileMap.get(order.mesero_id) ?? 'Mesero', orders_count: 0, total_sales: 0 };
      current.orders_count += 1;
      current.total_sales += Number(order.total ?? 0);
      waiterMap.set(order.mesero_id, current);

      const method = (order.metodo_pago ?? 'sin_metodo') as PaymentMethodSalesRow['method'];
      const paymentCurrent = paymentMap.get(method) ?? {
        method,
        label: 'Sin método',
        orders_count: 0,
        total_sales: 0,
      };
      paymentCurrent.orders_count += 1;
      paymentCurrent.total_sales += Number(order.total ?? 0);
      paymentMap.set(method, paymentCurrent);
    }

    setReport({
      date_from: fromDate,
      date_to: toDate,
      gross_income: grossIncome,
      total_expenses: totalExpenses,
      net_income: grossIncome - totalExpenses,
    });
    setWaiterSales(
      [...waiterMap.values()].sort((a: WaiterSalesRow, b: WaiterSalesRow) => b.total_sales - a.total_sales),
    );
    setPaymentMethodSales([...paymentMap.values()].filter((row) => row.orders_count > 0 || row.method !== 'sin_metodo'));
    setLoading(false);
  }, [fromDate, toDate, restaurantId]);

  useEffect(() => {
    const loadRestaurant = async () => {
      const restaurant = await getAdminRestaurant(profile?.id ?? null);
      if (!restaurant?.id) {
        setError('No se encontró restaurante para cargar reportes.');
        setLoading(false);
        return;
      }

      setRestaurantId(restaurant.id);
    };

    loadRestaurant();
  }, [profile?.id]);

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
              <Text style={[typography.titleMedium, { color: colors.onSurface, marginTop: 4 }]}>Tipos de pago</Text>
            </Enter>

            <View style={s.paymentGrid}>
              {paymentMethodSales.map((row, index) => {
                const method = row.method === 'sin_metodo' ? null : row.method;
                const percentage = report.gross_income > 0 ? (row.total_sales / report.gross_income) * 100 : 0;
                return (
                  <Enter key={row.method} delay={135 + index * 25} style={s.paymentCardWrap}>
                    <Card variant="outlined" style={s.paymentCard}>
                      <View style={s.paymentIconRow}>
                        <Ionicons name={method ? PAYMENT_META[method].icon : 'help-circle-outline'} size={18} color={colors.primary} />
                        <Text style={[typography.titleSmall, { color: colors.onSurface }]}>{row.label}</Text>
                      </View>
                      <Text style={[typography.titleMedium, { color: colors.primary }]}>{formatMoney(row.total_sales)}</Text>
                      <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>{row.orders_count} pedido(s) · {percentage.toFixed(1)}%</Text>
                    </Card>
                  </Enter>
                );
              })}
            </View>

            <Enter delay={180}>
              <View style={s.sectionHeader}>
                <Text style={[typography.titleMedium, { color: colors.onSurface }]}>Ventas por mesero</Text>
                <View style={s.headerActions}>
                  <Button
                    label="PDF"
                    variant="outlined"
                    icon="print-outline"
                    onPress={() => {
                      try {
                        exportReportAsPdfWeb(report, waiterSales, paymentMethodSales);
                      } catch (nextError: any) {
                        setError(nextError?.message ?? 'No se pudo exportar el reporte.');
                      }
                    }}
                    disabled={Platform.OS !== 'web'}
                  />
                  <Button label="Top platos" variant="tonal" icon="bar-chart-outline" onPress={() => router.push('/(admin)/reports/top-items' as any)} />
                </View>
              </View>
              {Platform.OS !== 'web' ? (
                <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginTop: 6 }]}>La exportación PDF está disponible por ahora en web usando imprimir o guardar como PDF.</Text>
              ) : null}
            </Enter>

            {waiterSales.length === 0 ? (
              <Card variant="outlined" style={s.emptyCard}>
                <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}>No hay ventas pagadas en el periodo seleccionado.</Text>
              </Card>
            ) : (
              waiterSales.map((row, index) => (
                <Enter key={row.mesero_id} delay={220 + index * 30}>
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
  paymentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, marginBottom: 8 },
  paymentCardWrap: { width: '48%' },
  paymentCard: { padding: 14, gap: 6, minHeight: 116 },
  paymentIconRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 6 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  emptyCard: { padding: 16, marginTop: 6 },
  waiterCard: { padding: 14, marginTop: 8 },
  waiterRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
