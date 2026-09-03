import { describe, expect, it } from "vitest";
import { noteToFrequency } from "../audio";
import { calculateCentsDeviation } from "../pitchDetection";

const CHROMATIC_NOTES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;

describe("calculateCentsDeviation (pitch-class tuning)", () => {
  it("treats C0 and C4 as the same tuned note", () => {
    expect(
      calculateCentsDeviation(noteToFrequency("C0"), noteToFrequency("C4")),
    ).toBeCloseTo(0, 8);
  });

  it.each(CHROMATIC_NOTES)(
    "treats every %s as in tune across octaves",
    (note) => {
      const low = noteToFrequency(`${note}2`);
      const target = noteToFrequency(`${note}4`);
      const high = noteToFrequency(`${note}6`);

      expect(calculateCentsDeviation(low, target)).toBeCloseTo(0, 8);
      expect(calculateCentsDeviation(high, target)).toBeCloseTo(0, 8);
    },
  );

  it("reports one semitone as 100 cents regardless of octave", () => {
    const c4 = noteToFrequency("C4");
    const cSharp2 = noteToFrequency("C#2");
    const b5 = noteToFrequency("B5");

    expect(calculateCentsDeviation(cSharp2, c4)).toBeCloseTo(100, 8);
    expect(calculateCentsDeviation(b5, c4)).toBeCloseTo(-100, 8);
  });

  it("preserves fine tuning offset after removing whole octaves", () => {
    const target = noteToFrequency("A4");
    const lowAPlusEightCents =
      noteToFrequency("A2") * Math.pow(2, 8 / 1200);

    expect(calculateCentsDeviation(lowAPlusEightCents, target)).toBeCloseTo(8, 8);
  });

  it("returns the nearest signed pitch-class distance within ±600 cents", () => {
    const c4 = noteToFrequency("C4");
    const fSharp5 = noteToFrequency("F#5");
    const g2 = noteToFrequency("G2");

    expect(calculateCentsDeviation(fSharp5, c4)).toBeCloseTo(-600, 8);
    expect(calculateCentsDeviation(g2, c4)).toBeCloseTo(-500, 8);
  });

  it("keeps invalid-frequency behavior safe", () => {
    expect(calculateCentsDeviation(0, 440)).toBe(0);
    expect(calculateCentsDeviation(440, -1)).toBe(0);
    expect(calculateCentsDeviation(Number.NaN, 440)).toBe(0);
  });
});
