import { GAME_MODE_META, GAME_MODES, type GameMode, type ModeCategoryId } from "./gameData";
import { buildProgressInsights, type ProgressResult } from "./progressInsights";

export type PracticeFocus = "balanced" | "pitch" | "frequency" | "speed" | "advanced";

export interface PracticePlanStep {
  label: string;
  detail: string;
  modeId: GameMode;
  /**
   * Category-derived training cue for this step (skill label, estimated
   * duration range as a display string like "3-5 min", and a one-line
   * session goal). Populated by {@link buildPracticePlanSteps} so callers
   * don't need to look the mode up themselves.
   */
  cue: ModeTrainingCue;
}

export interface PracticePlan {
  focus: PracticeFocus;
  title: string;
  summary: string;
  personalized: boolean;
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

const FOCUS_COPY: Record<
  PracticeFocus,
  Omit<PracticePlan, "focus" | "modeIds" | "steps" | "personalized">
> = {
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
const VALID_MODE_IDS = new Set<string>(GAME_MODES);

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

function isGameMode(mode: string): mode is GameMode {
  return VALID_MODE_IDS.has(mode);
}

function uniqueModeIds(modeIds: GameMode[]): GameMode[] {
  return modeIds.filter((modeId, index, all) => all.indexOf(modeId) === index);
}

function buildPracticePlanSteps(modeIds: GameMode[]): PracticePlanStep[] {
  return modeIds.map((modeId, index) => {
    const mode = GAME_MODE_META[modeId];
    return {
      label: STEP_LABELS[index] ?? `Step ${index + 1}`,
      detail: `${mode.label}: ${mode.description.toLowerCase()}.`,
      modeId,
      cue: getModeTrainingCue(modeId),
    };
  });
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

  return {
    focus,
    ...FOCUS_COPY[focus],
    personalized: false,
    modeIds,
    steps: buildPracticePlanSteps(modeIds),
  };
}

export function buildAdaptivePracticePlan(
  results: ProgressResult[],
  date = new Date(),
  fallbackFocus = getPracticeFocusForDate(date),
): PracticePlan {
  const normalizedResults = results.filter((result) => isGameMode(result.mode));

  if (normalizedResults.length < 2) {
    return buildPracticePlan(date, fallbackFocus);
  }

  const insights = buildProgressInsights(normalizedResults, 3);
  const priorityModes = insights.weakModes.map((mode) => mode.mode).filter(isGameMode);

  if (!priorityModes.length) {
    return buildPracticePlan(date, fallbackFocus);
  }

  const modeIds = uniqueModeIds([...priorityModes, ...getRecommendedModes(fallbackFocus, 3)]).slice(
    0,
    3,
  );
  const [primaryMode] = modeIds;
  const primaryLabel = primaryMode ? GAME_MODE_META[primaryMode].label : "your weakest mode";

  return {
    focus: fallbackFocus,
    title: `Personalized ${FOCUS_COPY[fallbackFocus].title.toLowerCase()}`,
    summary: `Prioritizes ${primaryLabel} from your recent accuracy trends, then balances today's rotation.`,
    personalized: true,
    modeIds,
    steps: buildPracticePlanSteps(modeIds),
  };
}

/**
 * Parsed min/max minutes from a {@link ModeTrainingCue.durationLabel}.
 * Labels look like "3-5 min", "6-10 min", or occasionally a single number
 * like "5 min". Returns null when the label can't be parsed.
 */
export interface PlanDurationRange {
  minMinutes: number;
  maxMinutes: number;
}

/**
 * Total-session estimate for a practice plan: sums the per-step min and max
 * minutes (drawn from each step's category training cue) into a tight range.
 *
 * Used by the dashboard "Today's Plan" card so a user can see at a glance
 * whether today's plan is a 9-minute tune-up or a 22-minute deep session
 * before committing. Pure and deterministic — safe to call on every render.
 */
export interface PlanDurationEstimate {
  minMinutes: number;
  maxMinutes: number;
  /** Pre-formatted display label, e.g. "9-14 min" or "8 min". */
  label: string;
}

const DURATION_LABEL_RE = /(\d+)\s*-\s*(\d+)/;
const DURATION_SINGLE_RE = /(\d+)/;

/**
 * Parse a category duration label like "3-5 min" or "6-10 min" into a numeric
 * range. Falls back to a single value (min === max) for labels like "5 min".
 * Returns null if no number can be found.
 */
export function parseDurationLabel(label: string): PlanDurationRange | null {
  const range = DURATION_LABEL_RE.exec(label);
  if (range) {
    const lo = Number(range[1]);
    const hi = Number(range[2]);
    if (Number.isFinite(lo) && Number.isFinite(hi) && hi >= lo) {
      return { minMinutes: lo, maxMinutes: hi };
    }
  }
  const single = DURATION_SINGLE_RE.exec(label);
  if (single) {
    const n = Number(single[1]);
    if (Number.isFinite(n) && n > 0) {
      return { minMinutes: n, maxMinutes: n };
    }
  }
  return null;
}

/**
 * Sum the per-step duration ranges of a practice plan into a total-session
 * estimate. Steps whose duration label can't be parsed are treated as 0 and
 * do not contribute to the total. The label is formatted as "X-Y min" when
 * the range has any spread, or "N min" when min === max.
 */
export function estimatePlanDuration(plan: PracticePlan): PlanDurationEstimate {
  let minMinutes = 0;
  let maxMinutes = 0;
  for (const step of plan.steps) {
    const range = parseDurationLabel(step.cue.durationLabel);
    if (!range) continue;
    minMinutes += range.minMinutes;
    maxMinutes += range.maxMinutes;
  }
  const label =
    minMinutes === maxMinutes ? `${minMinutes} min` : `${minMinutes}-${maxMinutes} min`;
  return { minMinutes, maxMinutes, label };
}
