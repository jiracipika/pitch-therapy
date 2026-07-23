import { describe, expect, it } from "vitest";
import {
  buildFrequencyWordleResult,
  buildFrequencyWordleShareText,
  formatFrequency,
  getFrequencyWordleFeedback,
  parseFrequencyGuess,
} from "../frequencyWordle";

describe("getFrequencyWordleFeedback", () => {
  it("marks guesses within two percent as correct", () => {
    expect(getFrequencyWordleFeedback(490, 500)).toEqual({ feedback: "correct" });
    expect(getFrequencyWordleFeedback(510, 500)).toEqual({ feedback: "correct" });
  });

  it("returns closeness and an audible direction hint", () => {
    expect(getFrequencyWordleFeedback(460, 500)).toEqual({ feedback: "close", direction: "higher" });
    expect(getFrequencyWordleFeedback(550, 500)).toEqual({ feedback: "close", direction: "lower" });
    expect(getFrequencyWordleFeedback(300, 500)).toEqual({ feedback: "miss", direction: "higher" });
  });

  it("rejects invalid frequencies", () => {
    expect(() => getFrequencyWordleFeedback(0, 500)).toThrow("positive finite");
    expect(() => getFrequencyWordleFeedback(500, Number.NaN)).toThrow("positive finite");
  });
});

describe("parseFrequencyGuess", () => {
  it("accepts decimal guesses and normalizes them to one decimal place", () => {
    expect(parseFrequencyGuess("440.04")).toEqual({ value: 440, error: null });
    expect(parseFrequencyGuess("440.06")).toEqual({ value: 440.1, error: null });
  });

  it("returns useful errors for empty, malformed, and out-of-range guesses", () => {
    expect(parseFrequencyGuess(" ").error).toContain("Enter");
    expect(parseFrequencyGuess("440 Hz").error).toContain("number");
    expect(parseFrequencyGuess("19").error).toContain("20");
    expect(parseFrequencyGuess("20001").error).toContain("20,000");
  });
});

describe("frequency Wordle summaries", () => {
  it("builds honest result metrics from attempts", () => {
    expect(buildFrequencyWordleResult("won", 3)).toEqual({ score: 400, accuracy: 1 / 3, rounds: 3 });
    expect(buildFrequencyWordleResult("lost", 6)).toEqual({ score: 0, accuracy: 0, rounds: 6 });
    expect(() => buildFrequencyWordleResult("won", 0)).toThrow("between 1 and 6");
  });

  it("shares the attempt grid without revealing the target", () => {
    expect(buildFrequencyWordleShareText(["miss", "close", "correct"])).toBe(
      "Frequency Wordle 3/6\n🟥\n🟨\n🟩",
    );
    expect(buildFrequencyWordleShareText(Array(6).fill("miss"))).toContain("X/6");
  });

  it("formats whole and decimal frequencies without noisy zeroes", () => {
    expect(formatFrequency(440)).toBe("440 Hz");
    expect(formatFrequency(440.1)).toBe("440.1 Hz");
  });
});
