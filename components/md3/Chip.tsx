import { Pressable, Text, StyleSheet } from 'react-native';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { useMD3Theme } from '@/hooks/use-md3-theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const STANDARD = Easing.bezier(0.2, 0.0, 0, 1.0);

type ChipVariant = 'assist' | 'filter' | 'input';

interface ChipProps {
  label:     string;
  selected?: boolean;
  onPress?:  () => void;
  icon?:     keyof typeof Ionicons.glyphMap;
  variant?:  ChipVariant;
}

export function Chip({ label, selected = false, onPress, icon, variant = 'assist' }: ChipProps) {
  const { colors, shape, typography } = useMD3Theme();

  const progress = useSharedValue(selected ? 1 : 0);
  const press    = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(selected ? 1 : 0, { duration: 220, easing: STANDARD });
  }, [selected, progress]);

  const animContainer = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [colors.surface, colors.secondaryContainer]),
    borderColor:     interpolateColor(progress.value, [0, 1], [colors.outline, colors.secondaryContainer]),
    transform: [{ scale: press.value }],
  }));

  const animCheckmark = useAnimatedStyle(() => ({
    width:  interpolate(progress.value, [0, 1], [0, 18]),
    opacity: progress.value,
    marginRight: interpolate(progress.value, [0, 1], [0, 6]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.6, 1]) }],
  }));

  const animIcon = useAnimatedStyle(() => ({
    width:  interpolate(progress.value, [0, 1], [16, 0]),
    opacity: 1 - progress.value,
    marginRight: interpolate(progress.value, [0, 1], [6, 0]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, 0.6]) }],
  }));

  const textColor = selected ? colors.onSecondaryContainer : colors.onSurfaceVariant;
  const iconColor = selected ? colors.onSecondaryContainer : colors.primary;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => { press.value = withSpring(0.95, { damping: 18, stiffness: 320 }); }}
      onPressOut={() => { press.value = withSpring(1,   { damping: 14, stiffness: 240 }); }}
      style={[
        styles.chip,
        { borderRadius: shape.full, borderWidth: 1 },
        animContainer,
      ]}
      android_ripple={{ color: colors.onSurface + '1F' }}
    >
      {variant === 'filter' && (
        <Animated.View style={[styles.iconWrap, animCheckmark]}>
          <Ionicons name="checkmark" size={16} color={iconColor} />
        </Animated.View>
      )}
      {icon && (
        <Animated.View style={[styles.iconWrap, animIcon]}>
          <Ionicons name={icon} size={16} color={iconColor} />
        </Animated.View>
      )}
      <Text style={[typography.labelLarge, { color: textColor }]}>{label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  chip:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, height: 34 },
  iconWrap: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
