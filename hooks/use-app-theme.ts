import { Platform } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Brand, AppTheme } from '@/constants/theme';

export function useAppTheme(): AppTheme & { brand: typeof Brand } {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const palette = Colors[scheme];

  const shadow = isDark
    ? Platform.select({
        ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10 },
        android: { elevation: 6 },
        default: {},
      })
    : Platform.select({
        ios:     { shadowColor: '#00000030', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8 },
        android: { elevation: 3 },
        default: {},
      });

  return {
    ...palette,
    isDark,
    shadow: shadow ?? {},
    brand: Brand,
  };
}
