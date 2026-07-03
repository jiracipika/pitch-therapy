import { GAME_MODE_META, GAME_MODES, type GameMode, type ModeCategoryId } from "./gameData";

export type PracticeFocus = "balanced" | "pitch" | "frequency" | "speed" | "advanced";

export interface PracticePlanStep {
  label: string;
  detail: string;
  modeId: GameMode;
}

export interface PracticePlan {
  focus: PracticeFocus;
  title: string;
  summary: string;
  modeIds: GameMode[];
  steps: PracticePlanStep[];
}

export interface ModeTrainingCue {
  skillLabel: string;
  durationLabel: string;
  sessionGoal: string;
}

const FOCUS_ROTATION: PracticeFocus[] = [
  "balanced",
  "pitch",
  "frequency",
  "advanced",
  "speed",
  "pitch",
  "balanced",
];

const FOCUS_COPY: Record<PracticeFocus, Omit<PracticePlan, "focus" | "modeIds" | "steps">> = {
  balanced: {
    title: "Balanced ear tune-up",
    summary: "Recognition, pitch control, and pressure in one short session.",
  },
  pitch: {
    title: "Pitch control day",
    summary: "Match, sing, and memorize tones before adding speed.",
  },
  frequency: {
    title: "Frequency accuracy day",
    summary: "Calibrate low-to-high hearing with frequency-first drills.",
  },
  speed: {
    title: "Fast reaction day",
    summary: "Start clean, then finish with timed recognition pressure.",
  },
  advanced: {
    title: "Advanced listening day",
    summary: "Train intervals, cents, and harmony with a light warm-up first.",
  },
};

const FOCUS_MODES: Record<PracticeFocus, GameMode[]> = {
  balanced: ["note-id", "pitch-match", "speed-round"],
  pitch: ["pitch-match", "tune-in", "pitch-memory"],
  frequency: ["frequency-guess", "frequency-slider", "frequency-wordle"],
  speed: ["note-id", "piano-tap", "speed-round"],
  advanced: ["drone-lock", "interval-archer", "chord-detective"],
};

const STEP_LABELS = ["Warm up", "Focus", "Finish strong"];

const CATEGORY_TRAINING_CUES: Record<ModeCategoryId, ModeTrainingCue> = {
  foundational: {
    skillLabel: "Core listening",
    durationLabel: "3-5 min",
    sessionGoal: "Build reliable note and frequency recognition before moving faster.",
  },
  wordle: {
    skillLabel: "Daily puzzle",
    durationLabel: "4-6 min",
    sessionGoal: "Use repeatable guesses to sharpen interval memory and elimination strategy.",
  },
  pitch: {
    skillLabel: "Pitch control",
    durationLabel: "5-8 min",
    sessionGoal: "Match, hold, and reproduce target tones with steady feedback.",
  },
  interactive: {
    skillLabel: "Hands-on drill",
    durationLabel: "3-6 min",
    sessionGoal: "Turn what you hear into a fast physical answer on the staff, keys, or slider.",
  },
  advanced: {
    skillLabel: "Advanced ear",
    durationLabel: "6-10 min",
    sessionGoal: "Challenge fine-grained interval, harmony, tuning, and cents judgment.",
  },
  speed: {
    skillLabel: "Timed reflexes",
    durationLabel: "2-4 min",
    sessionGoal: "Keep recognition accurate while decisions get faster under pressure.",
  },
};

export function getPracticeFocusForDate(date = new Date()): PracticeFocus {
  return FOCUS_ROTATION[date.getDay()] ?? "balanced";
}

export function getRecommendedModes(focus: PracticeFocus = "balanced", limit = 3): GameMode[] {
  const seedModes = FOCUS_MODES[focus] ?? FOCUS_MODES.balanced;
  const uniqueModes = [...seedModes, ...GAME_MODES].filter(
    (modeId, index, all) => all.indexOf(modeId) === index,
  );
  return uniqueModes.slice(0, Math.max(1, limit));
}

export function getModesByCategory(categoryId: ModeCategoryId): GameMode[] {
  return GAME_MODES.filter((modeId) => GAME_MODE_META[modeId].category === categoryId);
}

export function getModeTrainingCue(modeId: GameMode): ModeTrainingCue {
  return CATEGORY_TRAINING_CUES[GAME_MODE_META[modeId].category];
}

export function buildPracticePlan(
  date = new Date(),
  focus = getPracticeFocusForDate(date),
): PracticePlan {
  const modeIds = getRecommendedModes(focus, 3);
  const steps = modeIds.map((modeId, index) => {
    const mode = GAME_MODE_META[modeId];
    return {
      label: STEP_LABELS[index] ?? `Step ${index + 1}`,
      detail: `${mode.label}: ${mode.description.toLowerCase()}.`,
      modeId,
    };
  });

  return {
    focus,
    ...FOCUS_COPY[focus],
    modeIds,
    steps,
  };
}
