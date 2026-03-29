'use client';

import { useState, useEffect, useCallback } from 'react';

/* ── Types ── */

export interface GameResult {
  mode: string;
  score: number;
  accuracy: number;   // 0–1
  rounds: number;
  date: string;       // ISO
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
  streak: number;
  bestStreak: number;
  lastPlayDate: string | null;  // YYYY-MM-DD
  dailyCompleted: string[];     // YYYY-MM-DD list of completed dailies
}

const STORAGE_KEY = 'pitch-therapy-stats';

const DEFAULT_STATS: UserStats = {
  results: [],
  streak: 0,
  bestStreak: 0,
  lastPlayDate: null,
  dailyCompleted: [],
};

function loadStats(): UserStats {
  if (typeof window === 'undefined') return DEFAULT_STATS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATS;
    return { ...DEFAULT_STATS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATS;
  }
}

function saveStats(stats: UserStats) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // quota exceeded — trim old results
    const trimmed = { ...stats, results: stats.results.slice(-200) };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed)); } catch {}
  }
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/* ── Hook ── */

export function useStats() {
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setStats(loadStats());
    setLoaded(true);
  }, []);

  const recordResult = useCallback((result: GameResult) => {
    setStats((prev) => {
      const today = todayStr();
      const yesterday = yesterdayStr();

      // Calculate streak
      let newStreak = prev.streak;
      if (prev.lastPlayDate === today) {
        // Already played today, streak stays
      } else if (prev.lastPlayDate === yesterday) {
        newStreak = prev.streak + 1;
      } else {
        newStreak = 1;
      }

      const updated: UserStats = {
        results: [...prev.results, result],
        streak: newStreak,
        bestStreak: Math.max(prev.bestStreak, newStreak),
        lastPlayDate: today,
        dailyCompleted: prev.dailyCompleted,
      };

      saveStats(updated);
      return updated;
    });
  }, []);

  const markDailyCompleted = useCallback(() => {
    setStats((prev) => {
      const today = todayStr();
      if (prev.dailyCompleted.includes(today)) return prev;
      const updated = { ...prev, dailyCompleted: [...prev.dailyCompleted, today] };
      saveStats(updated);
      return updated;
    });
  }, []);

  const getModeStats = useCallback((mode: string): ModeStats => {
    const modeResults = stats.results.filter((r) => r.mode === mode);
    if (modeResults.length === 0) {
      return { gamesPlayed: 0, bestScore: 0, avgAccuracy: 0, lastPlayed: null };
    }
    return {
      gamesPlayed: modeResults.length,
      bestScore: Math.max(...modeResults.map((r) => r.score)),
      avgAccuracy: modeResults.reduce((s, r) => s + r.accuracy, 0) / modeResults.length,
      lastPlayed: modeResults[modeResults.length - 1].date,
    };
  }, [stats]);

  const clearStats = useCallback(() => {
    setStats(DEFAULT_STATS);
    saveStats(DEFAULT_STATS);
  }, []);

  return { stats, loaded, recordResult, markDailyCompleted, getModeStats, clearStats };
}
