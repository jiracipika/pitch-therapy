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

export function todayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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
