// ─── Achievements / Milestones (pure analytics) ──────────────────────────────
//
// Derives unlockable milestones from a user's session history and daily
// completion log. Pure and deterministic: same input → same output, with no
// clock dependency unless a `now` date is supplied. Reuses ProgressResult so
// it composes with the existing insights stack and stays monorepo-shared
// (web + mobile).

import type { ProgressResult } from "./progressInsights";
import { calculateLongestStreak } from "./dailyChallenge";
import { GAME_MODES } from "./gameData";

export type AchievementCategory = "volume" | "consistency" | "accuracy" | "versatility" | "speed";

export interface AchievementTier {
  /** Stable identifier, e.g. "volume-10". */
  id: string;
  category: AchievementCategory;
  /** Human label, e.g. "First 10 Sessions". */
  label: string;
  /** Short motivational description. */
  description: string;
  /** Threshold the metric must reach to unlock. */
  threshold: number;
  icon: string;
}

export interface AchievementStatus {
  tier: AchievementTier;
  /** Best observed value for this tier's metric (clamped at threshold when unlocked). */
  progress: number;
  /** 0–1 fraction of the threshold reached. 1 once unlocked. */
  progressFraction: number;
  unlocked: boolean;
}

export interface AchievementMetrics {
  totalSessions: number;
  longestStreak: number;
  bestAccuracy: number;
  modesPlayed: number;
  totalModes: number;
  fastestAvgResponseMs: number | null;
}

export interface AchievementResult {
  metrics: AchievementMetrics;
  statuses: AchievementStatus[];
  /** Count of unlocked tiers across all categories. */
  unlockedCount: number;
  /** Total tiers evaluated. */
  totalCount: number;
  /** Most recently relevant unlocked tier (highest-threshold unlocked), or null. */
  latestUnlock: AchievementTier | null;
}

const ALL_TIERS: AchievementTier[] = [
  // ── Volume: total sessions played ──
  {
    id: "volume-1",
    category: "volume",
    label: "First Steps",
    description: "Complete your first session.",
    threshold: 1,
    icon: "🎯",
  },
  {
    id: "volume-10",
    category: "volume",
    label: "Getting Serious",
    description: "Play 10 sessions.",
    threshold: 10,
    icon: "🔥",
  },
  {
    id: "volume-50",
    category: "volume",
    label: "Dedicated Ear",
    description: "Play 50 sessions.",
    threshold: 50,
    icon: "💎",
  },
  {
    id: "volume-100",
    category: "volume",
    label: "Centurion",
    description: "Play 100 sessions.",
    threshold: 100,
    icon: "👑",
  },

  // ── Consistency: longest day streak ──
  {
    id: "streak-3",
    category: "consistency",
    label: "Building Momentum",
    description: "Reach a 3-day streak.",
    threshold: 3,
    icon: "📈",
  },
  {
    id: "streak-7",
    category: "consistency",
    label: "Week Warrior",
    description: "Reach a 7-day streak.",
    threshold: 7,
    icon: "📅",
  },
  {
    id: "streak-14",
    category: "consistency",
    label: "Fortnight Focus",
    description: "Reach a 14-day streak.",
    threshold: 14,
    icon: "🗓️",
  },
  {
    id: "streak-30",
    category: "consistency",
    label: "Unbreakable",
    description: "Reach a 30-day streak.",
    threshold: 30,
    icon: "🛡️",
  },

  // ── Accuracy: best single-session accuracy ──
  {
    id: "accuracy-70",
    category: "accuracy",
    label: "Sharp Ear",
    description: "Score 70% accuracy in a session.",
    threshold: 0.7,
    icon: "🎵",
  },
  {
    id: "accuracy-85",
    category: "accuracy",
    label: "Precision Tuned",
    description: "Score 85% accuracy in a session.",
    threshold: 0.85,
    icon: "🎻",
  },
  {
    id: "accuracy-95",
    category: "accuracy",
    label: "Perfect Pitch Path",
    description: "Score 95% accuracy in a session.",
    threshold: 0.95,
    icon: "⭐",
  },

  // ── Versatility: distinct modes played ──
  {
    id: "versatility-3",
    category: "versatility",
    label: "Explorer",
    description: "Try 3 different modes.",
    threshold: 3,
    icon: "🧭",
  },
  {
    id: "versatility-6",
    category: "versatility",
    label: "Well-Rounded",
    description: "Try 6 different modes.",
    threshold: 6,
    icon: "🌐",
  },
  {
    id: "versatility-12",
    category: "versatility",
    label: "Renaissance Ear",
    description: "Try 12 different modes.",
    threshold: 12,
    icon: "🎓",
  },

  // ── Speed: fastest average round response ──
  {
    id: "speed-8000",
    category: "speed",
    label: "Quick Thinking",
    description: "Average under 8s per round.",
    threshold: 8000,
    icon: "⚡",
  },
  {
    id: "speed-5000",
    category: "speed",
    label: "Rapid Reflexes",
    description: "Average under 5s per round.",
    threshold: 5000,
    icon: "🚀",
  },
  {
    id: "speed-3000",
    category: "speed",
    label: "Lightning Ear",
    description: "Average under 3s per round.",
    threshold: 3000,
    icon: "💫",
  },
];

/**
 * Extract raw achievement metrics from session history. Pure and clock-free.
 */
export function deriveAchievementMetrics(results: ProgressResult[]): AchievementMetrics {
  if (results.length === 0) {
    return {
      totalSessions: 0,
      longestStreak: 0,
      bestAccuracy: 0,
      modesPlayed: 0,
      totalModes: GAME_MODES.length,
      fastestAvgResponseMs: null,
    };
  }

  const normalized = results
    .filter((r) => Number.isFinite(r.accuracy))
    .map((r) => ({
      ...r,
      accuracy: Math.max(0, Math.min(1, r.accuracy)),
      date: r.date || new Date().toISOString(),
    }));

  const dayKeys = [...new Set(normalized.map((r) => r.date.slice(0, 10)))];
  const longestStreak = calculateLongestStreak(dayKeys);

  const bestAccuracy = normalized.reduce((best, r) => (r.accuracy > best ? r.accuracy : best), 0);

  const modesPlayed = new Set(normalized.map((r) => r.mode)).size;

  // Per-session average response time = timeMs / rounds. Track the fastest.
  let fastestAvgResponseMs: number | null = null;
  for (const r of normalized) {
    if (!Number.isFinite(r.rounds) || r.rounds <= 0) continue;
    const avg = r.timeMs / r.rounds;
    if (fastestAvgResponseMs === null || avg < fastestAvgResponseMs) {
      fastestAvgResponseMs = avg;
    }
  }

  return {
    totalSessions: normalized.length,
    longestStreak,
    bestAccuracy,
    modesPlayed,
    totalModes: GAME_MODES.length,
    fastestAvgResponseMs,
  };
}

/**
 * Map a metric category to the observed value from the metrics object.
 */
function metricForCategory(category: AchievementCategory, metrics: AchievementMetrics): number {
  switch (category) {
    case "volume":
      return metrics.totalSessions;
    case "consistency":
      return metrics.longestStreak;
    case "accuracy":
      return metrics.bestAccuracy;
    case "versatility":
      return metrics.modesPlayed;
    case "speed":
      // Speed is inverted: lower is better, threshold is an upper bound.
      // A missing fastest time means speed tiers can never unlock.
      return metrics.fastestAvgResponseMs === null
        ? Number.POSITIVE_INFINITY
        : metrics.fastestAvgResponseMs;
  }
}

/**
 * Evaluate a single tier against observed metrics.
 */
export function evaluateTier(
  tier: AchievementTier,
  metrics: AchievementMetrics,
): AchievementStatus {
  const observed = metricForCategory(tier.category, metrics);
  const isSpeed = tier.category === "speed";

  // For speed, "reaching" the threshold means avg response <= threshold.
  const unlocked = isSpeed
    ? Number.isFinite(observed) && observed <= tier.threshold
    : observed >= tier.threshold;

  const progress = isSpeed
    ? unlocked
      ? tier.threshold
      : observed === Number.POSITIVE_INFINITY
        ? 0
        : Math.min(observed, tier.threshold)
    : Math.min(observed, tier.threshold);

  // For speed, progress fraction is inverted: faster (lower) = closer.
  // If unlocked, fraction is 1. Otherwise scale so that observed just above
  // threshold shows ~1 and very slow shows ~0.
  let progressFraction: number;
  if (unlocked) {
    progressFraction = 1;
  } else if (isSpeed) {
    // Observed is finite and > threshold here. Map threshold→1, 2*threshold→0.
    const overshoot = observed - tier.threshold;
    progressFraction = Math.max(0, 1 - overshoot / Math.max(1, tier.threshold));
  } else {
    progressFraction = tier.threshold > 0 ? Math.min(1, observed / tier.threshold) : 0;
  }

  return {
    tier,
    progress,
    progressFraction,
    unlocked,
  };
}

/**
 * Evaluate every achievement tier against a user's session history.
 * Returns metrics, per-tier statuses, and aggregate counts.
 *
 * @param results  Session history (same shape used by progressInsights).
 * @param dailyCompleted  Optional daily-completion day keys; currently unused
 *   by built-in tiers but accepted for future expansion without an API break.
 */
export function evaluateAchievements(
  results: ProgressResult[],
  _dailyCompleted: string[] = [],
): AchievementResult {
  const metrics = deriveAchievementMetrics(results);
  const statuses = ALL_TIERS.map((tier) => evaluateTier(tier, metrics));

  const unlockedStatuses = statuses.filter((s) => s.unlocked);
  const unlockedCount = unlockedStatuses.length;
  const totalCount = statuses.length;

  // Latest unlock = highest-threshold unlocked tier (the most impressive one).
  const latestUnlock =
    unlockedStatuses.length > 0
      ? [...unlockedStatuses].sort((a, b) => b.tier.threshold - a.tier.threshold)[0]!.tier
      : null;

  return {
    metrics,
    statuses,
    unlockedCount,
    totalCount,
    latestUnlock,
  };
}

/**
 * Return only the tiers that have been unlocked, sorted by threshold ascending.
 */
export function getUnlockedAchievements(results: ProgressResult[]): AchievementStatus[] {
  return evaluateAchievements(results)
    .statuses.filter((s) => s.unlocked)
    .sort((a, b) => a.tier.threshold - b.tier.threshold);
}

/**
 * Return the next locked tier for each category (the immediate goal to chase).
 * Categories with nothing left to unlock are omitted.
 */
export function getNextGoals(results: ProgressResult[]): AchievementStatus[] {
  const { statuses } = evaluateAchievements(results);
  const goals: AchievementStatus[] = [];
  const seenCategory = new Set<AchievementCategory>();

  // Iterate tiers sorted by threshold ascending within each category so the
  // first locked tier encountered is the next goal.
  const ordered = [...statuses].sort((a, b) => {
    if (a.tier.category !== b.tier.category) {
      return a.tier.category.localeCompare(b.tier.category);
    }
    return a.tier.threshold - b.tier.threshold;
  });

  for (const status of ordered) {
    if (status.unlocked) continue;
    if (seenCategory.has(status.tier.category)) continue;
    seenCategory.add(status.tier.category);
    goals.push(status);
  }

  return goals;
}

export { ALL_TIERS as ACHIEVEMENT_TIERS };
