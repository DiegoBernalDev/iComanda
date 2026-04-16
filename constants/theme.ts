import { Platform } from 'react-native';

// Colores de marca
export const Brand = {
  primary:       '#E85D04',
  primaryLight:  '#FB923C',
  primaryDark:   '#C2410C',
  primaryFade:   '#E85D0415',
  primaryBorder: '#E85D0444',

  success:       '#10B981',
  successFade:   '#10B98115',
  successBorder: '#10B98144',

  danger:        '#EF4444',
  dangerFade:    '#EF444415',
  dangerBorder:  '#EF444444',

  warning:       '#F59E0B',
  warningFade:   '#F59E0B15',

  indigo:        '#6366F1',
  indigoFade:    '#6366F115',
  indigoBorder:  '#6366F144',
};

// Paleta completa por tema
export const Colors = {
  light: {
    // Fondos
    background:   '#F4F5F7',
    surface:      '#FFFFFF',
    surfaceAlt:   '#F0F1F3',
    surfaceInput: '#F9FAFB',

    // Bordes
    border:       '#E5E7EB',
    borderStrong: '#D1D5DB',

    // Textos
    text:          '#111827',
    textSecondary: '#374151',
    textTertiary:  '#6B7280',
    textMuted:     '#9CA3AF',

    // Tab / nav
    tint:            Brand.primary,
    tabIconDefault:  '#9CA3AF',
    tabIconSelected: Brand.primary,

    // UI genérica
    icon: '#6B7280',
  },
  dark: {
    // Fondos
    background:   '#0F0F0F',
    surface:      '#1A1A1A',
    surfaceAlt:   '#262626',
    surfaceInput: '#262626',

    // Bordes
    border:       '#2A2A2A',
    borderStrong: '#333333',

    // Textos
    text:          '#F3F4F6',
    textSecondary: '#E5E7EB',
    textTertiary:  '#9CA3AF',
    textMuted:     '#6B7280',

    // Tab / nav
    tint:            '#FFFFFF',
    tabIconDefault:  '#6B7280',
    tabIconSelected: '#FFFFFF',

    // UI genérica
    icon: '#9BA1A6',
  },
};

export type AppTheme = typeof Colors.light & {
  isDark: boolean;
  shadow: object;
};

export const Fonts = Platform.select({
  ios: {
    sans:    'system-ui',
    serif:   'ui-serif',
    rounded: 'ui-rounded',
    mono:    'ui-monospace',
  },
  default: {
    sans:    'normal',
    serif:   'serif',
    rounded: 'normal',
    mono:    'monospace',
  },
  web: {
    sans:    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    serif:   "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', sans-serif",
    mono:    "SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace",
  },
});
