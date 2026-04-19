// ─── Pure game data, types, and constants ────────────────────────────────────
// No platform-specific imports (no supabase, no Web Audio, no Web MIDI).
// Safe to import from both web and React Native.

// ─── Game Modes ──────────────────────────────────────────────────────────────

export type GameMode =
  | "pitch-match"
  | "note-id"
  | "frequency-guess"
  | "note-wordle"
  | "frequency-wordle"
  | "pitch-memory"
  | "name-that-note"
  | "frequency-hunt"
  | "drone-lock"
  | "tune-in"
  | "piano-tap"
  | "frequency-slider"
  | "cents-deviation"
  | "interval-archer"
  | "speed-round"
  | "chord-detective"
  | "waveform-match"
  | "tuning-battle";

export const GAME_MODES: GameMode[] = [
  "pitch-match",
  "note-id",
  "frequency-guess",
  "note-wordle",
  "frequency-wordle",
  "pitch-memory",
  "name-that-note",
  "frequency-hunt",
  "drone-lock",
  "tune-in",
  "piano-tap",
  "frequency-slider",
  "cents-deviation",
  "interval-archer",
  "speed-round",
  "chord-detective",
  "waveform-match",
  "tuning-battle",
];

export interface GameModeMeta {
  id: GameMode;
  label: string;
  description: string;
  color: string; // tailwind class
  accentHex: string;
}

export const GAME_MODE_META: Record<GameMode, GameModeMeta> = {
  "pitch-match": {
    id: "pitch-match",
    label: "Pitch Match",
    description: "Match a target pitch with your voice",
    color: "text-blue-500",
    accentHex: "#3B82F6",
  },
  "note-id": {
    id: "note-id",
    label: "Note ID",
    description: "Identify notes by ear",
    color: "text-violet-500",
    accentHex: "#8B5CF6",
  },
  "frequency-guess": {
    id: "frequency-guess",
    label: "Frequency Guess",
    description: "Guess the frequency of a tone",
    color: "text-amber-500",
    accentHex: "#F59E0B",
  },
  "note-wordle": {
    id: "note-wordle",
    label: "Note Wordle",
    description: "Wordle-style note identification",
    color: "text-green-500",
    accentHex: "#22C55E",
  },
  "frequency-wordle": {
    id: "frequency-wordle",
    label: "Frequency Wordle",
    description: "Wordle-style frequency guessing",
    color: "text-teal-500",
    accentHex: "#14B8A6",
  },
  "pitch-memory": {
    id: "pitch-memory",
    label: "Pitch Memory",
    description: "Reproduce increasingly longer note sequences",
    color: "text-rose-500",
    accentHex: "#F43F5E",
  },
  "name-that-note": {
    id: "name-that-note",
    label: "Name That Note",
    description: "Read notes on the musical staff",
    color: "text-sky-500",
    accentHex: "#0EA5E9",
  },
  "frequency-hunt": {
    id: "frequency-hunt",
    label: "Frequency Hunt",
    description: "Find exact frequencies by ear on a log scale",
    color: "text-orange-500",
    accentHex: "#F97316",
  },
  "drone-lock": {
    id: "drone-lock",
    label: "Drone Lock",
    description: "Lock onto intervals relative to a drone",
    color: "text-emerald-500",
    accentHex: "#10B981",
  },
  "tune-in": {
    id: "tune-in",
    label: "Tune In",
    description: "Hit the target note with your voice or instrument",
    color: "text-pink-500",
    accentHex: "#EC4899",
  },
  "piano-tap": {
    id: "piano-tap",
    label: "Piano Tap",
    description: "Identify notes by tapping the correct piano key",
    color: "text-indigo-500",
    accentHex: "#6366F1",
  },
  "frequency-slider": {
    id: "frequency-slider",
    label: "Frequency Slider",
    description: "Drag to match a hidden frequency on a log scale",
    color: "text-cyan-500",
    accentHex: "#06B6D4",
  },
  "cents-deviation": {
    id: "cents-deviation",
    label: "Cents Deviation",
    description: "Detect microtonal pitch shifts in cents",
    color: "text-lime-500",
    accentHex: "#84CC16",
  },
  "interval-archer": {
    id: "interval-archer",
    label: "Interval Archer",
    description: "Identify intervals with arrow-accuracy scoring",
    color: "text-fuchsia-500",
    accentHex: "#D946EF",
  },
  "speed-round": {
    id: "speed-round",
    label: "Speed Round",
    description: "Identify notes as fast as you can in a time sprint",
    color: "text-orange-400",
    accentHex: "#FB923C",
  },
  "chord-detective": {
    id: "chord-detective",
    label: "Chord Detective",
    description: "Identify chord quality by ear",
    color: "text-pink-400",
    accentHex: "#F472B6",
  },
  "waveform-match": {
    id: "waveform-match",
    label: "Waveform Match",
    description: "Align waveforms by detecting sharp/flat tuning",
    color: "text-indigo-400",
    accentHex: "#818CF8",
  },
  "tuning-battle": {
    id: "tuning-battle",
    label: "Tuning Battle",
    description: "Two-player head-to-head tuning challenge",
    color: "text-rose-500",
    accentHex: "#F43F5E",
  },
};

// ─── Difficulty ──────────────────────────────────────────────────────────────

export type Difficulty = "easy" | "medium" | "hard";

export interface DifficultyConfig {
  label: string;
  /** Number of rounds per session */
  rounds: number;
  /** Time limit per round in seconds (0 = no limit) */
  timeLimit: number;
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: { label: "Easy", rounds: 5, timeLimit: 0 },
  medium: { label: "Medium", rounds: 10, timeLimit: 15 },
  hard: { label: "Hard", rounds: 15, timeLimit: 8 },
};

// ─── Notes & Frequencies ─────────────────────────────────────────────────────

export type NoteName =
  | "C"
  | "C#"
  | "D"
  | "D#"
  | "E"
  | "F"
  | "F#"
  | "G"
  | "G#"
  | "A"
  | "A#"
  | "B";

export interface Note {
  name: NoteName;
  octave: number;
  /** Frequency in Hz (A4 = 440) */
  frequency: number;
}

// ─── Session State Machine ───────────────────────────────────────────────────

export type SessionPhase =
  | "idle"
  | "calibrating"
  | "in_round"
  | "scoring"
  | "complete";

export interface SessionState {
  phase: SessionPhase;
  mode: GameMode;
  difficulty: Difficulty;
  currentRound: number;
  totalRounds: number;
  score: number;
  roundResults: RoundResult[];
  startedAt: number | null;
  completedAt: number | null;
}

export type SessionAction =
  | { type: "START"; mode: GameMode; difficulty: Difficulty }
  | { type: "CALIBRATE_COMPLETE" }
  | { type: "START_ROUND" }
  | { type: "SUBMIT_ANSWER"; answer: unknown }
  | { type: "ROUND_SCORED"; correct: boolean; points: number }
  | { type: "NEXT_ROUND" }
  | { type: "COMPLETE" }
  | { type: "RESET" };

export interface RoundResult {
  round: number;
  correct: boolean;
  points: number;
  target?: unknown;
  answer?: unknown;
  timeMs: number;
}
