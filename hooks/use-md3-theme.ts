import { useColorScheme } from '@/hooks/use-color-scheme';
import { MD3Colors, MD3Typography, MD3Shape, MD3Elevation, MD3State, MD3ColorScheme } from '@/constants/md3';

export interface MD3Theme {
  colors:    MD3ColorScheme;
  typography: typeof MD3Typography;
  shape:     typeof MD3Shape;
  elevation: typeof MD3Elevation;
  state:     typeof MD3State;
  isDark:    boolean;
}

export function useMD3Theme(): MD3Theme {
  const scheme = useColorScheme() ?? 'light';
  return {
    colors:    MD3Colors[scheme],
    typography: MD3Typography,
    shape:     MD3Shape,
    elevation: MD3Elevation,
    state:     MD3State,
    isDark:    scheme === 'dark',
  };
}
