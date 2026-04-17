import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMD3Theme } from '@/hooks/use-md3-theme';

type ChipVariant = 'assist' | 'filter' | 'input';

interface ChipProps {
  label:     string;
  selected?: boolean;
  onPress?:  () => void;
  icon?:     keyof typeof Ionicons.glyphMap;
  variant?:  ChipVariant;
}

export function Chip({ label, selected = false, onPress, icon, variant = 'assist' }: ChipProps) {
  const { colors, shape } = useMD3Theme();

  const backgroundColor = selected ? colors.secondaryContainer : colors.surface;
  const borderColor     = selected ? 'transparent'             : colors.outline;
  const textColor       = selected ? colors.onSecondaryContainer : colors.onSurfaceVariant;
  const iconColor       = selected ? colors.onSecondaryContainer : colors.primary;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor, borderRadius: shape.small, borderColor, borderWidth: selected ? 0 : 1 },
      ]}
      android_ripple={{ color: colors.onSurface + '1F' }}
    >
      {selected && variant === 'filter' && (
        <Ionicons name="checkmark" size={18} color={iconColor} />
      )}
      {icon && !selected && (
        <Ionicons name={icon} size={18} color={iconColor} />
      )}
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 6, height: 32 },
  label: { fontSize: 14, fontWeight: '500', letterSpacing: 0.1 },
});
