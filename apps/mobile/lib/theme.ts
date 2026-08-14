export const lightColors = {
  background: "#F1EFE7",
  backgroundRaised: "#FAF8F0",
  surface: "#FAF8F0",
  surfaceElevated: "#E8E5DA",
  card: "rgba(250, 248, 240, 0.92)",
  cardPressed: "#FFFFFF",
  border: "rgba(21, 23, 17, 0.14)",
  borderStrong: "rgba(21, 23, 17, 0.28)",
  divider: "rgba(21, 23, 17, 0.18)",
  text: "#151711",
  textSecondary: "rgba(21, 23, 17, 0.68)",
  textTertiary: "rgba(21, 23, 17, 0.47)",
  muted: "rgba(21, 23, 17, 0.56)",
  success: "#2B8A3E",
  warning: "#B8860B",
  danger: "#D93A2F",
  blue: "#5C7C12",
  purple: "#9C46C7",
  pink: "#D94068",
  red: "#D93A2F",
  orange: "#E85D24",
  yellow: "#B8860B",
  green: "#2B8A3E",
  teal: "#168C94",
  indigo: "#6558D3",
  mint: "#218C74",
  cyan: "#177EAA",
  pitchMatch: "#5C7C12",
  noteId: "#9C46C7",
  frequencyGuess: "#E85D24",
  noteWordle: "#2B8A3E",
  frequencyWordle: "#168C94",
  pitchMemory: "#D94068",
  nameThatNote: "#177EAA",
  frequencyHunt: "#E85D24",
  droneLock: "#218C74",
  tuneIn: "#D94068",
  pianoTap: "#6558D3",
  frequencySlider: "#168C94",
  centsDeviation: "#6D8E20",
  intervalArcher: "#9C46C7",
  speedRound: "#B8860B",
  chordDetective: "#C64C82",
  waveformMatch: "#337FAA",
  tuningBattle: "#D93A2F",
  glass: "rgba(250, 248, 240, 0.90)",
  glassLight: "rgba(250, 248, 240, 0.56)",
  glassBorder: "rgba(21, 23, 17, 0.14)",
  signal: "#5C7C12",
  coral: "#E85D24",
  ink: "#151711",
  cream: "#FAF8F0",
} as const;

export const darkColors = {
  ...lightColors,
  background: "#0a0a0f",
  backgroundRaised: "#111118",
  surface: "#1c1c2e",
  surfaceElevated: "#232338",
  card: "rgba(28, 28, 46, 0.94)",
  cardPressed: "#2a2a44",
  border: "rgba(255, 255, 255, 0.10)",
  borderStrong: "rgba(255, 255, 255, 0.24)",
  divider: "rgba(255, 255, 255, 0.12)",
  text: "#f5f5fa",
  textSecondary: "rgba(245, 245, 250, 0.70)",
  textTertiary: "rgba(245, 245, 250, 0.48)",
  muted: "rgba(245, 245, 250, 0.55)",
  success: "#34d399",
  warning: "#fbbf24",
  danger: "#f87171",
  blue: "#22d3ee",
  purple: "#a78bfa",
  pink: "#f472b6",
  red: "#f87171",
  orange: "#fb923c",
  yellow: "#facc15",
  green: "#34d399",
  teal: "#2dd4bf",
  indigo: "#818cf8",
  mint: "#6ee7b7",
  cyan: "#22d3ee",
  pitchMatch: "#22d3ee",
  noteId: "#a78bfa",
  frequencyGuess: "#fb923c",
  noteWordle: "#34d399",
  frequencyWordle: "#2dd4bf",
  pitchMemory: "#f472b6",
  nameThatNote: "#38bdf8",
  frequencyHunt: "#fb923c",
  droneLock: "#6ee7b7",
  tuneIn: "#f472b6",
  pianoTap: "#818cf8",
  frequencySlider: "#2dd4bf",
  centsDeviation: "#a3e635",
  intervalArcher: "#a78bfa",
  speedRound: "#facc15",
  chordDetective: "#f9a8d4",
  waveformMatch: "#7dd3fc",
  tuningBattle: "#f87171",
  glass: "rgba(28, 28, 46, 0.92)",
  glassLight: "rgba(255, 255, 255, 0.05)",
  glassBorder: "rgba(52, 211, 153, 0.22)",
  signal: "#34d399",
  coral: "#ff7857",
  ink: "#0a0a0f",
  cream: "#f5f5fa",
} as const;

export const colors = darkColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  full: 999,
} as const;

export const shadows = {
  card: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 5,
  },
  elevated: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.34,
    shadowRadius: 18,
    elevation: 8,
  },
  tab: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 0,
  },
  blue: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 6,
  },
} as const;

export const typography = {
  largeTitle: { fontSize: 36, fontWeight: "800" as const, letterSpacing: -1.2 },
  title1: { fontSize: 30, fontWeight: "800" as const, letterSpacing: -0.9 },
  title2: { fontSize: 23, fontWeight: "700" as const, letterSpacing: -0.45 },
  title3: { fontSize: 20, fontWeight: "700" as const, letterSpacing: -0.35 },
  headline: { fontSize: 17, fontWeight: "700" as const, letterSpacing: -0.3 },
  body: { fontSize: 17, fontWeight: "400" as const, letterSpacing: -0.25 },
  callout: { fontSize: 16, fontWeight: "400" as const, letterSpacing: -0.2 },
  subhead: { fontSize: 15, fontWeight: "500" as const, letterSpacing: -0.15 },
  footnote: { fontSize: 13, fontWeight: "500" as const, letterSpacing: 0 },
  caption1: { fontSize: 12, fontWeight: "600" as const, letterSpacing: 0.1 },
  caption2: { fontSize: 11, fontWeight: "700" as const, letterSpacing: 0.25 },
  overline: { fontSize: 11, fontWeight: "700" as const, letterSpacing: 0.8 },
} as const;

export type GameModeColor = keyof typeof colors;

/**
 * Semantic aliases used across the play screens.
 *
 * Previously these screens used hardcoded Tailwind blue-grey hex values
 * (#97A3B6, #F8FAFC, #7E8A9A, rgba(21,24,32,…)) that were visually
 * inconsistent with the app's warm green/cream design system. These
 * aliases map every former hardcode to a design-token equivalent so
 * screens stay in sync with theme changes automatically.
 */
export const playColors = {
  /** Primary text on dark backgrounds (was #F8FAFC). */
  text: darkColors.text,
  /** Secondary text (was #97A3B6). */
  textSecondary: darkColors.textSecondary,
  /** Tertiary/label text (was #7E8A9A, #a1a1aa). */
  textTertiary: darkColors.textTertiary,
  /** Muted label text (was #71717a, #52525b). */
  textMuted: darkColors.muted,
  /** Surface that cards/stat boxes sit on (was rgba(21,24,32,0.86)). */
  cardSurface: darkColors.surfaceElevated,
  /** Semi-transparent card for pressed/ambient states (was rgba(255,255,255,0.05)). */
  cardAmbient: 'rgba(244,246,236,0.05)',
  /** Card border (was rgba(255,255,255,0.10)). */
  cardBorder: darkColors.border,
  /** Success green (was #4ade80). */
  success: darkColors.success,
  /** Warning amber (was #fbbf24). */
  warning: darkColors.warning,
  /** Danger red (was #f87171). */
  danger: darkColors.danger,
  /** Screen background (was #10130E). */
  screen: darkColors.background,
  /** Track / divider dark line (was #3f3f46). */
  trackLine: darkColors.borderStrong,
};
