import { Card, Counter, Enter, FAB, PressScale } from '@/components/md3';
import { TableCard } from '@/components/tables/TableCard';
import { useAuth } from '@/context/auth';
import { useMD3Theme } from '@/hooks/use-md3-theme';
import { useTables } from '@/lib/hooks/useTables';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MeseroHome() {
  const { colors, typography, shape } = useMD3Theme();
  const s = useMemo(() => makeStyles(colors, shape), [colors, shape]);
  const { profile, signOut } = useAuth();
  const { restaurant, tables, loading, error, connectionStatus, stats, markCallAttended, clearTable } = useTables();

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <View style={[s.appBar, { backgroundColor: colors.surface, borderBottomColor: colors.outlineVariant }]}>
        <View style={s.appBarLeft}>
          {restaurant?.logo_url ? (
            <Image source={{ uri: restaurant.logo_url }} style={[s.headerLogo, { borderRadius: shape.full }]} contentFit="cover" />
          ) : (
            <View style={[s.headerLogo, s.headerLogoFallback, { borderRadius: shape.full, backgroundColor: colors.primaryContainer }]}>
              <Ionicons name="restaurant-outline" size={20} color={colors.onPrimaryContainer} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={[typography.titleLarge, { color: colors.onSurface }]} numberOfLines={1}>
              Hola, {profile?.nombre?.split(' ')[0] ?? 'Mesero'}
            </Text>
            <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
              {restaurant?.nombre || 'Sin restaurante'}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={signOut}
          style={[s.iconBtn, { borderRadius: shape.full }]}
          android_ripple={{ color: colors.onSurface + '1F', borderless: true, radius: 24 }}
        >
          <Ionicons name="log-out-outline" size={24} color={colors.onSurfaceVariant} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Enter delay={0}>
          <View style={s.statsRow}>
            <StatCard
              colors={colors}
              typography={typography}
              shape={shape}
              icon="grid-outline"
              value={stats.totalMesas}
              label="Mesas"
              color={colors.primary}
            />
            <StatCard
              colors={colors}
              typography={typography}
              shape={shape}
              icon="checkmark-circle-outline"
              value={stats.libres}
              label="Libres"
              color={colors.tertiary}
            />
            <StatCard
              colors={colors}
              typography={typography}
              shape={shape}
              icon="receipt-outline"
              value={stats.pendientes}
              label="Pendientes"
              color={colors.secondary}
            />
          </View>
        </Enter>

        <Enter delay={80}>
          <Text style={[typography.titleMedium, s.sectionLabel, { color: colors.onSurface }]}>Acciones</Text>
        </Enter>
        <View style={s.actionsGrid}>
          {[
            { icon: 'add-circle-outline' as const, label: 'Nuevo pedido', color: colors.primaryContainer, on: colors.onPrimaryContainer, route: '/(mesero)/pedido-nuevo' },
            { icon: 'list-outline' as const, label: 'Mis pedidos', color: colors.secondaryContainer, on: colors.onSecondaryContainer, route: '/(mesero)/pedidos' },
            { icon: 'restaurant-outline' as const, label: 'Ver menú', color: colors.tertiaryContainer, on: colors.onTertiaryContainer, route: '/(mesero)/menu' },
          ].map((action, i) => (
            <Enter key={action.label} delay={120 + i * 50} style={s.actionCardWrap}>
              <PressScale
                onPress={() => router.push(action.route as any)}
                style={[s.actionCard, { backgroundColor: action.color, borderRadius: shape.large }]}
                android_ripple={{ color: action.on + '30' }}
              >
                <Ionicons name={action.icon} size={28} color={action.on} />
                <Text style={[typography.labelLarge, { color: action.on, marginTop: 8 }]}>{action.label}</Text>
              </PressScale>
            </Enter>
          ))}
        </View>

        <Enter delay={220}>
          <View style={s.sectionHeader}>
            <Text style={[typography.titleMedium, { color: colors.onSurface }]}>Estado de mesas</Text>
            <View style={[s.connectionPill, { borderRadius: shape.full, backgroundColor: colors.surfaceVariant }]}>
              <Ionicons
                name={connectionStatus === 'connected' ? 'wifi-outline' : 'cloud-offline-outline'}
                size={14}
                color={colors.onSurfaceVariant}
              />
              <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>
                {connectionStatus === 'connected' ? 'En línea' : connectionStatus === 'reconnecting' ? 'Reconectando' : 'Desconectado'}
              </Text>
            </View>
          </View>
        </Enter>

        {error ? (
          <View style={[s.errorBanner, { backgroundColor: colors.errorContainer, borderRadius: shape.medium }]}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.onErrorContainer} />
            <Text style={[typography.bodySmall, { color: colors.onErrorContainer, flex: 1 }]}>{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <View style={s.grid}>
            {tables.map((table) => (
              <TableCard
                key={table.id}
                item={table}
                colors={colors}
                typography={typography}
                shape={shape}
                onPress={() => {
                  if (table.activeOrderId) {
                    router.push({ pathname: '/(mesero)/pedido/[id]', params: { id: table.activeOrderId } } as any);
                    return;
                  }
                  router.push({ pathname: '/(mesero)/pedido-nuevo', params: { tableId: table.id } } as any);
                }}
                onMarkAttended={markCallAttended}
                onClearTable={clearTable}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <FAB icon="add" onPress={() => router.push('/(mesero)/pedido-nuevo' as any)} style={s.fab} />
    </SafeAreaView>
  );
}

function StatCard({ colors, typography, shape, icon, value, label, color }: any) {
  return (
    <Card
      variant="elevated"
      style={{ flex: 1, backgroundColor: colors.surfaceContainerHigh, borderRadius: shape.medium, padding: 12, alignItems: 'center', gap: 4 }}
    >
      <Ionicons name={icon} size={20} color={color} />
      <Counter value={value} style={[typography.headlineSmall, { color: colors.onSurface }]} />
      <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant }]}>{label}</Text>
    </Card>
  );
}

const makeStyles = (colors: any, shape: any) => StyleSheet.create({
  safe: { flex: 1 },
  appBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 8 },
  appBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  headerLogo: { width: 44, height: 44 },
  headerLogoFallback: { alignItems: 'center', justifyContent: 'center' },
  iconBtn: { padding: 12 },
  scroll: { padding: 16, paddingBottom: 96 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  sectionLabel: { marginBottom: 12 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  actionCardWrap: { width: '48%' },
  actionCard: { padding: 18, alignItems: 'flex-start' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  connectionPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, marginBottom: 12 },
  loadingBox: { paddingVertical: 32 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fab: { position: 'absolute', right: 16, bottom: 24 },
});

