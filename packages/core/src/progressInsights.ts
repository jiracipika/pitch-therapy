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
  trendDelta: number;
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

function buildFocusTip(weakModes: WeakModeCluster[], momentum: ProgressMomentum) {
  if (!weakModes.length) {
    if (momentum.sessionsLast7 > 0) {
      return "Great balance this week. Rotate through less-played drills to keep your edge broad.";
    }
    return "No sessions yet. Start with 5-minute drills in two different modes to build a stable baseline.";
  }

  const [primary] = weakModes;
  const trend = primary.trendDelta >= 0 ? "improving" : "slipping";
  const minutes = Math.max(6, Math.round((momentum.avgSessionMinutesLast7 || 8) * 0.8));
  return `Focus next on ${primary.label}. It is ${trend}, but still your highest-impact gap. Run ${minutes}-minute reps and aim for +4% accuracy.`;
}

export function buildProgressInsights(
  results: ProgressResult[],
  topWeakModes = 3,
  now: Date = new Date(),
): ProgressInsights {
  const normalized = results
    .filter((result) => Number.isFinite(result.accuracy))
    .map((result) => ({
      ...result,
      accuracy: Math.max(0, Math.min(1, result.accuracy)),
      date: result.date || new Date().toISOString(),
    }));

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
