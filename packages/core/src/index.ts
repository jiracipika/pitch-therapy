// ─── @pitch-therapy/core — Web Entry Point ────────────────────────────────────

// ─── Game Data (pure types & constants, no platform deps) ────────────────────

export type {
  GameMode,
  GameModeMeta,
  Difficulty,
  DifficultyConfig,
  NoteName,
  Note,
  ModeCategoryId,
  ModeCategory,
  SessionPhase,
  SessionState,
  SessionAction,
  RoundResult,
} from "./gameData";

export { GAME_MODES, GAME_MODE_META, MODE_CATEGORIES, DIFFICULTY_CONFIG } from "./gameData";

// ─── Audio Utilities ─────────────────────────────────────────────────────────

export {
  noteToFrequency,
  frequencyToNote,
  getDailySeed,
  getAllNoteNames,
  generateNoteOptions,
  calculateScore,
} from "./audio";
export type { FrequencyToNoteResult } from "./audio";

// ─── Auth ────────────────────────────────────────────────────────────────────

export { getSupabaseClient } from "./supabase";
export { signUp, signIn, signOut, getSession, getUser } from "./auth";
export type { UserProfile } from "./auth";

// ─── Daily Challenge ─────────────────────────────────────────────────────────

export {
  getDailySeed as getDailyChallengeSeed,
  calculateStreak,
  todayDateString,
} from "./dailyChallenge";
export type { DailyChallengeResult } from "./dailyChallenge";

// ─── Staff Position Mapping ──────────────────────────────────────────────────

export { noteToStaffPos, staffPosToY, STAFF_LINES } from "./staff";
export type { StaffPosition } from "./staff";

// ─── Shared Game Framework ───────────────────────────────────────────────────

export { calculateScoreBreakdown, calculateGrade, createInitialGameState } from "./gameFramework";
export { GRADE_COLORS } from "./gameFramework";
export type { BaseGameState, ScoreBreakdown, Grade } from "./gameFramework";

// ─── Pitch Detection & Microphone ────────────────────────────────────────────

export {
  PitchDetector,
  MicrophoneManager,
  calculateCentsDeviation,
  centsToTunerRange,
} from "./pitchDetection";
export type { PitchDetectionResult, MicPermissionState } from "./pitchDetection";

// ─── MIDI ────────────────────────────────────────────────────────────────────

export { MidiManager, midiNoteToFrequency, midiNoteToName, frequencyToMidiNote } from "./midi";
export type { MidiNoteEvent, MidiDevice } from "./midi";

// ─── Game Session ────────────────────────────────────────────────────────────

export { sessionReducer, initialSessionState, generateShareGrid } from "./gameSession";
export type { WordleAttempt, WordleFeedback } from "./gameSession";

// ─── Progress Insights (pure analytics) ─────────────────────────────────────

export { buildProgressInsights, buildDailyActivityMap } from "./progressInsights";
export type {
  ProgressResult,
  WeakModeCluster,
  ProgressMomentum,
  ProgressInsights,
} from "./progressInsights";

// ─── Practice Planning (pure recommendations) ────────────────────────────────

export {
  buildAdaptivePracticePlan,
  buildPracticePlan,
  getModeTrainingCue,
  getModesByCategory,
  getPracticeFocusForDate,
  getRecommendedModes,
} from "./practicePlan";
export type {
  ModeTrainingCue,
  PracticeFocus,
  PracticePlan,
  PracticePlanStep,
} from "./practicePlan";
