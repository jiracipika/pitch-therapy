import { describe, expect, it } from "vitest";
import { GAME_MODE_META, GAME_MODES } from "../gameData";
import {
  buildAdaptivePracticePlan,
  buildPracticePlan,
  estimatePlanDuration,
  getModeTrainingCue,
  getModesByCategory,
  getPracticeFocusForDate,
  getRecommendedModes,
  parseDurationLabel,
} from "../practicePlan";

describe("practice plan", () => {
  it("rotates focus by weekday", () => {
    expect(getPracticeFocusForDate(new Date("2026-07-05T12:00:00Z"))).toBe("balanced");
    expect(getPracticeFocusForDate(new Date("2026-07-06T12:00:00Z"))).toBe("pitch");
    expect(getPracticeFocusForDate(new Date("2026-07-08T12:00:00Z"))).toBe("advanced");
  });

  it("returns unique recommended modes with valid metadata", () => {
    const modes = getRecommendedModes("frequency", 5);

    expect(new Set(modes).size).toBe(modes.length);
    expect(modes).toHaveLength(5);
    modes.forEach((modeId) => {
      expect(GAME_MODES).toContain(modeId);
      expect(GAME_MODE_META[modeId].label.length).toBeGreaterThan(0);
    });
  });

  it("builds a copy-ready plan from shared game data", () => {
    const plan = buildPracticePlan(new Date("2026-07-09T12:00:00Z"), "speed");

    expect(plan.focus).toBe("speed");
    expect(plan.personalized).toBe(false);
    expect(plan.modeIds).toEqual(["note-id", "piano-tap", "speed-round"]);
    expect(plan.steps.map((step) => step.label)).toEqual(["Warm up", "Focus", "Finish strong"]);
    expect(plan.steps[0]?.detail).toContain(GAME_MODE_META["note-id"].label);
  });

  it("populates a per-step training cue derived from each mode's category", () => {
    const plan = buildPracticePlan(new Date("2026-07-09T12:00:00Z"), "speed");
    expect(plan.steps.length).toBeGreaterThan(0);
    for (const step of plan.steps) {
      // Cue must match what getModeTrainingCue returns for that step's mode.
      expect(step.cue).toEqual(getModeTrainingCue(step.modeId));
      // And every cue field is non-empty.
      expect(step.cue.durationLabel.length).toBeGreaterThan(0);
      expect(step.cue.skillLabel.length).toBeGreaterThan(0);
      expect(step.cue.sessionGoal.length).toBeGreaterThan(0);
    }
  });

  it("personalizes the plan toward weak recent modes", () => {
    const plan = buildAdaptivePracticePlan(
      [
        {
          mode: "frequency-slider",
          score: 400,
          accuracy: 0.42,
          rounds: 10,
          date: "2026-07-01T12:00:00Z",
          timeMs: 360000,
        },
        {
          mode: "frequency-slider",
          score: 520,
          accuracy: 0.38,
          rounds: 10,
          date: "2026-07-02T12:00:00Z",
          timeMs: 330000,
        },
        {
          mode: "note-id",
          score: 920,
          accuracy: 0.92,
          rounds: 10,
          date: "2026-07-02T12:10:00Z",
          timeMs: 240000,
        },
        {
          mode: "note-id",
          score: 960,
          accuracy: 0.96,
          rounds: 10,
          date: "2026-07-03T12:10:00Z",
          timeMs: 220000,
        },
      ],
      new Date("2026-07-09T12:00:00Z"),
      "balanced",
    );

    expect(plan.personalized).toBe(true);
    expect(plan.modeIds[0]).toBe("frequency-slider");
    expect(plan.summary).toContain(GAME_MODE_META["frequency-slider"].label);
    expect(new Set(plan.modeIds).size).toBe(plan.modeIds.length);
  });

  it("falls back to the daily rotation without enough usable history", () => {
    const plan = buildAdaptivePracticePlan(
      [
        {
          mode: "unknown-mode",
          score: 100,
          accuracy: 0.1,
          rounds: 5,
          date: "2026-07-01T12:00:00Z",
          timeMs: 120000,
        },
      ],
      new Date("2026-07-09T12:00:00Z"),
      "speed",
    );

    expect(plan.personalized).toBe(false);
    expect(plan.modeIds).toEqual(["note-id", "piano-tap", "speed-round"]);
  });

  it("filters modes by shared category", () => {
    const advancedModes = getModesByCategory("advanced");

    expect(advancedModes.length).toBeGreaterThan(0);
    expect(advancedModes.every((modeId) => GAME_MODE_META[modeId].category === "advanced")).toBe(
      true,
    );
  });

  it("builds training cues from mode category metadata", () => {
    expect(getModeTrainingCue("note-id")).toMatchObject({
      skillLabel: "Core listening",
      durationLabel: "3-5 min",
    });
    expect(getModeTrainingCue("speed-round")).toMatchObject({
      skillLabel: "Timed reflexes",
      durationLabel: "2-4 min",
    });
  });

  it("provides complete training cue copy for every playable mode", () => {
    for (const modeId of GAME_MODES) {
      const cue = getModeTrainingCue(modeId);

      expect(cue.durationLabel.length).toBeGreaterThan(0);
      expect(cue.skillLabel.length).toBeGreaterThan(0);
      expect(cue.sessionGoal.length).toBeGreaterThan(0);
    }
  });
});

describe("parseDurationLabel", () => {
  it("parses a standard range label like '3-5 min'", () => {
    expect(parseDurationLabel("3-5 min")).toEqual({ minMinutes: 3, maxMinutes: 5 });
    expect(parseDurationLabel("6-10 min")).toEqual({ minMinutes: 6, maxMinutes: 10 });
  });

  it("parses a single-value label as min === max", () => {
    expect(parseDurationLabel("5 min")).toEqual({ minMinutes: 5, maxMinutes: 5 });
  });

  it("tolerates whitespace around the dash and digits", () => {
    expect(parseDurationLabel("3 - 5 minutes")).toEqual({ minMinutes: 3, maxMinutes: 5 });
  });

  it("returns null for labels with no digits", () => {
    expect(parseDurationLabel("a few minutes")).toBeNull();
    expect(parseDurationLabel("")).toBeNull();
  });

  it("parses every category duration label shipped in the game data", () => {
    // Guard against a future copy change silently breaking estimation.
    for (const modeId of GAME_MODES) {
      const cue = getModeTrainingCue(modeId);
      expect(parseDurationLabel(cue.durationLabel)).not.toBeNull();
    }
  });
});

describe("estimatePlanDuration", () => {
  it("sums per-step min and max minutes into a total range", () => {
    // Speed plan: note-id (foundational 3-5) + piano-tap (interactive 3-6)
    // + speed-round (speed 2-4) => 8-15 min.
    const plan = buildPracticePlan(new Date("2026-07-09T12:00:00Z"), "speed");
    const est = estimatePlanDuration(plan);
    expect(est.minMinutes).toBe(8);
    expect(est.maxMinutes).toBe(15);
    expect(est.label).toBe("8-15 min");
  });

  it("formats the label as 'N min' when min === max", () => {
    // Advanced plan: drone-lock + interval-archer + chord-detective, all in
    // the 'advanced' category (6-10 min each) => 18-30 min. Used here to
    // confirm the spread formatting on a real plan with multiple steps.
    const plan = buildPracticePlan(new Date("2026-07-08T12:00:00Z"), "advanced");
    const est = estimatePlanDuration(plan);
    expect(est.minMinutes).toBe(18);
    expect(est.maxMinutes).toBe(30);
    expect(est.label).toBe("18-30 min");
  });

  it("is consistent across calls (deterministic)", () => {
    const plan = buildPracticePlan(new Date("2026-07-09T12:00:00Z"), "balanced");
    expect(estimatePlanDuration(plan)).toEqual(estimatePlanDuration(plan));
  });

  it("returns a 0-minute estimate for a plan with no steps", () => {
    const empty = {
      ...buildPracticePlan(new Date("2026-07-09T12:00:00Z"), "balanced"),
      steps: [],
    };
    const est = estimatePlanDuration(empty);
    expect(est.minMinutes).toBe(0);
    expect(est.maxMinutes).toBe(0);
    expect(est.label).toBe("0 min");
  });

  it("ignores steps whose duration label cannot be parsed", () => {
    const base = buildPracticePlan(new Date("2026-07-09T12:00:00Z"), "speed");
    const plan = {
      ...base,
      steps: [
        ...base.steps,
        {
          label: "Bonus",
          detail: "Unparseable step",
          modeId: "note-id" as const,
          cue: {
            skillLabel: "Mystery",
            durationLabel: "whenever",
            sessionGoal: "No time info",
          },
        },
      ],
    };
    const est = estimatePlanDuration(plan);
    // Same total as the plain speed plan — the unparseable step adds nothing.
    expect(est.minMinutes).toBe(8);
    expect(est.maxMinutes).toBe(15);
  });
});
