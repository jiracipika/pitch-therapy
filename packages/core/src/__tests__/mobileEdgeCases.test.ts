import { describe, expect, it } from "vitest";
import {
  buildModeBreakdown,
  buildProgressInsights,
  normalizeProgressResults,
  type ProgressResult,
} from "../progressInsights";
import {
  calculateStreak,
  calculateLongestStreak,
  getDailyChallengeCompletion,
  todayDateString,
  DAILY_CHALLENGE_MODES,
} from "../dailyChallenge";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DAY = 24 * 60 * 60 * 1000;

function makeResult(
  mode: string,
  accuracy: number,
  daysAgo: number,
  score = 500,
  rounds = 10,
  timeMs = 300_000,
): ProgressResult {
  return {
    mode,
    score,
    accuracy,
    rounds,
    date: new Date(Date.now() - daysAgo * DAY).toISOString(),
    timeMs,
  };
}

// ─── normalizeProgressResults: edge cases the mobile app relies on ───────────

describe("normalizeProgressResults — mobile persistence edge cases", () => {
  it("clamps out-of-range accuracy to [0,1] (mobile can persist raw decimals)", () => {
    const normalized = normalizeProgressResults([
      { mode: "note-id", score: 100, accuracy: 1.5, rounds: 5, date: new Date().toISOString(), timeMs: 1000 },
      { mode: "note-id", score: 100, accuracy: -0.2, rounds: 5, date: new Date().toISOString(), timeMs: 1000 },
    ]);

    expect(normalized).toHaveLength(2);
    expect(normalized[0]!.accuracy).toBe(1);
    expect(normalized[1]!.accuracy).toBe(0);
  });

  it("drops entries with NaN or non-finite numeric fields", () => {
    const normalized = normalizeProgressResults([
      { mode: "note-id", score: NaN, accuracy: 0.8, rounds: 5, date: new Date().toISOString(), timeMs: 1000 },
      { mode: "note-id", score: 100, accuracy: Infinity, rounds: 5, date: new Date().toISOString(), timeMs: 1000 },
      { mode: "note-id", score: 100, accuracy: 0.8, rounds: NaN, date: new Date().toISOString(), timeMs: 1000 },
    ]);

    expect(normalized).toHaveLength(0);
  });

  it("drops entries with zero rounds (invalid session)", () => {
    const normalized = normalizeProgressResults([
      { mode: "note-id", score: 100, accuracy: 0.8, rounds: 0, date: new Date().toISOString(), timeMs: 1000 },
    ]);

    expect(normalized).toHaveLength(0);
  });

  it("drops entries with negative timeMs", () => {
    const normalized = normalizeProgressResults([
      { mode: "note-id", score: 100, accuracy: 0.8, rounds: 5, date: new Date().toISOString(), timeMs: -100 },
    ]);

    expect(normalized).toHaveLength(0);
  });

  it("drops entries with unparseable date strings", () => {
    const normalized = normalizeProgressResults([
      { mode: "note-id", score: 100, accuracy: 0.8, rounds: 5, date: "not-a-date", timeMs: 1000 },
    ]);

    expect(normalized).toHaveLength(0);
  });

  it("drops null, undefined, and non-object entries", () => {
    const normalized = normalizeProgressResults([
      null,
      undefined,
      "string",
      42,
      [],
    ]);

    expect(normalized).toHaveLength(0);
  });

  it("trims mode strings so persisted whitespace doesn't create phantom modes", () => {
    const normalized = normalizeProgressResults([
      { mode: "  note-id  ", score: 100, accuracy: 0.8, rounds: 5, date: new Date().toISOString(), timeMs: 1000 },
    ]);

    expect(normalized).toHaveLength(1);
    expect(normalized[0]!.mode).toBe("note-id");
  });

  it("floors non-integer round counts", () => {
    const normalized = normalizeProgressResults([
      { mode: "note-id", score: 100, accuracy: 0.8, rounds: 5.9, date: new Date().toISOString(), timeMs: 1000 },
    ]);

    expect(normalized[0]!.rounds).toBe(5);
  });
});

// ─── buildModeBreakdown: single-session and mode-label fallback ──────────────

describe("buildModeBreakdown — mobile Progress screen edge cases", () => {
  it("includes a mode with a single session", () => {
    const results = [makeResult("pitch-match", 0.85, 1)];
    const breakdown = buildModeBreakdown(results);

    expect(breakdown).toHaveLength(1);
    expect(breakdown[0]!.sessions).toBe(1);
    expect(breakdown[0]!.avgAccuracy).toBeCloseTo(0.85);
  });

  it("reports trendLabel 'steady' when fewer than 4 sessions exist", () => {
    const results = [
      makeResult("pitch-match", 0.6, 3),
      makeResult("pitch-match", 0.7, 2),
      makeResult("pitch-match", 0.8, 1),
    ];
    const breakdown = buildModeBreakdown(results);

    expect(breakdown[0]!.trendLabel).toBe("steady");
    expect(breakdown[0]!.trendDelta).toBe(0);
  });

  it("uses the mode id as label when mode is not in GAME_MODE_META", () => {
    const results = [makeResult("custom-mode", 0.5, 1)];
    const breakdown = buildModeBreakdown(results);

    expect(breakdown[0]!.label).toBe("custom-mode");
  });

  it("returns empty array for empty input", () => {
    expect(buildModeBreakdown([])).toEqual([]);
  });

  it("sorts modes alphabetically by mode id", () => {
    const results = [
      makeResult("speed-round", 0.7, 1),
      makeResult("note-id", 0.8, 1),
      makeResult("pitch-match", 0.6, 1),
    ];
    const breakdown = buildModeBreakdown(results);

    expect(breakdown.map((e) => e.mode)).toEqual([
      "note-id",
      "pitch-match",
      "speed-round",
    ]);
  });

  it("records lastPlayed as the most recent session timestamp", () => {
    const results = [
      makeResult("note-id", 0.6, 5),
      makeResult("note-id", 0.8, 1),
    ];
    const breakdown = buildModeBreakdown(results);
    const dates = results.map((r) => r.date).sort();
    expect(breakdown[0]!.lastPlayed).toBe(dates[1]);
  });
});

// ─── buildProgressInsights: focus tip generation ─────────────────────────────

describe("buildProgressInsights — focus tip edge cases", () => {
  it("returns a 'no sessions yet' tip when results are empty", () => {
    const insights = buildProgressInsights([], 3);
    expect(insights.focusTip).toContain("No sessions");
    expect(insights.weakModes).toHaveLength(0);
  });

  it("returns a 'great balance' tip when there are sessions but no weak modes", () => {
    // Single session in a mode — needs < 2 sessions to be excluded from weak modes
    const results = [makeResult("note-id", 0.95, 0)];
    const insights = buildProgressInsights(results, 3);
    expect(insights.focusTip).toContain("balance");
  });

  it("includes the mode label and target accuracy in the focus tip", () => {
    const results = [
      makeResult("note-id", 0.45, 4),
      makeResult("note-id", 0.48, 3),
      makeResult("note-id", 0.42, 2),
      makeResult("note-id", 0.40, 1),
    ];
    const insights = buildProgressInsights(results, 3);
    expect(insights.weakModes.length).toBeGreaterThan(0);
    expect(insights.focusTip).toContain("Note ID");
    expect(insights.focusTip).toMatch(/\d+%/);
  });
});

// ─── getDailyChallengeCompletion: mobile daily screen ────────────────────────

describe("getDailyChallengeCompletion — mobile daily screen", () => {
  it("reports 0/2 completion when no results exist", () => {
    const completion = getDailyChallengeCompletion([], new Date());
    expect(completion.completedCount).toBe(0);
    expect(completion.isComplete).toBe(false);
    expect(completion.completedModes).toEqual([]);
  });

  it("completes when both daily challenge modes were played today", () => {
    const now = new Date();
    const todayISO = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0).toISOString();
    const results = [
      { mode: "note-wordle", date: todayISO },
      { mode: "frequency-wordle", date: todayISO },
    ];

    const completion = getDailyChallengeCompletion(results, now);
    expect(completion.completedCount).toBe(2);
    expect(completion.isComplete).toBe(true);
  });

  it("does not count sessions from a different day", () => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const results = [
      { mode: "note-wordle", date: yesterday.toISOString() },
      { mode: "frequency-wordle", date: yesterday.toISOString() },
    ];

    const completion = getDailyChallengeCompletion(results, now);
    expect(completion.completedCount).toBe(0);
    expect(completion.isComplete).toBe(false);
  });

  it("ignores non-daily-challenge modes", () => {
    const now = new Date();
    const todayISO = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0).toISOString();
    const results = [
      { mode: "note-id", date: todayISO },
      { mode: "pitch-match", date: todayISO },
    ];

    const completion = getDailyChallengeCompletion(results, now);
    expect(completion.completedCount).toBe(0);
  });

  it("reports partial completion (1 of 2)", () => {
    const now = new Date();
    const todayISO = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0).toISOString();
    const results = [{ mode: "note-wordle", date: todayISO }];

    const completion = getDailyChallengeCompletion(results, now);
    expect(completion.completedCount).toBe(1);
    expect(completion.isComplete).toBe(false);
    expect(completion.completedModes).toEqual(["note-wordle"]);
  });

  it("handles exactly the DAILY_CHALLENGE_MODES constant correctly", () => {
    expect(DAILY_CHALLENGE_MODES).toEqual(["note-wordle", "frequency-wordle"]);
    expect(DAILY_CHALLENGE_MODES.length).toBe(2);
  });
});

// ─── calculateStreak / calculateLongestStreak: mobile session results ────────

describe("calculateStreak — mobile session results", () => {
  it("returns 0 for empty array", () => {
    expect(calculateStreak([])).toBe(0);
  });

  it("counts a single session today as a 1-day streak", () => {
    expect(calculateStreak([todayDateString()])).toBe(1);
  });

  it("counts consecutive days ending today", () => {
    const today = todayDateString();
    const yesterday = todayDateString(new Date(Date.now() - DAY));
    expect(calculateStreak([today, yesterday])).toBe(2);
  });

  it("breaks streak when there is a gap", () => {
    const today = todayDateString();
    const threeDaysAgo = todayDateString(new Date(Date.now() - 3 * DAY));
    expect(calculateStreak([today, threeDaysAgo])).toBe(1);
  });

  it("handles duplicate dates without inflating the streak", () => {
    const today = todayDateString();
    expect(calculateStreak([today, today, today])).toBe(1);
  });
});

describe("calculateLongestStreak — mobile session results", () => {
  it("returns 0 for empty array", () => {
    expect(calculateLongestStreak([])).toBe(0);
  });

  it("finds the longest run in a broken sequence", () => {
    const today = todayDateString();
    const d1 = todayDateString(new Date(Date.now() - 1 * DAY));
    const d2 = todayDateString(new Date(Date.now() - 2 * DAY));
    const d5 = todayDateString(new Date(Date.now() - 5 * DAY));
    const d6 = todayDateString(new Date(Date.now() - 6 * DAY));
    const d7 = todayDateString(new Date(Date.now() - 7 * DAY));

    // Two runs: today-d1-d2 (3 days) and d5-d6-d7 (3 days) => longest = 3
    expect(calculateLongestStreak([today, d1, d2, d5, d6, d7])).toBe(3);
  });

  it("counts a single day as 1", () => {
    expect(calculateLongestStreak([todayDateString()])).toBe(1);
  });
});
