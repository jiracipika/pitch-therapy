'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useStats, type UserStats, type GameResult, type ModeStats } from '@/lib/useStats';

interface StatsContextValue {
  stats: UserStats;
  loaded: boolean;
  recordResult: (result: GameResult) => void;
  markDailyCompleted: () => void;
  getModeStats: (mode: string) => ModeStats;
  clearStats: () => void;
}

const StatsContext = createContext<StatsContextValue | null>(null);

export function StatsProvider({ children }: { children: ReactNode }) {
  const value = useStats();
  return <StatsContext.Provider value={value}>{children}</StatsContext.Provider>;
}

export function useStatsContext() {
  const ctx = useContext(StatsContext);
  if (!ctx) throw new Error('useStatsContext must be used inside StatsProvider');
  return ctx;
}
