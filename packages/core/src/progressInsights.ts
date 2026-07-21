import { GAME_MODE_META, type GameMode } from "./gameData";

export interface ProgressResult {
  mode: GameMode | string;
  score: number;
  accuracy: number;
  rounds: number;
  date: string;
  timeMs: number;
}

export interface WeakModeCluster {
  mode: string;
  label: string;
  sessions: number;
  avgAccuracy: number;
  /** Signed mean-accuracy delta (recent half − early half). 0 when < 4 sessions. */
  trendDelta: number;
  /**
   * Canonical trend label derived from {@link trendDelta} via the shared
   * 3% threshold ({@link MODE_TREND_THRESHOLD}). Use this in UI instead of
   * re-deriving "improving/slipping" from `trendDelta` directly, so a mode
   * with too few sessions (trendDelta === 0) is reported as "steady" rather
   * than the misleading "improving" a naive `>= 0` check produces.
   */
  trendLabel: ModeTrendLabel;
  volatility: number;
  priorityScore: number;
}

export interface ProgressMomentum {
  sessionsLast7: number;
  sessionsPrev7: number;
  avgAccuracyLast7: number;
  avgAccuracyPrev7: number;
  avgSessionMinutesLast7: number;
  avgSessionMinutesPrev7: number;
  sessionDeltaPct: number;
  accuracyDeltaPct: number;
}

export interface ProgressInsights {
  weakModes: WeakModeCluster[];
  momentum: ProgressMomentum;
  focusTip: string;
}

export type ModeTrendLabel = "improving" | "steady" | "slipping";

export interface ModeBreakdownEntry {
  mode: string;
  label: string;
  sessions: number;
  avgAccuracy: number;
  bestScore: number;
  /** Signed mean-accuracy delta (recent half − early half). 0 when < 4 sessions. */
  trendDelta: number;
  trendLabel: ModeTrendLabel;
  /** ISO timestamp of the most recent session for this mode, or null. */
  lastPlayed: string | null;
}

// ─── Trend classification (shared by weak-mode and per-mode breakdown) ───────

/**
 * Absolute accuracy delta required before a mode is labeled "improving" or
 * "slipping" rather than "steady". Tuned to match the visible granularity of
 * the weekly momentum card (~5% felt-sense threshold).
 */
export const MODE_TREND_THRESHOLD = 0.03;

function classifyModeTrend(trendDelta: number): ModeTrendLabel {
  if (trendDelta >= MODE_TREND_THRESHOLD) return "improving";
  if (trendDelta <= -MODE_TREND_THRESHOLD) return "slipping";
  return "steady";
}

function toDayKey(dateISO: string) {
  return dateISO.slice(0, 10);
}

function mean(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function stdDev(values: number[]) {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance = mean(values.map((value) => (value - avg) ** 2));
  return Math.sqrt(variance);
}

function pctDelta(current: number, previous: number) {
  if (previous <= 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}

function signedWindowTrend(values: number[]) {
  if (values.length < 4) return 0;
  const half = Math.floor(values.length / 2);
  const early = mean(values.slice(0, half));
  const recent = mean(values.slice(half));
  return recent - early;
}

function buildWeakModeClusters(results: ProgressResult[], limit: number): WeakModeCluster[] {
  const buckets = new Map<string, ProgressResult[]>();

  for (const result of results) {
    const mode = result.mode;
    const list = buckets.get(mode) ?? [];
    list.push(result);
    buckets.set(mode, list);
  }

  const clusters: WeakModeCluster[] = [];

  buckets.forEach((modeResults, mode) => {
    if (modeResults.length < 2) return;
    const sorted = [...modeResults].sort((a, b) => a.date.localeCompare(b.date));
    const accuracySeries = sorted.map((entry) => Math.max(0, Math.min(1, entry.accuracy)));
    const avgAccuracy = mean(accuracySeries);
    const trendDelta = signedWindowTrend(accuracySeries);
    const volatility = stdDev(accuracySeries);

    const lowerAccuracyWeight = 1 - avgAccuracy;
    const downTrendPenalty = Math.max(0, -trendDelta);
    const priorityScore = lowerAccuracyWeight * 0.68 + downTrendPenalty * 0.22 + volatility * 0.1;
    const label = (GAME_MODE_META as Record<string, { label: string } | undefined>)[mode]?.label ?? mode;

    clusters.push({
      mode,
      label,
      sessions: modeResults.length,
      avgAccuracy,
      trendDelta,
      trendLabel: classifyModeTrend(trendDelta),
      volatility,
      priorityScore,
    });
  });

  return clusters.sort((a, b) => b.priorityScore - a.priorityScore).slice(0, limit);
}

function buildMomentum(results: ProgressResult[], now: Date = new Date()): ProgressMomentum {
  const last7Start = new Date(now);
  last7Start.setDate(now.getDate() - 6);
  const prev7Start = new Date(now);
  prev7Start.setDate(now.getDate() - 13);

  const last7: ProgressResult[] = [];
  const prev7: ProgressResult[] = [];

  for (const result of results) {
    const timestamp = new Date(result.date).getTime();
    if (timestamp >= last7Start.getTime()) {
      last7.push(result);
    } else if (timestamp >= prev7Start.getTime()) {
      prev7.push(result);
    }
  }

  const last7Acc = mean(last7.map((result) => result.accuracy));
  const prev7Acc = mean(prev7.map((result) => result.accuracy));
  const last7Minutes = mean(last7.map((result) => result.timeMs / 60000));
  const prev7Minutes = mean(prev7.map((result) => result.timeMs / 60000));

  return {
    sessionsLast7: last7.length,
    sessionsPrev7: prev7.length,
    avgAccuracyLast7: last7Acc,
    avgAccuracyPrev7: prev7Acc,
    avgSessionMinutesLast7: last7Minutes,
    avgSessionMinutesPrev7: prev7Minutes,
    sessionDeltaPct: pctDelta(last7.length, prev7.length),
    accuracyDeltaPct: pctDelta(last7Acc, prev7Acc),
  };
}

/**
 * Weekly accuracy-delta magnitude (percentage points) that counts as a real
 * directional shift worth calling out in the focus tip.
 */
const MOMENTUM_SHIFT_PCT = 10;

function buildFocusTip(weakModes: WeakModeCluster[], momentum: ProgressMomentum) {
  if (!weakModes.length) {
    if (momentum.sessionsLast7 > 0) {
      return "Great balance this week. Rotate through less-played drills to keep your edge broad.";
    }
    return "No sessions yet. Start with 5-minute drills in two different modes to build a stable baseline.";
  }

  const [primary] = weakModes;
  // Use the same thresholded classification as the "By Mode" card so a mode
  // with too few sessions reads as "steady" rather than the misleading
  // "improving" the old >= 0 check produced.
  const trend = classifyModeTrend(primary.trendDelta);

  // Personalized target: pull the user toward an 85% ceiling, always ask for at
  // least a 5pp jump, and never suggest more than 95%. Whole percentage points
  // keep the tip readable ("aim for 78%" not "78.3%").
  const targetRatio = Math.min(0.95, Math.max(primary.avgAccuracy + 0.05, 0.85));
  const targetPct = Math.round(targetRatio * 100);

  const minutes = Math.max(6, Math.round((momentum.avgSessionMinutesLast7 || 8) * 0.8));

  // Fold weekly momentum direction into the coaching tone so the tip reflects
  // the user's overall trajectory, not just the single weak mode.
  const momentumShift = momentum.accuracyDeltaPct;
  let momentumClause = "";
  if (momentumShift <= -MOMENTUM_SHIFT_PCT) {
    momentumClause = " Your overall accuracy dipped this week, so protect your gains before pushing harder.";
  } else if (momentumShift >= MOMENTUM_SHIFT_PCT) {
    momentumClause = " You're trending up overall — keep the streak going.";
  }

  return `Focus next on ${primary.label}. It's ${trend}, but still your highest-impact gap. Run ${minutes}-minute reps and aim for ${targetPct}% accuracy.${momentumClause}`;
}

export function buildProgressInsights(
  results: ProgressResult[],
  topWeakModes = 3,
  now: Date = new Date(),
): ProgressInsights {
  const nowMs = now.getTime();
  const normalized = results.flatMap((result) => {
    const timestamp = Date.parse(result.date);
    if (!Number.isFinite(result.accuracy) || !Number.isFinite(timestamp) || timestamp > nowMs) {
      return [];
    }

    return [{
      ...result,
      accuracy: Math.max(0, Math.min(1, result.accuracy)),
      date: new Date(timestamp).toISOString(),
    }];
  });

  const momentum = buildMomentum(normalized, now);
  const weakModes = buildWeakModeClusters(normalized, topWeakModes);

  return {
    weakModes,
    momentum,
    focusTip: buildFocusTip(weakModes, momentum),
  };
}

export function buildDailyActivityMap(results: ProgressResult[]) {
  const activity = new Map<string, number>();
  for (const result of results) {
    const key = toDayKey(result.date);
    activity.set(key, (activity.get(key) ?? 0) + 1);
  }
  return activity;
}

// ─── Per-mode breakdown (used by the Progress "By Mode" section) ──────────────

/**
 * Build a per-mode breakdown of accuracy, trend, and recency.
 *
 * Pure and deterministic: the same input array always produces the same output
 * in the same order (sorted by mode id alphabetically). Every mode that has at
 * least one result is included; modes with no results are omitted so callers
 * can render an explicit empty state.
 */
export function buildModeBreakdown(results: ProgressResult[]): ModeBreakdownEntry[] {
  const buckets = new Map<string, ProgressResult[]>();

  for (const result of results) {
    if (!Number.isFinite(result.accuracy)) continue;
    const mode = result.mode;
    const list = buckets.get(mode) ?? [];
    list.push(result);
    buckets.set(mode, list);
  }

  const entries: ModeBreakdownEntry[] = [];

  buckets.forEach((modeResults, mode) => {
    const sorted = [...modeResults].sort((a, b) => a.date.localeCompare(b.date));
    const accuracySeries = sorted.map((entry) => Math.max(0, Math.min(1, entry.accuracy)));
    const trendDelta = signedWindowTrend(accuracySeries);
    const last = sorted[sorted.length - 1];
    const label =
      (GAME_MODE_META as Record<string, { label: string } | undefined>)[mode]?.label ?? mode;

    entries.push({
      mode,
      label,
      sessions: modeResults.length,
      avgAccuracy: mean(accuracySeries),
      bestScore: modeResults.reduce((max, r) => (r.score > max ? r.score : max), 0),
      trendDelta,
      trendLabel: classifyModeTrend(trendDelta),
      lastPlayed: last ? last.date : null,
    });
  });

  return entries.sort((a, b) => a.mode.localeCompare(b.mode));
}
