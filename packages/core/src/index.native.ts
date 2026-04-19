// ─── Native entry point for @pitch-therapy/core ──────────────────────────────
// Re-exports everything from index.ts but uses .native stubs for web-only APIs
// (Web Audio API, Web MIDI API). This is the entry point Metro uses on RN/Android.

// ─── Game Modes (pure data, no platform deps) ────────────────────────────────

export type {
  GameMode,
  GameModeMeta,
  Difficulty,
  DifficultyConfig,
  NoteName,
  Note,
  SessionPhase,
  SessionState,
  SessionAction,
  RoundResult,
};

export {
  GAME_MODES,
  GAME_MODE_META,
  DIFFICULTY_CONFIG,
} from "./index";

// ─── Audio utilities (pure math, no web deps) ───────────────────────────────

export {
  noteToFrequency,
  frequencyToNote,
  getDailySeed,
  getAllNoteNames,
  generateNoteOptions,
  calculateScore,
} from "./audio";
export type { FrequencyToNoteResult } from "./audio";

// ─── Auth (stub for native) ─────────────────────────────────────────────────

export { signUp, signIn, signOut, getSession, getUser } from "./auth.native";
export type { UserProfile } from "./auth.native";

// ─── Supabase (stub for native) ─────────────────────────────────────────────

export { getSupabaseClient } from "./supabase.native";

// ─── Daily Challenge (pure logic) ───────────────────────────────────────────

export { getDailySeed as getDailyChallengeSeed, calculateStreak, todayDateString } from "./dailyChallenge";
export type { DailyChallengeResult } from "./dailyChallenge";

// ─── Staff (pure math) ──────────────────────────────────────────────────────

export { noteToStaffPos, staffPosToY, STAFF_LINES } from "./staff";
export type { StaffPosition } from "./staff";

// ─── Game Framework (pure logic) ────────────────────────────────────────────

export {
  calculateScoreBreakdown,
  calculateGrade,
  createInitialGameState,
  GRADE_COLORS,
} from "./gameFramework";
export type {
  BaseGameState,
  ScoreBreakdown,
  Grade,
} from "./gameFramework";

// ─── Pitch Detection (native stub) ──────────────────────────────────────────

export {
  PitchDetector,
  MicrophoneManager,
  calculateCentsDeviation,
  centsToTunerRange,
} from "./pitchDetection.native";
export type {
  PitchDetectionResult,
  MicPermissionState,
} from "./pitchDetection.native";

// ─── MIDI (native stub) ─────────────────────────────────────────────────────

export {
  MidiManager,
  midiNoteToFrequency,
  midiNoteToName,
  frequencyToMidiNote,
} from "./midi.native";
export type { MidiNoteEvent, MidiDevice } from "./midi.native";

// ─── Game Session (pure logic) ──────────────────────────────────────────────

export {
  sessionReducer,
  initialSessionState,
  generateShareGrid,
} from "./gameSession";
export type {
  WordleAttempt,
  WordleFeedback,
} from "./gameSession";
