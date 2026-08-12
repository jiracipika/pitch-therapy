import { View, Text, Pressable, ScrollView } from 'react-native';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { playFrequency } from '@/lib/audio';
import { triggerCorrectHaptic, triggerIncorrectHaptic, triggerSelectionHaptic } from '@/lib/haptics';
import { useSessionResults } from '@/lib/sessionResults';
import { playColors as pc } from '@/lib/theme';
import { GAME_MODE_META } from '@pitch-therapy/core';
const MODE = GAME_MODE_META['waveform-match'];
const ACCENT = MODE.accentHex;
const ROUNDS = 8;

function centsToFreq(base: number, cents: number) { return base * Math.pow(2, cents / 1200); }

type Phase = 'setup' | 'playing' | 'reveal' | 'done';

export default function WaveformMatchScreen() {
  const router = useRouter();
  const { recordResult } = useSessionResults();
  const [phase, setPhase] = useState<Phase>('setup');
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [baseFreq, setBaseFreq] = useState(440);
  const [detuneCents, setDetuneCents] = useState(0);
  const [sliderCents, setSliderCents] = useState(0);
  const [results, setResults] = useState<{ round: number; detune: number; answer: number; pts: number }[]>([]);
  const sessionStartRef = useRef(0);
  const recordedRef = useRef(false);

  // Persist session result once when the game completes.
  useEffect(() => {
    if (phase !== 'done' || recordedRef.current || results.length === 0) return;
    recordedRef.current = true;
    const avgPts = results.reduce((a, r) => a + r.pts, 0) / results.length;
    recordResult({
      mode: 'waveform-match',
      score,
      accuracy: Math.max(0, Math.min(1, avgPts / 100)),
      rounds: results.length,
      timeMs: Date.now() - sessionStartRef.current,
    });
  }, [phase, results, score, recordResult]);

  const FREQS = [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88, 523.25];

  const nextRound = useCallback(() => {
    const f = FREQS[Math.floor(Math.random() * FREQS.length)];
    const cents = (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 40) + 10);
    setBaseFreq(f); setDetuneCents(cents); setSliderCents(0); setRound(r => r + 1); setPhase('playing');
    playFrequency(f, 0.4);
    setTimeout(() => playFrequency(centsToFreq(f, cents), 0.4), 600);
  }, []);

  const startGame = useCallback(() => {
    void triggerSelectionHaptic();
    setRound(0); setScore(0); setResults([]);
    recordedRef.current = false;
    sessionStartRef.current = Date.now();
    nextRound();
  }, [nextRound]);

  const submit = useCallback(() => {
    const diff = Math.abs(sliderCents - detuneCents);
    const pts = Math.max(0, Math.round(100 - diff * 3));
    if (pts >= 70) void triggerCorrectHaptic();
    else void triggerIncorrectHaptic();
    setScore(s => s + pts);
    setResults(r => [...r, { round, detune: detuneCents, answer: sliderCents, pts }]);
    setPhase('reveal');
  }, [sliderCents, detuneCents, round]);

  const advance = useCallback(() => {
    if (round >= ROUNDS) {
      setPhase('done');
    } else {
      nextRound();
    }
  }, [round, nextRound]);

  if (phase === 'done') {
    const avg = results.length > 0 ? Math.round(results.reduce((a, r) => a + r.pts, 0) / results.length) : 0;
    return (
      <View style={{ flex: 1, backgroundColor: pc.screen }}>
        <ScrollView contentContainerStyle={{ paddingTop: 80, paddingHorizontal: 20, paddingBottom: 40, alignItems: 'center' }}>
          <Text style={{ fontSize: 48 }}>🌊</Text>
          <Text style={{ color: pc.text, fontSize: 28, fontWeight: '700', marginTop: 16 }}>Results</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 24 }}>
            {[{ l: 'Score', v: String(score) }, { l: 'Avg', v: `${avg}%` }, { l: 'Rounds', v: String(results.length) }].map(s => (
              <View key={s.l} style={{ backgroundColor: pc.cardSurface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: pc.cardBorder, alignItems: 'center', flex: 1 }}>
                <Text style={{ color: pc.text, fontSize: 22, fontWeight: '700' }}>{s.v}</Text>
                <Text style={{ color: pc.textSecondary, fontSize: 12, marginTop: 4 }}>{s.l}</Text>
              </View>
            ))}
          </View>
          <Pressable accessibilityRole="button" onPress={startGame} style={{ backgroundColor: ACCENT, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 24, width: '100%' }}>
            <Text style={{ color: pc.text, fontWeight: '700', fontSize: 16 }}>Play Again</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  if (phase === 'setup') {
    return (
      <View style={{ flex: 1, backgroundColor: pc.screen, paddingHorizontal: 20, justifyContent: 'center' }}>
        <Text style={{ textAlign: 'center', fontSize: 48 }}>🌊</Text>
        <Text style={{ color: ACCENT, fontSize: 26, fontWeight: '700', textAlign: 'center', marginTop: 16 }}>Waveform Match</Text>
        <Text style={{ color: pc.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 8 }}>Align waveforms by detecting sharp/flat</Text>
        <Text style={{ color: pc.textTertiary, fontSize: 12, textAlign: 'center', marginTop: 16 }}>{ROUNDS} rounds</Text>
        <Pressable accessibilityRole="button" onPress={startGame} style={{ backgroundColor: ACCENT, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 32 }}>
          <Text style={{ color: pc.text, fontWeight: '700', fontSize: 16 }}>Start Matching</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: pc.screen }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back to dashboard" onPress={() => router.back()}><Text style={{ color: pc.textSecondary }}>← Back</Text></Pressable>
        <Text style={{ color: ACCENT, fontWeight: '700' }}>🌊 Waveform Match</Text>
        <Text style={{ color: pc.textSecondary }}>{round}/{ROUNDS}</Text>
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
        <View style={{ height: 4, backgroundColor: pc.cardAmbient, borderRadius: 99, overflow: 'hidden' }}>
          <View style={{ height: '100%', backgroundColor: ACCENT, borderRadius: 99, width: `${(round / ROUNDS) * 100}%` }} />
        </View>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 20, marginTop: 24 }}>
        {/* Target waveform representation */}
        <View style={{ backgroundColor: pc.cardSurface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: pc.cardBorder, marginBottom: 12 }}>
          <Text style={{ color: ACCENT, fontSize: 12, fontWeight: '600', marginBottom: 8, textAlign: 'center' }}>TARGET</Text>
          <View style={{ height: 60, justifyContent: 'center', alignItems: 'center' }}>
            {Array.from({ length: 40 }).map((_, i) => {
              const h = Math.abs(Math.sin(i * 0.5)) * 40 + 4;
              return <View key={i} style={{ position: 'absolute', left: i * 8, width: 2, height: h, backgroundColor: ACCENT, borderRadius: 1, opacity: 0.7 }} />;
            })}
          </View>
        </View>

        {/* Detuned waveform */}
        <View style={{ backgroundColor: pc.cardSurface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: pc.cardBorder, marginBottom: 16 }}>
          <Text style={{ color: pc.danger, fontSize: 12, fontWeight: '600', marginBottom: 8, textAlign: 'center' }}>DETUNED</Text>
          <View style={{ height: 60, justifyContent: 'center', alignItems: 'center' }}>
            {Array.from({ length: 40 }).map((_, i) => {
              const h = Math.abs(Math.sin((i * 0.5) + detuneCents * 0.02)) * 40 + 4;
              return <View key={i} style={{ position: 'absolute', left: i * 8, width: 2, height: h, backgroundColor: pc.danger, borderRadius: 1, opacity: 0.7 }} />;
            })}
          </View>
        </View>

        {/* Replay buttons */}
        <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
          <Pressable accessibilityRole="button" onPress={() => playFrequency(baseFreq, 0.4)} style={{ backgroundColor: pc.cardAmbient, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 16, borderWidth: 1, borderColor: pc.cardBorder }}>
            <Text style={{ color: pc.textTertiary, fontSize: 12, fontWeight: '600' }}>▶ Target</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => playFrequency(centsToFreq(baseFreq, detuneCents), 0.4)} style={{ backgroundColor: pc.cardAmbient, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 16, borderWidth: 1, borderColor: pc.cardBorder }}>
            <Text style={{ color: pc.textTertiary, fontSize: 12, fontWeight: '600' }}>▶ Detuned</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => playFrequency(centsToFreq(baseFreq, sliderCents), 0.4)} style={{ backgroundColor: pc.cardAmbient, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 16, borderWidth: 1, borderColor: pc.cardBorder }}>
            <Text style={{ color: pc.textTertiary, fontSize: 12, fontWeight: '600' }}>▶ Yours</Text>
          </Pressable>
        </View>

        {/* Slider */}
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: pc.textSecondary, fontSize: 12 }}>♭ -50¢</Text>
            <Text style={{ color: Math.abs(sliderCents) < 5 ? pc.success : pc.text, fontSize: 14, fontWeight: '700' }}>{sliderCents > 0 ? '+' : ''}{sliderCents}¢</Text>
            <Text style={{ color: pc.textSecondary, fontSize: 12 }}>♯ +50¢</Text>
          </View>
          <View style={{ height: 40, justifyContent: 'center' }}>
            <View style={{ height: 6, backgroundColor: pc.cardBorder, borderRadius: 99 }}>
              <View style={{ height: '100%', backgroundColor: ACCENT, borderRadius: 99, width: `${((sliderCents + 50) / 100) * 100}%` }} />
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: 8 }}>
            {[-50, -30, -20, -10, -5, 0, 5, 10, 20, 30, 50].map(v => (
              <Pressable key={v} accessibilityRole="button" onPress={() => setSliderCents(v)} style={{
                backgroundColor: sliderCents === v ? ACCENT : pc.cardAmbient, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 8, borderWidth: 1, borderColor: sliderCents === v ? ACCENT : pc.cardBorder,
              }}>
                <Text style={{ color: sliderCents === v ? '#fff' : pc.textMuted, fontSize: 11, fontWeight: '600' }}>{v > 0 ? '+' : ''}{v}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {phase === 'reveal' && (
          <View style={{ backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: 12, padding: 12, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(74,222,128,0.3)' }}>
            <Text style={{ color: pc.textSecondary, fontSize: 13 }}>Target: <Text style={{ color: pc.text, fontWeight: '700' }}>{detuneCents > 0 ? '+' : ''}{detuneCents}¢</Text></Text>
            <Text style={{ color: pc.textSecondary, fontSize: 13 }}>Your answer: <Text style={{ color: pc.text, fontWeight: '700' }}>{sliderCents > 0 ? '+' : ''}{sliderCents}¢</Text></Text>
            <Text style={{ color: Math.abs(sliderCents - detuneCents) <= 5 ? pc.success : pc.warning, fontSize: 16, fontWeight: '700', marginTop: 4 }}>
              {Math.abs(sliderCents - detuneCents)}¢ off
            </Text>
          </View>
        )}

        <Pressable
          onPress={phase === 'reveal' ? advance : submit}
          style={{ backgroundColor: ACCENT, borderRadius: 14, padding: 16, alignItems: 'center' }}
        >
          <Text style={{ color: pc.text, fontWeight: '700', fontSize: 16 }}>
            {phase === 'reveal'
              ? (round >= ROUNDS ? 'See Results' : 'Next Round →')
              : `Submit (${round}/${ROUNDS})`}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
