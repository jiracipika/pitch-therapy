import { useState, useCallback, useEffect } from 'react';
import { getDailySeed, todayDateString } from '@pitch-therapy/core';

// ─── Types ───────────────────────────────────────────────────────────────────

export type DailyMode = 'note-wordle' | 'frequency-wordle';

export interface DailyChallengeState {
  date: string;
  seed: { note: string; frequency: number };
  modes: DailyMode[];
  completed: Record<DailyMode, boolean>;
  scores: Record<DailyMode, number | null>;
  streak: number;
  allCompleted: boolean;
}

// ─── Storage ─────────────────────────────────────────────────────────────────

function loadFromStorage(userId: string): Partial<DailyChallengeState> | null {
  try {
    const key = `daily_${userId}_${todayDateString()}`;
    const stored = globalThis.__dailyCache?.[key];
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
}

function saveToStorage(userId: string, state: DailyChallengeState) {
  try {
    if (!globalThis.__dailyCache) globalThis.__dailyCache = {};
    const key = `daily_${userId}_${state.date}`;
    globalThis.__dailyCache[key] = JSON.stringify({
      date: state.date,
      completed: state.completed,
      scores: state.scores,
      streak: state.streak,
    });
  } catch {}
}

function loadStreakFromStorage(userId: string): string[] {
  try {
    if (!globalThis.__streakCache) globalThis.__streakCache = {};
    return globalThis.__streakCache[userId] ?? [];
  } catch {}
  return [];
}

function saveStreakToStorage(userId: string, dates: string[]) {
  try {
    if (!globalThis.__streakCache) globalThis.__streakCache = {};
    globalThis.__streakCache[userId] = dates;
  } catch {}
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useDailyChallenge(userId?: string) {
  const seed = getDailySeed();
  const today = todayDateString();

  const uid = userId ?? 'anonymous';

  const [state, setState] = useState<DailyChallengeState>(() => {
    const stored = loadFromStorage(uid);
    const defaultState: DailyChallengeState = {
      date: today,
      seed,
      modes: ['note-wordle', 'frequency-wordle'],
      completed: { 'note-wordle': false, 'frequency-wordle': false },
      scores: { 'note-wordle': null, 'frequency-wordle': null },
      streak: 0,
      allCompleted: false,
    };

    if (stored?.date === today) {
      return {
        ...defaultState,
        completed: { ...defaultState.completed, ...stored.completed },
        scores: { ...defaultState.scores, ...stored.scores },
        streak: stored.streak ?? 0,
        allCompleted: (stored.completed?.['note-wordle'] ?? false) && (stored.completed?.['frequency-wordle'] ?? false),
      };
    }
    return defaultState;
  });

  // Load streak from history
  useEffect(() => {
    const dates = loadStreakFromStorage(uid);
    if (dates.length === 0) return;

    let streak = 0;
    const sorted = [...new Set(dates)].sort().reverse();
    const yesterday = new Date(Date.now() - 86400000);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    if (sorted[0] === today || sorted[0] === yesterdayStr) {
      streak = 1;
      for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1]!);
        const curr = new Date(sorted[i]!);
        const diff = (prev.getTime() - curr.getTime()) / 86400000;
        if (Math.abs(diff - 1) < 0.01) streak++;
        else break;
      }
    }

    setState((s) => ({ ...s, streak }));
  }, [uid, today]);

  const markCompleted = useCallback((mode: DailyMode, score: number) => {
    setState((prev) => {
      const newCompleted = { ...prev.completed, [mode]: true };
      const newScores = { ...prev.scores, [mode]: score };
      const allDone = newCompleted['note-wordle'] && newCompleted['frequency-wordle'];

      // Update streak if all completed
      let newStreak = prev.streak;
      if (allDone && !prev.allCompleted) {
        newStreak = prev.streak + 1;
        const dates = loadStreakFromStorage(uid);
        if (!dates.includes(today)) dates.push(today);
        saveStreakToStorage(uid, dates);
      }

      const next: DailyChallengeState = {
        ...prev,
        completed: newCompleted,
        scores: newScores,
        streak: newStreak,
        allCompleted: allDone,
      };
      saveToStorage(uid, next);
      return next;
    });
  }, [uid, today]);

  return { ...state, markCompleted };
}

// ─── Global cache types ──────────────────────────────────────────────────────

declare global {
  var __dailyCache: Record<string, string> | undefined;
  var __streakCache: Record<string, string[]> | undefined;
}
