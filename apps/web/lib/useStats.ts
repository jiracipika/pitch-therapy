"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { calculateStreak, calculateLongestStreak } from "@pitch-therapy/core";

/* ── Types ── */

export interface GameResult {
  mode: string;
  score: number;
  accuracy: number; // 0–1
  rounds: number;
  date: string; // ISO
  timeMs: number;
}

export interface ModeStats {
  gamesPlayed: number;
  bestScore: number;
  avgAccuracy: number;
  lastPlayed: string | null;
}

export interface UserStats {
  results: GameResult[];
  /** Current consecutive-day streak, anchored to today/yesterday. */
  streak: number;
  /** Longest run of consecutive days ever recorded. */
  bestStreak: number;
  /** YYYY-MM-DD of the most recent session, or null. */
  lastPlayDate: string | null;
  dailyCompleted: string[]; // YYYY-MM-DD list of completed dailies
}

const STORAGE_KEY = "pitch-therapy-stats";
const MAX_STORED_RESULTS = 500;

interface PersistedStats {
  results: GameResult[];
  dailyCompleted: string[];
}

const DEFAULT_PERSISTED: PersistedStats = {
  results: [],
  dailyCompleted: [],
};

function loadPersisted(): PersistedStats {
  if (typeof window === "undefined") return DEFAULT_PERSISTED;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PERSISTED;
    const parsed = JSON.parse(raw) as Partial<PersistedStats> & {
      // Legacy fields kept for back-compat — migrated/derived on load.
      streak?: number;
      bestStreak?: number;
      lastPlayDate?: string | null;
    };
    return {
      results: Array.isArray(parsed.results) ? parsed.results : [],
      dailyCompleted: Array.isArray(parsed.dailyCompleted) ? parsed.dailyCompleted : [],
    };
  } catch {
    return DEFAULT_PERSISTED;
  }
}

function savePersisted(stats: PersistedStats) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // quota exceeded — trim old results
    const trimmed: PersistedStats = { ...stats, results: stats.results.slice(-200) };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {}
  }
}

/** Extract the YYYY-MM-DD day key from an ISO timestamp. */
function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

/* ── Derived stats (pure) ── */

/**
 * Build the full UserStats view from the persisted results + dailyCompleted.
 * streak / bestStreak / lastPlayDate are *derived* from session history using
 * the canonical, DST-safe @pitch-therapy/core functions, so they can never
 * drift out of sync with the results array.
 */
function deriveStats(persisted: PersistedStats): UserStats {
  const { results, dailyCompleted } = persisted;

  if (results.length === 0) {
    return {
      results,
      dailyCompleted,
      streak: 0,
      bestStreak: 0,
      lastPlayDate: null,
    };
  }

  const dayKeys = results.map((r) => dayKey(r.date));
  const lastPlayDate = dayKeys.reduce((latest, key) => (key > latest ? key : latest), dayKeys[0]!);

  return {
    results,
    dailyCompleted,
    streak: calculateStreak(dayKeys),
    bestStreak: calculateLongestStreak(dayKeys),
    lastPlayDate,
  };
}

/* ── Hook ── */

export function useStats() {
  const [persisted, setPersisted] = useState<PersistedStats>(DEFAULT_PERSISTED);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setPersisted(loadPersisted());
    setLoaded(true);
  }, []);

  const stats = useMemo(() => deriveStats(persisted), [persisted]);

  const recordResult = useCallback((result: GameResult) => {
    setPersisted((prev) => {
      const updated: PersistedStats = {
        results: [...prev.results, result].slice(-MAX_STORED_RESULTS),
        dailyCompleted: prev.dailyCompleted,
      };
      savePersisted(updated);
      return updated;
    });
  }, []);

  const markDailyCompleted = useCallback(() => {
    setPersisted((prev) => {
      const today = new Date().toISOString().slice(0, 10);
      if (prev.dailyCompleted.includes(today)) return prev;
      const updated: PersistedStats = { ...prev, dailyCompleted: [...prev.dailyCompleted, today] };
      savePersisted(updated);
      return updated;
    });
  }, []);

  const getModeStats = useCallback(
    (mode: string): ModeStats => {
      const modeResults = stats.results.filter((r) => r.mode === mode);
      if (modeResults.length === 0) {
        return { gamesPlayed: 0, bestScore: 0, avgAccuracy: 0, lastPlayed: null };
      }
      const lastResult = modeResults[modeResults.length - 1] ?? null;
      return {
        gamesPlayed: modeResults.length,
        bestScore: Math.max(...modeResults.map((r) => r.score)),
        avgAccuracy: modeResults.reduce((s, r) => s + r.accuracy, 0) / modeResults.length,
        lastPlayed: lastResult?.date ?? null,
      };
    },
    [stats],
  );

  const clearStats = useCallback(() => {
    setPersisted(DEFAULT_PERSISTED);
    savePersisted(DEFAULT_PERSISTED);
  }, []);

  return { stats, loaded, recordResult, markDailyCompleted, getModeStats, clearStats };
}
