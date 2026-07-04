import { describe, it, expect } from "vitest";
import { noteToStaffPos, staffPosToY, STAFF_LINES } from "../staff";

describe("noteToStaffPos", () => {
  describe("naturals", () => {
    it("maps C to position 0 with no accidental", () => {
      expect(noteToStaffPos("C4")).toEqual({ position: 0, accidental: null });
    });

    it("maps E to position 2 (first staff line)", () => {
      expect(noteToStaffPos("E4")).toEqual({ position: 2, accidental: null });
    });

    it("maps B to position 6 (middle line)", () => {
      expect(noteToStaffPos("B4")).toEqual({ position: 6, accidental: null });
    });
  });

  describe("sharps", () => {
    it("maps C# to position 0 with sharp accidental", () => {
      expect(noteToStaffPos("C#4")).toEqual({ position: 0, accidental: "#" });
    });

    it("maps F# to position 3 with sharp accidental", () => {
      expect(noteToStaffPos("F#4")).toEqual({ position: 3, accidental: "#" });
    });
  });

  describe("flats", () => {
    it("maps Bb to position 6 with flat accidental", () => {
      expect(noteToStaffPos("Bb4")).toEqual({ position: 6, accidental: "b" });
    });

    it("maps Eb to position 2 with flat accidental", () => {
      expect(noteToStaffPos("Eb4")).toEqual({ position: 2, accidental: "b" });
    });

    it("maps Ab to position 5 with flat accidental", () => {
      expect(noteToStaffPos("Ab4")).toEqual({ position: 5, accidental: "b" });
    });
  });

  describe("without octave", () => {
    it("maps note name without octave digit", () => {
      expect(noteToStaffPos("C")).toEqual({ position: 0, accidental: null });
      expect(noteToStaffPos("F#")).toEqual({ position: 3, accidental: "#" });
      expect(noteToStaffPos("Bb")).toEqual({ position: 6, accidental: "b" });
    });
  });

  describe("edge cases", () => {
    it("falls back to middle position for unknown note", () => {
      expect(noteToStaffPos("H4")).toEqual({ position: 4, accidental: null });
      expect(noteToStaffPos("")).toEqual({ position: 4, accidental: null });
    });
  });
});

describe("STAFF_LINES", () => {
  it("has exactly 5 lines", () => {
    expect(STAFF_LINES).toHaveLength(5);
  });

  it("covers E4, G4, B4, D5, F5", () => {
    expect(STAFF_LINES).toEqual([2, 4, 6, 8, 10]);
  });
});

describe("staffPosToY", () => {
  it("returns 0 for the bottom line (E4, position 2)", () => {
    expect(staffPosToY(2)).toBe(0);
  });

  it("returns positive offset for positions above the bottom line", () => {
    expect(staffPosToY(4)).toBeGreaterThan(0);
  });

  it("returns negative offset for positions below the bottom line", () => {
    expect(staffPosToY(0)).toBeLessThan(0);
  });

  it("scales with line spacing", () => {
    const small = staffPosToY(4, 10);
    const large = staffPosToY(4, 20);
    expect(large).toBeGreaterThan(small);
  });
});
