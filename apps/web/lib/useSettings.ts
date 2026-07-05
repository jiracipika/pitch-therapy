"use client";

import { useCallback, useEffect, useState } from "react";

/* ── Types ── */

export type Difficulty = "easy" | "medium" | "hard";
export type SoundType = "sine" | "triangle" | "square" | "sawtooth";

export interface WebSettings {
  sound: boolean;
  haptics: boolean;
  soundType: SoundType;
  volume: number; // 0–100
  difficulty: Record<string, Difficulty>;
}

/* ── Constants ── */

const STORAGE_KEY = "pitch-therapy-settings-v1";

export const SETTINGS_MODE_IDS = [
  "pitch-match",
  "note-id",
  "frequency-guess",
  "note-wordle",
  "frequency-wordle",
] as const;

const DEFAULT_DIFFICULTY: Record<string, Difficulty> = Object.fromEntries(
  SETTINGS_MODE_IDS.map((id) => [id, "medium"]),
);

export const DEFAULT_SETTINGS: WebSettings = {
  sound: true,
  haptics: true,
  soundType: "sine",
  volume: 70,
  difficulty: { ...DEFAULT_DIFFICULTY },
};

/* ── Persistence ── */

function normalizeSettings(raw: unknown): WebSettings {
  if (typeof raw !== "object" || raw === null) return { ...DEFAULT_SETTINGS };
  const partial = raw as Partial<WebSettings> & Record<string, unknown>;

  const validSoundTypes: SoundType[] = ["sine", "triangle", "square", "sawtooth"];
  const soundType = validSoundTypes.includes(partial.soundType as SoundType)
    ? (partial.soundType as SoundType)
    : DEFAULT_SETTINGS.soundType;

  const rawDiff = partial.difficulty;
  const difficulty: Record<string, Difficulty> = { ...DEFAULT_DIFFICULTY };
  if (typeof rawDiff === "object" && rawDiff !== null) {
    for (const [key, val] of Object.entries(rawDiff)) {
      if (val === "easy" || val === "medium" || val === "hard") {
        difficulty[key] = val;
      }
    }
  }

  return {
    sound: typeof partial.sound === "boolean" ? partial.sound : DEFAULT_SETTINGS.sound,
    haptics: typeof partial.haptics === "boolean" ? partial.haptics : DEFAULT_SETTINGS.haptics,
    soundType,
    volume:
      typeof partial.volume === "number" && partial.volume >= 0 && partial.volume <= 100
        ? partial.volume
        : DEFAULT_SETTINGS.volume,
    difficulty,
  };
}

function loadSettings(): WebSettings {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return normalizeSettings(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(settings: WebSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage full or unavailable — settings stay in-memory for the session.
  }
}

/* ── Hook ── */

export function useSettings() {
  const [settings, setSettings] = useState<WebSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
    setLoaded(true);

    // Sync across tabs/windows when settings change elsewhere.
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setSettings(normalizeSettings(JSON.parse(e.newValue)));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const update = useCallback((patch: Partial<WebSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  const setSound = useCallback((sound: boolean) => update({ sound }), [update]);
  const setHaptics = useCallback((haptics: boolean) => update({ haptics }), [update]);
  const setSoundType = useCallback((soundType: SoundType) => update({ soundType }), [update]);
  const setVolume = useCallback((volume: number) => update({ volume }), [update]);
  const setDifficulty = useCallback(
    (mode: string, diff: Difficulty) => {
      setSettings((prev) => {
        const next = { ...prev, difficulty: { ...prev.difficulty, [mode]: diff } };
        saveSettings(next);
        return next;
      });
    },
    [],
  );

  const applyPreset = useCallback(
    (preset: "focus" | "coach" | "quiet") => {
      if (preset === "focus") {
        update({ sound: true, haptics: true, soundType: "triangle", volume: 72 });
      } else if (preset === "coach") {
        update({ sound: true, haptics: true, soundType: "sine", volume: 82 });
      } else {
        update({ sound: false, haptics: false, soundType: "sine", volume: 35 });
      }
    },
    [update],
  );

  const resetToDefaults = useCallback(() => {
    const next = { ...DEFAULT_SETTINGS, difficulty: { ...DEFAULT_DIFFICULTY } };
    saveSettings(next);
    setSettings(next);
  }, []);

  return {
    settings,
    loaded,
    setSound,
    setHaptics,
    setSoundType,
    setVolume,
    setDifficulty,
    applyPreset,
    resetToDefaults,
  };
}
