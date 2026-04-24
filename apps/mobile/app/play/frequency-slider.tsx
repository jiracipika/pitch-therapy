import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { playTone, playFrequency } from '@/lib/audio';
import { GameHeader } from '@/components/GameHeader';
import { triggerCorrectHaptic, triggerIncorrectHaptic } from '@/lib/haptics';

const ACCENT = '#06B6D4';
const MIN_FREQ = 80;
const MAX_FREQ = 1200;
const TOTAL_ROUNDS = 6;

const REFERENCE_NOTES = [
  { name: 'C3', freq: 130.81 }, { name: 'A3', freq: 220 },
  { name: 'C4', freq: 261.63 }, { name: 'A4', freq: 440 },
  { name: 'C5', freq: 523.25 }, { name: 'A5', freq: 880 },
];

function freqToPct(freq: number): number {
  return ((Math.log(freq) - Math.log(MIN_FREQ)) / (Math.log(MAX_FREQ) - Math.log(MIN_FREQ))) * 100;
}

function pctToFreq(pct: number): number {
  return Math.exp(Math.log(MIN_FREQ) + (pct / 100) * (Math.log(MAX_FREQ) - Math.log(MIN_FREQ)));
}

type Phase = 'setup' | 'playing' | 'reveal' | 'results';

interface RoundResult { round: number; freq: number; answer: number; centsOff: number; points: number }

export default function FrequencySliderScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('setup');
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [targetFreq, setTargetFreq] = useState(440);
  const [sliderPct, setSliderPct] = useState(50);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<RoundResult[]>([]);

  const pickTarget = () => {
    const minLog = Math.log(MIN_FREQ);
    const maxLog = Math.log(MAX_FREQ);
    const freq = Math.round(Math.exp(minLog + Math.random() * (maxLog - minLog)) * 10) / 10;
    setTargetFreq(freq);
    setSliderPct(50);
    setSubmitted(false);
  };

  const startGame = () => {
    setRound(0); setScore(0); setStreak(0); setResults([]);
    pickTarget();
    setRound(1);
    setPhase('playing');
    playFrequency(targetFreq, 1.0);
  };

  const handleSliderChange = (text: string) => {
    const val = parseFloat(text);
    if (!isNaN(val)) {
      const pct = Math.max(0, Math.min(100, val));
      setSliderPct(pct);
    }
  };

  const handleSubmit = () => {
    if (submitted) return;
    setSubmitted(true);
    const answerFreq = pctToFreq(sliderPct);
    const centsOff = Math.round(1200 * Math.log2(answerFreq / targetFreq));
    const points = Math.max(0, Math.round((1 - Math.abs(centsOff) / 100) * 150));
    const correct = Math.abs(centsOff) <= 15;
    if (correct) void triggerCorrectHaptic();
    else void triggerIncorrectHaptic();
    setScore(s => s + points);
    if (correct) setStreak(s => s + 1); else setStreak(0);
    setResults(r => [...r, { round, freq: targetFreq, answer: answerFreq, centsOff, points }]);
    setPhase('reveal');
  };

  const nextRound = () => {
    pickTarget();
    setRound(r => r + 1);
    setPhase('playing');
    playFrequency(targetFreq, 1.0);
  };

  if (phase === 'setup' || phase === 'results') {
    return (
      <View style={{ flex: 1, backgroundColor: '#09090b' }}>
        <ScrollView contentContainerStyle={{ paddingTop: 80, paddingHorizontal: 20, paddingBottom: 40 }}>
          {phase === 'results' ? (
            <>
              <Text style={{ color: '#f4f4f5', fontSize: 28, fontWeight: '700', marginBottom: 4 }}>Slider Complete!</Text>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', marginBottom: 20, alignItems: 'center' }}>
                <Text style={{ color: ACCENT, fontSize: 48, fontWeight: '700' }}>{score}</Text>
                <Text style={{ color: '#71717a', marginTop: 4 }}>points</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
                {[
                  { label: 'Avg Error', value: `${Math.round(results.reduce((s, r) => s + Math.abs(r.centsOff), 0) / results.length)}¢` },
                  { label: 'Streak', value: `🔥 ${streak}` },
                ].map(s => (
                  <View key={s.label} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', alignItems: 'center' }}>
                    <Text style={{ color: '#f4f4f5', fontSize: 20, fontWeight: '700' }}>{s.value}</Text>
                    <Text style={{ color: '#71717a', fontSize: 12, marginTop: 2 }}>{s.label}</Text>
                  </View>
                ))}
              </View>
              {results.map((r, i) => (
                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}>
                  <Text style={{ color: '#71717a', fontSize: 13 }}>Round {i + 1}</Text>
                  <Text style={{ color: '#f4f4f5', fontSize: 13, fontWeight: '600' }}>{r.freq.toFixed(1)} Hz</Text>
                  <Text style={{ color: Math.abs(r.centsOff) <= 15 ? '#4ade80' : '#fbbf24', fontSize: 13 }}>{r.centsOff}¢</Text>
                </View>
              ))}
            </>
          ) : (
            <>
              <Text style={{ color: '#f4f4f5', fontSize: 22, fontWeight: '700', marginBottom: 4 }}>Frequency Slider</Text>
              <Text style={{ color: '#71717a', fontSize: 14, marginBottom: 32 }}>Drag to match a hidden frequency</Text>
            </>
          )}
          <Pressable onPress={phase === 'results' ? startGame : startGame} style={{ backgroundColor: ACCENT, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 24 }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{phase === 'results' ? 'Play Again' : 'Start Game'}</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  const answerFreq = pctToFreq(sliderPct);
  const targetPct = freqToPct(targetFreq);

  return (
    <View style={{ flex: 1, backgroundColor: '#09090b' }}>
      <GameHeader score={score} round={round} totalRounds={TOTAL_ROUNDS} streak={streak} accent={ACCENT} />
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 32 }}>
        <Pressable onPress={() => playFrequency(targetFreq, 1.0)} style={{ alignSelf: 'center', width: 72, height: 72, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 28 }}>🔊</Text>
        </Pressable>
        <Text style={{ textAlign: 'center', color: '#71717a', fontSize: 13, marginBottom: 8 }}>Tap to replay tone</Text>
        <Text style={{ textAlign: 'center', color: '#52525b', fontSize: 12 }}>Your pick: {answerFreq.toFixed(1)} Hz</Text>

        {/* Slider */}
        <View style={{ marginTop: 24 }}>
          <View style={{ height: 48, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, position: 'relative', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
            {REFERENCE_NOTES.map(n => (
              <View key={n.name} style={{ position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: '#27272a', left: `${freqToPct(n.freq)}%` }}>
                <Text style={{ position: 'absolute', bottom: -16, left: 4, fontSize: 9, color: '#3f3f46' }}>{n.name}</Text>
              </View>
            ))}
            <View style={{ position: 'absolute', top: 18, left: `${sliderPct}%`, width: 20, height: 12, borderRadius: 6, backgroundColor: ACCENT, marginLeft: -10 }} />
            {submitted && (
              <View style={{ position: 'absolute', top: 8, bottom: 8, left: `${targetPct}%`, width: 4, borderRadius: 2, backgroundColor: '#4ade80', marginLeft: -2 }} />
            )}
          </View>
        </View>

        {/* Slider input */}
        <View style={{ marginTop: 24 }}>
          <TextInput
            value={sliderPct.toFixed(0)}
            onChangeText={handleSliderChange}
            keyboardType="numeric"
            style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 14, color: '#f4f4f5', fontSize: 16, textAlign: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' }}
          />
          <Text style={{ textAlign: 'center', color: '#52525b', fontSize: 11, marginTop: 4 }}>Enter position (0–100)</Text>
        </View>

        {submitted && (
          <View style={{ backgroundColor: 'rgba(6,182,212,0.08)', borderRadius: 12, padding: 14, marginTop: 16, borderWidth: 1, borderColor: 'rgba(6,182,212,0.2)', alignItems: 'center' }}>
            <Text style={{ color: '#71717a', fontSize: 13 }}>Target: <Text style={{ color: '#f4f4f5', fontWeight: '700' }}>{targetFreq.toFixed(1)} Hz</Text></Text>
            <Text style={{ color: '#71717a', fontSize: 13 }}>Answer: <Text style={{ color: '#f4f4f5', fontWeight: '700' }}>{answerFreq.toFixed(1)} Hz</Text></Text>
            <Text style={{ color: Math.abs(1200 * Math.log2(answerFreq / targetFreq)) <= 15 ? '#4ade80' : '#fbbf24', fontSize: 16, fontWeight: '700', marginTop: 4 }}>
              {Math.abs(Math.round(1200 * Math.log2(answerFreq / targetFreq)))}¢ off
            </Text>
          </View>
        )}

        <Pressable onPress={submitted ? (round >= TOTAL_ROUNDS ? () => setPhase('results') : nextRound) : handleSubmit} style={{ backgroundColor: ACCENT, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 20 }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
            {!submitted ? 'Lock In' : round >= TOTAL_ROUNDS ? 'See Results' : 'Next Round →'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
