// ─── Session Results Persistence (mobile) ───────────────────────────────────
//
// Mirrors the web app's useStats hook: game results are persisted to
// AsyncStorage so the Progress screen can display real stats, streaks,
// achievements, and insights instead of static zeroes.
//
// Uses the same useSyncExternalStore pattern as lib/settings.ts for
// synchronous reads with async hydration, so the UI never blocks on storage.

import AsyncStorage from 'expo-sqlite/kv-store';
import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import {
  calculateLongestStreak,
  calculateStreak,
  type ProgressResult,
} from '@pitch-therapy/core';

const STORAGE_KEY = 'pitch_therapy_session_results_v1';
const MAX_STORED_RESULTS = 500;

export interface SessionResult extends ProgressResult {
  /** ISO timestamp of when the session ended. */
  date: string;
}

export interface SessionStats {
  results: SessionResult[];
  totalSessions: number;
  totalCorrect: number;
  bestScore: number;
  avgAccuracy: number;
  /** Current consecutive-day streak, anchored to today/yesterday. */
  streak: number;
  /** Longest run of consecutive days ever recorded. */
  bestStreak: number;
  /** YYYY-MM-DD of the most recent session, or null. */
  lastPlayDate: string | null;
}

const EMPTY_STATS: SessionStats = {
  results: [],
  totalSessions: 0,
  totalCorrect: 0,
  bestScore: 0,
  avgAccuracy: 0,
  streak: 0,
  bestStreak: 0,
  lastPlayDate: null,
};

// ─── External store (module-level singleton) ─────────────────────────────────

let cachedResults: SessionResult[] = [];
let isHydrated = false;
let hydratePromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function deriveStats(results: SessionResult[]): SessionStats {
  if (results.length === 0) return { ...EMPTY_STATS, results: [] };

  const dayKeys = results.map((r) => r.date.slice(0, 10));
  const lastPlayDate = dayKeys.reduce((latest, key) => (key > latest ? key : latest), dayKeys[0]!);

  const totalCorrect = Math.round(
    results.reduce((sum, r) => sum + r.accuracy * r.rounds, 0),
  );
  const totalRounds = results.reduce((sum, r) => sum + r.rounds, 0);

  return {
    results,
    totalSessions: results.length,
    totalCorrect,
    bestScore: Math.max(...results.map((r) => r.score)),
    avgAccuracy: totalRounds > 0 ? totalCorrect / totalRounds : 0,
    streak: calculateStreak(dayKeys),
    bestStreak: calculateLongestStreak(dayKeys),
    lastPlayDate,
  };
}

let cachedStats: SessionStats = EMPTY_STATS;

function recomputeStats() {
  cachedStats = deriveStats(cachedResults);
}

async function hydrate() {
  if (isHydrated) return;
  if (hydratePromise) return hydratePromise;

  hydratePromise = (async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SessionResult[];
        if (Array.isArray(parsed)) {
          cachedResults = parsed.slice(-MAX_STORED_RESULTS);
          recomputeStats();
          notify();
        }
      }
    } catch {
      // Corrupt data — start fresh.
      cachedResults = [];
      recomputeStats();
    } finally {
      isHydrated = true;
      hydratePromise = null;
    }
  })();

  return hydratePromise;
}

function persist(results: SessionResult[]) {
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(results)).catch(() => {
    // Keep UI responsive even when persistence fails.
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): SessionStats {
  return cachedStats;
}

function getServerSnapshot(): SessionStats {
  return EMPTY_STATS;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * React hook that provides access to persisted session results.
 *
 * On first mount it hydrates from AsyncStorage. Returns live-derived stats
 * that update whenever a new result is recorded via `recordResult`.
 */
export function useSessionResults() {
  const stats = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    void hydrate();
  }, []);

  const recordResult = useCallback((result: Omit<SessionResult, 'date'> & { date?: string }) => {
    const entry: SessionResult = {
      ...result,
      date: result.date ?? new Date().toISOString(),
    };
    cachedResults = [...cachedResults, entry].slice(-MAX_STORED_RESULTS);
    recomputeStats();
    persist(cachedResults);
    notify();
  }, []);

  const clearResults = useCallback(() => {
    cachedResults = [];
    recomputeStats();
    persist([]);
    notify();
  }, []);

  return { stats, recordResult, clearResults };
}

/**
 * Compute per-mode stats from a results array (pure, no subscription).
 * Used by the Progress screen's "By Mode" section.
 */
export function getModeStats(results: SessionResult[], mode: string) {
  const modeResults = results.filter((r) => r.mode === mode);
  if (modeResults.length === 0) {
    return { sessions: 0, bestScore: 0, avgAccuracy: 0 };
  }
  return {
    sessions: modeResults.length,
    bestScore: Math.max(...modeResults.map((r) => r.score)),
    avgAccuracy: modeResults.reduce((s, r) => s + r.accuracy, 0) / modeResults.length,
  };
}
