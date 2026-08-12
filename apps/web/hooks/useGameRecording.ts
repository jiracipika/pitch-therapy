"use client";

import { useCallback, useRef } from "react";
import { useStatsContext } from "@/components/StatsProvider";
import type { GameResult } from "@/lib/useStats";

/**
 * Encapsulates the `recordedRef` + `recordResult` dedup pattern duplicated
 * in every game page's `phase === "done"` useEffect.
 *
 * Usage:
 * ```ts
 * const { recordedRef, recordGame } = useGameRecording("note-id");
 *
 * useEffect(() => {
 *   if (phase !== "done") {
 *     recordedRef.current = false;
 *     return;
 *   }
 *   recordGame({
 *     score,
 *     accuracy: correctCount / totalRounds,
 *     rounds: totalRounds,
 *     timeMs: totalRounds * 5000,
 *   });
 * }, [phase, recordGame]);
 * ```
 *
 * The hook fills in `mode` and `date` automatically; callers only provide
 * `score`, `accuracy`, `rounds`, and `timeMs`.
 */
export function useGameRecording(mode: string) {
  const { recordResult } = useStatsContext();
  const recordedRef = useRef(false);

  const recordGame = useCallback(
    (result: Omit<GameResult, "mode" | "date">) => {
      if (recordedRef.current) return;
      recordedRef.current = true;
      recordResult({
        ...result,
        mode,
        date: new Date().toISOString(),
      });
    },
    [mode, recordResult],
  );

  return { recordedRef, recordGame };
}
