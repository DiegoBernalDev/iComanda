import { Pressable, View, ViewStyle, Platform, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useMD3Theme } from '@/hooks/use-md3-theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type CardVariant = 'elevated' | 'filled' | 'outlined';

interface CardProps {
  children:   React.ReactNode;
  variant?:   CardVariant;
  onPress?:   () => void;
  style?:     ViewStyle | ViewStyle[];
}

export function Card({ children, variant = 'elevated', onPress, style }: CardProps) {
  const { colors, shape } = useMD3Theme();
  const pressed = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(onPress ? 1 - pressed.value * 0.01 : 1, { duration: 100 }) }],
  }));

  const backgroundColor = {
    elevated: colors.surfaceContainerLow,
    filled:   colors.surfaceContainerHighest,
    outlined: colors.surface,
  }[variant];

  const borderStyle = variant === 'outlined'
    ? { borderWidth: 1, borderColor: colors.outlineVariant }
    : {};

  const shadow = variant === 'elevated'
    ? Platform.select({
        ios:     { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 3 },
        android: { elevation: 2 },
      })
    : {};

  const content = (
    <View style={[styles.card, { backgroundColor, borderRadius: shape.medium }, borderStyle, shadow as ViewStyle, style]}>
      {children}
    </View>
  );

  if (!onPress) return content;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => { pressed.value = 1; }}
      onPressOut={() => { pressed.value = 0; }}
      android_ripple={{ color: colors.onSurface + '1F' }}
      style={[animStyle, { borderRadius: shape.medium }]}
    >
      {content}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden' },
});
