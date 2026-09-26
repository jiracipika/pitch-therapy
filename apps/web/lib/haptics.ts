"use client";

import { DEFAULT_SETTINGS, STORAGE_KEY } from "@/lib/useSettings";

/**
 * Answer feedback vibration for devices that support it (Android Chrome).
 * Reads the persisted haptics setting directly — the same pattern lib/audio
 * uses for sound settings — so game pages can call this from plain event
 * handlers without threading a settings hook through them.
 */
function hapticsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS.haptics;
    const parsed = JSON.parse(raw) as { haptics?: unknown };
    return typeof parsed.haptics === "boolean" ? parsed.haptics : DEFAULT_SETTINGS.haptics;
  } catch {
    return DEFAULT_SETTINGS.haptics;
  }
}

/** Short pulse for correct answers, double pulse for wrong ones. */
export function answerHaptic(correct: boolean): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  if (!hapticsEnabled()) return;
  try {
    navigator.vibrate(correct ? 30 : [50, 40, 50]);
  } catch {
    // Some browsers throw on disallowed patterns — feedback is optional.
  }
}
