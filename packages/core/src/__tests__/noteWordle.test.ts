import { describe, expect, it } from "vitest";
import {
  NOTE_WORDLE_NOTES,
  buildNoteWordleResult,
  buildNoteWordleShareText,
  getNoteWordleFeedback,
  noteForSpeech,
} from "../noteWordle";

describe("getNoteWordleFeedback", () => {
  it("marks the target note correct", () => {
    expect(getNoteWordleFeedback("F#", "F#")).toBe("correct");
  });

  it("treats pitch-class distance as circular at the octave boundary", () => {
    expect(getNoteWordleFeedback("B", "C")).toBe("close");
    expect(getNoteWordleFeedback("C", "A#")).toBe("close");
    expect(getNoteWordleFeedback("A", "C")).toBe("miss");
  });

  it("rejects notes outside the supported chromatic set", () => {
    expect(() => getNoteWordleFeedback("H", "C")).toThrow(/Unsupported note/);
    expect(() => getNoteWordleFeedback("C", "Db")).toThrow(/Unsupported note/);
  });
});

describe("buildNoteWordleResult", () => {
  it("rewards a first-guess solve with the maximum score and full accuracy", () => {
    expect(buildNoteWordleResult("won", 1)).toEqual({
      score: 600,
      accuracy: 1,
      rounds: 1,
    });
  });

  it("uses answer rate for later solves and zeroes failed puzzles", () => {
    expect(buildNoteWordleResult("won", 4)).toEqual({
      score: 300,
      accuracy: 0.25,
      rounds: 4,
    });
    expect(buildNoteWordleResult("lost", 6)).toEqual({
      score: 0,
      accuracy: 0,
      rounds: 6,
    });
  });

  it("rejects impossible attempt counts", () => {
    expect(() => buildNoteWordleResult("won", 0)).toThrow(/between 1 and 6/);
    expect(() => buildNoteWordleResult("lost", 7)).toThrow(/between 1 and 6/);
  });
});

describe("Note Wordle presentation helpers", () => {
  it("keeps a stable chromatic note order", () => {
    expect(NOTE_WORDLE_NOTES).toEqual([
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
    ]);
  });

  it("creates screen-reader-friendly sharp note names", () => {
    expect(noteForSpeech("C#")).toBe("C sharp");
    expect(noteForSpeech("A")).toBe("A");
  });

  it("builds a shareable result without revealing the target", () => {
    expect(buildNoteWordleShareText(["miss", "close", "correct"])).toBe(
      "Note Wordle 3/6\n🟥\n🟨\n🟩",
    );
    expect(buildNoteWordleShareText(Array(6).fill("miss"))).toBe(
      "Note Wordle X/6\n🟥\n🟥\n🟥\n🟥\n🟥\n🟥",
    );
  });
});
