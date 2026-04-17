// Material Design 3 — Design Tokens
// Seed color: #E85D04 (Orange)
// Generated following MD3 color system spec

// ── Paleta de colores ─────────────────────────────────────────

export const MD3Colors = {
  light: {
    // Primary
    primary:            '#9B4500',
    onPrimary:          '#FFFFFF',
    primaryContainer:   '#FFDBCC',
    onPrimaryContainer: '#360F00',

    // Secondary
    secondary:            '#77574A',
    onSecondary:          '#FFFFFF',
    secondaryContainer:   '#FFDBD1',
    onSecondaryContainer: '#2C160E',

    // Tertiary
    tertiary:            '#6A5E2E',
    onTertiary:          '#FFFFFF',
    tertiaryContainer:   '#F4E2A8',
    onTertiaryContainer: '#231B00',

    // Error
    error:            '#BA1A1A',
    onError:          '#FFFFFF',
    errorContainer:   '#FFDAD6',
    onErrorContainer: '#410002',

    // Background & Surface
    background:          '#FFFBFF',
    onBackground:        '#201A18',
    surface:             '#FFFBFF',
    onSurface:           '#201A18',
    surfaceVariant:      '#F5DED5',
    onSurfaceVariant:    '#53433D',
    surfaceContainerHighest: '#EDE0DC',
    surfaceContainerHigh:    '#F2E4E0',
    surfaceContainer:        '#F7EEE9',
    surfaceContainerLow:     '#FDF5F1',
    surfaceContainerLowest:  '#FFFFFF',
    inverseSurface:      '#362F2D',
    inverseOnSurface:    '#FBEEEB',
    inversePrimary:      '#FFB596',
    surfaceTint:         '#9B4500',

    // Outline
    outline:        '#85736D',
    outlineVariant: '#D8C2BB',

    // Misc
    shadow: '#000000',
    scrim:  '#000000',
  },

  dark: {
    // Primary
    primary:            '#FFB596',
    onPrimary:          '#552100',
    primaryContainer:   '#793200',
    onPrimaryContainer: '#FFDBCC',

    // Secondary
    secondary:            '#E7BDB1',
    onSecondary:          '#442A21',
    secondaryContainer:   '#5D4036',
    onSecondaryContainer: '#FFDBD1',

    // Tertiary
    tertiary:            '#D7C68E',
    onTertiary:          '#393005',
    tertiaryContainer:   '#514619',
    onTertiaryContainer: '#F4E2A8',

    // Error
    error:            '#FFB4AB',
    onError:          '#690005',
    errorContainer:   '#93000A',
    onErrorContainer: '#FFDAD6',

    // Background & Surface
    background:          '#201A18',
    onBackground:        '#EDE0DC',
    surface:             '#201A18',
    onSurface:           '#EDE0DC',
    surfaceVariant:      '#53433D',
    onSurfaceVariant:    '#D8C2BB',
    surfaceContainerHighest: '#4A3730',
    surfaceContainerHigh:    '#3E2E28',
    surfaceContainer:        '#362620',
    surfaceContainerLow:     '#2E1F1A',
    surfaceContainerLowest:  '#180E0B',
    inverseSurface:      '#EDE0DC',
    inverseOnSurface:    '#362F2D',
    inversePrimary:      '#9B4500',
    surfaceTint:         '#FFB596',

    // Outline
    outline:        '#A08D87',
    outlineVariant: '#53433D',

    // Misc
    shadow: '#000000',
    scrim:  '#000000',
  },
} as const;

// ── Tipografía MD3 ────────────────────────────────────────────

export const MD3Typography = {
  displayLarge:   { fontSize: 57, lineHeight: 64, fontWeight: '400' as const, letterSpacing: -0.25 },
  displayMedium:  { fontSize: 45, lineHeight: 52, fontWeight: '400' as const, letterSpacing: 0 },
  displaySmall:   { fontSize: 36, lineHeight: 44, fontWeight: '400' as const, letterSpacing: 0 },

  headlineLarge:  { fontSize: 32, lineHeight: 40, fontWeight: '400' as const, letterSpacing: 0 },
  headlineMedium: { fontSize: 28, lineHeight: 36, fontWeight: '400' as const, letterSpacing: 0 },
  headlineSmall:  { fontSize: 24, lineHeight: 32, fontWeight: '400' as const, letterSpacing: 0 },

  titleLarge:     { fontSize: 22, lineHeight: 28, fontWeight: '400' as const, letterSpacing: 0 },
  titleMedium:    { fontSize: 16, lineHeight: 24, fontWeight: '500' as const, letterSpacing: 0.15 },
  titleSmall:     { fontSize: 14, lineHeight: 20, fontWeight: '500' as const, letterSpacing: 0.1 },

  bodyLarge:      { fontSize: 16, lineHeight: 24, fontWeight: '400' as const, letterSpacing: 0.5 },
  bodyMedium:     { fontSize: 14, lineHeight: 20, fontWeight: '400' as const, letterSpacing: 0.25 },
  bodySmall:      { fontSize: 12, lineHeight: 16, fontWeight: '400' as const, letterSpacing: 0.4 },

  labelLarge:     { fontSize: 14, lineHeight: 20, fontWeight: '500' as const, letterSpacing: 0.1 },
  labelMedium:    { fontSize: 12, lineHeight: 16, fontWeight: '500' as const, letterSpacing: 0.5 },
  labelSmall:     { fontSize: 11, lineHeight: 16, fontWeight: '500' as const, letterSpacing: 0.5 },
} as const;

// ── Formas MD3 ────────────────────────────────────────────────

export const MD3Shape = {
  none:       0,
  extraSmall: 4,
  small:      8,
  medium:     12,
  large:      16,
  extraLarge: 28,
  full:       9999,
} as const;

// ── Elevación MD3 (nivel de opacidad del surface tint) ────────

export const MD3Elevation = {
  level0: 0,    // 0%
  level1: 0.05, // 5%  — Cards, menus
  level2: 0.08, // 8%  — FAB, chips
  level3: 0.11, // 11% — Dialog, drawers
  level4: 0.12, // 12%
  level5: 0.14, // 14% — Navigation bar
} as const;

// ── State layers (opacidades de interacción) ──────────────────

export const MD3State = {
  hover:   0.08,
  pressed: 0.12,
  focused: 0.12,
  dragged: 0.16,
  disabled: 0.38,
  disabledContainer: 0.12,
} as const;

export type MD3ColorScheme = typeof MD3Colors.light;
export type MD3TypographyKey = keyof typeof MD3Typography;
export type MD3ShapeKey = keyof typeof MD3Shape;
