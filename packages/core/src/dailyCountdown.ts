/** Pure countdown helpers shared by web and native daily challenge screens. */

export const COUNTDOWN_FINE_GRAIN_THRESHOLD_SECONDS = 60;

/** Returns whole seconds until the next local midnight. */
export function getSecondsUntilLocalMidnight(from = new Date()): number {
  const midnight = new Date(from);
  midnight.setHours(24, 0, 0, 0);
  return Math.max(0, Math.floor((midnight.getTime() - from.getTime()) / 1000));
}

function resolveSeconds(value: number | Date): number {
  return value instanceof Date
    ? getSecondsUntilLocalMidnight(value)
    : Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
}

/** Full h/m/s display for a timer that refreshes every second. */
export function formatClockCountdown(value: number | Date): string {
  const seconds = resolveSeconds(value);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return `${hours}h ${minutes}m ${remainder}s`;
}

/**
 * Battery-friendly display: hide seconds while the refresh cadence is coarse,
 * then reveal them for the final minute when updates run every second.
 */
export function formatAdaptiveCountdown(value: number | Date): string {
  const seconds = resolveSeconds(value);
  if (seconds < COUNTDOWN_FINE_GRAIN_THRESHOLD_SECONDS) {
    return formatClockCountdown(seconds);
  }

  const wholeMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(wholeMinutes / 60);
  const minutes = wholeMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export function getCountdownRefreshInterval(secondsRemaining: number): 1_000 | 30_000 {
  return secondsRemaining < COUNTDOWN_FINE_GRAIN_THRESHOLD_SECONDS ? 1_000 : 30_000;
}
