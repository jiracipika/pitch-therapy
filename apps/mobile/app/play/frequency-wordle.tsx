import { View, Text, Pressable, TextInput, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { GAME_MODE_META } from '@pitch-therapy/core';
import { playFrequency } from '@/lib/audio';
import { triggerCorrectHaptic, triggerIncorrectHaptic } from '@/lib/haptics';

const MODE = GAME_MODE_META['frequency-wordle'];
const ACCENT = MODE.accentHex;

type Feedback = 'correct' | 'close' | 'miss';
interface GuessRow { freq: number; feedback: Feedback; direction?: 'up' | 'down' }

function getFeedback(guess: number, target: number): { feedback: Feedback; direction?: 'up' | 'down' } {
  const err = Math.abs(guess - target) / target * 100;
  if (err <= 2) return { feedback: 'correct' };
  if (err <= 10) return { feedback: 'close', direction: guess < target ? 'up' : 'down' };
  return { feedback: 'miss', direction: guess < target ? 'up' : 'down' };
}

export default function FrequencyWordleScreen() {
  const router = useRouter();
  const [targetFreq, setTargetFreq] = useState(0);
  const [guesses, setGuesses] = useState<GuessRow[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [phase, setPhase] = useState<'playing' | 'won' | 'lost'>('playing');

  const initGame = () => {
    setTargetFreq(Math.round((Math.random() * 800 + 200) * 10) / 10);
    setGuesses([]); setInputVal(''); setPhase('playing');
  };

  useEffect(() => { initGame(); }, []);

  const submitGuess = () => {
    const freq = parseFloat(inputVal);
    if (isNaN(freq) || freq <= 0 || guesses.length >= 6 || phase !== 'playing') return;
    playFrequency(freq);
    const { feedback, direction } = getFeedback(freq, targetFreq);
    const newGuesses = [...guesses, { freq, feedback, direction }];
    setGuesses(newGuesses); setInputVal('');
    if (feedback === 'correct') {
      void triggerCorrectHaptic();
      setPhase('won');
    } else if (newGuesses.length >= 6) {
      void triggerIncorrectHaptic();
      setPhase('lost');
    } else {
      void triggerIncorrectHaptic();
    }
  };

  const rowStyle = (guess?: GuessRow, isCurrent?: boolean): object => {
    if (!guess && !isCurrent) return styles.rowEmpty;
    if (!guess && isCurrent) return styles.rowCurrent;
    if (guess!.feedback === 'correct') return { ...styles.rowFilled, borderColor: ACCENT, backgroundColor: ACCENT + '15' };
    if (guess!.feedback === 'close') return { ...styles.rowFilled, borderColor: '#fbbf24', backgroundColor: 'rgba(251,191,36,0.1)' };
    return { ...styles.rowFilled, borderColor: '#f87171', backgroundColor: 'rgba(248,113,113,0.1)' };
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Text style={styles.headerBtn}>← Back</Text></Pressable>
        <Text style={{ fontSize: 17, fontWeight: '600', color: ACCENT }}>🔵 Frequency Wordle</Text>
        <Pressable onPress={initGame}><Text style={styles.headerBtn}>New</Text></Pressable>
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 24, gap: 8 }}>
        {Array.from({ length: 6 }).map((_, i) => {
          const guess = guesses[i];
          const isCurrent = i === guesses.length;
          const textColor = guess
            ? (guess.feedback === 'correct' ? ACCENT : guess.feedback === 'close' ? '#fbbf24' : '#f87171')
            : (isCurrent && inputVal ? '#a1a1aa' : '#27272a');
          const display = guess
            ? `${guess.freq} Hz ${guess.direction === 'up' ? '▲' : guess.direction === 'down' ? '▼' : '✓'}`
            : (isCurrent && inputVal ? `${inputVal} Hz` : '');
          return (
            <View key={i} style={rowStyle(guess, isCurrent)}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: textColor }}>{display}</Text>
            </View>
          );
        })}
      </View>

      {phase === 'playing' && (
        <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
          <View style={styles.inputRow}>
            <TextInput
              value={inputVal}
              onChangeText={setInputVal}
              keyboardType="numeric"
              placeholder="Frequency in Hz"
              placeholderTextColor="#3f3f46"
              onSubmitEditing={submitGuess}
              style={styles.input}
            />
            <Pressable onPress={submitGuess} disabled={!inputVal}
              style={[styles.goBtn, { backgroundColor: ACCENT, opacity: inputVal ? 1 : 0.3 }]}>
              <Text style={styles.goBtnText}>Go</Text>
            </Pressable>
          </View>
        </View>
      )}

      {(phase === 'won' || phase === 'lost') && (
        <View style={{ paddingHorizontal: 20, paddingTop: 24, alignItems: 'center' }}>
          <Text style={{ fontSize: 40, marginBottom: 8 }}>{phase === 'won' ? '🎉' : '😔'}</Text>
          <Text style={styles.title}>{phase === 'won' ? 'Got it!' : `It was ${targetFreq} Hz`}</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            <Pressable onPress={initGame} style={[styles.btnSmall, { backgroundColor: ACCENT }]}>
              <Text style={styles.btnSmallText}>Play Again</Text>
            </Pressable>
            <Pressable onPress={() => router.back()} style={styles.btnSmall}>
              <Text style={[styles.btnSmallText, { color: '#a1a1aa' }]}>Dashboard</Text>
            </Pressable>
          </View>
        </View>
      )}

      <View style={styles.legend}>
        <Text style={{ fontSize: 12, color: '#52525b' }}>🟩 Within 2% · 🟨 Within 10% (▲▼) · 🟥 Far</Text>
        <Pressable onPress={() => playFrequency(targetFreq)}>
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
  inputRow: { flexDirection: 'row', gap: 10 },
  input: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: '#f4f4f5', fontSize: 16, fontWeight: '500' },
  goBtn: { borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  goBtnText: { color: '#000', fontWeight: '700', fontSize: 16 },
  btnSmall: { borderRadius: 12, padding: 12, paddingHorizontal: 24, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  btnSmallText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  legend: { position: 'absolute', bottom: 20, left: 20, right: 20, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', padding: 14, alignItems: 'center' },
});
