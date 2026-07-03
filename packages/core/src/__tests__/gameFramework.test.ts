import { describe, it, expect } from "vitest";
import {
  calculateScoreBreakdown,
  calculateGrade,
  createInitialGameState,
  GRADE_COLORS,
} from "../gameFramework";
import type { Grade } from "../gameFramework";

describe("calculateScoreBreakdown", () => {
  it("zero accuracy gives zero base points", () => {
    const bd = calculateScoreBreakdown(0, 1000, 0);
    expect(bd.basePoints).toBe(0);
    expect(bd.timeBonus).toBeGreaterThanOrEqual(0);
    expect(bd.total).toBe(bd.basePoints + bd.timeBonus + bd.streakBonus);
  });

  it("perfect accuracy gives 100 base points", () => {
    const bd = calculateScoreBreakdown(1, 0, 0);
    expect(bd.basePoints).toBe(100);
  });

  it("streak bonus increases with higher streak", () => {
    const noStreak = calculateScoreBreakdown(1, 1000, 0);
    const midStreak = calculateScoreBreakdown(1, 1000, 5);
    const maxStreak = calculateScoreBreakdown(1, 1000, 10);
    expect(midStreak.streakBonus).toBeGreaterThan(noStreak.streakBonus);
    expect(maxStreak.streakBonus).toBeGreaterThan(midStreak.streakBonus);
  });

  it("streak bonus caps at streak 10 (multiplier 2.0)", () => {
    const at10 = calculateScoreBreakdown(1, 0, 10);
    const at20 = calculateScoreBreakdown(1, 0, 20);
    expect(at10.streakBonus).toBe(at20.streakBonus);
  });

  it("faster response = higher time bonus", () => {
    const slow = calculateScoreBreakdown(1, 8000, 0);
    const fast = calculateScoreBreakdown(1, 500, 0);
    expect(fast.timeBonus).toBeGreaterThan(slow.timeBonus);
  });

  it("time bonus is zero for very slow responses", () => {
    const verySlow = calculateScoreBreakdown(1, 100000, 0);
    expect(verySlow.timeBonus).toBe(0);
  });

  it("total is the sum of base + time + streak", () => {
    const bd = calculateScoreBreakdown(0.85, 2000, 7);
    expect(bd.total).toBe(bd.basePoints + bd.timeBonus + bd.streakBonus);
    expect(bd.total).toBeGreaterThan(0);
  });

  it("total is never negative", () => {
    const bd = calculateScoreBreakdown(0, 0, 0);
    expect(bd.total).toBeGreaterThanOrEqual(0);
  });
});

describe("calculateGrade", () => {
  it("returns S for 95%+", () => {
    expect(calculateGrade(95, 100)).toBe("S");
    expect(calculateGrade(100, 100)).toBe("S");
  });

  it("returns A for 85-94%", () => {
    expect(calculateGrade(85, 100)).toBe("A");
    expect(calculateGrade(94, 100)).toBe("A");
  });

  it("returns B for 70-84%", () => {
    expect(calculateGrade(70, 100)).toBe("B");
    expect(calculateGrade(84, 100)).toBe("B");
  });

  it("returns C for 55-69%", () => {
    expect(calculateGrade(55, 100)).toBe("C");
    expect(calculateGrade(69, 100)).toBe("C");
  });

  it("returns D for 40-54%", () => {
    expect(calculateGrade(40, 100)).toBe("D");
    expect(calculateGrade(54, 100)).toBe("D");
  });

  it("returns F below 40%", () => {
    expect(calculateGrade(39, 100)).toBe("F");
    expect(calculateGrade(0, 100)).toBe("F");
  });

  it("returns F when totalPossible is 0", () => {
    expect(calculateGrade(100, 0)).toBe("F");
  });

  it("each grade has a color class", () => {
    const grades: Grade[] = ["S", "A", "B", "C", "D", "F"];
    for (const grade of grades) {
      expect(GRADE_COLORS[grade].length).toBeGreaterThan(0);
    }
  });
});

describe("createInitialGameState", () => {
  it("initializes with correct mode, difficulty, and rounds", () => {
    const state = createInitialGameState("note-id", "hard", 15);
    expect(state.mode).toBe("note-id");
    expect(state.difficulty).toBe("hard");
    expect(state.totalRounds).toBe(15);
  });

  it("starts in idle phase with zero score and streak", () => {
    const state = createInitialGameState("pitch-match", "easy", 5);
    expect(state.phase).toBe("idle");
    expect(state.score).toBe(0);
    expect(state.streak).toBe(0);
    expect(state.bestStreak).toBe(0);
    expect(state.currentRound).toBe(0);
  });

  it("starts with empty round results and null times", () => {
    const state = createInitialGameState("speed-round", "medium", 10);
    expect(state.roundResults).toEqual([]);
    expect(state.startTime).toBeNull();
    expect(state.roundStartTime).toBeNull();
  });
});
