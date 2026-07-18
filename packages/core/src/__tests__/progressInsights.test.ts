import { describe, expect, it } from "vitest";
import {
  buildDailyActivityMap,
  buildModeBreakdown,
  buildProgressInsights,
  MODE_TREND_THRESHOLD,
} from "../progressInsights";

const DAY = 24 * 60 * 60 * 1000;

function r(mode: string, accuracy: number, daysAgo: number, score = 500, timeMs = 300000) {
  return {
    mode,
    score,
    accuracy,
    rounds: 10,
    date: new Date("2026-07-03T12:00:00Z").getTime() - daysAgo * DAY,
    timeMs,
  };
}

describe("buildProgressInsights", () => {
  const fixedNow = new Date("2026-07-03T12:00:00Z");

  it("returns weak-mode ranking and momentum deltas", () => {
    const now = Date.now();
    const results = [
      { mode: "pitch-match", score: 90, accuracy: 0.8, rounds: 8, date: new Date(now - DAY * 1).toISOString(), timeMs: 360000 },
      { mode: "pitch-match", score: 84, accuracy: 0.76, rounds: 8, date: new Date(now - DAY * 3).toISOString(), timeMs: 330000 },
      { mode: "note-id", score: 66, accuracy: 0.58, rounds: 8, date: new Date(now - DAY * 2).toISOString(), timeMs: 420000 },
      { mode: "note-id", score: 63, accuracy: 0.54, rounds: 8, date: new Date(now - DAY * 4).toISOString(), timeMs: 420000 },
      { mode: "note-id", score: 60, accuracy: 0.5, rounds: 8, date: new Date(now - DAY * 10).toISOString(), timeMs: 410000 },
    ];

    const insights = buildProgressInsights(results, 2);

    expect(insights.weakModes).toHaveLength(2);
    expect(insights.weakModes[0]?.mode).toBe("note-id");
    expect(insights.momentum.sessionsLast7).toBe(4);
    expect(typeof insights.focusTip).toBe("string");
    expect(insights.focusTip.length).toBeGreaterThan(10);
  });

  it("is deterministic with an explicit now date", () => {
    const results = [
      r("pitch-match", 0.8, 1),
      r("pitch-match", 0.76, 3),
      r("note-id", 0.58, 2),
      r("note-id", 0.54, 4),
      r("note-id", 0.5, 10),
    ].map((x) => ({ ...x, date: new Date(x.date).toISOString() }));

    const a = buildProgressInsights(results, 3, fixedNow);
    const b = buildProgressInsights(results, 3, fixedNow);

    expect(a).toEqual(b);
    expect(a.momentum.sessionsLast7).toBe(4);
    expect(a.momentum.sessionsPrev7).toBe(1);
  });

  it("correctly classifies sessions into last-7 vs prev-7 windows", () => {
    const results = [
      r("note-id", 0.9, 0).date,
      r("note-id", 0.9, 6).date,
      r("note-id", 0.9, 7).date,
      r("note-id", 0.9, 13).date,
      r("note-id", 0.9, 20).date,
    ].map((d, i) => ({
      mode: "note-id",
      score: 500,
      accuracy: 0.9,
      rounds: 10,
      date: new Date(d).toISOString(),
      timeMs: 300000,
    }));

    const insights = buildProgressInsights(results, 3, fixedNow);
    // days 0 and 6 are in last-7; days 7 and 13 are in prev-7; day 20 is excluded
    expect(insights.momentum.sessionsLast7).toBe(2);
    expect(insights.momentum.sessionsPrev7).toBe(2);
  });

  it("computes accuracy momentum delta between windows", () => {
    const results = [
      // last-7: high accuracy
      { mode: "note-id", score: 900, accuracy: 0.9, rounds: 10, date: new Date(fixedNow.getTime() - 1 * DAY).toISOString(), timeMs: 300000 },
      { mode: "note-id", score: 880, accuracy: 0.88, rounds: 10, date: new Date(fixedNow.getTime() - 2 * DAY).toISOString(), timeMs: 300000 },
      // prev-7: lower accuracy
      { mode: "note-id", score: 500, accuracy: 0.5, rounds: 10, date: new Date(fixedNow.getTime() - 10 * DAY).toISOString(), timeMs: 300000 },
      { mode: "note-id", score: 520, accuracy: 0.52, rounds: 10, date: new Date(fixedNow.getTime() - 12 * DAY).toISOString(), timeMs: 300000 },
    ];

    const insights = buildProgressInsights(results, 3, fixedNow);
    expect(insights.momentum.avgAccuracyLast7).toBeCloseTo(0.89, 1);
    expect(insights.momentum.avgAccuracyPrev7).toBeCloseTo(0.51, 1);
    expect(insights.momentum.accuracyDeltaPct).toBeGreaterThan(0);
  });

  it("returns empty weak modes and baseline momentum for no sessions", () => {
    const insights = buildProgressInsights([], 3, fixedNow);
    expect(insights.weakModes).toHaveLength(0);
    expect(insights.momentum.sessionsLast7).toBe(0);
    expect(insights.focusTip).toContain("No sessions yet");
  });

  describe("focusTip coaching", () => {
    // Two weak sessions of the same mode, both inside the last-7-day window.
    // avg accuracy = 0.6 -> personalized target should be 85% (the ceiling,
    // since 0.6 + 0.05 = 0.65 < 0.85).
    const weakResults = [
      r("note-id", 0.6, 1),
      r("note-id", 0.6, 3),
    ].map((x) => ({ ...x, date: new Date(x.date).toISOString() }));

    it("suggests a personalized accuracy target instead of a fixed +4%", () => {
      const insights = buildProgressInsights(weakResults, 3, fixedNow);
      expect(insights.focusTip).toContain("aim for 85% accuracy");
      expect(insights.focusTip).not.toContain("+4%");
    });

    it("labels a mode with too few sessions as steady (not improving)", () => {
      // Only 2 sessions -> signedWindowTrend returns 0 -> classifyModeTrend
      // yields "steady". The old >= 0 check falsely reported "improving".
      const insights = buildProgressInsights(weakResults, 3, fixedNow);
      expect(insights.focusTip).toContain("It's steady");
      expect(insights.focusTip).not.toContain("It's improving");
    });

    it("acks a slipping week when overall accuracy drops sharply", () => {
      // Build a history where last-7 accuracy is well below prev-7.
      const slipping = [
        r("note-id", 0.9, 10), // prev-7, strong
        r("note-id", 0.9, 12),
        r("note-id", 0.4, 1), // last-7, weak
        r("note-id", 0.4, 3),
      ].map((x) => ({ ...x, date: new Date(x.date).toISOString() }));

      const insights = buildProgressInsights(slipping, 3, fixedNow);
      expect(insights.momentum.accuracyDeltaPct).toBeLessThan(-10);
      expect(insights.focusTip).toContain("overall accuracy dipped");
    });

    it("celebrates an improving week when overall accuracy jumps", () => {
      const improving = [
        r("note-id", 0.4, 10), // prev-7, weak
        r("note-id", 0.4, 12),
        r("note-id", 0.9, 1), // last-7, strong
        r("note-id", 0.9, 3),
      ].map((x) => ({ ...x, date: new Date(x.date).toISOString() }));

      const insights = buildProgressInsights(improving, 3, fixedNow);
      expect(insights.momentum.accuracyDeltaPct).toBeGreaterThan(10);
      expect(insights.focusTip).toContain("trending up overall");
    });

    it("caps the suggested target at 95% for an already-strong weak mode", () => {
      // avg 0.92 -> 0.92 + 0.05 = 0.97, capped to 0.95 -> "95%".
      const strongWeak = [
        r("pitch-match", 0.92, 1),
        r("pitch-match", 0.92, 3),
      ].map((x) => ({ ...x, date: new Date(x.date).toISOString() }));

      const insights = buildProgressInsights(strongWeak, 3, fixedNow);
      expect(insights.focusTip).toContain("aim for 95% accuracy");
    });
  });

  it("handles a single session (no weak clusters since need 2+)", () => {
    const results = [
      { mode: "note-id", score: 500, accuracy: 0.5, rounds: 5, date: new Date(fixedNow.getTime() - 1 * DAY).toISOString(), timeMs: 300000 },
    ];
    const insights = buildProgressInsights(results, 3, fixedNow);
    expect(insights.weakModes).toHaveLength(0);
    expect(insights.momentum.sessionsLast7).toBe(1);
  });

  it("normalizes out-of-range accuracy to [0, 1]", () => {
    const results = [
      { mode: "note-id", score: 500, accuracy: 1.5, rounds: 5, date: new Date(fixedNow.getTime() - 1 * DAY).toISOString(), timeMs: 300000 },
      { mode: "note-id", score: 500, accuracy: -0.3, rounds: 5, date: new Date(fixedNow.getTime() - 2 * DAY).toISOString(), timeMs: 300000 },
    ];
    const insights = buildProgressInsights(results, 3, fixedNow);
    // 1.5 -> 1.0, -0.3 -> 0.0; avg = 0.5
    expect(insights.momentum.avgAccuracyLast7).toBeCloseTo(0.5, 1);
  });

  it("ranks weaker accuracy above stronger accuracy", () => {
    const results = [
      r("pitch-match", 0.2, 1),
      r("pitch-match", 0.2, 2),
      r("note-id", 0.9, 1),
      r("note-id", 0.9, 2),
    ].map((x) => ({ ...x, date: new Date(x.date).toISOString() }));

    const insights = buildProgressInsights(results, 2, fixedNow);
    expect(insights.weakModes[0]?.mode).toBe("pitch-match");
  });
});

describe("buildDailyActivityMap", () => {
  it("counts sessions per day key", () => {
    const results = [
      { mode: "note-id", score: 100, accuracy: 0.8, rounds: 5, date: "2026-07-03T12:00:00Z", timeMs: 300000 },
      { mode: "note-id", score: 100, accuracy: 0.8, rounds: 5, date: "2026-07-03T18:00:00Z", timeMs: 300000 },
      { mode: "pitch-match", score: 100, accuracy: 0.8, rounds: 5, date: "2026-07-02T12:00:00Z", timeMs: 300000 },
    ];

    const map = buildDailyActivityMap(results);
    expect(map.get("2026-07-03")).toBe(2);
    expect(map.get("2026-07-02")).toBe(1);
  });

  it("returns empty map for no results", () => {
    const map = buildDailyActivityMap([]);
    expect(map.size).toBe(0);
  });
});

describe("buildModeBreakdown", () => {
  const fixedNow = new Date("2026-07-03T12:00:00Z");

  it("returns an empty array when there are no sessions", () => {
    expect(buildModeBreakdown([])).toEqual([]);
  });

  it("aggregates sessions per mode and computes mean accuracy + best score", () => {
    const results = [
      { mode: "note-id", score: 500, accuracy: 0.5, rounds: 5, date: "2026-07-01T12:00:00Z", timeMs: 300000 },
      { mode: "note-id", score: 900, accuracy: 0.9, rounds: 5, date: "2026-07-02T12:00:00Z", timeMs: 300000 },
    ];

    const breakdown = buildModeBreakdown(results);

    expect(breakdown).toHaveLength(1);
    expect(breakdown[0]?.mode).toBe("note-id");
    expect(breakdown[0]?.sessions).toBe(2);
    expect(breakdown[0]?.avgAccuracy).toBeCloseTo(0.7, 5);
    expect(breakdown[0]?.bestScore).toBe(900);
    expect(breakdown[0]?.lastPlayed).toBe("2026-07-02T12:00:00Z");
  });

  it("labels the trend as steady when fewer than 4 sessions exist", () => {
    const results = [
      r("note-id", 0.9, 1),
      r("note-id", 0.9, 2),
    ].map((x) => ({ ...x, date: new Date(x.date).toISOString() }));

    const [entry] = buildModeBreakdown(results);
    expect(entry?.trendDelta).toBe(0);
    expect(entry?.trendLabel).toBe("steady");
  });

  it("labels a clear upward trend as improving", () => {
    const results = [
      { mode: "note-id", score: 500, accuracy: 0.4, rounds: 5, date: new Date(fixedNow.getTime() - 4 * DAY).toISOString(), timeMs: 300000 },
      { mode: "note-id", score: 520, accuracy: 0.42, rounds: 5, date: new Date(fixedNow.getTime() - 3 * DAY).toISOString(), timeMs: 300000 },
      { mode: "note-id", score: 880, accuracy: 0.88, rounds: 5, date: new Date(fixedNow.getTime() - 2 * DAY).toISOString(), timeMs: 300000 },
      { mode: "note-id", score: 910, accuracy: 0.91, rounds: 5, date: new Date(fixedNow.getTime() - 1 * DAY).toISOString(), timeMs: 300000 },
    ];

    const [entry] = buildModeBreakdown(results);
    expect(entry?.trendDelta).toBeGreaterThan(MODE_TREND_THRESHOLD);
    expect(entry?.trendLabel).toBe("improving");
  });

  it("labels a clear downward trend as slipping", () => {
    const results = [
      { mode: "note-id", score: 900, accuracy: 0.9, rounds: 5, date: new Date(fixedNow.getTime() - 4 * DAY).toISOString(), timeMs: 300000 },
      { mode: "note-id", score: 880, accuracy: 0.88, rounds: 5, date: new Date(fixedNow.getTime() - 3 * DAY).toISOString(), timeMs: 300000 },
      { mode: "note-id", score: 420, accuracy: 0.42, rounds: 5, date: new Date(fixedNow.getTime() - 2 * DAY).toISOString(), timeMs: 300000 },
      { mode: "note-id", score: 400, accuracy: 0.4, rounds: 5, date: new Date(fixedNow.getTime() - 1 * DAY).toISOString(), timeMs: 300000 },
    ];

    const [entry] = buildModeBreakdown(results);
    expect(entry?.trendDelta).toBeLessThan(-MODE_TREND_THRESHOLD);
    expect(entry?.trendLabel).toBe("slipping");
  });

  it("sorts entries deterministically by mode id and excludes unplayed modes", () => {
    const results = [
      { mode: "pitch-match", score: 700, accuracy: 0.7, rounds: 5, date: "2026-07-01T12:00:00Z", timeMs: 300000 },
      { mode: "note-id", score: 800, accuracy: 0.8, rounds: 5, date: "2026-07-01T13:00:00Z", timeMs: 300000 },
    ];

    const breakdown = buildModeBreakdown(results);
    expect(breakdown.map((e) => e.mode)).toEqual(["note-id", "pitch-match"]);
    expect(breakdown.find((e) => e.mode === "speed-round")).toBeUndefined();
  });

  it("is deterministic: identical inputs produce identical outputs", () => {
    const results = [
      r("pitch-match", 0.2, 1),
      r("pitch-match", 0.2, 2),
      r("note-id", 0.9, 1),
      r("note-id", 0.9, 2),
    ].map((x) => ({ ...x, date: new Date(x.date).toISOString() }));

    expect(buildModeBreakdown(results)).toEqual(buildModeBreakdown(results));
  });

  it("uses the mode's display label from game metadata", () => {
    const results = [
      { mode: "note-id", score: 500, accuracy: 0.5, rounds: 5, date: "2026-07-01T12:00:00Z", timeMs: 300000 },
    ];

    const [entry] = buildModeBreakdown(results);
    // GAME_MODE_META["note-id"].label is human-friendly (not the raw id).
    expect(entry?.label).not.toBe("note-id");
    expect(entry?.label.length).toBeGreaterThan(0);
  });

  it("clamps out-of-range accuracy into [0, 1] before averaging", () => {
    const results = [
      { mode: "note-id", score: 500, accuracy: 1.5, rounds: 5, date: "2026-07-01T12:00:00Z", timeMs: 300000 },
      { mode: "note-id", score: 500, accuracy: -0.3, rounds: 5, date: "2026-07-02T12:00:00Z", timeMs: 300000 },
    ];

    const [entry] = buildModeBreakdown(results);
    expect(entry?.avgAccuracy).toBeCloseTo(0.5, 5);
  });
});
