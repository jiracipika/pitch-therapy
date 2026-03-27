import type { NoteName } from "./index";

// ─── Constants ───────────────────────────────────────────────────────────────

const NOTE_NAMES: NoteName[] = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
];

const SEMITONE_OFFSETS: Record<string, number> = {
  C: 0, "C#": 1, Db: 1,
  D: 2, "D#": 3, Eb: 3,
  E: 4, Fb: 4,
  F: 5, "E#": 5,
  "F#": 6, Gb: 6,
  G: 7, "G#": 8, Ab: 8,
  A: 9, "A#": 10, Bb: 10,
  B: 11, Cb: 11,
};

// ─── noteToFrequency ─────────────────────────────────────────────────────────

/**
 * Convert a note name like "A4", "C#3", "Bb5" to Hz.
 * Full 88-key piano range: A0 (27.5 Hz) to C8 (4186 Hz).
 */
export function noteToFrequency(noteName: string): number {
  const match = noteName.match(/^([A-Ga-g][#b]?)(\d)$/);
  if (!match || !match[1] || !match[2]) return NaN;

  const rawNote = match[1];
  const octStr = match[2];
  const semitone = SEMITONE_OFFSETS[capitalize(rawNote)];
  if (semitone === undefined) return NaN;

  const octave = parseInt(octStr, 10);
  // Semitones from A4: A4 = 0
  const semitonesFromA4 = (octave - 4) * 12 + (semitone - 9);
  return 440 * Math.pow(2, semitonesFromA4 / 12);
}

function capitalize(s: string): string {
  return s[0].toUpperCase() + s.slice(1).toLowerCase();
}

// ─── frequencyToNote ─────────────────────────────────────────────────────────

export interface FrequencyToNoteResult {
  noteName: string;
  octave: number;
  centsOff: number;
}

/**
 * Convert Hz to nearest 12-TET note with cents deviation.
 * Returns null for out-of-range or invalid input.
 */
export function frequencyToNote(hz: number): FrequencyToNoteResult | null {
  if (hz <= 0 || !isFinite(hz)) return null;

  // A0 = 27.5 Hz, C8 = ~4186 Hz
  if (hz < 20 || hz > 4500) return null;

  // Semitones from A4
  const semitonesFromA4 = 12 * Math.log2(hz / 440);
  const roundedSemitones = Math.round(semitonesFromA4);
  const centsOff = Math.round((semitonesFromA4 - roundedSemitones) * 100);

  // Convert semitone offset to note name + octave
  const noteIndex = ((roundedSemitones + 9) % 12 + 12) % 12;
  const octave = Math.floor((roundedSemitones + 9) / 12) + 4;

  return {
    noteName: NOTE_NAMES[noteIndex]!,
    octave,
    centsOff,
  };
}

// ─── getDailySeed ────────────────────────────────────────────────────────────

/**
 * Deterministic daily seed. All users get same note + frequency on same day.
 * Picks from C2 to C7 range.
 */
export function getDailySeed(date?: Date): { note: string; frequency: number } {
  const d = date ?? new Date();
  const dateStr = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  const hash = simpleHash(dateStr);

  // Pick note from C2..B6 (60 notes, octaves 2-6)
  const naturalNotes = ["C", "D", "E", "F", "G", "A", "B"];
  const noteIndex = hash % naturalNotes.length;
  const octave = 2 + (Math.floor(hash / naturalNotes.length) % 5); // 2-6
  const note = naturalNotes[noteIndex] + octave;

  // Deterministic frequency within that note's octave range
  const lowFreq = noteToFrequency("C" + octave)!;
  const highFreq = noteToFrequency("B" + octave)!;
  const freqHash = simpleHash(dateStr + "-freq");
  const frequency = lowFreq + (freqHash % 10000) / 10000 * (highFreq - lowFreq);

  return { note, frequency: Math.round(frequency * 100) / 100 };
}

function simpleHash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// ─── getAllNoteNames ─────────────────────────────────────────────────────────

export function getAllNoteNames(): string[] {
  return [...NOTE_NAMES];
}

// ─── generateNoteOptions ─────────────────────────────────────────────────────

/**
 * Generate random note options for Note ID mode.
 * Beginner: 4 natural notes, Intermediate: 6 with sharps, Advanced: all 12.
 */
export function generateNoteOptions(
  count?: number,
  includeSharps?: boolean,
): string[] {
  const naturalNotes = ["C", "D", "E", "F", "G", "A", "B"];

  // Default behavior based on no args
  if (count === undefined && includeSharps === undefined) {
    count = 4;
    includeSharps = false;
  }

  let pool: string[];
  if (includeSharps) {
    pool = [...NOTE_NAMES];
  } else {
    pool = naturalNotes;
  }

  const clampedCount = Math.max(2, Math.min(count ?? 4, pool.length));
  return shuffle(pool).slice(0, clampedCount);
}

function shuffle<T>(arr: T[]): T[] {
  const a: T[] = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── calculateScore ──────────────────────────────────────────────────────────

/**
 * Calculate score for a round.
 * - accuracy: 0-1 (1 = perfect)
 * - responseTimeMs: time in ms
 * - streak: current streak count
 * - mode: game mode
 */
export function calculateScore(
  mode: string,
  accuracy: number,
  responseTimeMs: number,
  streak: number,
): number {
  if (accuracy <= 0) return 0;

  // Base score from accuracy (0-100)
  const baseScore = accuracy * 100;

  // Time bonus: faster = more bonus (max 50 points for <1s, scales down)
  const timeBonus = Math.max(0, 50 * Math.exp(-responseTimeMs / 5000));

  // Streak multiplier: 1x base, up to 2x at streak 10+
  const streakMultiplier = 1 + Math.min(streak, 10) * 0.1;

  // Mode multiplier
  const modeMultiplier: Record<string, number> = {
    "pitch-match": 1.0,
    "note-id": 1.2,
    "frequency-guess": 1.5,
    "note-wordle": 1.3,
    "frequency-wordle": 1.8,
  };

  const total = Math.round(
    (baseScore + timeBonus) * streakMultiplier * (modeMultiplier[mode] ?? 1.0),
  );

  return Math.max(0, Math.min(total, 500)); // cap at 500 per round
}
