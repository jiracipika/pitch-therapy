// Deterministic daily seed based on date string
export function getDailySeed(date?: Date): { note: string; frequency: number } {
  const d = date ?? new Date();
  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  // Simple hash
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash + dateStr.charCodeAt(i)) | 0;
  }
  hash = Math.abs(hash);

  const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

  const note = NOTE_NAMES[hash % 12]!;
  // Frequency between 200-1000
  const frequency = Math.round(200 + (hash % 800));

  return { note, frequency };
}

export interface DailyChallengeResult {
  user_id: string;
  date: string; // YYYY-MM-DD
  mode: string; // 'note-wordle' | 'frequency-wordle'
  completed: boolean;
  score: number;
  guesses: number;
}

export const DAILY_CHALLENGE_MODES = ["note-wordle", "frequency-wordle"] as const;

export type DailyChallengeMode = (typeof DAILY_CHALLENGE_MODES)[number];

export function todayDateString(date: Date = new Date()): string {
  const d = date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Derive today's daily-challenge progress from persisted session history.
 * Session timestamps are converted to local calendar dates so completion and
 * the midnight reset stay aligned for users outside UTC.
 */
export function getDailyChallengeCompletion(
  results: ReadonlyArray<{ mode: string; date: string }>,
  date: Date = new Date(),
): { completedModes: DailyChallengeMode[]; completedCount: number; isComplete: boolean } {
  const targetDay = todayDateString(date);
  const completed = new Set<DailyChallengeMode>();

  for (const result of results) {
    if (!DAILY_CHALLENGE_MODES.includes(result.mode as DailyChallengeMode)) continue;
    const completedAt = new Date(result.date);
    if (!Number.isFinite(completedAt.getTime()) || todayDateString(completedAt) !== targetDay) continue;
    completed.add(result.mode as DailyChallengeMode);
  }

  const completedModes = DAILY_CHALLENGE_MODES.filter((mode) => completed.has(mode));
  return {
    completedModes,
    completedCount: completedModes.length,
    isComplete: completedModes.length === DAILY_CHALLENGE_MODES.length,
  };
}

/**
 * Calculate streak from an array of completion dates.
 * Streak counts consecutive calendar days ending today (or yesterday).
 *
 * Uses calendar-day arithmetic (not raw ms division) to avoid DST
 * edge cases where a day is 23 or 25 hours long.
 */
export function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...new Set(dates)].sort().reverse();

  const today = todayDateString();
  const yesterday = shiftDays(today, -1);

  // Streak must start from today or yesterday
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    // sorted is descending, so sorted[i-1] is the later date.
    // We want (later - earlier) = 1 for a consecutive day.
    const diff = dayDiff(sorted[i - 1]!, sorted[i]!);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

/**
 * Calculate the longest run of consecutive calendar days in the history.
 * Unlike {@link calculateStreak}, this is not anchored to "today/yesterday"
 * — it scans every run in the full history and returns the maximum length.
 *
 * Deduplicates input dates and uses UTC day arithmetic for DST safety.
 */
export function calculateLongestStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...new Set(dates)].sort();
  if (sorted.length === 1) return 1;

  let longest = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = dayDiff(sorted[i]!, sorted[i - 1]!);
    if (diff === 1) {
      current++;
      if (current > longest) longest = current;
    } else {
      current = 1;
    }
  }
  return longest;
}

/**
 * Shift a YYYY-MM-DD date string by `n` days.
 * Works in UTC to avoid local timezone surprises.
 */
function shiftDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Whole-day difference between two YYYY-MM-DD strings (a - b).
 * Uses UTC midnight anchors so DST transitions never produce 23/25h gaps.
 */
function dayDiff(a: string, b: string): number {
  const ta = new Date(a + "T00:00:00Z").getTime();
  const tb = new Date(b + "T00:00:00Z").getTime();
  return Math.round((ta - tb) / 86400000);
}
