import { describe, it, expect } from "vitest";
import {
  GAME_MODES,
  GAME_MODE_META,
  MODE_CATEGORIES,
  DIFFICULTY_CONFIG,
  type GameMode,
  type ModeCategoryId,
} from "../gameData";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const TAILWIND_COLOR_RE = /^text-[a-z]+-\d{2,4}$/;

function expectNonEmpty(value: unknown, label: string) {
  expect(value, `${label} must be non-empty`).toBeTruthy();
  expect(
    String(value).trim().length,
    `${label} must not be only whitespace`,
  ).toBeGreaterThan(0);
}

// ─── GAME_MODES array ↔ GameMode union ───────────────────────────────────────
//
// The `GameMode` union and the `GAME_MODES` runtime array are maintained by
// hand. TypeScript does NOT enforce that the array exhausts the union, so a
// newly-added mode can silently vanish from UI iteration. These tests are the
// only thing that catches that drift.

describe("GAME_MODES array", () => {
  it("contains no duplicate entries", () => {
    const seen = new Set<GameMode>();
    for (const mode of GAME_MODES) {
      expect(seen.has(mode), `duplicate mode "${mode}"`).toBe(false);
      seen.add(mode);
    }
    expect(seen.size).toBe(GAME_MODES.length);
  });

  it("is non-empty and stable in length", () => {
    expect(GAME_MODES.length).toBeGreaterThan(0);
    // Snapshot the count so a deliberate add/remove surfaces as an intentional
    // diff rather than slipping through silently.
    expect(GAME_MODES).toHaveLength(18);
  });
});

// ─── GAME_MODE_META coverage ─────────────────────────────────────────────────

describe("GAME_MODE_META", () => {
  it("has a self-consistent entry for every GameMode in the array", () => {
    for (const mode of GAME_MODES) {
      const meta = GAME_MODE_META[mode];
      expect(meta, `missing GAME_MODE_META entry for "${mode}"`).toBeDefined();
      // The `id` field must match the key so lookups by id round-trip cleanly.
      expect(meta.id).toBe(mode);
    }
  });

  it("does not define metadata for modes absent from GAME_MODES", () => {
    const arraySet = new Set<GameMode>(GAME_MODES);
    const metaKeys = Object.keys(GAME_MODE_META) as GameMode[];
    for (const key of metaKeys) {
      expect(arraySet.has(key), `orphan GAME_MODE_META key "${key}"`).toBe(true);
    }
  });

  it("every entry has complete, non-empty human-facing copy", () => {
    for (const mode of GAME_MODES) {
      const meta = GAME_MODE_META[mode];
      expectNonEmpty(meta.label, `${mode}.label`);
      expectNonEmpty(meta.description, `${mode}.description`);
      expectNonEmpty(meta.icon, `${mode}.icon`);
      expectNonEmpty(meta.color, `${mode}.color`);
      expectNonEmpty(meta.accentHex, `${mode}.accentHex`);
    }
  });

  it("every accentHex is a valid 3- or 6-digit hex color", () => {
    for (const mode of GAME_MODES) {
      const { accentHex } = GAME_MODE_META[mode];
      expect(accentHex, `${mode}.accentHex must be a hex color`).toMatch(HEX_COLOR_RE);
    }
  });

  it("every color is a tailwind text-* utility class", () => {
    for (const mode of GAME_MODES) {
      const { color } = GAME_MODE_META[mode];
      expect(color, `${mode}.color must be a tailwind class`).toMatch(TAILWIND_COLOR_RE);
    }
  });

  it("every mode references a category that exists in MODE_CATEGORIES", () => {
    // A typo here (e.g. category: "advnced") would silently drop the mode from
    // the "By Category" grouping in the mobile/web mode browsers.
    const validCategoryIds = new Set(MODE_CATEGORIES.map((c) => c.id));
    for (const mode of GAME_MODES) {
      const { category } = GAME_MODE_META[mode];
      expect(
        validCategoryIds.has(category),
        `${mode} references unknown category "${category}"`,
      ).toBe(true);
    }
  });

  it("has no duplicate labels (labels are user-facing titles)", () => {
    const labels = GAME_MODES.map((m) => GAME_MODE_META[m].label);
    expect(new Set(labels).size, "mode labels must be unique").toBe(labels.length);
  });
});

// ─── MODE_CATEGORIES ─────────────────────────────────────────────────────────

describe("MODE_CATEGORIES", () => {
  it("has unique category ids", () => {
    const ids = MODE_CATEGORIES.map((c) => c.id);
    expect(new Set(ids).size, "category ids must be unique").toBe(ids.length);
  });

  it("covers every category referenced by a mode", () => {
    const declaredCategories = new Set(MODE_CATEGORIES.map((c) => c.id));
    const referencedCategories = new Set(
      GAME_MODES.map((m) => GAME_MODE_META[m].category),
    );
    for (const ref of referencedCategories) {
      expect(
        declaredCategories.has(ref),
        `referenced category "${ref}" has no MODE_CATEGORIES entry`,
      ).toBe(true);
    }
  });

  it("every category has complete copy and a valid hex accent", () => {
    for (const category of MODE_CATEGORIES) {
      expectNonEmpty(category.label, `category ${category.id}.label`);
      expectNonEmpty(category.description, `category ${category.id}.description`);
      expectNonEmpty(category.icon, `category ${category.id}.icon`);
      expect(
        category.accentHex,
        `category ${category.id}.accentHex must be a hex color`,
      ).toMatch(HEX_COLOR_RE);
    }
  });

  it("has no orphan categories (every declared id is used by some mode)", () => {
    // Catches the reverse drift: declaring a category no mode belongs to,
    // which would render as an empty section in the mode browser.
    const referenced = new Set(GAME_MODES.map((m) => GAME_MODE_META[m].category));
    for (const category of MODE_CATEGORIES) {
      expect(
        referenced.has(category.id as ModeCategoryId),
        `category "${category.id}" is declared but no mode uses it`,
      ).toBe(true);
    }
  });
});

// ─── DIFFICULTY_CONFIG ───────────────────────────────────────────────────────

describe("DIFFICULTY_CONFIG", () => {
  it("defines easy, medium, and hard", () => {
    expect(DIFFICULTY_CONFIG.easy).toBeDefined();
    expect(DIFFICULTY_CONFIG.medium).toBeDefined();
    expect(DIFFICULTY_CONFIG.hard).toBeDefined();
  });

  it("round counts increase monotonically with difficulty", () => {
    // Catches a class of regression where a refactor swaps rounds/timeLimit or
    // makes "hard" easier than "medium".
    expect(DIFFICULTY_CONFIG.easy.rounds).toBeGreaterThan(0);
    expect(DIFFICULTY_CONFIG.medium.rounds).toBeGreaterThanOrEqual(
      DIFFICULTY_CONFIG.easy.rounds,
    );
    expect(DIFFICULTY_CONFIG.hard.rounds).toBeGreaterThanOrEqual(
      DIFFICULTY_CONFIG.medium.rounds,
    );
  });

  it("time limits are non-negative and tighten with difficulty", () => {
    const { easy, medium, hard } = DIFFICULTY_CONFIG;
    expect(easy.timeLimit).toBeGreaterThanOrEqual(0);
    expect(medium.timeLimit).toBeGreaterThanOrEqual(0);
    expect(hard.timeLimit).toBeGreaterThanOrEqual(0);
    // Easy has no limit (0); hard should never exceed medium.
    expect(hard.timeLimit).toBeLessThanOrEqual(medium.timeLimit);
  });

  it("every difficulty has a non-empty label", () => {
    expectNonEmpty(DIFFICULTY_CONFIG.easy.label, "easy.label");
    expectNonEmpty(DIFFICULTY_CONFIG.medium.label, "medium.label");
    expectNonEmpty(DIFFICULTY_CONFIG.hard.label, "hard.label");
  });
});
