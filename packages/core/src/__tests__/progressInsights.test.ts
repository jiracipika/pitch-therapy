import { describe, expect, it } from "vitest";
import { buildProgressInsights } from "../progressInsights";

describe("buildProgressInsights", () => {
  it("returns weak-mode ranking and momentum deltas", () => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const results = [
      { mode: "pitch-match", score: 90, accuracy: 0.8, rounds: 8, date: new Date(now - day * 1).toISOString(), timeMs: 360000 },
      { mode: "pitch-match", score: 84, accuracy: 0.76, rounds: 8, date: new Date(now - day * 3).toISOString(), timeMs: 330000 },
      { mode: "note-id", score: 66, accuracy: 0.58, rounds: 8, date: new Date(now - day * 2).toISOString(), timeMs: 420000 },
      { mode: "note-id", score: 63, accuracy: 0.54, rounds: 8, date: new Date(now - day * 4).toISOString(), timeMs: 420000 },
      { mode: "note-id", score: 60, accuracy: 0.5, rounds: 8, date: new Date(now - day * 10).toISOString(), timeMs: 410000 },
    ];

    const insights = buildProgressInsights(results, 2);

    expect(insights.weakModes).toHaveLength(2);
    expect(insights.weakModes[0]?.mode).toBe("note-id");
    expect(insights.momentum.sessionsLast7).toBe(4);
    expect(typeof insights.focusTip).toBe("string");
    expect(insights.focusTip.length).toBeGreaterThan(10);
  });
});
