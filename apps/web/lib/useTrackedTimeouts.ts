"use client";

import { useEffect, useRef } from "react";

/**
 * Tracks setTimeout ids so ALL pending timeouts can be cleared on unmount.
 * Prevents feedback/audio timers from firing after back navigation.
 */
export function useTrackedTimeouts() {
  const idsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const intervalIdsRef = useRef<ReturnType<typeof setInterval>[]>([]);

  function trackTimeout(
    fn: () => void,
    delay: number,
  ): ReturnType<typeof setTimeout> {
    const id = setTimeout(() => {
      idsRef.current = idsRef.current.filter((t) => t !== id);
      fn();
    }, delay);
    idsRef.current.push(id);
    return id;
  }

  function trackInterval(
    fn: () => void,
    delay: number,
  ): ReturnType<typeof setInterval> {
    const id = setInterval(fn, delay);
    intervalIdsRef.current.push(id);
    return id;
  }

  function clearAllTimeouts() {
    idsRef.current.forEach((t) => clearTimeout(t));
    idsRef.current = [];
    intervalIdsRef.current.forEach((t) => clearInterval(t));
    intervalIdsRef.current = [];
  }

  useEffect(() => clearAllTimeouts, []);

  return { trackTimeout, trackInterval, clearAllTimeouts };
}
