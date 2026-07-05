import { describe, expect, it } from "vitest";
import {
  ACHIEVEMENT_TIERS,
  deriveAchievementMetrics,
  evaluateAchievements,
  evaluateTier,
  getNextGoals,
  getUnlockedAchievements,
  type AchievementTier,
} from "../achievements";

function session(
  mode: string,
  accuracy: number,
  rounds: number,
  dateISO: string,
  score = 500,
  timeMs = 300000,
) {
  return { mode, score, accuracy, rounds, date: dateISO, timeMs };
}

describe("ACHIEVEMENT_TIERS", () => {
  it("has tiers across every category", () => {
    const categories = new Set(ACHIEVEMENT_TIERS.map((t) => t.category));
    expect(categories.has("volume")).toBe(true);
    expect(categories.has("consistency")).toBe(true);
    expect(categories.has("accuracy")).toBe(true);
    expect(categories.has("versatility")).toBe(true);
    expect(categories.has("speed")).toBe(true);
  });

  it("has unique tier ids", () => {
    const ids = ACHIEVEMENT_TIERS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has non-empty labels, descriptions, and icons for every tier", () => {
    for (const tier of ACHIEVEMENT_TIERS) {
      expect(tier.label.length).toBeGreaterThan(0);
      expect(tier.description.length).toBeGreaterThan(0);
      expect(tier.icon.length).toBeGreaterThan(0);
      expect(tier.threshold).toBeGreaterThan(0);
    }
  });
});

describe("deriveAchievementMetrics", () => {
  it("returns zero metrics for empty history", () => {
    const metrics = deriveAchievementMetrics([]);
    expect(metrics.totalSessions).toBe(0);
    expect(metrics.longestStreak).toBe(0);
    expect(metrics.bestAccuracy).toBe(0);
    expect(metrics.modesPlayed).toBe(0);
    expect(metrics.fastestAvgResponseMs).toBeNull();
  });

  it("counts total sessions and best accuracy", () => {
    const metrics = deriveAchievementMetrics([
      session("note-id", 0.6, 10, "2026-07-01T12:00:00Z"),
      session("note-id", 0.9, 10, "2026-07-02T12:00:00Z"),
      session("pitch-match", 0.8, 10, "2026-07-03T12:00:00Z"),
    ]);
    expect(metrics.totalSessions).toBe(3);
    expect(metrics.bestAccuracy).toBeCloseTo(0.9, 5);
    expect(metrics.modesPlayed).toBe(2);
  });

  it("computes longest streak across consecutive days", () => {
    const metrics = deriveAchievementMetrics([
      session("note-id", 0.8, 10, "2026-07-01T12:00:00Z"),
      session("note-id", 0.8, 10, "2026-07-02T12:00:00Z"),
      session("note-id", 0.8, 10, "2026-07-03T12:00:00Z"),
    ]);
    expect(metrics.longestStreak).toBe(3);
  });

  it("computes fastest average response time (timeMs / rounds)", () => {
    const metrics = deriveAchievementMetrics([
      session("note-id", 0.8, 10, "2026-07-01T12:00:00Z", 500, 50000), // 5000 ms/round
      session("note-id", 0.8, 10, "2026-07-02T12:00:00Z", 500, 25000), // 2500 ms/round
    ]);
    expect(metrics.fastestAvgResponseMs).toBe(2500);
  });

  it("ignores sessions with zero rounds when computing speed", () => {
    const metrics = deriveAchievementMetrics([
      session("note-id", 0.8, 0, "2026-07-01T12:00:00Z"),
      session("note-id", 0.8, 10, "2026-07-02T12:00:00Z", 500, 30000), // 3000 ms/round
    ]);
    expect(metrics.fastestAvgResponseMs).toBe(3000);
  });

  it("returns null fastestAvgResponseMs when no session has valid rounds", () => {
    const metrics = deriveAchievementMetrics([session("note-id", 0.8, 0, "2026-07-01T12:00:00Z")]);
    expect(metrics.fastestAvgResponseMs).toBeNull();
  });

  it("clamps out-of-range accuracy to [0, 1]", () => {
    const metrics = deriveAchievementMetrics([
      session("note-id", 1.5, 10, "2026-07-01T12:00:00Z"),
      session("note-id", -0.3, 10, "2026-07-02T12:00:00Z"),
    ]);
    expect(metrics.bestAccuracy).toBeCloseTo(1.0, 5);
    expect(metrics.totalSessions).toBe(2);
  });
});

describe("evaluateTier", () => {
  const metrics = {
    totalSessions: 25,
    longestStreak: 7,
    bestAccuracy: 0.88,
    modesPlayed: 5,
    totalModes: 18,
    fastestAvgResponseMs: 4000,
  };

  it("unlocks a volume tier below the observed count", () => {
    const tier: AchievementTier = {
      id: "volume-10",
      category: "volume",
      label: "Getting Serious",
      description: "Play 10 sessions.",
      threshold: 10,
      icon: "🔥",
    };
    const status = evaluateTier(tier, metrics);
    expect(status.unlocked).toBe(true);
    expect(status.progressFraction).toBe(1);
    expect(status.progress).toBe(10);
  });

  it("leaves a volume tier above the observed count locked with partial progress", () => {
    const tier: AchievementTier = {
      id: "volume-50",
      category: "volume",
      label: "Dedicated Ear",
      description: "Play 50 sessions.",
      threshold: 50,
      icon: "💎",
    };
    const status = evaluateTier(tier, metrics);
    expect(status.unlocked).toBe(false);
    expect(status.progressFraction).toBeCloseTo(0.5, 2);
    expect(status.progress).toBe(25);
  });

  it("unlocks a speed tier when observed response is at or below threshold", () => {
    const tier: AchievementTier = {
      id: "speed-5000",
      category: "speed",
      label: "Rapid Reflexes",
      description: "Average under 5s per round.",
      threshold: 5000,
      icon: "🚀",
    };
    const status = evaluateTier(tier, metrics);
    expect(status.unlocked).toBe(true);
    expect(status.progressFraction).toBe(1);
  });

  it("leaves a speed tier locked when response is slower than threshold", () => {
    const tier: AchievementTier = {
      id: "speed-3000",
      category: "speed",
      label: "Lightning Ear",
      description: "Average under 3s per round.",
      threshold: 3000,
      icon: "💫",
    };
    const status = evaluateTier(tier, metrics);
    expect(status.unlocked).toBe(false);
    // observed 4000, threshold 3000 → fraction = 1 - 1000/3000 ≈ 0.667
    expect(status.progressFraction).toBeCloseTo(0.667, 2);
  });

  it("never unlocks speed tiers when fastestAvgResponseMs is null", () => {
    const noSpeedMetrics = { ...metrics, fastestAvgResponseMs: null };
    const tier: AchievementTier = {
      id: "speed-8000",
      category: "speed",
      label: "Quick Thinking",
      description: "Average under 8s per round.",
      threshold: 8000,
      icon: "⚡",
    };
    const status = evaluateTier(tier, noSpeedMetrics);
    expect(status.unlocked).toBe(false);
    expect(status.progressFraction).toBe(0);
  });
});

describe("evaluateAchievements", () => {
  it("unlocks only the first-steps volume tier for a brand-new user with one session", () => {
    const result = evaluateAchievements([session("note-id", 0.6, 10, "2026-07-01T12:00:00Z")]);

    expect(result.unlockedCount).toBe(1);
    expect(result.totalCount).toBe(ACHIEVEMENT_TIERS.length);
    const unlockedIds = result.statuses.filter((s) => s.unlocked).map((s) => s.tier.id);
    expect(unlockedIds).toContain("volume-1");
  });

  it("unlocks multiple volume tiers as sessions accumulate", () => {
    const results = Array.from({ length: 10 }, (_, i) =>
      session("note-id", 0.7, 10, `2026-07-${String(i + 1).padStart(2, "0")}T12:00:00Z`),
    );
    const result = evaluateAchievements(results);
    const unlockedIds = result.statuses.filter((s) => s.unlocked).map((s) => s.tier.id);
    expect(unlockedIds).toContain("volume-1");
    expect(unlockedIds).toContain("volume-10");
    expect(unlockedIds).not.toContain("volume-50");
  });

  it("unlocks accuracy tiers based on best single-session accuracy", () => {
    const result = evaluateAchievements([
      session("note-id", 0.72, 10, "2026-07-01T12:00:00Z"),
      session("note-id", 0.9, 10, "2026-07-02T12:00:00Z"),
    ]);
    const unlockedIds = result.statuses.filter((s) => s.unlocked).map((s) => s.tier.id);
    expect(unlockedIds).toContain("accuracy-70");
    expect(unlockedIds).toContain("accuracy-85");
    expect(unlockedIds).not.toContain("accuracy-95");
  });

  it("unlocks consistency tiers from longest streak", () => {
    const results = Array.from({ length: 7 }, (_, i) =>
      session("note-id", 0.8, 10, `2026-07-${String(i + 1).padStart(2, "0")}T12:00:00Z`),
    );
    const result = evaluateAchievements(results);
    const unlockedIds = result.statuses.filter((s) => s.unlocked).map((s) => s.tier.id);
    expect(unlockedIds).toContain("streak-3");
    expect(unlockedIds).toContain("streak-7");
    expect(unlockedIds).not.toContain("streak-14");
  });

  it("unlocks versatility tiers as distinct modes grow", () => {
    const modes = [
      "note-id",
      "pitch-match",
      "frequency-guess",
      "speed-round",
      "piano-tap",
      "drone-lock",
    ];
    const results = modes.map((m, i) =>
      session(m, 0.8, 10, `2026-07-${String(i + 1).padStart(2, "0")}T12:00:00Z`),
    );
    const result = evaluateAchievements(results);
    const unlockedIds = result.statuses.filter((s) => s.unlocked).map((s) => s.tier.id);
    expect(unlockedIds).toContain("versatility-3");
    expect(unlockedIds).toContain("versatility-6");
    expect(unlockedIds).not.toContain("versatility-12");
  });

  it("unlocks speed tiers when average response is fast enough", () => {
    const result = evaluateAchievements([
      session("note-id", 0.8, 10, "2026-07-01T12:00:00Z", 500, 25000), // 2500 ms/round
    ]);
    const unlockedIds = result.statuses.filter((s) => s.unlocked).map((s) => s.tier.id);
    expect(unlockedIds).toContain("speed-8000");
    expect(unlockedIds).toContain("speed-5000");
    expect(unlockedIds).toContain("speed-3000");
  });

  it("reports latestUnlock as the highest-threshold unlocked tier", () => {
    const results = Array.from({ length: 60 }, (_, i) =>
      session("note-id", 0.8, 10, `2026-07-${String((i % 27) + 1).padStart(2, "0")}T12:00:00Z`),
    );
    const result = evaluateAchievements(results);
    expect(result.latestUnlock).not.toBeNull();
    // Among unlocked tiers, latest should have the max threshold.
    const maxUnlockedThreshold = Math.max(
      ...result.statuses.filter((s) => s.unlocked).map((s) => s.tier.threshold),
    );
    expect(result.latestUnlock!.threshold).toBe(maxUnlockedThreshold);
  });

  it("reports null latestUnlock when nothing is unlocked", () => {
    const result = evaluateAchievements([]);
    expect(result.latestUnlock).toBeNull();
    expect(result.unlockedCount).toBe(0);
  });

  it("is deterministic for identical input", () => {
    const input = [
      session("note-id", 0.8, 10, "2026-07-01T12:00:00Z"),
      session("pitch-match", 0.9, 10, "2026-07-02T12:00:00Z"),
    ];
    expect(evaluateAchievements(input)).toEqual(evaluateAchievements(input));
  });
});

describe("getUnlockedAchievements", () => {
  it("returns unlocked tiers sorted by threshold ascending", () => {
    const results = Array.from({ length: 12 }, (_, i) =>
      session("note-id", 0.95, 10, `2026-07-${String(i + 1).padStart(2, "0")}T12:00:00Z`),
    );
    const unlocked = getUnlockedAchievements(results);
    expect(unlocked.length).toBeGreaterThan(0);
    expect(unlocked.every((s) => s.unlocked)).toBe(true);
    for (let i = 1; i < unlocked.length; i++) {
      expect(unlocked[i]!.tier.threshold).toBeGreaterThanOrEqual(unlocked[i - 1]!.tier.threshold);
    }
  });

  it("returns empty array when nothing is unlocked", () => {
    expect(getUnlockedAchievements([])).toEqual([]);
  });
});

describe("getNextGoals", () => {
  it("returns the next locked tier per category", () => {
    const results = Array.from({ length: 5 }, (_, i) =>
      session("note-id", 0.6, 10, `2026-07-${String(i + 1).padStart(2, "0")}T12:00:00Z`),
    );
    const goals = getNextGoals(results);
    const categories = new Set(goals.map((g) => g.tier.category));
    // volume is partly done (5 sessions) so volume should still have a next goal.
    expect(categories.has("volume")).toBe(true);
    // Every returned goal must be locked.
    expect(goals.every((g) => !g.unlocked)).toBe(true);
  });

  it("returns one goal per category at most", () => {
    const results = Array.from({ length: 100 }, (_, i) =>
      session("note-id", 0.99, 10, `2026-07-${String((i % 27) + 1).padStart(2, "0")}T12:00:00Z`),
    );
    const goals = getNextGoals(results);
    const categoryCounts = new Map<string, number>();
    for (const g of goals) {
      categoryCounts.set(g.tier.category, (categoryCounts.get(g.tier.category) ?? 0) + 1);
    }
    for (const count of categoryCounts.values()) {
      expect(count).toBe(1);
    }
  });

  it("returns empty when every category is fully maxed", () => {
    // Max out every category: 100+ sessions, 30-day streak, 95% accuracy,
    // 12 distinct modes, 3000ms/round fastest.
    const modes = [
      "note-id",
      "pitch-match",
      "frequency-guess",
      "note-wordle",
      "frequency-wordle",
      "pitch-memory",
      "name-that-note",
      "frequency-hunt",
      "drone-lock",
      "tune-in",
      "piano-tap",
      "frequency-slider",
    ];
    const results: ReturnType<typeof session>[] = [];
    // 100 sessions spread across 30 consecutive days (keeps streak-30 satisfied).
    for (let i = 0; i < 100; i++) {
      const day = (i % 30) + 1;
      const mode = modes[i % modes.length]!;
      results.push(
        session(mode, 0.99, 10, `2026-07-${String(day).padStart(2, "0")}T12:00:00Z`, 500, 25000),
      );
    }
    const goals = getNextGoals(results);
    expect(goals).toEqual([]);
  });
});
