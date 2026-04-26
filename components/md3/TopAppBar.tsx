import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMD3Theme } from '@/hooks/use-md3-theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TopAppBarProps {
  title:         string;
  onBack?:       () => void;
  trailing?:     React.ReactNode;
  variant?:      'small' | 'medium' | 'large';
  subtitle?:     string;
}

export function TopAppBar({ title, onBack, trailing, variant = 'small', subtitle }: TopAppBarProps) {
  const { colors, typography } = useMD3Theme();
  const insets = useSafeAreaInsets();

  const titleStyle = {
    small:  typography.titleLarge,
    medium: typography.headlineSmall,
    large:  typography.headlineMedium,
  }[variant];

  return (
    <View style={[
      styles.container,
      { backgroundColor: colors.surface, paddingTop: insets.top },
    ]}>
      <View style={[styles.row, variant !== 'small' && styles.rowTall]}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            style={styles.iconBtn}
            android_ripple={{ color: colors.onSurface + '1F', borderless: true, radius: 20 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
          </Pressable>
        ) : (
          <View style={styles.iconBtn} />
        )}

        <View style={styles.titleArea}>
          <Text style={[titleStyle, { color: colors.onSurface }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        <View style={styles.trailing}>
          {trailing}
        </View>
      </View>

      {/* MD3 divider sutil */}
      <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  row:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, minHeight: 64 },
  rowTall:   { minHeight: 112, alignItems: 'flex-end', paddingBottom: 16 },
  iconBtn:   { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24 },
  titleArea: { flex: 1, paddingHorizontal: 4 },
  subtitle:  { fontSize: 12, marginTop: 2 },
  trailing:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingRight: 4 },
  divider:   { height: StyleSheet.hairlineWidth },
});
