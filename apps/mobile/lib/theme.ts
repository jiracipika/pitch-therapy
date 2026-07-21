export const lightColors = {
  // ── Surfaces ──
  background: "#F2F2F7",
  backgroundRaised: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceElevated: "#F2F2F7",
  card: "rgba(255, 255, 255, 0.78)",
  cardPressed: "rgba(255, 255, 255, 0.88)",
  border: "rgba(60, 60, 67, 0.20)",
  borderStrong: "rgba(60, 60, 67, 0.30)",
  divider: "rgba(60, 60, 67, 0.18)",

  // ── Text ──
  text: "#000000",
  textSecondary: "rgba(60, 60, 67, 0.60)",
  textTertiary: "rgba(60, 60, 67, 0.30)",
  muted: "rgba(60, 60, 67, 0.50)",
  success: "#34C759",
  warning: "#FF9500",
  danger: "#FF3B30",

  // ── Tints ──
  blue: "#007AFF",
  purple: "#AF52DE",
  pink: "#FF2D55",
  red: "#FF3B30",
  orange: "#FF9500",
  yellow: "#FFCC00",
  green: "#34C759",
  teal: "#5AC8FA",
  indigo: "#5856D6",
  mint: "#63E6E2",
  cyan: "#32ADE6",

  // ── Mode Colors ──
  pitchMatch: "#007AFF",
  noteId: "#AF52DE",
  frequencyGuess: "#FF9500",
  noteWordle: "#34C759",
  frequencyWordle: "#5AC8FA",
  pitchMemory: "#FF2D55",
  nameThatNote: "#32ADE6",
  frequencyHunt: "#F97316",
  droneLock: "#63E6E2",
  tuneIn: "#FF2D55",
  pianoTap: "#5856D6",
  frequencySlider: "#5AC8FA",
  centsDeviation: "#A3E635",
  intervalArcher: "#AF52DE",
  speedRound: "#FFCC00",
  chordDetective: "#F9A8D4",
  waveformMatch: "#93C5FD",
  tuningBattle: "#FF3B30",

  glass: "rgba(255, 255, 255, 0.72)",
  glassLight: "rgba(255, 255, 255, 0.42)",
  glassBorder: "rgba(60, 60, 67, 0.12)",
} as const;

// ─── Dark mode color overrides ─────────────────────────────────────────────

export const darkColors = {
  ...lightColors,
  background: "#000000",
  backgroundRaised: "#1C1C1E",
  surface: "#1C1C1E",
  surfaceElevated: "#2C2C2E",
  card: "rgba(28, 28, 30, 0.78)",
  cardPressed: "rgba(44, 44, 46, 0.88)",
  border: "rgba(84, 84, 88, 0.50)",
  borderStrong: "rgba(84, 84, 88, 0.65)",
  divider: "rgba(84, 84, 88, 0.40)",

  text: "#FFFFFF",
  textSecondary: "rgba(235, 235, 245, 0.60)",
  textTertiary: "rgba(235, 235, 245, 0.30)",
  muted: "rgba(235, 235, 245, 0.50)",
  success: "#30D158",
  warning: "#FF9F0A",
  danger: "#FF453A",

  blue: "#0A84FF",
  purple: "#BF5AF2",
  pink: "#FF375F",
  red: "#FF453A",
  orange: "#FF9F0A",
  yellow: "#FFD60A",
  green: "#30D158",
  teal: "#64D2FF",
  indigo: "#5E5CE6",
  mint: "#63E6E2",
  cyan: "#40C8E0",

  pitchMatch: "#0A84FF",
  noteId: "#BF5AF2",
  frequencyGuess: "#FF9F0A",
  noteWordle: "#30D158",
  frequencyWordle: "#64D2FF",
  pitchMemory: "#FF375F",
  nameThatNote: "#40C8E0",
  frequencyHunt: "#FF9F0A",
  droneLock: "#63E6E2",
  tuneIn: "#FF375F",
  pianoTap: "#5E5CE6",
  frequencySlider: "#64D2FF",
  centsDeviation: "#A3E635",
  intervalArcher: "#BF5AF2",
  speedRound: "#FFD60A",
  chordDetective: "#F9A8D4",
  waveformMatch: "#93C5FD",
  tuningBattle: "#FF453A",

  glass: "rgba(28, 28, 30, 0.78)",
  glassLight: "rgba(28, 28, 30, 0.48)",
  glassBorder: "rgba(255, 255, 255, 0.08)",
} as const;

// The native shell is intentionally dark (gradients, status bar, and glass
// surfaces). Keep its active tokens dark so text and controls maintain
// accessible contrast. The complete light palette remains available for a
// future runtime appearance switch.
export const colors = darkColors;

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
  md: 10,
  lg: 14,
  xl: 20,
  full: 999,
} as const;

export const shadows = {
  card: {
    boxShadow: "0 2px 12px rgba(0,0,0,0.08), 0 0 0 0.5px rgba(0,0,0,0.04)",
  },
  elevated: {
    boxShadow: "0 8px 28px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
  },
  tab: {
    boxShadow: "0 -4px 16px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.04)",
  },
  blue: {
    boxShadow: "0 8px 24px rgba(0,122,255,0.20), 0 2px 8px rgba(0,122,255,0.10)",
  },
} as const;

export const typography = {
  largeTitle: { fontSize: 34, fontWeight: "700" as const, letterSpacing: -0.4 },
  title1: { fontSize: 28, fontWeight: "700" as const, letterSpacing: -0.5 },
  title2: { fontSize: 22, fontWeight: "700" as const, letterSpacing: -0.3 },
  title3: { fontSize: 20, fontWeight: "600" as const, letterSpacing: -0.4 },
  headline: { fontSize: 17, fontWeight: "600" as const, letterSpacing: -0.4 },
  body: { fontSize: 17, fontWeight: "400" as const, letterSpacing: -0.4 },
  callout: { fontSize: 16, fontWeight: "400" as const, letterSpacing: -0.3 },
  subhead: { fontSize: 15, fontWeight: "400" as const, letterSpacing: -0.2 },
  footnote: { fontSize: 13, fontWeight: "400" as const, letterSpacing: -0.08 },
  caption1: { fontSize: 12, fontWeight: "400" as const, letterSpacing: 0 },
  caption2: { fontSize: 11, fontWeight: "400" as const, letterSpacing: 0.07 },
  overline: { fontSize: 11, fontWeight: "600" as const, letterSpacing: 0.5 },
} as const;

export type GameModeColor = keyof typeof colors;
