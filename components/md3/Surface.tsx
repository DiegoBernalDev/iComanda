import { View, ViewStyle, StyleSheet } from 'react-native';
import { useMD3Theme } from '@/hooks/use-md3-theme';
import { MD3Elevation } from '@/constants/md3';

type ElevationLevel = keyof typeof MD3Elevation;

interface SurfaceProps {
  children: React.ReactNode;
  elevation?: ElevationLevel;
  style?: ViewStyle | ViewStyle[];
}

// Convierte hex a rgb para la mezcla de surface tint
function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function blendColor(surface: string, tint: string, alpha: number): string {
  const s = hexToRgb(surface);
  const t = hexToRgb(tint);
  const r = Math.round(s.r + (t.r - s.r) * alpha);
  const g = Math.round(s.g + (t.g - s.g) * alpha);
  const b = Math.round(s.b + (t.b - s.b) * alpha);
  return `rgb(${r},${g},${b})`;
}

export function Surface({ children, elevation = 'level0', style }: SurfaceProps) {
  const { colors, elevation: elev } = useMD3Theme();
  const alpha = elev[elevation];
  const backgroundColor = alpha > 0
    ? blendColor(colors.surface, colors.surfaceTint, alpha)
    : colors.surface;

  return (
    <View style={[{ backgroundColor }, style]}>
      {children}
    </View>
  );
}
