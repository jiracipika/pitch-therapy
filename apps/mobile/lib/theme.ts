export const colors = {
  background: '#08090D',
  backgroundRaised: '#0F1117',
  surface: '#151820',
  surfaceElevated: '#1D222D',
  card: 'rgba(21,24,32,0.86)',
  cardPressed: 'rgba(29,34,45,0.92)',
  border: 'rgba(255,255,255,0.10)',
  borderStrong: 'rgba(255,255,255,0.16)',
  divider: 'rgba(255,255,255,0.07)',

  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textTertiary: '#7E8A9A',
  muted: '#97A3B6',

  blue: '#38BDF8',
  purple: '#A78BFA',
  pink: '#FB7185',
  red: '#F87171',
  orange: '#FDBA74',
  yellow: '#FACC15',
  green: '#4ADE80',
  teal: '#2DD4BF',
  indigo: '#818CF8',

  pitchMatch: '#38BDF8',
  noteId: '#A78BFA',
  frequencyGuess: '#FDBA74',
  noteWordle: '#4ADE80',
  frequencyWordle: '#2DD4BF',
  pitchMemory: '#FB7185',
  nameThatNote: '#60A5FA',
  frequencyHunt: '#F97316',
  droneLock: '#34D399',
  tuneIn: '#F472B6',
  pianoTap: '#818CF8',
  frequencySlider: '#22D3EE',
  centsDeviation: '#A3E635',
  intervalArcher: '#C084FC',
  speedRound: '#FBBF24',
  chordDetective: '#F9A8D4',
  waveformMatch: '#93C5FD',
  tuningBattle: '#FDA4AF',

  glass: 'rgba(15,17,23,0.78)',
  glassLight: 'rgba(255,255,255,0.055)',
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
    boxShadow: '0 10px 24px rgba(0,0,0,0.22)',
  },
  elevated: {
    boxShadow: '0 18px 38px rgba(0,0,0,0.30)',
  },
  tab: {
    boxShadow: '0 16px 30px rgba(0,0,0,0.34)',
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
