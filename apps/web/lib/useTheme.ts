"use client";

import { useCallback, useEffect, useState } from "react";

export type ThemeName = "paper" | "midnight";

const STORAGE_KEY = "pt:theme";

export function applyTheme(theme: ThemeName) {
  if (theme === "midnight") {
    document.documentElement.dataset.theme = "dark";
  } else {
    delete document.documentElement.dataset.theme;
  }
}

function readStoredTheme(): ThemeName {
  try {
    return localStorage.getItem(STORAGE_KEY) === "midnight" ? "midnight" : "paper";
  } catch {
    return "paper";
  }
}

/** Paper is the default; midnight ink is an explicit choice (persisted). */
export function useTheme() {
  const [theme, setTheme] = useState<ThemeName>("paper");

  useEffect(() => {
    const stored = readStoredTheme();
    setTheme(stored);
    applyTheme(stored);
  }, []);

  const updateTheme = useCallback((next: ThemeName) => {
    setTheme(next);
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private mode — theme just won't persist */
    }
  }, []);

  return { theme, setTheme: updateTheme };
}
