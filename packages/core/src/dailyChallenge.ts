// Deterministic daily seed based on date string
export function getDailySeed(date?: Date): { note: string; frequency: number } {
  const d = date ?? new Date();
  const dateStr = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

  // Simple hash
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash + dateStr.charCodeAt(i)) | 0;
  }
  hash = Math.abs(hash);

  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    'E': 329.63, 'F': 349.23, 'F#': 369.99, 'G': 392.0,
    'G#': 415.30, 'A': 440.0, 'A#': 466.16, 'B': 493.88,
  };

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
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Calculate streak from an array of completion dates.
 * Streak counts consecutive days ending today (or yesterday).
 */
export function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...new Set(dates)].sort().reverse();

  const today = todayDateString();
  const yesterday = new Date(Date.now() - 86400000);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  // Streak must start from today or yesterday
  if (sorted[0] !== today && sorted[0] !== yesterdayStr) return 0;

  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]!);
    const curr = new Date(sorted[i]!);
    const diff = (prev.getTime() - curr.getTime()) / 86400000;
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}
