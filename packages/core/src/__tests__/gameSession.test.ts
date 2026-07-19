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

  it("renders a single-cell frequency-wordle row on its own line", () => {
    const grid = generateShareGrid([
      { answer: 500, feedback: ["wrong"] },
      { answer: 440, feedback: ["correct"] },
    ]);
    expect(grid).toBe("🟥\n🟩");
  });

  it("preserves row/col order: each attempt is one line, each cell one emoji", () => {
    const grid = generateShareGrid([
      { answer: "A#4", feedback: ["correct", "close", "wrong"] },
      { answer: "A4", feedback: ["correct", "correct", "correct"] },
      { answer: "C5", feedback: ["wrong", "wrong", "wrong"] },
    ]);
    expect(grid).toBe("🟩🟨🟥\n🟩🟩🟩\n🟥🟥🟥");
  });
});

// ─── Scoring formula regression guards ───────────────────────────────────────
// These lock in the exact scoring curve so accidental drift in the reducer's
// math (time-decay for non-wordle, attempt-bonus for wordle) is caught before
// it reaches users — the numbers drive leaderboard/progress surfaces.

describe("non-wordle time-decay scoring", () => {
  function answerOnce(mode: SessionState["mode"], target: { note?: string; frequency?: number }, answer: string | number, ms: number) {
    let state = sessionReducer(initialSessionState, {
      type: "START",
      mode: mode as any,
      difficulty: "easy",
      totalRounds: 1,
    });
    state = sessionReducer(state, { type: "NEXT_ROUND", target });
    state = sessionReducer(state, { type: "SUBMIT_ANSWER", answer, responseTimeMs: ms });
    return state;
  }

  it("rewards 100 points for an instantaneous correct answer (ms=0)", () => {
    const s = answerOnce("note-id", { note: "A4" }, "A4", 0);
    expect(s.score).toBe(100);
    expect(s.rounds[0]?.points).toBe(100);
  });

  it("awards 95 points at 500ms (1 - 0.05 decay)", () => {
    const s = answerOnce("note-id", { note: "A4" }, "A4", 500);
    expect(s.score).toBe(95);
  });

  it("awards 50 points at the 5000ms midpoint", () => {
    const s = answerOnce("note-id", { note: "A4" }, "A4", 5000);
    expect(s.score).toBe(50);
  });

  it("clamps to 0 once response time reaches the 10000ms floor", () => {
    const s = answerOnce("note-id", { note: "A4" }, "A4", 10000);
    expect(s.score).toBe(0);
    // And never goes negative beyond that floor.
    const slow = answerOnce("note-id", { note: "A4" }, "A4", 15000);
    expect(slow.score).toBe(0);
  });

  it("still marks a slow-but-correct answer as correct for streak purposes", () => {
    const s = answerOnce("note-id", { note: "A4" }, "A4", 10000);
    expect(s.score).toBe(0);
    expect(s.rounds[0]?.correct).toBe(true);
    expect(s.streak).toBe(1);
  });
});

describe("wordle attempt-bonus scoring", () => {
  function startWordle(mode: "note-wordle" | "frequency-wordle") {
    return sessionReducer(initialSessionState, {
      type: "START",
      mode,
      difficulty: "medium",
      totalRounds: 1,
    });
  }

  // points = 50 + (maxAttempts - attemptsAfterSubmit + 1) * 25, maxAttempts=6
  const expectedForAttempt = (attempt: number) => 50 + (6 - attempt + 1) * 25;

  it("awards 200 points for solving note-wordle on the first attempt", () => {
    let s = startWordle("note-wordle");
    s = sessionReducer(s, { type: "NEXT_ROUND", target: { note: "A4" } });
    s = sessionReducer(s, { type: "SUBMIT_ANSWER", answer: "A4", responseTimeMs: 1000 });
    expect(s.score).toBe(expectedForAttempt(1));
    expect(s.score).toBe(200);
  });

  it("awards 150 points for solving on the third attempt", () => {
    let s = startWordle("note-wordle");
    s = sessionReducer(s, { type: "NEXT_ROUND", target: { note: "A4" } });
    for (const guess of ["C4", "D4", "A4"]) {
      s = sessionReducer(s, { type: "SUBMIT_ANSWER", answer: guess, responseTimeMs: 1000 });
    }
    expect(s.score).toBe(expectedForAttempt(3));
    expect(s.score).toBe(150);
  });

  it("awards 75 points for solving on the final (6th) attempt", () => {
    let s = startWordle("note-wordle");
    s = sessionReducer(s, { type: "NEXT_ROUND", target: { note: "A4" } });
    for (const guess of ["C4", "D4", "E4", "F4", "G4", "A4"]) {
      s = sessionReducer(s, { type: "SUBMIT_ANSWER", answer: guess, responseTimeMs: 1000 });
    }
    expect(s.score).toBe(expectedForAttempt(6));
    expect(s.score).toBe(75);
  });

  it("scores 0 when all 6 attempts are wrong (no attempt bonus paid out)", () => {
    let s = startWordle("frequency-wordle");
    s = sessionReducer(s, { type: "NEXT_ROUND", target: { frequency: 440 } });
    for (let i = 0; i < 6; i++) {
      s = sessionReducer(s, { type: "SUBMIT_ANSWER", answer: 999, responseTimeMs: 1000 });
    }
    expect(s.score).toBe(0);
    expect(s.isComplete).toBe(true);
    expect(s.streak).toBe(0);
  });
});

// ─── Answer-correctness edge cases ───────────────────────────────────────────
// isAnswerCorrect is buried inside the reducer but drives both scoring and
// streak logic. These guards pin its normalization + thresholds.

describe("note-id answer normalization", () => {
  function answerNote(guess: string, targetNote: string) {
    let s = sessionReducer(initialSessionState, {
      type: "START", mode: "note-id", difficulty: "easy", totalRounds: 1,
    });
    s = sessionReducer(s, { type: "NEXT_ROUND", target: { note: targetNote } });
    return sessionReducer(s, { type: "SUBMIT_ANSWER", answer: guess, responseTimeMs: 0 });
  }

  it("treats note matching as case-insensitive", () => {
    expect(answerNote("a4", "A4").streak).toBe(1);
    expect(answerNote("A4", "a4").streak).toBe(1);
  });

  it("ignores whitespace inside the answer", () => {
    // isAnswerCorrect strips all whitespace before comparing, so " A4 ", "A 4",
    // and "A4" all normalize to "A4".
    expect(answerNote(" A4 ", "A4").streak).toBe(1);
    expect(answerNote("A 4", "A4").streak).toBe(1);
  });

  it("rejects a wrong note", () => {
    expect(answerNote("C4", "A4").streak).toBe(0);
  });
});

describe("frequency-guess cents threshold", () => {
  function answerFreq(guess: number, target: number) {
    let s = sessionReducer(initialSessionState, {
      type: "START", mode: "frequency-guess", difficulty: "easy", totalRounds: 1,
    });
    s = sessionReducer(s, { type: "NEXT_ROUND", target: { frequency: target } });
    return sessionReducer(s, { type: "SUBMIT_ANSWER", answer: guess, responseTimeMs: 0 });
  }

  it("accepts an exact-match frequency", () => {
    expect(answerFreq(440, 440).streak).toBe(1);
  });

  it("accepts a guess within 10 cents (≈8 cents at 440Hz)", () => {
    // 442Hz ≈ 7.85 cents above 440 — within the ±10 cent window.
    expect(answerFreq(442, 440).streak).toBe(1);
  });

  it("rejects a guess beyond 10 cents", () => {
    // 445Hz ≈ 19.5 cents — outside the window.
    expect(answerFreq(445, 440).streak).toBe(0);
  });
});

// ─── Streak accumulation across rounds ───────────────────────────────────────
describe("streak accumulation across rounds", () => {
  it("increments streak on each consecutive correct answer", () => {
    // totalRounds is set generously because NEXT_ROUND + SUBMIT together
    // advance the internal round counter by 2 (NEXT bumps by 1, SUBMIT sets
    // round = round + 1). Three landed submits therefore need headroom ≥ 7.
    let s = sessionReducer(initialSessionState, {
      type: "START", mode: "note-id", difficulty: "easy", totalRounds: 10,
    });
    for (let i = 0; i < 3; i++) {
      s = sessionReducer(s, { type: "NEXT_ROUND", target: { note: "A4" } });
      s = sessionReducer(s, { type: "SUBMIT_ANSWER", answer: "A4", responseTimeMs: 0 });
    }
    expect(s.streak).toBe(3);
    expect(s.rounds).toHaveLength(3);
  });

  it("resets streak to 0 on a wrong answer and does not recover lost streak", () => {
    let s = sessionReducer(initialSessionState, {
      type: "START", mode: "note-id", difficulty: "easy", totalRounds: 10,
    });
    // round 1 correct
    s = sessionReducer(s, { type: "NEXT_ROUND", target: { note: "A4" } });
    s = sessionReducer(s, { type: "SUBMIT_ANSWER", answer: "A4", responseTimeMs: 0 });
    expect(s.streak).toBe(1);
    // round 2 wrong
    s = sessionReducer(s, { type: "NEXT_ROUND", target: { note: "A4" } });
    s = sessionReducer(s, { type: "SUBMIT_ANSWER", answer: "C4", responseTimeMs: 0 });
    expect(s.streak).toBe(0);
    // round 3 correct again — streak is 1, not 2
    s = sessionReducer(s, { type: "NEXT_ROUND", target: { note: "A4" } });
    s = sessionReducer(s, { type: "SUBMIT_ANSWER", answer: "A4", responseTimeMs: 0 });
    expect(s.streak).toBe(1);
  });
});

// ─── Reducer guard clauses (no-ops when out of phase) ────────────────────────
describe("reducer guard clauses", () => {
  it("NEXT_ROUND is a no-op once the session is complete", () => {
    let s = sessionReducer(initialSessionState, {
      type: "START", mode: "note-id", difficulty: "easy", totalRounds: 1,
    });
    s = sessionReducer(s, { type: "NEXT_ROUND", target: { note: "A4" } });
    s = sessionReducer(s, { type: "SUBMIT_ANSWER", answer: "A4", responseTimeMs: 0 });
    expect(s.isComplete).toBe(true);
    const before = s;
    const after = sessionReducer(s, { type: "NEXT_ROUND", target: { note: "C5" } });
    // Reference-equal: reducer returned state untouched.
    expect(after).toBe(before);
  });

  it("SUBMIT_ANSWER is a no-op when not in the in_round phase", () => {
    // START puts us in in_round, but a fresh initial state is "idle".
    const idle = initialSessionState;
    const after = sessionReducer(idle, {
      type: "SUBMIT_ANSWER", answer: "A4", responseTimeMs: 0,
    });
    expect(after).toBe(idle);
  });

  it("SUBMIT_ANSWER is a no-op after COMPLETE (idempotent completion)", () => {
    let s = sessionReducer(initialSessionState, {
      type: "START", mode: "note-id", difficulty: "easy", totalRounds: 1,
    });
    s = sessionReducer(s, { type: "NEXT_ROUND", target: { note: "A4" } });
    s = sessionReducer(s, { type: "SUBMIT_ANSWER", answer: "A4", responseTimeMs: 0 });
    expect(s.isComplete).toBe(true);
    const scoreBefore = s.score;
    const after = sessionReducer(s, {
      type: "SUBMIT_ANSWER", answer: "C5", responseTimeMs: 0,
    });
    expect(after.score).toBe(scoreBefore);
    expect(after.isComplete).toBe(true);
  });
});

// ─── Wordle feedback correctness ─────────────────────────────────────────────
// The per-cell coloring feeds both the live UI and the share grid; getting it
// wrong silently corrupts both. These pin the exact feedback vectors.

describe("note-wordle per-cell feedback", () => {
  function feedbackFor(guess: string, targetNote: string) {
    let s = sessionReducer(initialSessionState, {
      type: "START", mode: "note-wordle", difficulty: "medium", totalRounds: 1,
    });
    s = sessionReducer(s, { type: "NEXT_ROUND", target: { note: targetNote } });
    s = sessionReducer(s, { type: "SUBMIT_ANSWER", answer: guess, responseTimeMs: 0 });
    return s.attempts[s.attempts.length - 1]?.feedback;
  }

  it("marks an exact character match as 'correct'", () => {
    // guess "A4" target "A4" -> both cells exact.
    expect(feedbackFor("A4", "A4")).toEqual(["correct", "correct"]);
  });

  it("marks a character present in the wrong position as 'close'", () => {
    // guess "A4" target "A#4" (after space-strip target is "A#4", guess "A4"):
    // index 0 'A' matches 'A' -> correct; index 1 '4' is in target -> close.
    expect(feedbackFor("A4", "A#4")).toEqual(["correct", "close"]);
  });

  it("marks an absent character as 'wrong'", () => {
    expect(feedbackFor("C4", "A4")).toEqual(["wrong", "correct"]);
  });
});

describe("frequency-wordle single-cell feedback", () => {
  function feedbackFor(guess: number, target: number) {
    let s = sessionReducer(initialSessionState, {
      type: "START", mode: "frequency-wordle", difficulty: "hard", totalRounds: 1,
    });
    s = sessionReducer(s, { type: "NEXT_ROUND", target: { frequency: target } });
    s = sessionReducer(s, { type: "SUBMIT_ANSWER", answer: guess, responseTimeMs: 0 });
    return s.attempts[s.attempts.length - 1]?.feedback;
  }

  it("returns ['correct'] when within 2% of target", () => {
    expect(feedbackFor(445, 440)).toEqual(["correct"]);
  });

  it("returns ['close'] when within 10% but beyond 2%", () => {
    expect(feedbackFor(470, 440)).toEqual(["close"]);
  });

  it("returns ['wrong'] when beyond 10% off", () => {
    expect(feedbackFor(550, 440)).toEqual(["wrong"]);
  });
});

// ─── Wordle max-attempts boundary ────────────────────────────────────────────
describe("wordle max-attempts boundary", () => {
  it("START sets maxAttempts to 6 for wordle modes", () => {
    const note = sessionReducer(initialSessionState, {
      type: "START", mode: "note-wordle", difficulty: "easy", totalRounds: 1,
    });
    const freq = sessionReducer(initialSessionState, {
      type: "START", mode: "frequency-wordle", difficulty: "easy", totalRounds: 1,
    });
    expect(note.maxAttempts).toBe(6);
    expect(freq.maxAttempts).toBe(6);
  });

  it("START sets maxAttempts to 1 for non-wordle modes", () => {
    const s = sessionReducer(initialSessionState, {
      type: "START", mode: "note-id", difficulty: "easy", totalRounds: 1,
    });
    expect(s.maxAttempts).toBe(1);
  });

  it("clears attempts when advancing to the next wordle round", () => {
    // totalRounds is generous: NEXT_ROUND bumps the internal round counter
    // before the first submit, so the solve's nextRound (= round + 1) must
    // stay under totalRounds to land in "scoring" rather than "complete".
    let s = sessionReducer(initialSessionState, {
      type: "START", mode: "note-wordle", difficulty: "medium", totalRounds: 10,
    });
    s = sessionReducer(s, { type: "NEXT_ROUND", target: { note: "A4" } });
    s = sessionReducer(s, { type: "SUBMIT_ANSWER", answer: "C4", responseTimeMs: 0 });
    expect(s.attempts).toHaveLength(1);
    expect(s.phase).toBe("in_round"); // still guessing round 1
    // Solve round 1 to move to the scoring phase.
    s = sessionReducer(s, { type: "SUBMIT_ANSWER", answer: "A4", responseTimeMs: 0 });
    expect(s.phase).toBe("scoring");
    // Begin round 2 — attempts must reset.
    s = sessionReducer(s, { type: "NEXT_ROUND", target: { note: "D4" } });
    expect(s.attempts).toEqual([]);
  });
});
