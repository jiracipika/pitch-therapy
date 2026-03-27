import { describe, it, expect } from "vitest";
import {
  sessionReducer,
  initialSessionState,
  generateShareGrid,
} from "../gameSession";
import type { SessionState } from "../gameSession";

describe("sessionReducer", () => {
  it("START initializes session", () => {
    const state = sessionReducer(initialSessionState, {
      type: "START",
      mode: "note-id",
      difficulty: "easy",
      totalRounds: 5,
    });
    expect(state.phase).toBe("in_round");
    expect(state.mode).toBe("note-id");
    expect(state.round).toBe(1);
    expect(state.totalRounds).toBe(5);
    expect(state.startTime).not.toBeNull();
  });

  it("RESET returns to idle", () => {
    const started = sessionReducer(initialSessionState, {
      type: "START",
      mode: "pitch-match",
      difficulty: "medium",
      totalRounds: 3,
    });
    const reset = sessionReducer(started, { type: "RESET" });
    expect(reset.phase).toBe("idle");
    expect(reset.round).toBe(0);
    expect(reset.score).toBe(0);
  });

  describe("note-id flow", () => {
    function startGame() {
      return sessionReducer(initialSessionState, {
        type: "START",
        mode: "note-id",
        difficulty: "easy",
        totalRounds: 2,
      });
    }

    it("correct answer scores points and advances", () => {
      const started = startGame();
      const withTarget = sessionReducer(started, {
        type: "NEXT_ROUND",
        target: { note: "A4", frequency: 440 },
      });
      const answered = sessionReducer(withTarget, {
        type: "SUBMIT_ANSWER",
        answer: "A4",
        responseTimeMs: 500,
      });
      expect(answered.score).toBeGreaterThan(0);
      expect(answered.streak).toBe(1);
      expect(answered.rounds).toHaveLength(1);
    });

    it("wrong answer gives 0 points, resets streak", () => {
      const started = startGame();
      const withTarget = sessionReducer(started, {
        type: "NEXT_ROUND",
        target: { note: "A4", frequency: 440 },
      });
      const answered = sessionReducer(withTarget, {
        type: "SUBMIT_ANSWER",
        answer: "C4",
        responseTimeMs: 500,
      });
      expect(answered.score).toBe(0);
      expect(answered.streak).toBe(0);
    });

    it("completes after all rounds", () => {
      let state = startGame();
      for (let i = 0; i < 2; i++) {
        state = sessionReducer(state, {
          type: "NEXT_ROUND",
          target: { note: "A4", frequency: 440 },
        });
        state = sessionReducer(state, {
          type: "SUBMIT_ANSWER",
          answer: "A4",
          responseTimeMs: 500,
        });
      }
      expect(state.phase).toBe("complete");
      expect(state.isComplete).toBe(true);
    });
  });

  describe("wordle modes", () => {
    it("note-wordle tracks attempts", () => {
      let state = sessionReducer(initialSessionState, {
        type: "START",
        mode: "note-wordle",
        difficulty: "medium",
        totalRounds: 1,
      });
      state = sessionReducer(state, {
        type: "NEXT_ROUND",
        target: { note: "A4" },
      });

      // Wrong guess
      state = sessionReducer(state, {
        type: "SUBMIT_ANSWER",
        answer: "C4",
        responseTimeMs: 2000,
      });
      expect(state.attempts).toHaveLength(1);
      expect(state.phase).toBe("in_round"); // not done yet

      // Correct guess
      state = sessionReducer(state, {
        type: "SUBMIT_ANSWER",
        answer: "A4",
        responseTimeMs: 1000,
      });
      expect(state.attempts).toHaveLength(2);
      expect(state.rounds[0].correct).toBe(false); // first guess was wrong
      expect(state.rounds[state.rounds.length - 1].correct).toBe(true);
      expect(state.phase).toBe("complete");
    });

    it("frequency-wordle completes after max attempts", () => {
      let state = sessionReducer(initialSessionState, {
        type: "START",
        mode: "frequency-wordle",
        difficulty: "hard",
        totalRounds: 1,
      });
      state = sessionReducer(state, {
        type: "NEXT_ROUND",
        target: { frequency: 440 },
      });

      for (let i = 0; i < 6; i++) {
        state = sessionReducer(state, {
          type: "SUBMIT_ANSWER",
          answer: 100, // way off
          responseTimeMs: 2000,
        });
      }
      expect(state.attempts).toHaveLength(6);
      expect(state.phase).toBe("complete");
    });
  });

  it("SUBMIT_ANSWER after complete is ignored", () => {
    let state = sessionReducer(initialSessionState, {
      type: "START",
      mode: "note-id",
      difficulty: "easy",
      totalRounds: 1,
    });
    state = sessionReducer(state, {
      type: "NEXT_ROUND",
      target: { note: "A4", frequency: 440 },
    });
    state = sessionReducer(state, {
      type: "SUBMIT_ANSWER",
      answer: "A4",
      responseTimeMs: 500,
    });
    expect(state.isComplete).toBe(true);
    const scoreBefore = state.score;

    state = sessionReducer(state, {
      type: "SUBMIT_ANSWER",
      answer: "C5",
      responseTimeMs: 100,
    });
    expect(state.score).toBe(scoreBefore); // no change
  });

  it("0 totalRounds completes immediately on submit", () => {
    // START with 0 rounds is technically valid — next submit triggers complete
    // since round 1 > totalRounds 0
    let state = sessionReducer(initialSessionState, {
      type: "START",
      mode: "note-id",
      difficulty: "easy",
      totalRounds: 0,
    });
    state = sessionReducer(state, {
      type: "NEXT_ROUND",
      target: { note: "A4" },
    });
    state = sessionReducer(state, {
      type: "SUBMIT_ANSWER",
      answer: "A4",
      responseTimeMs: 500,
    });
    expect(state.isComplete).toBe(true);
  });
});

describe("generateShareGrid", () => {
  it("converts attempts to emoji grid", () => {
    const grid = generateShareGrid([
      { answer: "C4", feedback: ["wrong", "close"] },
      { answer: "A4", feedback: ["correct", "correct"] },
    ]);
    expect(grid).toBe("🟥🟨\n🟩🟩");
  });

  it("empty attempts = empty string", () => {
    expect(generateShareGrid([])).toBe("");
  });
});
