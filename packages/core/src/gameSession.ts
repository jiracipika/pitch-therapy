import type {
  GameMode,
  Difficulty,
  SessionPhase,
  RoundResult,
} from "./index";

// ─── State Types ─────────────────────────────────────────────────────────────

export interface SessionState {
  phase: SessionPhase;
  mode: GameMode;
  difficulty: Difficulty;
  score: number;
  round: number;
  totalRounds: number;
  rounds: RoundResult[];
  currentTarget: { note?: string; frequency?: number };
  streak: number;
  startTime: number | null;
  isComplete: boolean;
  // Wordle-specific
  maxAttempts: number;
  attempts: WordleAttempt[];
}

export interface WordleAttempt {
  answer: string | number;
  feedback: WordleFeedback[];
}

export type WordleFeedback = "correct" | "close" | "wrong";

export type SessionAction =
  | { type: "START"; mode: GameMode; difficulty: Difficulty; totalRounds: number }
  | { type: "NEXT_ROUND"; target: { note?: string; frequency?: number } }
  | { type: "SUBMIT_ANSWER"; answer: string | number; responseTimeMs: number }
  | { type: "COMPLETE" }
  | { type: "RESET" };

// ─── Helpers ─────────────────────────────────────────────────────────────────

const isWordleMode = (mode: GameMode) =>
  mode === "note-wordle" || mode === "frequency-wordle";

function isAnswerCorrect(
  mode: GameMode,
  answer: string | number,
  target: { note?: string; frequency?: number },
): { correct: boolean; centsOff?: number } {
  if (mode === "note-id" || mode === "note-wordle") {
    const ans = String(answer).toUpperCase().replace(" ", "");
    const tgt = target.note?.toUpperCase().replace(" ", "");
    return { correct: ans === tgt };
  }

  if (mode === "frequency-guess" || mode === "frequency-wordle") {
    const ansFreq = Number(answer);
    const tgtFreq = target.frequency ?? 440;
    const centsOff = Math.round(
      1200 * Math.log2(ansFreq / tgtFreq),
    );
    const correct = Math.abs(centsOff) <= 10; // within 10 cents
    return { correct, centsOff };
  }

  // pitch-match: any non-empty answer is "submitted" (correctness determined upstream)
  return { correct: true };
}

function getWordleFeedback(
  mode: GameMode,
  answer: string | number,
  target: { note?: string; frequency?: number },
  allNotes: string[],
): WordleFeedback[] {
  if (mode === "note-wordle") {
    const guess = String(answer).toUpperCase().replace(" ", "");
    const correct = target.note?.toUpperCase().replace(" ", "") ?? "";

    return guess.split("").map((char, i) => {
      if (char === correct[i]) return "correct";
      if (correct.includes(char)) return "close";
      return "wrong";
    });
  }

  if (mode === "frequency-wordle") {
    // Single-cell feedback for frequency
    const ansFreq = Number(answer);
    const tgtFreq = target.frequency ?? 440;
    const pctOff = Math.abs(ansFreq - tgtFreq) / tgtFreq;

    if (pctOff < 0.02) return ["correct"];
    if (pctOff < 0.1) return ["close"];
    return ["wrong"];
  }

  return [];
}

const ALL_NOTES_FOR_WORDLE = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
];

// ─── Initial State ───────────────────────────────────────────────────────────

export const initialSessionState: SessionState = {
  phase: "idle",
  mode: "pitch-match",
  difficulty: "easy",
  score: 0,
  round: 0,
  totalRounds: 0,
  rounds: [],
  currentTarget: {},
  streak: 0,
  startTime: null,
  isComplete: false,
  maxAttempts: 6,
  attempts: [],
};

// ─── Reducer ─────────────────────────────────────────────────────────────────

export function sessionReducer(
  state: SessionState,
  action: SessionAction,
): SessionState {
  switch (action.type) {
    case "START":
      return {
        ...initialSessionState,
        mode: action.mode,
        difficulty: action.difficulty,
        totalRounds: action.totalRounds,
        phase: "in_round",
        round: 1,
        startTime: Date.now(),
        maxAttempts: isWordleMode(action.mode) ? 6 : 1,
      };

    case "NEXT_ROUND":
      if (state.isComplete) return state;
      return {
        ...state,
        round: state.round + 1,
        currentTarget: action.target,
        attempts: [],
        phase: "in_round",
      };

    case "SUBMIT_ANSWER": {
      if (state.isComplete || state.phase !== "in_round") return state;

      const { correct, centsOff } = isAnswerCorrect(
        state.mode,
        action.answer,
        state.currentTarget,
      );

      // Wordle: accumulate attempts
      if (isWordleMode(state.mode)) {
        const feedback = getWordleFeedback(
          state.mode,
          action.answer,
          state.currentTarget,
          ALL_NOTES_FOR_WORDLE,
        );
        const newAttempts = [
          ...state.attempts,
          { answer: action.answer, feedback },
        ];

        // Check if wordle is done (correct or max attempts reached)
        const wordleDone =
          correct || newAttempts.length >= state.maxAttempts;

        // Score for wordle: fewer attempts = more points
        let points = 0;
        if (correct) {
          const attemptBonus = state.maxAttempts - newAttempts.length + 1;
          points = 50 + attemptBonus * 25;
        }

        const newRound: RoundResult = {
          round: state.round,
          correct,
          points,
          target: state.currentTarget,
          answer: action.answer,
          timeMs: action.responseTimeMs,
        };

        const nextRound = wordleDone
          ? state.round + 1
          : state.round;

        return {
          ...state,
          attempts: newAttempts,
          rounds: [...state.rounds, newRound],
          score: state.score + points,
          streak: correct ? state.streak + 1 : 0,
          round: nextRound,
          phase: wordleDone ? (nextRound > state.totalRounds ? "complete" : "scoring") : "in_round",
          isComplete: wordleDone && nextRound > state.totalRounds,
        };
      }

      // Non-wordle modes
      const points = correct
        ? Math.round(100 * Math.max(0, 1 - action.responseTimeMs / 10000))
        : 0;

      const newRound: RoundResult = {
        round: state.round,
        correct,
        points,
        target: state.currentTarget,
        answer: action.answer,
        timeMs: action.responseTimeMs,
      };

      const nextRound = state.round + 1;
      return {
        ...state,
        rounds: [...state.rounds, newRound],
        score: state.score + points,
        streak: correct ? state.streak + 1 : 0,
        round: nextRound,
        phase:
          nextRound > state.totalRounds ? "complete" : "scoring",
        isComplete: nextRound > state.totalRounds,
      };
    }

    case "COMPLETE":
      return {
        ...state,
        phase: "complete",
        isComplete: true,
      };

    case "RESET":
      return { ...initialSessionState };

    default:
      return state;
  }
}

// ─── Share Grid ──────────────────────────────────────────────────────────────

const FEEDBACK_EMOJI: Record<WordleFeedback, string> = {
  correct: "🟩",
  close: "🟨",
  wrong: "🟥",
};

export function generateShareGrid(attempts: WordleAttempt[]): string {
  return attempts
    .map((a) => a.feedback.map((f) => FEEDBACK_EMOJI[f]).join(""))
    .join("\n");
}
