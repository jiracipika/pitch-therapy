import { View, Text, Pressable, ScrollView } from 'react-native';
import { useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { playTone, playFrequency, NOTE_FREQS_4 } from '@/lib/audio';
import { GameHeader } from '@/components/GameHeader';
import { triggerCorrectHaptic, triggerIncorrectHaptic } from '@/lib/haptics';

const ACCENT = '#D946EF';

const INTERVALS = [
  { name: 'Unison', semitones: 0 },
  { name: 'm2', semitones: 1 },
  { name: 'M2', semitones: 2 },
  { name: 'm3', semitones: 3 },
  { name: 'M3', semitones: 4 },
  { name: 'P4', semitones: 5 },
  { name: 'Tritone', semitones: 6 },
  { name: 'P5', semitones: 7 },
  { name: 'm6', semitones: 8 },
  { name: 'M6', semitones: 9 },
  { name: 'm7', semitones: 10 },
  { name: 'M7', semitones: 11 },
  { name: 'Octave', semitones: 12 },
];

type IntervalMode = 'ascending' | 'descending' | 'harmonic';

const MODE_CONFIG: Record<IntervalMode, { label: string; pool: number[] }> = {
  ascending: { label: 'Ascending', pool: [1, 2, 3, 4, 5, 7, 8, 9, 12] },
  descending: { label: 'Descending', pool: [1, 2, 3, 4, 5, 7, 8, 9, 12] },
  harmonic: { label: 'Harmonic', pool: [3, 4, 5, 7, 12] },
};

const TOTAL_ROUNDS = 8;
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

type Phase = 'setup' | 'playing' | 'results';

interface RoundResult { round: number; root: string; interval: string; answer: string; correct: boolean; points: number }

export default function IntervalArcherScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('setup');
  const [intervalMode, setIntervalMode] = useState<IntervalMode>('ascending');
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [rootNote, setRootNote] = useState('C');
  const [rootFreq, setRootFreq] = useState(261.63);
  const [targetInterval, setTargetInterval] = useState(INTERVALS[4]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [results, setResults] = useState<RoundResult[]>([]);

  const pool = MODE_CONFIG[intervalMode].pool;
  const activeIntervals = INTERVALS.filter(i => pool.includes(i.semitones));

  const playIntervalSound = (freq: number, semitones: number) => {
    const secondFreq = freq * Math.pow(2, semitones / 12);
    if (intervalMode === 'ascending') {
      playFrequency(freq, 0.5);
      setTimeout(() => playFrequency(secondFreq, 0.8), 550);
    } else if (intervalMode === 'descending') {
      playFrequency(secondFreq, 0.5);
      setTimeout(() => playFrequency(freq, 0.8), 550);
    } else {
      // Harmonic: play both — approximate with two rapid tones
      playFrequency(freq, 0.6);
      playFrequency(secondFreq, 0.6);
    }
  };

  const startGame = (mode: IntervalMode) => {
    setIntervalMode(mode);
    setRound(0); setScore(0); setStreak(0); setBestStreak(0); setResults([]);
    nextRound(mode);
  };

  const pickAndPlay = (mode: IntervalMode) => {
    const noteIdx = Math.floor(Math.random() * 12);
    const note = NOTE_NAMES[noteIdx];
    const freq = NOTE_FREQS_4[note] || 261.63;
    const intervalSemitones = pool[Math.floor(Math.random() * pool.length)];
    const interval = INTERVALS[intervalSemitones];
    setRootNote(note);
    setRootFreq(freq);
    setTargetInterval(interval);
    setFeedback(null);
    setSelected(null);
    playIntervalSound(freq, interval.semitones);
  };

  const nextRound = (mode?: IntervalMode) => {
    const m = mode || intervalMode;
    pickAndPlay(m);
    setRound(r => r + 1);
    setPhase('playing');
  };

  const handleAnswer = (semitones: number, name: string) => {
    if (feedback) return;
    const correct = semitones === targetInterval.semitones;
    const semitonesOff = Math.abs(semitones - targetInterval.semitones);
    let points = 0;
    if (correct) points = 120;
    else if (semitonesOff === 1) points = 30;
    else if (semitonesOff === 2) points = 10;
    if (correct) void triggerCorrectHaptic();
    else void triggerIncorrectHaptic();

    setSelected(name);
    setFeedback(correct ? 'correct' : 'wrong');
    if (correct) setStreak(s => { const ns = s + 1; setBestStreak(b => Math.max(b, ns)); return ns; });
    else setStreak(0);
    setScore(s => s + points);
    setResults(r => [...r, { round, root: rootNote, interval: targetInterval.name, answer: name, correct, points }]);

    setTimeout(() => {
      if (round >= TOTAL_ROUNDS) { setPhase('results'); }
      else { nextRound(); }
    }, 1000);
  };

  if (phase === 'setup') {
    return (
      <View style={{ flex: 1, backgroundColor: '#08090D' }}>
        <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 20 }}>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: ACCENT }} />
          <Text style={{ color: '#F8FAFC', fontSize: 22, fontWeight: '700', marginTop: 12 }}>Interval Archer</Text>
          <Text style={{ color: '#97A3B6', fontSize: 14, marginTop: 4 }}>Identify intervals — closer is more points</Text>
        </View>
        <View style={{ flex: 1, paddingHorizontal: 20, justifyContent: 'center' }}>
          <Text style={{ color: '#F8FAFC', fontSize: 18, fontWeight: '600', marginBottom: 16 }}>Mode</Text>
          {(Object.keys(MODE_CONFIG) as IntervalMode[]).map(m => (
            <Pressable key={m} onPress={() => startGame(m)} style={({ pressed }) => ({ backgroundColor: 'rgba(21,24,32,0.86)', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', marginBottom: 12, opacity: pressed ? 0.75 : 1 })}>
              <Text style={{ color: '#F8FAFC', fontWeight: '600', fontSize: 16 }}>{MODE_CONFIG[m].label}</Text>
              <Text style={{ color: '#97A3B6', fontSize: 13, marginTop: 3 }}>{MODE_CONFIG[m].pool.length} intervals · {TOTAL_ROUNDS} rounds</Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  if (phase === 'results') {
    const correct = results.filter(r => r.correct).length;
    return (
      <View style={{ flex: 1, backgroundColor: '#08090D' }}>
        <ScrollView contentContainerStyle={{ paddingTop: 80, paddingHorizontal: 20, paddingBottom: 40 }}>
          <Text style={{ color: '#F8FAFC', fontSize: 28, fontWeight: '700', marginBottom: 4 }}>Interval Archer Complete!</Text>
          <View style={{ backgroundColor: 'rgba(21,24,32,0.86)', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', marginBottom: 20, alignItems: 'center' }}>
            <Text style={{ color: ACCENT, fontSize: 48, fontWeight: '700' }}>{score}</Text>
            <Text style={{ color: '#97A3B6', marginTop: 4 }}>points</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
            {[
              { label: 'Bullseyes', value: `${correct}/${TOTAL_ROUNDS}` },
              { label: 'Best Streak', value: `🔥 ${bestStreak}` },
            ].map(s => (
              <View key={s.label} style={{ flex: 1, backgroundColor: 'rgba(21,24,32,0.86)', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', alignItems: 'center' }}>
                <Text style={{ color: '#F8FAFC', fontSize: 20, fontWeight: '700' }}>{s.value}</Text>
                <Text style={{ color: '#97A3B6', fontSize: 12, marginTop: 2 }}>{s.label}</Text>
              </View>
            ))}
          </View>
          {results.map((r, i) => (
            <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}>
              <Text style={{ color: '#97A3B6', fontSize: 13 }}>Round {i + 1}</Text>
              <Text style={{ color: '#F8FAFC', fontSize: 13, fontWeight: '600' }}>{r.interval}</Text>
              <Text style={{ color: r.correct ? '#4ade80' : '#f87171', fontSize: 13 }}>{r.correct ? '✓' : r.answer}</Text>
            </View>
          ))}
          <Pressable onPress={() => startGame(intervalMode)} style={{ backgroundColor: ACCENT, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 24 }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Play Again</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#08090D' }}>
      <GameHeader score={score} round={round} totalRounds={TOTAL_ROUNDS} streak={streak} accent={ACCENT} />
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 32 }}>
        <Pressable onPress={() => playIntervalSound(rootFreq, targetInterval.semitones)} style={{ alignSelf: 'center', width: 72, height: 72, borderRadius: 18, backgroundColor: `${ACCENT}22`, borderWidth: 2, borderColor: ACCENT, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 28 }}>🔊</Text>
        </Pressable>
        <Text style={{ textAlign: 'center', color: '#97A3B6', fontSize: 13, marginBottom: 4 }}>Replay interval</Text>
        <Text style={{ textAlign: 'center', color: '#7E8A9A', fontSize: 12, marginBottom: 20 }}>Root: {rootNote} · {MODE_CONFIG[intervalMode].label}</Text>

        {/* Target visual */}
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          {[48, 36, 24, 12].map((size, i) => (
            <View key={i} style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: 1, borderColor: `rgba(217,70,239,${0.1 + i * 0.08})`, backgroundColor: i === 3 ? 'rgba(217,70,239,0.1)' : 'transparent' }} />
          ))}
        </View>

        {feedback && (
          <View style={{ backgroundColor: feedback === 'correct' ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)', borderRadius: 12, padding: 12, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: feedback === 'correct' ? '#4ade80' : '#f87171' }}>
            <Text style={{ color: feedback === 'correct' ? '#4ade80' : '#f87171', fontWeight: '700', fontSize: 16 }}>
              {feedback === 'correct' ? '🎯 Bullseye!' : `It was ${targetInterval.name}`}
            </Text>
          </View>
        )}

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {activeIntervals.map(interval => {
            const isTarget = feedback && interval.semitones === targetInterval.semitones;
            const isSelected = selected === interval.name && feedback === 'wrong';
            let bgColor = 'rgba(255,255,255,0.04)';
            let borderColor = 'rgba(255,255,255,0.07)';
            let textColor = '#f4f4f5';

            if (isTarget) { bgColor = 'rgba(74,222,128,0.15)'; borderColor = '#4ade80'; textColor = '#4ade80'; }
            else if (isSelected) { bgColor = 'rgba(248,113,113,0.15)'; borderColor = '#f87171'; textColor = '#f87171'; }

            return (
              <Pressable key={interval.name} onPress={() => handleAnswer(interval.semitones, interval.name)} style={({ pressed }) => ({
                width: 80, height: 56, borderRadius: 12, backgroundColor: bgColor,
                borderWidth: 1, borderColor, alignItems: 'center', justifyContent: 'center',
                opacity: pressed ? 0.75 : 1,
              })}>
                <Text style={{ color: textColor, fontWeight: '700', fontSize: 14 }}>{interval.name}</Text>
                <Text style={{ color: '#7E8A9A', fontSize: 10 }}>
                  {interval.semitones === 0 ? '' : interval.semitones === 12 ? '8va' : `${interval.semitones}st`}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={{ textAlign: 'center', color: '#7E8A9A', fontSize: 12, marginTop: 24 }}>{MODE_CONFIG[intervalMode].label} mode</Text>
      </View>
    </View>
  );
}
