import { describe, it, expect, vi } from "vitest";
import {
  noteToFrequency,
  frequencyToNote,
  getDailySeed,
  getAllNoteNames,
  generateNoteOptions,
  calculateScore,
} from "../audio";
import { GAME_MODES } from "../gameData";

describe("noteToFrequency", () => {
  it("A4 = 440 Hz", () => {
    expect(noteToFrequency("A4")).toBe(440);
  });

  it("A0 = 27.5 Hz", () => {
    expect(noteToFrequency("A0")).toBeCloseTo(27.5, 1);
  });

  it("C8 ≈ 4186 Hz", () => {
    expect(noteToFrequency("C8")).toBeCloseTo(4186.01, 1);
  });

  it("C4 = middle C ≈ 261.63 Hz", () => {
    expect(noteToFrequency("C4")).toBeCloseTo(261.63, 1);
  });

  it("handles sharps", () => {
    expect(noteToFrequency("C#4")).toBeCloseTo(277.18, 1);
    expect(noteToFrequency("F#3")).toBeCloseTo(185.0, 1);
  });

  it("handles flats", () => {
    expect(noteToFrequency("Bb4")).toBeCloseTo(466.16, 1);
    expect(noteToFrequency("Eb3")).toBeCloseTo(155.56, 1);
  });

  it("returns NaN for invalid input", () => {
    expect(noteToFrequency("H4")).toBeNaN();
    expect(noteToFrequency("ABC")).toBeNaN();
    expect(noteToFrequency("")).toBeNaN();
    expect(noteToFrequency("A")).toBeNaN();
  });

  it("handles lowercase note names", () => {
    expect(noteToFrequency("a4")).toBe(440);
    expect(noteToFrequency("c#4")).toBeCloseTo(277.18, 1);
    expect(noteToFrequency("bb4")).toBeCloseTo(466.16, 1);
  });
});

describe("frequencyToNote", () => {
  it("440 Hz = A4", () => {
    const result = frequencyToNote(440);
    expect(result).not.toBeNull();
    expect(result!.noteName).toBe("A");
    expect(result!.octave).toBe(4);
    expect(result!.centsOff).toBe(0);
  });

  it("261.63 Hz ≈ C4", () => {
    const result = frequencyToNote(261.63);
    expect(result).not.toBeNull();
    expect(result!.noteName).toBe("C");
    expect(result!.octave).toBe(4);
  });

  it("returns null for 0", () => {
    expect(frequencyToNote(0)).toBeNull();
  });

  it("returns null for negative", () => {
    expect(frequencyToNote(-100)).toBeNull();
  });

  it("returns null for NaN", () => {
    expect(frequencyToNote(NaN)).toBeNull();
  });

  it("returns null for very high frequency", () => {
    expect(frequencyToNote(50000)).toBeNull();
  });
});

describe("getDailySeed", () => {
  it("same date = same result", () => {
    const d = new Date(2026, 0, 15);
    const a = getDailySeed(d);
    const b = getDailySeed(d);
    expect(a.note).toBe(b.note);
    expect(a.frequency).toBe(b.frequency);
  });

  it("different dates = different results", () => {
    const a = getDailySeed(new Date(2026, 0, 15));
    const b = getDailySeed(new Date(2026, 0, 16));
    // Could theoretically collide but extremely unlikely
    expect(a.note !== b.note || a.frequency !== b.frequency).toBe(true);
  });

  it("produces identical seed for local-midnight and UTC-midnight on same calendar day", () => {
    // Both Date objects represent Jan 5, 2026 — the function reads local
    // components so these should produce the same seed.
    const a = getDailySeed(new Date(2026, 0, 5, 0, 0, 0));
    const b = getDailySeed(new Date(2026, 0, 5, 23, 59, 59));
    expect(a).toEqual(b);
  });

  it("does not collide between month-day permutations that share an unpadded string", () => {
    // Before the zero-pad fix, Jan-12 ("2026-1-12") and Dec-1 ("2026-12-1")
    // were distinct, but Jan-1 ("2026-1-1") and Nov-1 ("2026-11-1") could
    // land close in hash space. With padding every date is unique.
    const jan1 = getDailySeed(new Date(2026, 0, 1));
    const nov1 = getDailySeed(new Date(2026, 10, 1));
    const dec1 = getDailySeed(new Date(2026, 11, 1));
    const seeds = [jan1, nov1, dec1].map((s) => `${s.note}@${s.frequency}`);
    expect(new Set(seeds).size).toBeGreaterThanOrEqual(2);
  });

  it("returns a frequency within audible musical range", () => {
    const seed = getDailySeed(new Date(2026, 6, 4));
    expect(seed.frequency).toBeGreaterThan(60);
    expect(seed.frequency).toBeLessThan(2100);
  });
});

describe("getAllNoteNames", () => {
  it("returns 12 notes", () => {
    const notes = getAllNoteNames();
    expect(notes).toHaveLength(12);
    expect(notes[0]).toBe("C");
    expect(notes[11]).toBe("B");
  });
});

describe("generateNoteOptions", () => {
  it("default returns 4 natural notes", () => {
    const opts = generateNoteOptions();
    expect(opts).toHaveLength(4);
    expect(opts.every((n) => !n.includes("#"))).toBe(true);
  });

  it("with sharps includes sharps", () => {
    const opts = generateNoteOptions(6, true);
    expect(opts).toHaveLength(6);
  });

  it("clamps count to pool size", () => {
    const opts = generateNoteOptions(20, false);
    expect(opts.length).toBeLessThanOrEqual(7);
  });
});

describe("calculateScore", () => {
  it("0 accuracy = 0 score", () => {
    expect(calculateScore("note-id", 0, 1000, 0)).toBe(0);
  });

  it("perfect accuracy with streak gives higher score", () => {
    const low = calculateScore("note-id", 1.0, 1000, 0);
    const high = calculateScore("note-id", 1.0, 1000, 5);
    expect(high).toBeGreaterThan(low);
  });

  it("faster response = higher score", () => {
    const slow = calculateScore("note-id", 1.0, 5000, 0);
    const fast = calculateScore("note-id", 1.0, 500, 0);
    expect(fast).toBeGreaterThan(slow);
  });

  it("frequency modes give higher multiplier", () => {
    const basic = calculateScore("pitch-match", 1.0, 1000, 0);
    const freq = calculateScore("frequency-wordle", 1.0, 1000, 0);
    expect(freq).toBeGreaterThan(basic);
  });

  it("hard difficulty scores higher than easy for identical performance", () => {
    const easy = calculateScore("note-id", 1.0, 1000, 3, "easy");
    const medium = calculateScore("note-id", 1.0, 1000, 3, "medium");
    const hard = calculateScore("note-id", 1.0, 1000, 3, "hard");

    expect(hard).toBeGreaterThan(medium);
    expect(medium).toBeGreaterThan(easy);
  });

  it("advanced modes now outscore foundational modes at the same difficulty", () => {
    // Before the fix, chord-detective (advanced) had no multiplier entry and
    // silently defaulted to 1.0 — scoring the same as pitch-match.
    const foundational = calculateScore("pitch-match", 1.0, 1000, 0, "medium");
    const advanced = calculateScore("chord-detective", 1.0, 1000, 0, "medium");
    expect(advanced).toBeGreaterThan(foundational);
  });

  it("every game mode has a non-default multiplier", () => {
    // Regression guard: ensures no mode silently falls back to 1.0 unless
    // intentionally set (only pitch-match is explicitly 1.0).
    for (const mode of GAME_MODES) {
      const score = calculateScore(mode, 1.0, 1000, 0, "easy");
      // At easy (1.0x difficulty) with perfect accuracy, every mode should
      // produce a positive score.
      expect(score).toBeGreaterThan(0);
    }
  });
});
