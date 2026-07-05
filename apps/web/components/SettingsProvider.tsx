"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  useSettings,
  type WebSettings,
  type Difficulty,
  type SoundType,
} from "@/lib/useSettings";

interface SettingsContextValue {
  settings: WebSettings;
  loaded: boolean;
  setSound: (sound: boolean) => void;
  setHaptics: (haptics: boolean) => void;
  setSoundType: (soundType: SoundType) => void;
  setVolume: (volume: number) => void;
  setDifficulty: (mode: string, diff: Difficulty) => void;
  applyPreset: (preset: "focus" | "coach" | "quiet") => void;
  resetToDefaults: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const value = useSettings();
  const memoized = useMemo(() => value, [value]);
  return <SettingsContext.Provider value={memoized}>{children}</SettingsContext.Provider>;
}

export function useSettingsContext(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettingsContext must be used inside SettingsProvider");
  return ctx;
}
