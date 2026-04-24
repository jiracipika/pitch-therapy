import { View, Text, Pressable, ScrollView } from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { playTone, playFrequency, NOTE_FREQS_4 } from '@/lib/audio';
import { GameHeader } from '@/components/GameHeader';
import { triggerCorrectHaptic, triggerIncorrectHaptic } from '@/lib/haptics';

const ACCENT = '#84CC16';
const CENTS_RANGE = 50;
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

type Difficulty = 'easy' | 'medium' | 'hard';

const DIFF_CONFIG: Record<Difficulty, { label: string; centsRange: number; rounds: number }> = {
  easy: { label: 'Easy', centsRange: 50, rounds: 6 },
  medium: { label: 'Medium', centsRange: 30, rounds: 8 },
  hard: { label: 'Hard', centsRange: 15, rounds: 10 },
};

type Phase = 'setup' | 'playing' | 'reveal' | 'results';

interface RoundResult { round: number; note: string; actualCents: number; guessCents: number; points: number }

export default function CentsDeviationScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('setup');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [baseNote, setBaseNote] = useState('A');
  const [baseFreq, setBaseFreq] = useState(440);
  const [actualCents, setActualCents] = useState(0);
  const [needleCents, setNeedleCents] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<RoundResult[]>([]);

  const config = DIFF_CONFIG[difficulty];
  const totalRounds = config.rounds;

  const pickRound = () => {
    const noteIdx = Math.floor(Math.random() * 12);
    const note = NOTE_NAMES[noteIdx];
    const freq = NOTE_FREQS_4[note] || 440;
    const cents = Math.max(-config.centsRange, Math.min(config.centsRange, Math.round((Math.random() * 2 - 1) * config.centsRange)));
    setBaseNote(note);
    setBaseFreq(freq);
    setActualCents(cents);
    setNeedleCents(0);
    setSubmitted(false);
    return { note, freq, cents };
  };

  const startGame = (diff: Difficulty) => {
    setDifficulty(diff);
    setRound(0); setScore(0); setStreak(0); setBestStreak(0); setResults([]);
    const { freq } = pickRound();
    setRound(1);
    setPhase('playing');
    playFrequency(freq, 0.8);
  };

  const playDeviation = () => {
    playFrequency(baseFreq, 0.8);
    setTimeout(() => {
      const deviatedFreq = baseFreq * Math.pow(2, actualCents / 1200);
      playFrequency(deviatedFreq, 1.2);
    }, 1000);
  };

  const handleSubmit = () => {
    if (submitted) return;
    setSubmitted(true);
    const error = Math.abs(needleCents - actualCents);
    const points = Math.max(0, Math.round((1 - error / config.centsRange) * 100));
    const correct = error <= 5;
    if (correct) void triggerCorrectHaptic();
    else void triggerIncorrectHaptic();
    setScore(s => s + points);
    if (correct) {
      setStreak(s => { const ns = s + 1; setBestStreak(b => Math.max(b, ns)); return ns; });
    } else { setStreak(0); }
    setResults(r => [...r, { round, note: baseNote, actualCents, guessCents: needleCents, points }]);
    setPhase('reveal');
  };

  const nextRound = () => {
    const { freq } = pickRound();
    setRound(r => r + 1);
    setPhase('playing');
    playFrequency(freq, 0.8);
  };

  const adjustNeedle = (amount: number) => {
    if (submitted) return;
    setNeedleCents(prev => Math.max(-CENTS_RANGE, Math.min(CENTS_RANGE, prev + amount)));
  };

  if (phase === 'setup') {
    return (
      <View style={{ flex: 1, backgroundColor: '#08090D' }}>
        <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 20 }}>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: ACCENT }} />
          <Text style={{ color: '#F8FAFC', fontSize: 22, fontWeight: '700', marginTop: 12 }}>Cents Deviation</Text>
          <Text style={{ color: '#97A3B6', fontSize: 14, marginTop: 4 }}>Detect microtonal shifts</Text>
        </View>
        <View style={{ flex: 1, paddingHorizontal: 20, justifyContent: 'center' }}>
          <Text style={{ color: '#F8FAFC', fontSize: 18, fontWeight: '600', marginBottom: 16 }}>Difficulty</Text>
          {(Object.keys(DIFF_CONFIG) as Difficulty[]).map(d => (
            <Pressable key={d} onPress={() => startGame(d)} style={({ pressed }) => ({ backgroundColor: 'rgba(21,24,32,0.86)', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', marginBottom: 12, opacity: pressed ? 0.75 : 1 })}>
              <Text style={{ color: '#F8FAFC', fontWeight: '600', fontSize: 16, textTransform: 'capitalize' }}>{d}</Text>
              <Text style={{ color: '#97A3B6', fontSize: 13, marginTop: 3 }}>±{DIFF_CONFIG[d].centsRange}¢ · {DIFF_CONFIG[d].rounds} rounds</Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  if (phase === 'results') {
    return (
      <View style={{ flex: 1, backgroundColor: '#08090D' }}>
        <ScrollView contentContainerStyle={{ paddingTop: 80, paddingHorizontal: 20, paddingBottom: 40 }}>
          <Text style={{ color: '#F8FAFC', fontSize: 28, fontWeight: '700', marginBottom: 4 }}>Cents Deviation Complete!</Text>
          <View style={{ backgroundColor: 'rgba(21,24,32,0.86)', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', marginBottom: 20, alignItems: 'center' }}>
            <Text style={{ color: ACCENT, fontSize: 48, fontWeight: '700' }}>{score}</Text>
            <Text style={{ color: '#97A3B6', marginTop: 4 }}>points</Text>
          </View>
          <Pressable onPress={() => startGame(difficulty)} style={{ backgroundColor: ACCENT, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 24 }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Play Again</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  const needlePct = 50 + (needleCents / CENTS_RANGE) * 45;
  const actualPct = 50 + (actualCents / CENTS_RANGE) * 45;

  return (
    <View style={{ flex: 1, backgroundColor: '#08090D' }}>
      <GameHeader score={score} round={round} totalRounds={totalRounds} streak={streak} accent={ACCENT} />
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 32 }}>
        <Text style={{ textAlign: 'center', color: '#a1a1aa', fontSize: 14, marginBottom: 4 }}>Reference: <Text style={{ color: '#F8FAFC', fontWeight: '700' }}>{baseNote}</Text></Text>
        <Text style={{ textAlign: 'center', color: '#7E8A9A', fontSize: 12, marginBottom: 16 }}>Listen then set the needle</Text>

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
          <Pressable onPress={() => playFrequency(baseFreq, 0.8)} style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: 'rgba(21,24,32,0.86)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 20 }}>🔊</Text>
          </Pressable>
          <Pressable onPress={playDeviation} style={{ flex: 1, height: 56, borderRadius: 14, backgroundColor: `${ACCENT}20`, borderWidth: 1, borderColor: ACCENT, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: ACCENT, fontWeight: '600', fontSize: 13 }}>🔊+🔊 Play Both</Text>
          </Pressable>
        </View>

        {/* Cents meter */}
        <View style={{ marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ color: '#7E8A9A', fontSize: 10 }}>-{CENTS_RANGE}¢</Text>
            <Text style={{ color: '#7E8A9A', fontSize: 10 }}>0</Text>
            <Text style={{ color: '#7E8A9A', fontSize: 10 }}>+{CENTS_RANGE}¢</Text>
          </View>
          <View style={{ height: 64, backgroundColor: 'rgba(21,24,32,0.86)', borderRadius: 16, position: 'relative', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' }}>
            <View style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, backgroundColor: '#3f3f46' }} />
            <View style={{ position: 'absolute', top: 8, bottom: 8, left: `${needlePct}%`, width: 4, borderRadius: 2, backgroundColor: ACCENT, marginLeft: -2 }} />
            {submitted && (
              <View style={{ position: 'absolute', top: 12, bottom: 12, left: `${actualPct}%`, width: 4, borderRadius: 2, backgroundColor: '#f87171', marginLeft: -2 }} />
            )}
          </View>
        </View>
        <Text style={{ textAlign: 'center', fontSize: 18, fontWeight: '700', color: ACCENT, marginBottom: 8 }}>
          {needleCents > 0 ? '+' : ''}{needleCents}¢
        </Text>

        {/* Adjustment buttons */}
        <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
          {[10, 5, 1].map(amt => (
            <View key={amt} style={{ flexDirection: 'row', gap: 4 }}>
              <Pressable onPress={() => adjustNeedle(-amt)} style={{ width: 44, height: 36, borderRadius: 8, backgroundColor: 'rgba(21,24,32,0.86)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#a1a1aa', fontSize: 13, fontWeight: '600' }}>-{amt}</Text>
              </Pressable>
              <Pressable onPress={() => adjustNeedle(amt)} style={{ width: 44, height: 36, borderRadius: 8, backgroundColor: 'rgba(21,24,32,0.86)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#a1a1aa', fontSize: 13, fontWeight: '600' }}>+{amt}</Text>
              </Pressable>
            </View>
          ))}
        </View>

        {submitted && (
          <View style={{ backgroundColor: 'rgba(132,204,22,0.08)', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(132,204,22,0.2)', alignItems: 'center' }}>
            <Text style={{ color: '#97A3B6', fontSize: 13 }}>Actual: <Text style={{ color: '#F8FAFC', fontWeight: '700' }}>{actualCents > 0 ? '+' : ''}{actualCents}¢</Text></Text>
            <Text style={{ color: '#97A3B6', fontSize: 13 }}>Guess: <Text style={{ color: '#F8FAFC', fontWeight: '700' }}>{needleCents > 0 ? '+' : ''}{needleCents}¢</Text></Text>
          </View>
        )}

        <Pressable onPress={submitted ? (round >= totalRounds ? () => setPhase('results') : nextRound) : handleSubmit} style={{ backgroundColor: ACCENT, borderRadius: 14, padding: 16, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
            {!submitted ? 'Lock In' : round >= totalRounds ? 'See Results' : 'Next Round →'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
