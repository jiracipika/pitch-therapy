import { describe, it, expect, vi, afterEach } from "vitest";
import { calculateStreak, todayDateString, getDailySeed } from "../dailyChallenge";

afterEach(() => {
  vi.useRealTimers();
});

describe("todayDateString", () => {
  it("returns YYYY-MM-DD format", () => {
    vi.setSystemTime(new Date("2026-07-03T10:30:00"));
    expect(todayDateString()).toBe("2026-07-03");
  });

  it("zero-pads month and day", () => {
    vi.setSystemTime(new Date("2026-01-05T08:00:00"));
    expect(todayDateString()).toBe("2026-01-05");
  });
});

describe("calculateStreak", () => {
  it("returns 0 for empty array", () => {
    expect(calculateStreak([])).toBe(0);
  });

  it("returns 0 if most recent date is neither today nor yesterday", () => {
    vi.setSystemTime(new Date("2026-07-10T12:00:00"));
    expect(calculateStreak(["2026-07-05", "2026-07-04"])).toBe(0);
  });

  it("counts a 1-day streak for today only", () => {
    vi.setSystemTime(new Date("2026-07-10T12:00:00"));
    expect(calculateStreak(["2026-07-10"])).toBe(1);
  });

  it("counts consecutive days ending today", () => {
    vi.setSystemTime(new Date("2026-07-10T12:00:00"));
    expect(calculateStreak(["2026-07-10", "2026-07-09", "2026-07-08"])).toBe(3);
  });

  it("counts consecutive days ending yesterday (grace period)", () => {
    vi.setSystemTime(new Date("2026-07-10T12:00:00"));
    expect(calculateStreak(["2026-07-09", "2026-07-08", "2026-07-07"])).toBe(3);
  });

  it("stops at a gap", () => {
    vi.setSystemTime(new Date("2026-07-10T12:00:00"));
    expect(calculateStreak(["2026-07-10", "2026-07-09", "2026-07-05"])).toBe(2);
  });

  it("handles unsorted input", () => {
    vi.setSystemTime(new Date("2026-07-10T12:00:00"));
    expect(calculateStreak(["2026-07-08", "2026-07-10", "2026-07-09"])).toBe(3);
  });

  it("deduplicates dates", () => {
    vi.setSystemTime(new Date("2026-07-10T12:00:00"));
    expect(calculateStreak(["2026-07-10", "2026-07-10", "2026-07-09"])).toBe(2);
  });

  it("returns 1 for a single day matching today", () => {
    vi.setSystemTime(new Date("2026-07-10T12:00:00"));
    expect(calculateStreak(["2026-07-10"])).toBe(1);
  });

  it("returns 0 for a single day that is too old", () => {
    vi.setSystemTime(new Date("2026-07-10T12:00:00"));
    expect(calculateStreak(["2026-07-01"])).toBe(0);
  });

  it("handles a long streak across month boundary", () => {
    vi.setSystemTime(new Date("2026-08-02T12:00:00"));
    // Jul 31 → Aug 1 → Aug 2
    expect(calculateStreak(["2026-08-02", "2026-08-01", "2026-07-31"])).toBe(3);
  });
});

describe("getDailySeed (dailyChallenge)", () => {
  it("is deterministic for the same date", () => {
    const a = getDailySeed(new Date(2026, 6, 4));
    const b = getDailySeed(new Date(2026, 6, 4));
    expect(a).toEqual(b);
  });

  it("returns a valid note name from the chromatic scale", () => {
    const validNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    for (let month = 0; month < 12; month++) {
      const seed = getDailySeed(new Date(2026, month, 15));
      expect(validNotes).toContain(seed.note);
    }
  });

  it("produces different seeds for consecutive days", () => {
    const seeds = [
      getDailySeed(new Date(2026, 0, 1)),
      getDailySeed(new Date(2026, 0, 2)),
      getDailySeed(new Date(2026, 0, 3)),
    ];
    // At least 2 of 3 consecutive days should differ
    const unique = new Set(seeds.map((s) => `${s.note}@${s.frequency}`));
    expect(unique.size).toBeGreaterThanOrEqual(2);
  });

  it("produces frequency in a reasonable audible range", () => {
    const seed = getDailySeed(new Date(2026, 6, 4));
    expect(seed.frequency).toBeGreaterThan(100);
    expect(seed.frequency).toBeLessThan(1100);
  });
});
