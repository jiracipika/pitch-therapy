// ─── Music Theory Constants & Helpers (pure, cross-platform) ─────────────────
//
// Centralizes the musical-interval and chord data that was previously
// copy-pasted across 6+ play-mode files in both the web and mobile apps.
// Pure and platform-free — safe to import from both index.ts (web) and
// index.native.ts (React Native).

// ─── Chromatic Scale ─────────────────────────────────────────────────────────

/**
 * The 12 chromatic note names, ascending from C.
 * Sharps only (no enharmonic flats) — consistent with how the ear-training
 * modes present notes throughout the app.
 */
export const CHROMATIC_SCALE = [
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

export type ChromaticNote = (typeof CHROMATIC_SCALE)[number];

/**
 * Number of semitones in an octave (12-TET).
 */
export const OCTAVE_SEMITONES = 12;

// ─── Intervals ───────────────────────────────────────────────────────────────

export interface IntervalDef {
  /** Semitone distance above the root (0 = unison, 12 = octave). */
  semitones: number;
  /** Full name, e.g. "Minor 3rd". */
  name: string;
  /** Abbreviated name, e.g. "m3". */
  abbr: string;
}

/**
 * All 13 named intervals from unison through octave.
 *
 * Both the short (`abbr`) and long (`name`) labels are provided so that
 * modes can choose the display style without maintaining separate data.
 * The list is ordered by semitone count ascending.
 */
export const INTERVALS: readonly IntervalDef[] = [
  { semitones: 0, name: "Unison", abbr: "P1" },
  { semitones: 1, name: "Minor 2nd", abbr: "m2" },
  { semitones: 2, name: "Major 2nd", abbr: "M2" },
  { semitones: 3, name: "Minor 3rd", abbr: "m3" },
  { semitones: 4, name: "Major 3rd", abbr: "M3" },
  { semitones: 5, name: "Perfect 4th", abbr: "P4" },
  { semitones: 6, name: "Tritone", abbr: "TT" },
  { semitones: 7, name: "Perfect 5th", abbr: "P5" },
  { semitones: 8, name: "Minor 6th", abbr: "m6" },
  { semitones: 9, name: "Major 6th", abbr: "M6" },
  { semitones: 10, name: "Minor 7th", abbr: "m7" },
  { semitones: 11, name: "Major 7th", abbr: "M7" },
  { semitones: 12, name: "Octave", abbr: "P8" },
];

/** Look up an interval by its semitone count. Returns undefined if not found. */
export function intervalBySemitones(semitones: number): IntervalDef | undefined {
  return INTERVALS.find((i) => i.semitones === semitones);
}

/**
 * Filter intervals to a specific set of semitone values.
 * Useful when a mode only uses a subset (e.g. Drone Lock skips m7/M7).
 * Returns intervals in ascending semitone order.
 */
export function intervalsInPool(semitonePool: readonly number[]): IntervalDef[] {
  return INTERVALS.filter((i) => semitonePool.includes(i.semitones));
}

// ─── Chords ──────────────────────────────────────────────────────────────────

export type ChordTypeId =
  | "major"
  | "minor"
  | "dim"
  | "aug"
  | "dom7"
  | "min7";

export interface ChordTypeDef {
  id: ChordTypeId;
  /** Display label, e.g. "Major" or "Min 7". */
  label: string;
  /** Notation symbol appended to the root, e.g. "" for major, "m7" for min7. */
  symbol: string;
  /** Semitone offsets from the root, e.g. [0, 4, 7] for a major triad. */
  intervals: number[];
}

/**
 * The six chord qualities used by Chord Detective, with their interval
 * formulas. Ordered from simplest (major triad) to most complex (min7).
 */
export const CHORD_TYPES: readonly ChordTypeDef[] = [
  { id: "major", label: "Major", symbol: "", intervals: [0, 4, 7] },
  { id: "minor", label: "Minor", symbol: "m", intervals: [0, 3, 7] },
  { id: "dim", label: "Dim", symbol: "dim", intervals: [0, 3, 6] },
  { id: "aug", label: "Aug", symbol: "aug", intervals: [0, 4, 8] },
  { id: "dom7", label: "Dom 7", symbol: "7", intervals: [0, 4, 7, 10] },
  { id: "min7", label: "Min 7", symbol: "m7", intervals: [0, 3, 7, 10] },
];

/** Map of chord type id → interval formula, for quick lookup by id. */
export const CHORD_INTERVALS: Readonly<Record<ChordTypeId, number[]>> =
  Object.fromEntries(CHORD_TYPES.map((c) => [c.id, c.intervals])) as Record<
    ChordTypeId,
    number[]
  >;

/** Look up a chord type definition by its id. Returns undefined if not found. */
export function chordTypeById(id: string): ChordTypeDef | undefined {
  return CHORD_TYPES.find((c) => c.id === id);
}

/**
 * Return the list of note names that make up a chord given a root note
 * and a chord-type id. Notes wrap around the chromatic scale.
 *
 * Example: chordNotes("C", "dom7") → ["C", "E", "G", "A#"]
 */
export function chordNotes(rootNote: string, chordTypeId: string): string[] {
  const rootIdx = CHROMATIC_SCALE.indexOf(rootNote as ChromaticNote);
  if (rootIdx < 0) return [];
  const def = chordTypeById(chordTypeId);
  if (!def) return [];
  return def.intervals.map(
    (semi) => CHROMATIC_SCALE[(rootIdx + semi) % OCTAVE_SEMITONES]!,
  );
}

/**
 * Return the display name for a chord: root note + symbol.
 * Example: chordLabel("C", "min7") → "C m7"
 */
export function chordLabel(rootNote: string, chordTypeId: string): string {
  const def = chordTypeById(chordTypeId);
  const label = def?.label ?? chordTypeId;
  return def ? `${rootNote}${def.symbol}` : `${rootNote} ${label}`;
}
