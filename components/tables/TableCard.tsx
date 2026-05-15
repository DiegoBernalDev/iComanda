import { Card, PressScale } from '@/components/md3';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

type TableStatus = 'libre' | 'pendiente' | 'listo' | 'entregado' | 'cliente-llama';

export type TableCardModel = {
  id: string;
  numero: number;
  capacidad: number;
  status: TableStatus;
  activeOrderId: string | null;
  activeCallId: string | null;
};

type Props = {
  item: TableCardModel;
  onPress: () => void;
  onMarkAttended: (callId: string) => void;
  onClearTable: (tableId: string) => void;
  colors: any;
  typography: any;
  shape: any;
};

const STATUS_META: Record<TableStatus, { label: string; icon: keyof typeof Ionicons.glyphMap; tone: string }> = {
  libre: { label: 'Libre', icon: 'checkmark-circle-outline', tone: 'ok' },
  pendiente: { label: 'Pendiente', icon: 'time-outline', tone: 'pending' },
  listo: { label: 'Listo para entregar', icon: 'restaurant-outline', tone: 'ready' },
  entregado: { label: 'Entregado', icon: 'bag-check-outline', tone: 'done' },
  'cliente-llama': { label: 'Cliente llama', icon: 'notifications-outline', tone: 'call' },
};

export function TableCard({ item, onPress, onMarkAttended, onClearTable, colors, typography, shape }: Props) {
  const meta = STATUS_META[item.status];
  const canMarkAttended = item.status === 'cliente-llama' && !!item.activeCallId;
  const canClearTable = item.status === 'entregado';
  const statusColors = {
    ok: { bg: colors.tertiaryContainer, fg: colors.onTertiaryContainer },
    pending: { bg: colors.secondaryContainer, fg: colors.onSecondaryContainer },
    ready: { bg: colors.primaryContainer, fg: colors.onPrimaryContainer },
    done: { bg: colors.surfaceVariant, fg: colors.onSurfaceVariant },
    call: { bg: colors.errorContainer, fg: colors.onErrorContainer },
  } as const;
  const tone = statusColors[meta.tone as keyof typeof statusColors];

  return (
    <PressScale
      onPress={onPress}
      android_ripple={{ color: colors.onSurface + '1F' }}
      style={{ width: '48%' }}
    >
      <Card variant="outlined" style={[s.card, { borderRadius: shape.large, borderColor: colors.outlineVariant }]}>
        <View style={s.row}>
          <View
            style={[
              s.badge,
              { borderRadius: shape.full, backgroundColor: tone.bg },
            ]}
          >
            <Ionicons name={meta.icon} size={12} color={tone.fg} />
            <Text style={[typography.labelSmall, { color: tone.fg }]} numberOfLines={1}>
              {meta.label}
            </Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={16} color={colors.onSurfaceVariant} />
        </View>

        <Text style={[typography.titleMedium, { color: colors.onSurface }]}>Mesa {item.numero}</Text>
        <View style={s.infoRow}>
          <Ionicons name="people-outline" size={14} color={colors.onSurfaceVariant} />
          <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>
            {item.capacidad} personas
          </Text>
        </View>

        <View style={s.actionSlot}>
          {canMarkAttended ? (
            <PressScale
              onPress={(e) => {
                e.stopPropagation();
                onMarkAttended(item.activeCallId!);
              }}
              style={[
                s.callButton,
                { borderRadius: shape.medium, backgroundColor: colors.errorContainer },
              ]}
              android_ripple={{ color: colors.onErrorContainer + '20' }}
            >
              <Text style={[typography.labelLarge, { color: colors.onErrorContainer }]}>
                Marcar atendida
              </Text>
            </PressScale>
          ) : null}

          {canClearTable ? (
            <PressScale
              onPress={(e) => {
                e.stopPropagation();
                onClearTable(item.id);
              }}
              style={[
                s.callButton,
                { borderRadius: shape.medium, backgroundColor: colors.tertiaryContainer },
              ]}
              android_ripple={{ color: colors.onTertiaryContainer + '20' }}
            >
              <Text style={[typography.labelLarge, { color: colors.onTertiaryContainer }]}>
                Limpiar mesa
              </Text>
            </PressScale>
          ) : null}
        </View>
      </Card>
    </PressScale>
  );
}

const s = StyleSheet.create({
  card: { padding: 12, minHeight: 144, gap: 8, borderWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, flex: 1 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionSlot: { minHeight: 40, justifyContent: 'flex-end' },
  callButton: { paddingHorizontal: 10, paddingVertical: 8, alignItems: 'center' },
});

