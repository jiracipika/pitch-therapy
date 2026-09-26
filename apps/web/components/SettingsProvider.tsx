"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
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

/**
 * Difficulty state seeded from the persisted per-mode setting. The stored
 * value preselects the next session's difficulty (Settings → "Default per
 * mode"), and an in-game change persists back for the following session.
 */
export function useStoredDifficulty(
  mode: string,
  fallback: Difficulty,
): [Difficulty, (d: Difficulty) => void] {
  const { settings, loaded, setDifficulty } = useSettingsContext();
  const [value, setValue] = useState<Difficulty>(fallback);

  // Apply once when persisted settings finish loading; later changes in the
  // setup screen are the player's own and must not be overwritten.
  useEffect(() => {
    if (loaded) setValue(settings.difficulty[mode] ?? fallback);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, mode]);

  const set = useCallback(
    (d: Difficulty) => {
      setValue(d);
      setDifficulty(mode, d);
    },
    [mode, setDifficulty],
  );

  return [value, set];
}
