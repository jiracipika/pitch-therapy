// ─── Shared Game Framework Types ─────────────────────────────────────────────

import type { GameMode, Difficulty, RoundResult } from "./index";

// ─── Base Game State ─────────────────────────────────────────────────────────

export interface BaseGameState {
  mode: GameMode;
  difficulty: Difficulty;
  phase: "idle" | "playing" | "feedback" | "paused" | "complete";
  currentRound: number;
  totalRounds: number;
  score: number;
  streak: number;
  bestStreak: number;
  roundResults: RoundResult[];
  startTime: number | null;
  roundStartTime: number | null;
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

export interface ScoreBreakdown {
  basePoints: number;
  timeBonus: number;
  streakBonus: number;
  total: number;
}

/**
 * Calculate a detailed score breakdown for a round.
 */
export function calculateScoreBreakdown(
  accuracy: number,
  responseTimeMs: number,
  streak: number,
): ScoreBreakdown {
  const basePoints = Math.round(accuracy * 100);
  const timeBonus = Math.round(Math.max(0, 50 * Math.exp(-responseTimeMs / 5000)));
  const streakMultiplier = 1 + Math.min(streak, 10) * 0.1;
  const streakBonus = Math.round(basePoints * (streakMultiplier - 1));

  return {
    basePoints,
    timeBonus,
    streakBonus,
    total: Math.max(0, basePoints + timeBonus + streakBonus),
  };
}

// ─── Grade ───────────────────────────────────────────────────────────────────

export type Grade = "S" | "A" | "B" | "C" | "D" | "F";

export function calculateGrade(
  score: number,
  totalPossible: number,
): Grade {
  const pct = totalPossible > 0 ? score / totalPossible : 0;

  if (pct >= 0.95) return "S";
  if (pct >= 0.85) return "A";
  if (pct >= 0.70) return "B";
  if (pct >= 0.55) return "C";
  if (pct >= 0.40) return "D";
  return "F";
}

export const GRADE_COLORS: Record<Grade, string> = {
  S: "text-amber-400",
  A: "text-emerald-400",
  B: "text-blue-400",
  C: "text-violet-400",
  D: "text-orange-400",
  F: "text-red-400",
};

// ─── Utility ─────────────────────────────────────────────────────────────────

export function createInitialGameState(
  mode: GameMode,
  difficulty: Difficulty,
  totalRounds: number,
): BaseGameState {
  return {
    mode,
    difficulty,
    phase: "idle",
    currentRound: 0,
    totalRounds,
    score: 0,
    streak: 0,
    bestStreak: 0,
    roundResults: [],
    startTime: null,
    roundStartTime: null,
  };
}
