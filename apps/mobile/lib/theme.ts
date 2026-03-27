export const colors = {
  pitchMatch: '#3B82F6',
  noteId: '#8B5CF6',
  frequencyGuess: '#F59E0B',
  noteWordle: '#22C55E',
  frequencyWordle: '#14B8A6',
  background: '#09090b',
  card: '#18181b',
  border: '#27272a',
  text: '#f4f4f5',
  muted: '#a1a1aa',
} as const;

export type GameModeColor = keyof typeof colors;
