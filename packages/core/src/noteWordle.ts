export const NOTE_WORDLE_NOTES = [
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

export type NoteWordleNote = (typeof NOTE_WORDLE_NOTES)[number];
export type NoteWordleFeedback = "correct" | "close" | "miss";
export type NoteWordlePhase = "playing" | "won" | "lost";

const FEEDBACK_SYMBOLS: Record<NoteWordleFeedback, string> = {
  correct: "🟩",
  close: "🟨",
  miss: "🟥",
};

function noteIndex(note: string): number {
  const index = NOTE_WORDLE_NOTES.indexOf(note as NoteWordleNote);
  if (index === -1) throw new Error(`Unsupported note: ${note}`);
  return index;
}

export function getNoteWordleFeedback(guess: string, target: string): NoteWordleFeedback {
  const guessIndex = noteIndex(guess);
  const targetIndex = noteIndex(target);
  const directDistance = Math.abs(guessIndex - targetIndex);
  const pitchClassDistance = Math.min(directDistance, NOTE_WORDLE_NOTES.length - directDistance);

  if (pitchClassDistance === 0) return "correct";
  return pitchClassDistance <= 2 ? "close" : "miss";
}

export function buildNoteWordleResult(
  phase: Exclude<NoteWordlePhase, "playing">,
  attempts: number,
): { score: number; accuracy: number; rounds: number } {
  if (!Number.isInteger(attempts) || attempts < 1 || attempts > 6) {
    throw new Error("Note Wordle attempts must be between 1 and 6.");
  }

  if (phase === "lost") return { score: 0, accuracy: 0, rounds: attempts };
  return {
    score: (7 - attempts) * 100,
    accuracy: 1 / attempts,
    rounds: attempts,
  };
}

export function noteForSpeech(note: string): string {
  return note.replace("#", " sharp");
}

export function buildNoteWordleShareText(feedback: readonly NoteWordleFeedback[]): string {
  if (feedback.length < 1 || feedback.length > 6) {
    throw new Error("Note Wordle share feedback must contain between 1 and 6 attempts.");
  }

  const solvedAt = feedback.findIndex((result) => result === "correct");
  const score = solvedAt === -1 ? "X" : String(solvedAt + 1);
  return `Note Wordle ${score}/6\n${feedback.map((result) => FEEDBACK_SYMBOLS[result]).join("\n")}`;
}
