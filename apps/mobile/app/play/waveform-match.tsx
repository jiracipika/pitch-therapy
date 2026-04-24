import { View, Text, Pressable, ScrollView } from 'react-native';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { playFrequency } from '@/lib/audio';

const ACCENT = '#818CF8';
const ROUNDS = 8;

function centsToFreq(base: number, cents: number) { return base * Math.pow(2, cents / 1200); }

type Phase = 'setup' | 'playing' | 'done';

export default function WaveformMatchScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('setup');
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [baseFreq, setBaseFreq] = useState(440);
  const [detuneCents, setDetuneCents] = useState(0);
  const [sliderCents, setSliderCents] = useState(0);
  const [results, setResults] = useState<{ round: number; detune: number; answer: number; pts: number }[]>([]);

  const FREQS = [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88, 523.25];

  const nextRound = useCallback(() => {
    const f = FREQS[Math.floor(Math.random() * FREQS.length)];
    const cents = (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 40) + 10);
    setBaseFreq(f); setDetuneCents(cents); setSliderCents(0); setRound(r => r + 1); setPhase('playing');
    playFrequency(f, 0.4);
    setTimeout(() => playFrequency(centsToFreq(f, cents), 0.4), 600);
  }, []);

  const startGame = useCallback(() => { setRound(0); setScore(0); setResults([]); nextRound(); }, [nextRound]);

  const submit = useCallback(() => {
    const diff = Math.abs(sliderCents - detuneCents);
    const pts = Math.max(0, Math.round(100 - diff * 3));
    setScore(s => s + pts);
    setResults(r => [...r, { round, detune: detuneCents, answer: sliderCents, pts }]);
    setPhase('done');
  }, [sliderCents, detuneCents, round]);

  if (phase === 'done') {
    const avg = results.length > 0 ? Math.round(results.reduce((a, r) => a + r.pts, 0) / results.length) : 0;
    return (
      <View style={{ flex: 1, backgroundColor: '#08090D' }}>
        <ScrollView contentContainerStyle={{ paddingTop: 80, paddingHorizontal: 20, paddingBottom: 40, alignItems: 'center' }}>
          <Text style={{ fontSize: 48 }}>🌊</Text>
          <Text style={{ color: '#F8FAFC', fontSize: 28, fontWeight: '700', marginTop: 16 }}>Results</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 24 }}>
            {[{ l: 'Score', v: String(score) }, { l: 'Avg', v: `${avg}%` }, { l: 'Rounds', v: String(results.length) }].map(s => (
              <View key={s.l} style={{ backgroundColor: 'rgba(21,24,32,0.86)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', alignItems: 'center', flex: 1 }}>
                <Text style={{ color: '#F8FAFC', fontSize: 22, fontWeight: '700' }}>{s.v}</Text>
                <Text style={{ color: '#97A3B6', fontSize: 12, marginTop: 4 }}>{s.l}</Text>
              </View>
            ))}
          </View>
          <Pressable onPress={startGame} style={{ backgroundColor: ACCENT, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 24, width: '100%' }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Play Again</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  if (phase === 'setup') {
    return (
      <View style={{ flex: 1, backgroundColor: '#08090D', paddingHorizontal: 20, justifyContent: 'center' }}>
        <Text style={{ textAlign: 'center', fontSize: 48 }}>🌊</Text>
        <Text style={{ color: ACCENT, fontSize: 26, fontWeight: '700', textAlign: 'center', marginTop: 16 }}>Waveform Match</Text>
        <Text style={{ color: '#97A3B6', fontSize: 14, textAlign: 'center', marginTop: 8 }}>Align waveforms by detecting sharp/flat</Text>
        <Text style={{ color: '#7E8A9A', fontSize: 12, textAlign: 'center', marginTop: 16 }}>{ROUNDS} rounds</Text>
        <Pressable onPress={startGame} style={{ backgroundColor: ACCENT, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 32 }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Start Matching</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#08090D' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56 }}>
        <Pressable onPress={() => router.back()}><Text style={{ color: '#97A3B6' }}>← Back</Text></Pressable>
        <Text style={{ color: ACCENT, fontWeight: '700' }}>🌊 Waveform Match</Text>
        <Text style={{ color: '#97A3B6' }}>{round}/{ROUNDS}</Text>
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
        <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden' }}>
          <View style={{ height: '100%', backgroundColor: ACCENT, borderRadius: 99, width: `${(round / ROUNDS) * 100}%` }} />
        </View>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 20, marginTop: 24 }}>
        {/* Target waveform representation */}
        <View style={{ backgroundColor: 'rgba(21,24,32,0.86)', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', marginBottom: 12 }}>
          <Text style={{ color: ACCENT, fontSize: 12, fontWeight: '600', marginBottom: 8, textAlign: 'center' }}>TARGET</Text>
          <View style={{ height: 60, justifyContent: 'center', alignItems: 'center' }}>
            {Array.from({ length: 40 }).map((_, i) => {
              const h = Math.abs(Math.sin(i * 0.5)) * 40 + 4;
              return <View key={i} style={{ position: 'absolute', left: i * 8, width: 2, height: h, backgroundColor: ACCENT, borderRadius: 1, opacity: 0.7 }} />;
            })}
          </View>
        </View>

        {/* Detuned waveform */}
        <View style={{ backgroundColor: 'rgba(21,24,32,0.86)', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', marginBottom: 16 }}>
          <Text style={{ color: '#f87171', fontSize: 12, fontWeight: '600', marginBottom: 8, textAlign: 'center' }}>DETUNED</Text>
          <View style={{ height: 60, justifyContent: 'center', alignItems: 'center' }}>
            {Array.from({ length: 40 }).map((_, i) => {
              const h = Math.abs(Math.sin((i * 0.5) + detuneCents * 0.02)) * 40 + 4;
              return <View key={i} style={{ position: 'absolute', left: i * 8, width: 2, height: h, backgroundColor: '#f87171', borderRadius: 1, opacity: 0.7 }} />;
            })}
          </View>
        </View>

        {/* Replay buttons */}
        <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
          <Pressable onPress={() => playFrequency(baseFreq, 0.4)} style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' }}>
            <Text style={{ color: '#a1a1aa', fontSize: 12, fontWeight: '600' }}>▶ Target</Text>
          </Pressable>
          <Pressable onPress={() => playFrequency(centsToFreq(baseFreq, detuneCents), 0.4)} style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' }}>
            <Text style={{ color: '#a1a1aa', fontSize: 12, fontWeight: '600' }}>▶ Detuned</Text>
          </Pressable>
          <Pressable onPress={() => playFrequency(centsToFreq(baseFreq, sliderCents), 0.4)} style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' }}>
            <Text style={{ color: '#a1a1aa', fontSize: 12, fontWeight: '600' }}>▶ Yours</Text>
          </Pressable>
        </View>

        {/* Slider */}
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: '#97A3B6', fontSize: 12 }}>♭ -50¢</Text>
            <Text style={{ color: Math.abs(sliderCents) < 5 ? '#4ade80' : '#f4f4f5', fontSize: 14, fontWeight: '700' }}>{sliderCents > 0 ? '+' : ''}{sliderCents}¢</Text>
            <Text style={{ color: '#97A3B6', fontSize: 12 }}>♯ +50¢</Text>
          </View>
          <View style={{ height: 40, justifyContent: 'center' }}>
            <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 99 }}>
              <View style={{ height: '100%', backgroundColor: ACCENT, borderRadius: 99, width: `${((sliderCents + 50) / 100) * 100}%` }} />
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: 8 }}>
            {[-50, -30, -20, -10, -5, 0, 5, 10, 20, 30, 50].map(v => (
              <Pressable key={v} onPress={() => setSliderCents(v)} style={{
                backgroundColor: sliderCents === v ? ACCENT : 'rgba(255,255,255,0.05)', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 8, borderWidth: 1, borderColor: sliderCents === v ? ACCENT : 'rgba(255,255,255,0.07)',
              }}>
                <Text style={{ color: sliderCents === v ? '#fff' : '#71717a', fontSize: 11, fontWeight: '600' }}>{v > 0 ? '+' : ''}{v}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable onPress={submit} style={{ backgroundColor: ACCENT, borderRadius: 14, padding: 16, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Submit ({round}/{ROUNDS})</Text>
        </Pressable>
      </View>
    </View>
  );
}
