import {
  describe,
  it,
  expect,
  vi,
} from "vitest";
import {
  noteToFrequency,
  frequencyToNote,
  getDailySeed,
  getAllNoteNames,
  generateNoteOptions,
  calculateScore,
} from "../audio";

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
    expect(noteToFrequency("F#3")).toBeCloseTo(185.00, 1);
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
});
