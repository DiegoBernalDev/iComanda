import { ReactNode, useEffect, useRef, useState } from 'react';
import { Pressable, PressableProps, Text, TextStyle, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const EMPHASIZED = Easing.bezier(0.2, 0.0, 0, 1.0);
const STANDARD   = Easing.bezier(0.4, 0.0, 0.2, 1.0);

interface EnterProps {
  children: ReactNode;
  delay?:    number;
  distance?: number;
  duration?: number;
  style?:    ViewStyle | ViewStyle[];
}

export function Enter({ children, delay = 0, distance = 12, duration = 320, style }: EnterProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(delay, withTiming(1, { duration, easing: EMPHASIZED }));
  }, [delay, duration, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: interpolate(progress.value, [0, 1], [distance, 0]) }],
  }));

  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
}

interface CounterProps {
  value:    number;
  duration?: number;
  style?:   TextStyle | TextStyle[];
}

export function Counter({ value, duration = 600, style }: CounterProps) {
  const [display, setDisplay] = useState(0);
  const displayRef = useRef(0);

  useEffect(() => {
    const start = displayRef.current;
    const target = value;

    const startTime = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(start + (target - start) * eased);
      displayRef.current = next;
      setDisplay(next);
      if (t >= 1) clearInterval(id);
    }, 16);

    return () => clearInterval(id);
  }, [value, duration]);

  return <Text style={style}>{display}</Text>;
}

interface PressScaleProps extends Omit<PressableProps, 'style'> {
  children: ReactNode;
  scale?:   number;
  style?:   ViewStyle | ViewStyle[];
}

export function PressScale({ children, scale = 0.97, style, onPressIn, onPressOut, ...rest }: PressScaleProps) {
  const value = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: value.value }] }));

  return (
    <AnimatedPressable
      onPressIn={(e) => { value.value = withSpring(scale, { damping: 18, stiffness: 320 }); onPressIn?.(e); }}
      onPressOut={(e) => { value.value = withSpring(1, { damping: 14, stiffness: 260 }); onPressOut?.(e); }}
      style={[animStyle, style]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}

interface ShakeProps {
  children: ReactNode;
  trigger:  unknown;
  style?:   ViewStyle | ViewStyle[];
}

export function Shake({ children, trigger, style }: ShakeProps) {
  const x = useSharedValue(0);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (!trigger) return;
    x.value = withSequence(
      withTiming(-6, { duration: 50 }),
      withTiming(6,  { duration: 50 }),
      withTiming(-4, { duration: 50 }),
      withTiming(4,  { duration: 50 }),
      withTiming(0,  { duration: 50 }),
    );
  }, [trigger, x]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return <Animated.View style={[animStyle, style]}>{children}</Animated.View>;
}

interface PopProps {
  children: ReactNode;
  style?:   ViewStyle | ViewStyle[];
}

export function Pop({ children, style }: PopProps) {
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 220 });
    opacity.value = withTiming(1, { duration: 220 });
  }, [scale, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  return <Animated.View style={[animStyle, style]}>{children}</Animated.View>;
}

interface SpinTogglerProps {
  active:  boolean;
  children: ReactNode;
  style?:   ViewStyle | ViewStyle[];
}

export function SpinToggler({ active, children, style }: SpinTogglerProps) {
  const rotation = useSharedValue(active ? 0 : 180);
  useEffect(() => {
    rotation.value = withSpring(active ? 0 : 180, { damping: 14, stiffness: 200 });
  }, [active, rotation]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));
  return <Animated.View style={[animStyle, style]}>{children}</Animated.View>;
}

interface SoftToggleProps {
  active: boolean;
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
}

export function SoftToggle({ active, children, style }: SoftToggleProps) {
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(active ? 1 : 0, { damping: 16, stiffness: 220 });
  }, [active, progress]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.78, 1]),
    transform: [
      { scale: interpolate(progress.value, [0, 1], [0.92, 1]) },
      { translateY: interpolate(progress.value, [0, 1], [1, 0]) },
    ],
  }));

  return <Animated.View style={[animStyle, style]}>{children}</Animated.View>;
}

interface PulseProps {
  children: ReactNode;
  style?:   ViewStyle | ViewStyle[];
}

export function Pulse({ children, style }: PulseProps) {
  const scale = useSharedValue(0);
  useEffect(() => {
    scale.value = withSequence(
      withSpring(1.08, { damping: 8, stiffness: 180 }),
      withSpring(1,    { damping: 12, stiffness: 200 }),
    );
  }, [scale]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <Animated.View style={[animStyle, style]}>{children}</Animated.View>;
}

export { STANDARD, EMPHASIZED };
