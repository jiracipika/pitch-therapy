/**
 * Gamification layer for Pitch Therapy.
 * Derives XP, levels, and mastery from existing session data — no new storage needed.
 * All functions are pure and work off the GameResult shape from useStats.
 */

import type { GameResult, ModeStats } from "./useStats";
import { GAME_MODES, GAME_MODE_META, MODE_CATEGORIES, type GameMode, type ModeCategoryId } from "@pitch-therapy/core";

/* ── XP / Level System ── */

/** Total XP earned across all sessions. */
export function calculateTotalXP(results: GameResult[]): number {
  return results.reduce((sum, r) => {
    // XP = score + accuracy bonus + speed bonus
    const accBonus = Math.round(r.accuracy * 50);
    const speedBonus = r.timeMs > 0 && r.timeMs < 30000 ? 10 : 0;
    return sum + r.score + accBonus + speedBonus;
  }, 0);
}

/** XP required to reach a given level (cumulative). */
export function xpForLevel(level: number): number {
  // Quadratic: L1=0, L2=100, L3=300, L4=600, L5=1000...
  if (level <= 1) return 0;
  return 50 * level * (level - 1);
}

/** Current level from total XP. */
export function levelFromXP(totalXP: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXP) level++;
  return level;
}

/** Level progress info for rendering XP bar. */
export function getLevelProgress(totalXP: number) {
  const level = levelFromXP(totalXP);
  const currentLevelXP = xpForLevel(level);
  const nextLevelXP = xpForLevel(level + 1);
  const xpInLevel = totalXP - currentLevelXP;
  const xpForNext = nextLevelXP - currentLevelXP;
  const pct = xpForNext > 0 ? (xpInLevel / xpForNext) * 100 : 100;
  return { level, xpInLevel, xpForNext, pct, totalXP };
}

/* ── Level display names (musical themed) ── */

const LEVEL_TITLES = [
  "Tuning In",      // 1-3
  "Sharp Listener", // 4-6
  "Pitch Perfect",  // 7-10
  "Golden Ear",     // 11-15
  "Maestro",        // 16-20
  "Virtuoso",       // 21+
];

export function levelTitle(level: number): string {
  if (level <= 3) return LEVEL_TITLES[0];
  if (level <= 6) return LEVEL_TITLES[1];
  if (level <= 10) return LEVEL_TITLES[2];
  if (level <= 15) return LEVEL_TITLES[3];
  if (level <= 20) return LEVEL_TITLES[4];
  return LEVEL_TITLES[5];
}

/* ── Daily Goal ── */

export const DAILY_GOAL_XP = 50;

export function todayXP(results: GameResult[]): number {
  const today = new Date().toISOString().slice(0, 10);
  return results
    .filter((r) => r.date.startsWith(today))
    .reduce((sum, r) => sum + r.score + Math.round(r.accuracy * 50), 0);
}

/* ── Category Mastery (Khan Academy style) ── */

export type MasteryLevel = "not-started" | "familiar" | "proficient" | "mastered";

export interface CategoryMastery {
  categoryId: ModeCategoryId;
  label: string;
  icon: string;
  accentHex: string;
  description: string;
  totalModes: number;
  playedModes: number;
  masteredModes: number;
  avgAccuracy: number;
  totalGames: number;
  masteryPct: number; // 0-100
  level: MasteryLevel;
  modes: ModeMasteryEntry[];
}

export interface ModeMasteryEntry {
  modeId: GameMode;
  label: string;
  icon: string;
  accentHex: string;
  description: string;
  gamesPlayed: number;
  bestScore: number;
  avgAccuracy: number;
  masteryPct: number;
  level: MasteryLevel;
}

/** Determine mastery level for a single mode. */
export function modeMasteryLevel(gamesPlayed: number, avgAccuracy: number): MasteryLevel {
  if (gamesPlayed === 0) return "not-started";
  if (gamesPlayed >= 4 && avgAccuracy >= 0.8) return "mastered";
  if (gamesPlayed >= 2 && avgAccuracy >= 0.6) return "proficient";
  return "familiar";
}

/** Compute mastery percentage (0-100) for rendering rings. */
export function modeMasteryPct(gamesPlayed: number, avgAccuracy: number): number {
  if (gamesPlayed === 0) return 0;
  const accComponent = Math.min(avgAccuracy, 1) * 70;
  const volComponent = Math.min(gamesPlayed / 5, 1) * 30;
  return Math.round(accComponent + volComponent);
}

/** Category-level mastery from its mode masteries. */
function categoryMasteryLevel(modes: ModeMasteryEntry[]): MasteryLevel {
  const played = modes.filter((m) => m.gamesPlayed > 0);
  if (played.length === 0) return "not-started";
  const mastered = modes.filter((m) => m.level === "mastered").length;
  const proficient = modes.filter((m) => m.level === "proficient").length;
  if (mastered >= modes.length * 0.6) return "mastered";
  if (proficient + mastered >= modes.length * 0.5) return "proficient";
  return "familiar";
}

/** Build full category mastery data from results. */
export function buildCategoryMastery(
  results: GameResult[],
  getModeStats: (mode: string) => ModeStats,
): CategoryMastery[] {
  return MODE_CATEGORIES.map((cat) => {
    const catModeIds = GAME_MODES.filter((id) => GAME_MODE_META[id].category === cat.id);
    const modeEntries: ModeMasteryEntry[] = catModeIds.map((modeId) => {
      const meta = GAME_MODE_META[modeId];
      const ms = getModeStats(modeId);
      const masteryPct = modeMasteryPct(ms.gamesPlayed, ms.avgAccuracy);
      return {
        modeId,
        label: meta.label,
        icon: meta.icon,
        accentHex: meta.accentHex,
        description: meta.description,
        gamesPlayed: ms.gamesPlayed,
        bestScore: ms.bestScore,
        avgAccuracy: ms.avgAccuracy,
        masteryPct,
        level: modeMasteryLevel(ms.gamesPlayed, ms.avgAccuracy),
      };
    });

    const playedModes = modeEntries.filter((m) => m.gamesPlayed > 0).length;
    const masteredModes = modeEntries.filter((m) => m.level === "mastered").length;
    const catResults = results.filter((r) =>
      catModeIds.includes(r.mode as GameMode),
    );
    const avgAccuracy =
      catResults.length > 0
        ? catResults.reduce((s, r) => s + r.accuracy, 0) / catResults.length
        : 0;

    const masteryPct =
      modeEntries.length > 0
        ? Math.round(modeEntries.reduce((s, m) => s + m.masteryPct, 0) / modeEntries.length)
        : 0;

    return {
      categoryId: cat.id,
      label: cat.label,
      icon: cat.icon,
      accentHex: cat.accentHex,
      description: cat.description,
      totalModes: catModeIds.length,
      playedModes,
      masteredModes,
      avgAccuracy,
      totalGames: catResults.length,
      masteryPct,
      level: categoryMasteryLevel(modeEntries),
      modes: modeEntries,
    };
  });
}

/* ── Mastery display config ── */

export const MASTERY_CONFIG: Record<MasteryLevel, { label: string; color: string; ringColor: string; bg: string }> = {
  "not-started": { label: "Not Started", color: "var(--ios-label3)", ringColor: "var(--ios-label4)", bg: "transparent" },
  familiar:      { label: "Familiar",     color: "#FF9F0A",          ringColor: "#FF9F0A",            bg: "rgba(255,159,10,0.08)" },
  proficient:    { label: "Proficient",   color: "#0A84FF",          ringColor: "#0A84FF",            bg: "rgba(10,132,255,0.08)" },
  mastered:      { label: "Mastered",     color: "#30D158",          ringColor: "#30D158",            bg: "rgba(48,209,88,0.08)" },
};

/* ── Last played mode (for resume card) ── */

export function getLastPlayedMode(results: GameResult[]): GameMode | null {
  if (results.length === 0) return null;
  return results[results.length - 1].mode as GameMode;
}
