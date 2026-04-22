// ─── Apple-inspired Design System ────────────────────────────────────────────
// Clean, minimal aesthetic. Frosted glass. SF Pro typography vibes.
// Subtle gradients. Rounded corners. Smooth transitions.

export const colors = {
  // Core palette
  background: '#000000',
  surface: '#1C1C1E',
  surfaceElevated: '#2C2C2E',
  card: '#1C1C1E',
  border: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.04)',

  // Text
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  textTertiary: '#636366',
  muted: '#8E8E93',

  // Accent colors (Apple-inspired)
  blue: '#0A84FF',
  purple: '#BF5AF2',
  pink: '#FF375F',
  red: '#FF453A',
  orange: '#FF9F0A',
  yellow: '#FFD60A',
  green: '#30D158',
  teal: '#64D2FF',
  indigo: '#5E5CE6',

  // Game mode colors (mapped to accent palette)
  pitchMatch: '#0A84FF',
  noteId: '#BF5AF2',
  frequencyGuess: '#FF9F0A',
  noteWordle: '#30D158',
  frequencyWordle: '#64D2FF',
  pitchMemory: '#FF375F',
  nameThatNote: '#5E5CE6',
  frequencyHunt: '#FF9F0A',
  droneLock: '#30D158',
  tuneIn: '#FF375F',
  pianoTap: '#5E5CE6',
  frequencySlider: '#64D2FF',
  centsDeviation: '#30D158',
  intervalArcher: '#BF5AF2',
  speedRound: '#FF9F0A',
  chordDetective: '#FF375F',
  waveformMatch: '#5E5CE6',
  tuningBattle: '#FF375F',

  // Frosted glass
  glass: 'rgba(28,28,30,0.72)',
  glassLight: 'rgba(255,255,255,0.05)',
  glassBorder: 'rgba(255,255,255,0.12)',
} as const;

// ─── Spacing ─────────────────────────────────────────────────────────────────

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// ─── Radii ───────────────────────────────────────────────────────────────────

export const radii = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  full: 999,
} as const;

// ─── Shadows (Apple-style subtle) ───────────────────────────────────────────

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  tab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 12,
  },
} as const;

// ─── Typography Scale (SF Pro-inspired) ──────────────────────────────────────

export const typography = {
  largeTitle: { fontSize: 34, fontWeight: '700' as const, letterSpacing: 0.37 },
  title1: { fontSize: 28, fontWeight: '700' as const, letterSpacing: 0.36 },
  title2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: 0.35 },
  title3: { fontSize: 20, fontWeight: '600' as const, letterSpacing: 0.38 },
  headline: { fontSize: 17, fontWeight: '600' as const, letterSpacing: -0.41 },
  body: { fontSize: 17, fontWeight: '400' as const, letterSpacing: -0.41 },
  callout: { fontSize: 16, fontWeight: '400' as const, letterSpacing: -0.32 },
  subhead: { fontSize: 15, fontWeight: '400' as const, letterSpacing: -0.24 },
  footnote: { fontSize: 13, fontWeight: '400' as const, letterSpacing: -0.08 },
  caption1: { fontSize: 12, fontWeight: '400' as const, letterSpacing: 0 },
  caption2: { fontSize: 11, fontWeight: '400' as const, letterSpacing: 0.07 },
  overline: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.06 },
} as const;

export type GameModeColor = keyof typeof colors;
