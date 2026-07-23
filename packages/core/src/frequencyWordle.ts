export const FREQUENCY_WORDLE_MAX_GUESSES = 6;
export const FREQUENCY_WORDLE_MIN_GUESS = 20;
export const FREQUENCY_WORDLE_MAX_GUESS = 20_000;

export type FrequencyWordleFeedback = "correct" | "close" | "miss";
export type FrequencyWordleDirection = "higher" | "lower";
export type FrequencyWordlePhase = "playing" | "won" | "lost";

export interface FrequencyWordleFeedbackResult {
  feedback: FrequencyWordleFeedback;
  direction?: FrequencyWordleDirection;
}

export interface FrequencyGuessParseResult {
  value: number | null;
  error: string | null;
}

const FEEDBACK_SYMBOLS: Record<FrequencyWordleFeedback, string> = {
  correct: "🟩",
  close: "🟨",
  miss: "🟥",
};

function assertPositiveFinite(value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Frequency values must be positive finite numbers.");
  }
}

export function getFrequencyWordleFeedback(
  guess: number,
  target: number,
): FrequencyWordleFeedbackResult {
  assertPositiveFinite(guess);
  assertPositiveFinite(target);

  const percentError = (Math.abs(guess - target) / target) * 100;
  if (percentError <= 2) return { feedback: "correct" };

  return {
    feedback: percentError <= 10 ? "close" : "miss",
    direction: guess < target ? "higher" : "lower",
  };
}

export function parseFrequencyGuess(input: string): FrequencyGuessParseResult {
  const normalized = input.trim();
  if (!normalized) return { value: null, error: "Enter a frequency." };

  const value = Number(normalized);
  if (!Number.isFinite(value)) return { value: null, error: "Enter a valid number." };
  if (value < FREQUENCY_WORDLE_MIN_GUESS || value > FREQUENCY_WORDLE_MAX_GUESS) {
    return { value: null, error: "Use a frequency from 20 to 20,000 Hz." };
  }

  return { value: Math.round(value * 10) / 10, error: null };
}

export function buildFrequencyWordleResult(
  phase: Exclude<FrequencyWordlePhase, "playing">,
  attempts: number,
): { score: number; accuracy: number; rounds: number } {
  if (!Number.isInteger(attempts) || attempts < 1 || attempts > FREQUENCY_WORDLE_MAX_GUESSES) {
    throw new Error("Frequency Wordle attempts must be between 1 and 6.");
  }

  if (phase === "lost") return { score: 0, accuracy: 0, rounds: attempts };
  return { score: (FREQUENCY_WORDLE_MAX_GUESSES + 1 - attempts) * 100, accuracy: 1 / attempts, rounds: attempts };
}

export function buildFrequencyWordleShareText(
  feedback: readonly FrequencyWordleFeedback[],
): string {
  if (feedback.length < 1 || feedback.length > FREQUENCY_WORDLE_MAX_GUESSES) {
    throw new Error("Frequency Wordle share feedback must contain between 1 and 6 attempts.");
  }

  const solvedAt = feedback.findIndex((result) => result === "correct");
  const score = solvedAt === -1 ? "X" : String(solvedAt + 1);
  return `Frequency Wordle ${score}/6\n${feedback.map((result) => FEEDBACK_SYMBOLS[result]).join("\n")}`;
}

export function formatFrequency(frequency: number): string {
  assertPositiveFinite(frequency);
  return `${Number.isInteger(frequency) ? frequency.toFixed(0) : frequency.toFixed(1)} Hz`;
}
