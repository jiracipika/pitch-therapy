import { View, Text, Pressable, ScrollView } from 'react-native';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { playTone, playFrequency, NOTE_FREQS_4 } from '@/lib/audio';
import { GameHeader } from '@/components/GameHeader';

const ACCENT = '#EC4899';
const TARGET_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const TOTAL_ROUNDS = 5;

type Phase = 'setup' | 'playing' | 'results';

interface RoundResult { round: number; target: string; correct: boolean; points: number; accuracy: number }

export default function TuneInScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('setup');
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [target, setTarget] = useState('A');
  const [targetFreq, setTargetFreq] = useState(440);
  const [centsOff, setCentsOff] = useState(0);
  const [holdProgress, setHoldProgress] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [results, setResults] = useState<RoundResult[]>([]);
  const holdStartRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pickTarget = () => {
    const note = TARGET_NOTES[Math.floor(Math.random() * TARGET_NOTES.length)];
    const freq = NOTE_FREQS_4[note] || 440;
    setTarget(note);
    setTargetFreq(freq);
    setCentsOff(0);
    setHoldProgress(0);
    setFeedback(null);
    return note;
  };

  const startGame = () => {
    setRound(0); setScore(0); setStreak(0); setResults([]);
    const note = pickTarget();
    setRound(1);
    setPhase('playing');
    if (NOTE_FREQS_4[note]) playTone(note, NOTE_FREQS_4[note]);
  };

  // Simulate tuning detection with random walk toward target
  useEffect(() => {
    if (phase !== 'playing') return;
    intervalRef.current = setInterval(() => {
      setCentsOff(prev => {
        // Drift toward target with some noise
        const drift = -prev * 0.05 + (Math.random() - 0.5) * 15;
        const next = Math.max(-50, Math.min(50, prev + drift));
        if (Math.abs(next) <= 10) {
          if (!holdStartRef.current) holdStartRef.current = Date.now();
          const held = Date.now() - holdStartRef.current;
          setHoldProgress(Math.min(held / 1500, 1));
          if (held >= 1500) {
            handleSuccess(next);
          }
        } else {
          holdStartRef.current = null;
          setHoldProgress(0);
        }
        return next;
      });
    }, 100);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase, round]);

  const handleSuccess = (cents: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const accuracy = 1 - Math.abs(cents) / 50;
    const points = Math.round(accuracy * 100 + 30);
    setScore(s => s + points);
    setStreak(s => s + 1);
    setFeedback('correct');
    setResults(r => [...r, { round, target, correct: true, points, accuracy }]);
    setTimeout(() => {
      if (round >= TOTAL_ROUNDS) { setPhase('results'); }
      else {
        pickTarget();
        setRound(r => r + 1);
        const next = TARGET_NOTES[Math.floor(Math.random() * TARGET_NOTES.length)];
        setTarget(next);
        const freq = NOTE_FREQS_4[next] || 440;
        setTargetFreq(freq);
        if (NOTE_FREQS_4[next]) playTone(next, NOTE_FREQS_4[next]);
      }
    }, 1500);
  };

  if (phase === 'setup') {
    return (
      <View style={{ flex: 1, backgroundColor: '#09090b' }}>
        <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 20 }}>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: ACCENT }} />
          <Text style={{ color: '#f4f4f5', fontSize: 22, fontWeight: '700', marginTop: 12 }}>Tune In</Text>
          <Text style={{ color: '#71717a', fontSize: 14, marginTop: 4 }}>Hit the target note with your voice</Text>
        </View>
        <View style={{ flex: 1, paddingHorizontal: 20, justifyContent: 'center' }}>
          <Text style={{ color: '#f4f4f5', fontSize: 18, fontWeight: '600', marginBottom: 32 }}>Get ready to tune!</Text>
          <Text style={{ color: '#71717a', fontSize: 13, marginBottom: 8 }}>• Target note will be shown</Text>
          <Text style={{ color: '#71717a', fontSize: 13, marginBottom: 8 }}>• Tuning meter shows your accuracy</Text>
          <Text style={{ color: '#71717a', fontSize: 13, marginBottom: 8 }}>• Hold steady for 1.5s to score</Text>
          <Pressable onPress={startGame} style={{ backgroundColor: ACCENT, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 32 }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Start Game</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (phase === 'results') {
    const correct = results.filter(r => r.correct).length;
    return (
      <View style={{ flex: 1, backgroundColor: '#09090b' }}>
        <ScrollView contentContainerStyle={{ paddingTop: 80, paddingHorizontal: 20, paddingBottom: 40 }}>
          <Text style={{ color: '#f4f4f5', fontSize: 28, fontWeight: '700', marginBottom: 4 }}>Tune In Complete!</Text>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', marginBottom: 20, alignItems: 'center' }}>
            <Text style={{ color: ACCENT, fontSize: 48, fontWeight: '700' }}>{score}</Text>
            <Text style={{ color: '#71717a', marginTop: 4 }}>points</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
            {[
              { label: 'Hit', value: `${correct}/${TOTAL_ROUNDS}` },
              { label: 'Streak', value: `🔥 ${streak}` },
            ].map(s => (
              <View key={s.label} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', alignItems: 'center' }}>
                <Text style={{ color: '#f4f4f5', fontSize: 20, fontWeight: '700' }}>{s.value}</Text>
                <Text style={{ color: '#71717a', fontSize: 12, marginTop: 2 }}>{s.label}</Text>
              </View>
            ))}
          </View>
          <Pressable onPress={startGame} style={{ backgroundColor: ACCENT, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 24 }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Play Again</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  const centsColor = Math.abs(centsOff) <= 10 ? '#4ade80' : Math.abs(centsOff) <= 25 ? '#fbbf24' : '#f87171';

  return (
    <View style={{ flex: 1, backgroundColor: '#09090b' }}>
      <GameHeader score={score} round={round} totalRounds={TOTAL_ROUNDS} streak={streak} accent={ACCENT} />
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 32 }}>
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ color: ACCENT, fontSize: 64, fontWeight: '700' }}>{target}</Text>
          <Text style={{ color: '#71717a', fontSize: 14, marginTop: 4 }}>{targetFreq.toFixed(1)} Hz</Text>
        </View>

        {/* Tuning meter */}
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ color: '#52525b', fontSize: 10 }}>-50¢</Text>
            <Text style={{ color: '#52525b', fontSize: 10 }}>0</Text>
            <Text style={{ color: '#52525b', fontSize: 10 }}>+50¢</Text>
          </View>
          <View style={{ height: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 6, position: 'relative', overflow: 'hidden' }}>
            <View style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, backgroundColor: '#52525b' }} />
            <View style={{ position: 'absolute', left: '40%', top: 0, bottom: 0, width: '20%', backgroundColor: 'rgba(74,222,128,0.1)', borderRadius: 4 }} />
            <View style={{ position: 'absolute', top: 2, left: `${50 + (centsOff / 50) * 45}%`, width: 16, height: 8, borderRadius: 4, backgroundColor: centsColor, marginLeft: -8, borderWidth: 2, borderColor: centsColor }} />
          </View>
          <Text style={{ textAlign: 'center', fontSize: 18, fontWeight: '700', color: centsColor, marginTop: 8 }}>
            {centsOff > 0 ? '+' : ''}{centsOff}¢
          </Text>
        </View>

        {holdProgress > 0 && (
          <View style={{ marginBottom: 16 }}>
            <View style={{ height: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
              <View style={{ height: '100%', backgroundColor: '#4ade80', borderRadius: 4, width: `${holdProgress * 100}%` }} />
            </View>
            <Text style={{ textAlign: 'center', fontSize: 12, color: '#71717a', marginTop: 4 }}>Hold steady...</Text>
          </View>
        )}

        <Pressable onPress={() => { if (NOTE_FREQS_4[target]) playTone(target, NOTE_FREQS_4[target]); }} style={{ alignSelf: 'center', width: 64, height: 64, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 24 }}>🔊</Text>
        </Pressable>
        <Text style={{ textAlign: 'center', color: '#52525b', fontSize: 12, marginTop: 8 }}>Tap to hear target</Text>
      </View>
    </View>
  );
}
