import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from 'expo-sqlite/kv-store';
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

function dailyKey(userId: string, date: string): string {
  return `daily_${userId}_${date}`;
}

const STREAK_KEY_PREFIX = 'daily_streak_';

function streakKey(userId: string): string {
  return `${STREAK_KEY_PREFIX}${userId}`;
}

// AsyncStorage getItem/setItem are async, but this hook previously used a
// synchronous globalThis cache. We keep an in-memory cache layered on top of
// AsyncStorage so reads are synchronous (for initial useState) and writes
// persist across app restarts. The cache is populated during the effect.

const dailyCache = new Map<string, DailyChallengeState>();
const streakCache = new Map<string, string[]>();

async function loadDailyFromStorage(
  userId: string,
  date: string,
): Promise<DailyChallengeState | null> {
  const cacheKey = dailyKey(userId, date);
  const cached = dailyCache.get(cacheKey);
  if (cached) return cached;
  try {
    const raw = await AsyncStorage.getItem(cacheKey);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DailyChallengeState>;
      if (parsed?.date === date) {
        return parsed as DailyChallengeState;
      }
    }
  } catch {
    // Corrupt or missing — start fresh
  }
  return null;
}

async function saveDailyToStorage(userId: string, state: DailyChallengeState) {
  const cacheKey = dailyKey(userId, state.date);
  dailyCache.set(cacheKey, state);
  try {
    await AsyncStorage.setItem(cacheKey, JSON.stringify(state));
  } catch {
    // Persistence failure shouldn't crash the app
  }
}

async function loadStreakFromStorage(userId: string): Promise<string[]> {
  const key = streakKey(userId);
  const cached = streakCache.get(key);
  if (cached) return cached;
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as string[];
      if (Array.isArray(parsed)) {
        streakCache.set(key, parsed);
        return parsed;
      }
    }
  } catch {
    // Corrupt or missing
  }
  return [];
}

async function saveStreakToStorage(userId: string, dates: string[]) {
  const key = streakKey(userId);
  streakCache.set(key, dates);
  try {
    await AsyncStorage.setItem(key, JSON.stringify(dates));
  } catch {
    // Persistence failure shouldn't crash the app
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useDailyChallenge(userId?: string) {
  const seed = getDailySeed();
  const today = todayDateString();
  const uid = userId ?? 'anonymous';

  const defaultState: DailyChallengeState = {
    date: today,
    seed,
    modes: ['note-wordle', 'frequency-wordle'],
    completed: { 'note-wordle': false, 'frequency-wordle': false },
    scores: { 'note-wordle': null, 'frequency-wordle': null },
    streak: 0,
    allCompleted: false,
  };

  const [state, setState] = useState<DailyChallengeState>(defaultState);

  // Hydrate from AsyncStorage on mount
  useEffect(() => {
    let active = true;
    (async () => {
      const stored = await loadDailyFromStorage(uid, today);
      if (!active || !stored) return;

      const allDone =
        (stored.completed['note-wordle'] ?? false) &&
        (stored.completed['frequency-wordle'] ?? false);

      setState({
        ...defaultState,
        completed: { ...defaultState.completed, ...stored.completed },
        scores: { ...defaultState.scores, ...stored.scores },
        streak: stored.streak ?? 0,
        allCompleted: allDone,
      });
    })();

    // Load streak from history
    (async () => {
      const dates = await loadStreakFromStorage(uid);
      if (!active || dates.length === 0) return;

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

      if (active) {
        setState((s) => ({ ...s, streak }));
      }
    })();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, today]);

  const markCompleted = useCallback(
    (mode: DailyMode, score: number) => {
      setState((prev) => {
        const newCompleted = { ...prev.completed, [mode]: true };
        const newScores = { ...prev.scores, [mode]: score };
        const allDone = newCompleted['note-wordle'] && newCompleted['frequency-wordle'];

        let newStreak = prev.streak;
        if (allDone && !prev.allCompleted) {
          newStreak = prev.streak + 1;
          void (async () => {
            const dates = await loadStreakFromStorage(uid);
            if (!dates.includes(today)) dates.push(today);
            void saveStreakToStorage(uid, dates);
          })();
        }

        const next: DailyChallengeState = {
          ...prev,
          completed: newCompleted,
          scores: newScores,
          streak: newStreak,
          allCompleted: allDone,
        };
        void saveDailyToStorage(uid, next);
        return next;
      });
    },
    [uid, today],
  );

  return { ...state, markCompleted };
}
