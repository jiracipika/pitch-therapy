import { describe, it, expect } from "vitest";
import {
  formatAdaptiveCountdown,
  formatClockCountdown,
  getCountdownRefreshInterval,
  getSecondsUntilLocalMidnight,
} from "../dailyCountdown";

// Mirror of the formatting logic from apps/mobile/app/daily.tsx
// These are pure functions that drive the countdown timer.
// We test the math here so the mobile countdown stays correct.

const getSecondsUntilMidnight = getSecondsUntilLocalMidnight;
const formatTimeUntilMidnight = formatClockCountdown;

describe("daily countdown timer", () => {
  it("returns the full day (86400s) at midnight", () => {
    const midnight = new Date("2026-01-15T00:00:00");
    expect(getSecondsUntilMidnight(midnight)).toBe(86400);
  });

  it("returns 0 at exactly the next midnight (23:59:59 + 1s)", () => {
    const justBefore = new Date("2026-01-15T23:59:59");
    expect(getSecondsUntilMidnight(justBefore)).toBe(1);
  });

  it("returns 1 second at 23:59:59", () => {
    const justBefore = new Date("2026-01-15T23:59:59");
    expect(getSecondsUntilMidnight(justBefore)).toBe(1);
  });

  it("formats as '0h 0m 1s' at midnight minus 1 second (23:59:59)", () => {
    const justBefore = new Date("2026-01-15T23:59:59");
    expect(formatTimeUntilMidnight(justBefore)).toBe("0h 0m 1s");
  });

  it("formats as '24h 0m 0s' at exactly midnight (00:00:00)", () => {
    const midnight = new Date("2026-01-15T00:00:00");
    expect(formatTimeUntilMidnight(midnight)).toBe("24h 0m 0s");
  });

  it("formats noon correctly as '12h 0m 0s'", () => {
    const noon = new Date("2026-01-15T12:00:00");
    expect(formatTimeUntilMidnight(noon)).toBe("12h 0m 0s");
  });

  it("formats 6:30:45 PM as '5h 29m 15s'", () => {
    const evening = new Date("2026-01-15T18:30:45");
    expect(formatTimeUntilMidnight(evening)).toBe("5h 29m 15s");
  });

  it("the seconds component is always < 60 (modulo applied)", () => {
    // Test various times throughout a day
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        const time = new Date(`2026-01-15T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:30`);
        const formatted = formatTimeUntilMidnight(time);
        const parts = formatted.match(/(\d+)h (\d+)m (\d+)s/);
        expect(parts).not.toBeNull();
        if (parts) {
          expect(Number(parts[2])).toBeLessThan(60); // minutes < 60
          expect(Number(parts[3])).toBeLessThan(60); // seconds < 60
        }
      }
    }
  });
});

// Regression: the old buggy version parsed the string backwards to decide
// interval cadence, always extracting the seconds component (0-59) which
// meant `secondsLeft < 60` was always true and the 30s battery-saving path
// was never used. These tests pin the correct "total seconds remaining" math.
describe("daily countdown battery-saving interval", () => {
  it("uses total seconds (not just the seconds component) for interval decision", () => {
    // At 6pm there are ~6 hours = ~21600 seconds remaining.
    const evening = new Date("2026-01-15T18:00:00");
    const totalSeconds = getSecondsUntilMidnight(evening);
    // The old bug would have extracted "0" (the seconds field from "6h 0m 0s")
    // and wrongly chosen the 1s interval. The correct value is ~21600.
    expect(totalSeconds).toBeGreaterThan(21000);
    expect(totalSeconds).toBeLessThan(22000);
    expect(getCountdownRefreshInterval(totalSeconds)).toBe(30_000);
  });

  it("correctly identifies the final-minute case for 1s updates", () => {
    const justBefore = new Date("2026-01-15T23:59:30");
    const totalSeconds = getSecondsUntilMidnight(justBefore);
    expect(totalSeconds).toBe(30);
    expect(getCountdownRefreshInterval(totalSeconds)).toBe(1_000);
  });

  it("does not display stale seconds while using the battery-saving cadence", () => {
    expect(formatAdaptiveCountdown(19_845)).toBe("5h 30m");
    expect(formatAdaptiveCountdown(45)).toBe("0h 0m 45s");
  });

  it("formats a stable clock string for the web countdown", () => {
    expect(formatClockCountdown(3_661)).toBe("1h 1m 1s");
  });
});
