export const colors = {
  background: '#05070C',
  backgroundRaised: '#0D111A',
  surface: '#141A26',
  surfaceElevated: '#1D2431',
  card: 'rgba(18,23,35,0.88)',
  cardPressed: 'rgba(24,30,45,0.94)',
  border: 'rgba(255,255,255,0.11)',
  borderStrong: 'rgba(255,255,255,0.18)',
  divider: 'rgba(255,255,255,0.07)',

  text: '#F5F7FF',
  textSecondary: 'rgba(235,235,245,0.70)',
  textTertiary: 'rgba(235,235,245,0.42)',
  muted: 'rgba(235,235,245,0.54)',

  blue: '#0A84FF',
  purple: '#BF5AF2',
  pink: '#FF375F',
  red: '#FF453A',
  orange: '#FF9F0A',
  yellow: '#FFD60A',
  green: '#30D158',
  teal: '#5AC8FA',
  indigo: '#5E5CE6',

  pitchMatch: '#0A84FF',
  noteId: '#BF5AF2',
  frequencyGuess: '#FF9F0A',
  noteWordle: '#30D158',
  frequencyWordle: '#5AC8FA',
  pitchMemory: '#FF375F',
  nameThatNote: '#32ADE6',
  frequencyHunt: '#F97316',
  droneLock: '#63E6E2',
  tuneIn: '#FF375F',
  pianoTap: '#5E5CE6',
  frequencySlider: '#5AC8FA',
  centsDeviation: '#A3E635',
  intervalArcher: '#BF5AF2',
  speedRound: '#FFCC00',
  chordDetective: '#F9A8D4',
  waveformMatch: '#93C5FD',
  tuningBattle: '#FF453A',

  glass: 'rgba(18,23,35,0.78)',
  glassLight: 'rgba(255,255,255,0.065)',
  glassBorder: 'rgba(255,255,255,0.13)',
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
  sm: 6,
  md: 8,
  lg: 8,
  xl: 8,
  full: 999,
} as const;

export const shadows = {
  card: {
    boxShadow: '0 12px 28px rgba(0,0,0,0.26)',
  },
  elevated: {
    boxShadow: '0 20px 44px rgba(0,0,0,0.36)',
  },
  tab: {
    boxShadow: '0 18px 32px rgba(0,0,0,0.36)',
  },
} as const;

export const typography = {
  largeTitle: { fontSize: 34, fontWeight: '800' as const, letterSpacing: 0 },
  title1: { fontSize: 28, fontWeight: '800' as const, letterSpacing: 0 },
  title2: { fontSize: 22, fontWeight: '800' as const, letterSpacing: 0 },
  title3: { fontSize: 20, fontWeight: '700' as const, letterSpacing: 0 },
  headline: { fontSize: 17, fontWeight: '700' as const, letterSpacing: 0 },
  body: { fontSize: 17, fontWeight: '400' as const, letterSpacing: 0 },
  callout: { fontSize: 16, fontWeight: '500' as const, letterSpacing: 0 },
  subhead: { fontSize: 15, fontWeight: '500' as const, letterSpacing: 0 },
  footnote: { fontSize: 13, fontWeight: '500' as const, letterSpacing: 0 },
  caption1: { fontSize: 12, fontWeight: '400' as const, letterSpacing: 0 },
  caption2: { fontSize: 11, fontWeight: '500' as const, letterSpacing: 0 },
  overline: { fontSize: 11, fontWeight: '800' as const, letterSpacing: 0 },
} as const;

export type GameModeColor = keyof typeof colors;
