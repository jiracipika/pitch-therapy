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
  calculateLongestStreak,
  todayDateString,
  DAILY_CHALLENGE_MODES,
  getDailyChallengeCompletion,
} from "./dailyChallenge";
export type { DailyChallengeResult, DailyChallengeMode } from "./dailyChallenge";

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

// ─── Note Wordle (pure cross-platform rules & presentation) ─────────────────

export {
  NOTE_WORDLE_NOTES,
  buildNoteWordleResult,
  buildNoteWordleShareText,
  getNoteWordleFeedback,
  noteForSpeech,
} from "./noteWordle";
export type { NoteWordleFeedback, NoteWordleNote, NoteWordlePhase } from "./noteWordle";

// ─── Frequency Wordle (pure cross-platform rules & presentation) ────────────

export {
  FREQUENCY_WORDLE_MAX_GUESSES,
  FREQUENCY_WORDLE_MIN_GUESS,
  FREQUENCY_WORDLE_MAX_GUESS,
  buildFrequencyWordleResult,
  buildFrequencyWordleShareText,
  formatFrequency,
  getFrequencyWordleFeedback,
  parseFrequencyGuess,
} from "./frequencyWordle";
export type {
  FrequencyGuessParseResult,
  FrequencyWordleDirection,
  FrequencyWordleFeedback,
  FrequencyWordleFeedbackResult,
  FrequencyWordlePhase,
} from "./frequencyWordle";

// ─── Progress Insights (pure analytics) ─────────────────────────────────────

export {
  buildProgressInsights,
  buildDailyActivityMap,
  buildModeBreakdown,
  MODE_TREND_THRESHOLD,
} from "./progressInsights";
export type {
  ProgressResult,
  WeakModeCluster,
  ProgressMomentum,
  ProgressInsights,
  ModeBreakdownEntry,
  ModeTrendLabel,
} from "./progressInsights";

// ─── Practice Planning (pure recommendations) ────────────────────────────────

export {
  buildAdaptivePracticePlan,
  buildPracticePlan,
  estimatePlanDuration,
  getModeTrainingCue,
  getModesByCategory,
  getPracticeFocusForDate,
  getRecommendedModes,
  parseDurationLabel,
} from "./practicePlan";
export type {
  ModeTrainingCue,
  PlanDurationEstimate,
  PlanDurationRange,
  PracticeFocus,
  PracticePlan,
  PracticePlanStep,
} from "./practicePlan";

// ─── Achievements / Milestones (pure analytics) ──────────────────────────────

export {
  ACHIEVEMENT_TIERS,
  deriveAchievementMetrics,
  evaluateAchievements,
  evaluateTier,
  getLatestBadges,
  getNextGoals,
  getUnlockedAchievements,
  MASTERY_MIN_ACCURACY,
  MASTERY_MIN_SESSIONS,
} from "./achievements";
export type {
  AchievementCategory,
  AchievementTier,
  AchievementStatus,
  AchievementMetrics,
  AchievementResult,
} from "./achievements";
