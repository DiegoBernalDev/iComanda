import { Pressable, Text, StyleSheet, ViewStyle, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useMD3Theme } from '@/hooks/use-md3-theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Variant = 'filled' | 'tonal' | 'outlined' | 'text' | 'elevated';

interface ButtonProps {
  label:     string;
  onPress:   () => void;
  variant?:  Variant;
  icon?:     keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  style?:    ViewStyle;
  loading?:  boolean;
}

export function Button({
  label, onPress, variant = 'filled', icon, disabled = false, style,
}: ButtonProps) {
  const { colors, shape, state } = useMD3Theme();
  const pressed = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    opacity: withTiming(disabled ? state.disabled : 1 - pressed.value * 0.08, { duration: 100 }),
    transform: [{ scale: withTiming(1 - pressed.value * 0.02, { duration: 100 }) }],
  }));

  const containerColor = {
    filled:   disabled ? colors.onSurface + '1F' : colors.primary,
    tonal:    disabled ? colors.onSurface + '1F' : colors.secondaryContainer,
    outlined: 'transparent',
    text:     'transparent',
    elevated: disabled ? colors.onSurface + '1F' : colors.surfaceContainerLow,
  }[variant];

  const labelColor = {
    filled:   disabled ? colors.onSurface + '61' : colors.onPrimary,
    tonal:    disabled ? colors.onSurface + '61' : colors.onSecondaryContainer,
    outlined: disabled ? colors.onSurface + '61' : colors.primary,
    text:     disabled ? colors.onSurface + '61' : colors.primary,
    elevated: disabled ? colors.onSurface + '61' : colors.primary,
  }[variant];

  const borderStyle = variant === 'outlined'
    ? { borderWidth: 1, borderColor: disabled ? colors.onSurface + '1F' : colors.outline }
    : {};

  const shadow = (variant === 'elevated' || variant === 'filled') && !disabled
    ? Platform.select({
        ios:     { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 2 },
        android: { elevation: variant === 'elevated' ? 2 : 0 },
      })
    : {};

  return (
    <AnimatedPressable
      onPress={disabled ? undefined : onPress}
      onPressIn={() => { pressed.value = 1; }}
      onPressOut={() => { pressed.value = 0; }}
      style={[
        styles.base,
        { backgroundColor: containerColor, borderRadius: shape.full },
        borderStyle,
        shadow,
        style,
        animStyle,
      ]}
      android_ripple={{ color: labelColor + '30', borderless: false }}
    >
      {icon && <Ionicons name={icon} size={18} color={labelColor} />}
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 10, minHeight: 40 },
  label: { fontSize: 14, fontWeight: '500', letterSpacing: 0.1 },
});
