import { describe, it, expect, vi, afterEach } from "vitest";
import {
  calculateStreak,
  calculateLongestStreak,
  todayDateString,
  getDailySeed,
  getDailyChallengeCompletion,
} from "../dailyChallenge";

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

describe("getDailyChallengeCompletion", () => {
  const today = new Date(2026, 6, 21, 12, 0, 0);

  it("tracks each daily mode once from today's completed sessions", () => {
    const result = getDailyChallengeCompletion([
      { mode: "note-wordle", date: new Date(2026, 6, 21, 8).toISOString() },
      { mode: "note-wordle", date: new Date(2026, 6, 21, 9).toISOString() },
      { mode: "frequency-wordle", date: new Date(2026, 6, 21, 10).toISOString() },
    ], today);

    expect(result).toEqual({
      completedModes: ["note-wordle", "frequency-wordle"],
      completedCount: 2,
      isComplete: true,
    });
  });

  it("ignores other modes, previous days, and invalid timestamps", () => {
    const result = getDailyChallengeCompletion([
      { mode: "note-wordle", date: new Date(2026, 6, 20, 23, 59).toISOString() },
      { mode: "pitch-match", date: new Date(2026, 6, 21, 9).toISOString() },
      { mode: "frequency-wordle", date: "not-a-date" },
    ], today);

    expect(result.completedCount).toBe(0);
    expect(result.isComplete).toBe(false);
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

describe("calculateLongestStreak", () => {
  it("returns 0 for empty array", () => {
    expect(calculateLongestStreak([])).toBe(0);
  });

  it("returns 1 for a single date", () => {
    expect(calculateLongestStreak(["2026-07-10"])).toBe(1);
  });

  it("returns the length of a single consecutive run", () => {
    expect(calculateLongestStreak(["2026-07-10", "2026-07-11", "2026-07-12"])).toBe(3);
  });

  it("returns the longest run among multiple separated runs", () => {
    // run A: 3 consecutive, run B: 5 consecutive, run C: 2 consecutive
    const dates = [
      "2026-06-01", "2026-06-02", "2026-06-03",
      "2026-06-10", "2026-06-11", "2026-06-12", "2026-06-13", "2026-06-14",
      "2026-06-20", "2026-06-21",
    ];
    expect(calculateLongestStreak(dates)).toBe(5);
  });

  it("is not anchored to today (unlike calculateStreak)", () => {
    // A 4-day run entirely in the past should still return 4, even though
    // calculateStreak would return 0 because it doesn't touch today/yesterday.
    vi.setSystemTime(new Date("2026-12-01T12:00:00"));
    expect(calculateLongestStreak(["2026-07-01", "2026-07-02", "2026-07-03", "2026-07-04"])).toBe(4);
  });

  it("deduplicates dates", () => {
    expect(calculateLongestStreak(["2026-07-10", "2026-07-10", "2026-07-11"])).toBe(2);
  });

  it("handles unsorted input", () => {
    expect(calculateLongestStreak(["2026-07-12", "2026-07-10", "2026-07-11"])).toBe(3);
  });

  it("returns 1 when no two dates are consecutive", () => {
    expect(calculateLongestStreak(["2026-07-01", "2026-07-05", "2026-07-10"])).toBe(1);
  });

  it("handles a run crossing a month boundary", () => {
    expect(calculateLongestStreak(["2026-07-30", "2026-07-31", "2026-08-01", "2026-08-02"])).toBe(4);
  });

  it("handles a run crossing a year boundary", () => {
    expect(calculateLongestStreak(["2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02"])).toBe(4);
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
