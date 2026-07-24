import { describe, it, expect } from "vitest";
import {
  CHROMATIC_SCALE,
  OCTAVE_SEMITONES,
  INTERVALS,
  intervalBySemitones,
  intervalsInPool,
  CHORD_TYPES,
  CHORD_INTERVALS,
  chordTypeById,
  chordNotes,
  chordLabel,
} from "../musicTheory";

describe("CHROMATIC_SCALE", () => {
  it("has 12 notes starting at C", () => {
    expect(CHROMATIC_SCALE).toHaveLength(12);
    expect(CHROMATIC_SCALE[0]).toBe("C");
    expect(CHROMATIC_SCALE[11]).toBe("B");
  });

  it("includes all sharps and no flats", () => {
    expect(CHROMATIC_SCALE).toContain("C#");
    expect(CHROMATIC_SCALE).toContain("F#");
    expect(CHROMATIC_SCALE).not.toContain("Db");
    expect(CHROMATIC_SCALE).not.toContain("Bb");
  });

  it("has no duplicates", () => {
    expect(new Set(CHROMATIC_SCALE).size).toBe(12);
  });
});

describe("INTERVALS", () => {
  it("has 13 entries from unison to octave", () => {
    expect(INTERVALS).toHaveLength(13);
    expect(INTERVALS[0]!.semitones).toBe(0);
    expect(INTERVALS[12]!.semitones).toBe(12);
  });

  it("is ordered by semitone count ascending", () => {
    for (let i = 1; i < INTERVALS.length; i++) {
      expect(INTERVALS[i]!.semitones).toBeGreaterThan(INTERVALS[i - 1]!.semitones);
    }
  });

  it("every interval has a non-empty name and abbreviation", () => {
    for (const interval of INTERVALS) {
      expect(interval.name.length).toBeGreaterThan(0);
      expect(interval.abbr.length).toBeGreaterThan(0);
    }
  });

  it("includes well-known intervals", () => {
    expect(intervalBySemitones(7)?.name).toBe("Perfect 5th");
    expect(intervalBySemitones(4)?.name).toBe("Major 3rd");
    expect(intervalBySemitones(3)?.abbr).toBe("m3");
    expect(intervalBySemitones(0)?.name).toBe("Unison");
  });
});

describe("intervalBySemitones", () => {
  it("returns the interval for valid semitone counts", () => {
    expect(intervalBySemitones(5)?.semitones).toBe(5);
    expect(intervalBySemitones(12)?.name).toBe("Octave");
  });

  it("returns undefined for unknown semitone counts", () => {
    expect(intervalBySemitones(13)).toBeUndefined();
    expect(intervalBySemitones(-1)).toBeUndefined();
    expect(intervalBySemitones(99)).toBeUndefined();
  });
});

describe("intervalsInPool", () => {
  it("returns intervals matching the pool, in ascending order", () => {
    const result = intervalsInPool([3, 4, 7]);
    expect(result).toHaveLength(3);
    expect(result[0]!.semitones).toBe(3);
    expect(result[1]!.semitones).toBe(4);
    expect(result[2]!.semitones).toBe(7);
  });

  it("returns empty array for an empty pool", () => {
    expect(intervalsInPool([])).toEqual([]);
  });

  it("ignores semitones not in the canonical INTERVALS list", () => {
    // 2 and 13 — 2 exists, 13 does not
    const result = intervalsInPool([2, 13]);
    expect(result).toHaveLength(1);
    expect(result[0]!.semitones).toBe(2);
  });

  it("handles a realistic harmonic pool (triads + octave)", () => {
    const harmonic = intervalsInPool([3, 4, 5, 7, 12]);
    expect(harmonic).toHaveLength(5);
    expect(harmonic.map((i) => i.name)).toEqual([
      "Minor 3rd",
      "Major 3rd",
      "Perfect 4th",
      "Perfect 5th",
      "Octave",
    ]);
  });
});

describe("CHORD_TYPES", () => {
  it("has 6 chord types", () => {
    expect(CHORD_TYPES).toHaveLength(6);
  });

  it("every type has id, label, symbol, and intervals", () => {
    for (const ct of CHORD_TYPES) {
      expect(ct.id.length).toBeGreaterThan(0);
      expect(ct.label.length).toBeGreaterThan(0);
      expect(ct.intervals.length).toBeGreaterThanOrEqual(3);
      // symbol can be empty string (major)
      expect(typeof ct.symbol).toBe("string");
    }
  });

  it("major triad is [0, 4, 7]", () => {
    expect(chordTypeById("major")?.intervals).toEqual([0, 4, 7]);
  });

  it("dom7 is a 4-note chord", () => {
    expect(chordTypeById("dom7")?.intervals).toEqual([0, 4, 7, 10]);
    expect(chordTypeById("dom7")?.intervals).toHaveLength(4);
  });
});

describe("CHORD_INTERVALS", () => {
  it("has an entry for every chord type id", () => {
    for (const ct of CHORD_TYPES) {
      expect(CHORD_INTERVALS[ct.id]).toBeDefined();
      expect(CHORD_INTERVALS[ct.id]).toEqual(ct.intervals);
    }
  });

  it("major interval formula matches the chord type definition", () => {
    expect(CHORD_INTERVALS.major).toEqual([0, 4, 7]);
    expect(CHORD_INTERVALS.dim).toEqual([0, 3, 6]);
    expect(CHORD_INTERVALS.aug).toEqual([0, 4, 8]);
  });
});

describe("chordTypeById", () => {
  it("finds existing chord types", () => {
    expect(chordTypeById("minor")?.label).toBe("Minor");
    expect(chordTypeById("min7")?.symbol).toBe("m7");
  });

  it("returns undefined for unknown ids", () => {
    expect(chordTypeById("sus4")).toBeUndefined();
    expect(chordTypeById("")).toBeUndefined();
  });
});

describe("chordNotes", () => {
  it("returns the correct notes for a C major triad", () => {
    expect(chordNotes("C", "major")).toEqual(["C", "E", "G"]);
  });

  it("returns the correct notes for a C minor triad", () => {
    expect(chordNotes("C", "minor")).toEqual(["C", "D#", "G"]);
  });

  it("wraps around the octave correctly", () => {
    // A major = A, C#, E — no wrap needed
    expect(chordNotes("A", "major")).toEqual(["A", "C#", "E"]);
    // G major = G, B, D — D wraps to next octave in chromatic index
    expect(chordNotes("G", "major")).toEqual(["G", "B", "D"]);
    // B major = B, D#, F# — wraps past B
    expect(chordNotes("B", "major")).toEqual(["B", "D#", "F#"]);
  });

  it("returns 4 notes for 7th chords", () => {
    expect(chordNotes("C", "dom7")).toEqual(["C", "E", "G", "A#"]);
    expect(chordNotes("C", "min7")).toEqual(["C", "D#", "G", "A#"]);
  });

  it("returns empty array for invalid root note", () => {
    expect(chordNotes("H", "major")).toEqual([]);
    expect(chordNotes("", "major")).toEqual([]);
  });

  it("returns empty array for invalid chord type", () => {
    expect(chordNotes("C", "sus4")).toEqual([]);
  });
});

describe("chordLabel", () => {
  it("combines root and symbol for major (empty symbol)", () => {
    expect(chordLabel("C", "major")).toBe("C");
    expect(chordLabel("D", "major")).toBe("D");
  });

  it("combines root and symbol for minor", () => {
    expect(chordLabel("C", "minor")).toBe("Cm");
  });

  it("combines root and symbol for 7th chords", () => {
    expect(chordLabel("G", "dom7")).toBe("G7");
    expect(chordLabel("A", "min7")).toBe("Am7");
  });

  it("falls back to root + label for unknown type", () => {
    expect(chordLabel("C", "unknown")).toBe("C unknown");
  });
});

describe("Data integrity", () => {
  it("OCTAVE_SEMITONES is 12", () => {
    expect(OCTAVE_SEMITONES).toBe(12);
  });

  it("all chord intervals stay within one octave", () => {
    for (const ct of CHORD_TYPES) {
      for (const semi of ct.intervals) {
        expect(semi).toBeGreaterThanOrEqual(0);
        expect(semi).toBeLessThanOrEqual(OCTAVE_SEMITONES);
      }
    }
  });

  it("all chord roots map via chordNotes produce only chromatic notes", () => {
    for (const root of CHROMATIC_SCALE) {
      const notes = chordNotes(root, "major");
      for (const note of notes) {
        expect(CHROMATIC_SCALE).toContain(note);
      }
    }
  });
});
