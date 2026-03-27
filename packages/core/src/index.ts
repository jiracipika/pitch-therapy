// ─── Game Modes ──────────────────────────────────────────────────────────────

export type GameMode =
  | "pitch-match"
  | "note-id"
  | "frequency-guess"
  | "note-wordle"
  | "frequency-wordle";

export const GAME_MODES: GameMode[] = [
  "pitch-match",
  "note-id",
  "frequency-guess",
  "note-wordle",
  "frequency-wordle",
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

// ─── Audio Utility Stubs ─────────────────────────────────────────────────────

/**
 * Convert a note name + octave to frequency in Hz.
 * Placeholder — real implementation uses equal temperament.
 */
export function noteToFrequency(note: Note): number {
  return note.frequency;
}

/**
 * Convert a frequency in Hz to the closest note.
 * Placeholder — real implementation rounds to nearest 12-TET note.
 */
export function frequencyToNote(frequency: number): Note {
  const semitones = 12 * Math.log2(frequency / 440);
  const noteIndex = Math.round(semitones) + 9; // A = index 9
  const octave = Math.floor((noteIndex + 3) / 12) + 4;
  const noteNames: NoteName[] = [
    "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
  ];
  const name: NoteName = noteNames[((noteIndex % 12) + 12) % 12] ?? "A";
  return { name, octave, frequency };
}

/**
 * Generate a deterministic daily seed for challenge generation.
 */
export function getDailySeed(date?: Date): number {
  const d = date ?? new Date();
  const dateStr = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}
