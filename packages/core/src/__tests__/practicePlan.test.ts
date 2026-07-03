import { describe, expect, it } from "vitest";
import { GAME_MODE_META, GAME_MODES } from "../gameData";
import {
  buildPracticePlan,
  getModeTrainingCue,
  getModesByCategory,
  getPracticeFocusForDate,
  getRecommendedModes,
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
    expect(plan.modeIds).toEqual(["note-id", "piano-tap", "speed-round"]);
    expect(plan.steps.map((step) => step.label)).toEqual(["Warm up", "Focus", "Finish strong"]);
    expect(plan.steps[0]?.detail).toContain(GAME_MODE_META["note-id"].label);
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
