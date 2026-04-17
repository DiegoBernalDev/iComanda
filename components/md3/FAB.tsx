import { Pressable, StyleSheet, ViewStyle, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useMD3Theme } from '@/hooks/use-md3-theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type FABSize = 'small' | 'medium' | 'large';
type FABVariant = 'primary' | 'secondary' | 'tertiary' | 'surface';

interface FABProps {
  icon:      keyof typeof Ionicons.glyphMap;
  onPress:   () => void;
  size?:     FABSize;
  variant?:  FABVariant;
  style?:    ViewStyle;
}

export function FAB({ icon, onPress, size = 'medium', variant = 'primary', style }: FABProps) {
  const { colors, shape } = useMD3Theme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const dims = { small: 40, medium: 56, large: 96 }[size];
  const iconSize = { small: 24, medium: 24, large: 36 }[size];
  const radius = { small: shape.medium, medium: shape.large, large: shape.extraLarge }[size];

  const containerColor = {
    primary:   colors.primaryContainer,
    secondary: colors.secondaryContainer,
    tertiary:  colors.tertiaryContainer,
    surface:   colors.surfaceContainerHigh,
  }[variant];

  const iconColor = {
    primary:   colors.onPrimaryContainer,
    secondary: colors.onSecondaryContainer,
    tertiary:  colors.onTertiaryContainer,
    surface:   colors.primary,
  }[variant];

  const shadow = Platform.select({
    ios:     { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6 },
    android: { elevation: 6 },
  });

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.95); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      style={[
        styles.fab,
        { width: dims, height: dims, borderRadius: radius, backgroundColor: containerColor },
        shadow,
        style,
        animStyle,
      ]}
      android_ripple={{ color: iconColor + '30', borderless: false }}
    >
      <Ionicons name={icon} size={iconSize} color={iconColor} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  fab: { alignItems: 'center', justifyContent: 'center' },
});
