import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { GAME_MODE_META } from '@pitch-therapy/core';
import { GameHeader } from '@/components/GameHeader';
import NoteComparisonStaff from '@/components/NoteComparisonStaff';
import { playTone, NOTE_FREQS_4 } from '@/lib/audio';

const MODE = GAME_MODE_META['note-wordle'];
const ACCENT = MODE.accentHex;
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

type Feedback = 'correct' | 'close' | 'miss';
interface GuessRow { note: string; feedback: Feedback }

function getFeedback(guess: string, targetIdx: number): Feedback {
  const guessIdx = NOTE_NAMES.indexOf(guess as typeof NOTE_NAMES[number]);
  const diff = Math.abs(guessIdx - targetIdx);
  if (diff === 0) return 'correct';
  if (diff <= 2 || diff >= 10) return 'close';
  return 'miss';
}

export default function NoteWordleScreen() {
  const router = useRouter();
  const [targetIdx, setTargetIdx] = useState(0);
  const [guesses, setGuesses] = useState<GuessRow[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string | null>(null);
  const [phase, setPhase] = useState<'playing' | 'won' | 'lost'>('playing');

  const initGame = () => {
    setTargetIdx(Math.floor(Math.random() * 12));
    setGuesses([]); setCurrentGuess(null); setPhase('playing');
  };

  useEffect(() => { initGame(); }, []);

  const submitGuess = () => {
    if (!currentGuess || guesses.length >= 6 || phase !== 'playing') return;
    const feedback = getFeedback(currentGuess, targetIdx);
    const noteIdx = NOTE_NAMES.indexOf(currentGuess as typeof NOTE_NAMES[number]);
    const freq = NOTE_FREQS_4[currentGuess];
    if (freq) playTone(currentGuess, freq);
    const newGuesses = [...guesses, { note: currentGuess, feedback }];
    setGuesses(newGuesses); setCurrentGuess(null);
    if (feedback === 'correct') setPhase('won');
    else if (newGuesses.length >= 6) setPhase('lost');
  };

  const targetNote = NOTE_NAMES[targetIdx];

  const rowStyle = (guess?: GuessRow, isCurrent?: boolean): object => {
    if (!guess && !isCurrent) return styles.rowEmpty;
    if (!guess && isCurrent) return styles.rowCurrent;
    if (guess!.feedback === 'correct') return { ...styles.rowFilled, borderColor: '#4ade80', backgroundColor: 'rgba(74,222,128,0.1)' };
    if (guess!.feedback === 'close') return { ...styles.rowFilled, borderColor: '#fbbf24', backgroundColor: 'rgba(251,191,36,0.1)' };
    return { ...styles.rowFilled, borderColor: '#f87171', backgroundColor: 'rgba(248,113,113,0.1)' };
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Text style={styles.headerBtn}>← Back</Text></Pressable>
        <Text style={{ fontSize: 17, fontWeight: '600', color: ACCENT }}>🟩 Note Wordle</Text>
        <Pressable onPress={initGame}><Text style={styles.headerBtn}>New</Text></Pressable>
      </View>

      {/* Guess grid */}
      <View style={{ paddingHorizontal: 20, paddingTop: 24, gap: 8 }}>
        {Array.from({ length: 6 }).map((_, i) => {
          const guess = guesses[i];
          const isCurrent = i === guesses.length;
          const textColor = guess ? (guess.feedback === 'correct' ? '#4ade80' : guess.feedback === 'close' ? '#fbbf24' : '#f87171') : (isCurrent ? '#a1a1aa' : '#27272a');
          return (
            <View key={i} style={rowStyle(guess, isCurrent)}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: textColor }}>
                {guess ? guess.note : isCurrent ? (currentGuess ?? '?') : ''}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Note picker */}
      {phase === 'playing' && (
        <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
          <View style={styles.noteGrid}>
            {NOTE_NAMES.map((n) => (
              <Pressable key={n} onPress={() => setCurrentGuess(n)}
                style={[styles.noteBtn, currentGuess === n && { backgroundColor: ACCENT }]}>
                <Text style={[styles.noteBtnText, currentGuess === n && { color: '#000' }]}>{n}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={submitGuess} disabled={!currentGuess}
            style={[styles.submitBtn, { backgroundColor: ACCENT, opacity: currentGuess ? 1 : 0.3 }]}>
            <Text style={styles.submitBtnText}>Submit</Text>
          </Pressable>
        </View>
      )}

      {/* End state */}
      {(phase === 'won' || phase === 'lost') && (
        <View style={{ paddingHorizontal: 20, paddingTop: 24, alignItems: 'center' }}>
          <Text style={{ fontSize: 40, marginBottom: 8 }}>{phase === 'won' ? '🎉' : '😔'}</Text>
          <Text style={styles.title}>{phase === 'won' ? 'Got it!' : `It was ${targetNote}4`}</Text>

          {/* Staff comparison showing last guess vs target */}
          <View style={{ width: '100%', marginTop: 12 }}>
            <NoteComparisonStaff
              guessedNote={guesses[guesses.length - 1]?.note ?? '?'}
              correctNote={targetNote}
              isCorrect={phase === 'won'}
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            <Pressable onPress={initGame} style={[styles.btnSmall, { backgroundColor: ACCENT }]}>
              <Text style={styles.btnSmallText}>Play Again</Text>
            </Pressable>
            <Pressable onPress={() => router.back()} style={styles.btnSmall}>
              <Text style={[styles.btnSmallText, { color: '#a1a1aa' }]}>Dashboard</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={{ fontSize: 12, color: '#52525b' }}>🟩 Correct · 🟨 Within 2 semitones · 🟥 Far</Text>
        <Pressable onPress={() => { const f = NOTE_FREQS_4[targetNote]; if (f) playTone(targetNote, f); }}>
          <Text style={{ fontSize: 12, color: ACCENT, marginTop: 4 }}>🔊 Play target tone</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12 },
  headerBtn: { color: '#71717a', fontSize: 13 },
  title: { fontSize: 22, fontWeight: '600', color: '#f4f4f5' },
  rowEmpty: { height: 48, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  rowCurrent: { height: 48, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  rowFilled: { height: 48, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  noteGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  noteBtn: { width: 52, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center' },
  noteBtnText: { fontSize: 14, fontWeight: '600', color: '#a1a1aa' },
  submitBtn: { borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 12 },
  submitBtnText: { color: '#000', fontWeight: '700', fontSize: 16 },
  btnSmall: { borderRadius: 12, padding: 12, paddingHorizontal: 24, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  btnSmallText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  legend: { position: 'absolute', bottom: 20, left: 20, right: 20, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', padding: 14, alignItems: 'center' },
});
