import { View, Text, Pressable, ScrollView, PanResponder, LayoutChangeEvent } from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { playFrequency } from '@/lib/audio';
import { GameHeader } from '@/components/GameHeader';
import { triggerCorrectHaptic, triggerIncorrectHaptic } from '@/lib/haptics';
import { useSessionResults } from '@/lib/sessionResults';
import { colors, radii, typography } from '@/lib/theme';

const ACCENT = colors.frequencySlider;
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
  const insets = useSafeAreaInsets();
  const { recordResult } = useSessionResults();
  const [phase, setPhase] = useState<Phase>('setup');
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [targetFreq, setTargetFreq] = useState(440);
  const [sliderPct, setSliderPct] = useState(50);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [trackWidth, setTrackWidth] = useState(1);
  const sessionStartRef = useRef(0);
  const recordedRef = useRef(false);

  // Persist session result once when the game completes.
  useEffect(() => {
    if (phase !== 'results' || recordedRef.current || results.length === 0) return;
    recordedRef.current = true;
    const avgPoints = results.reduce((s, r) => s + r.points, 0) / results.length;
    recordResult({
      mode: 'frequency-slider',
      score,
      accuracy: Math.max(0, Math.min(1, avgPoints / 150)),
      rounds: results.length,
      timeMs: Date.now() - sessionStartRef.current,
    });
  }, [phase, results, score, recordResult]);

  const pickTarget = () => {
    const minLog = Math.log(MIN_FREQ);
    const maxLog = Math.log(MAX_FREQ);
    const freq = Math.round(Math.exp(minLog + Math.random() * (maxLog - minLog)) * 10) / 10;
    setTargetFreq(freq);
    setSliderPct(50);
    setSubmitted(false);
    return freq;
  };

  const startGame = () => {
    setRound(1);
    setScore(0);
    setStreak(0);
    setResults([]);
    recordedRef.current = false;
    sessionStartRef.current = Date.now();
    const nextFreq = pickTarget();
    setPhase('playing');
    void playFrequency(nextFreq, 1.0);
  };

  const updateSliderFromX = useCallback((x: number) => {
    const pct = Math.max(0, Math.min(100, (x / Math.max(trackWidth, 1)) * 100));
    setSliderPct(pct);
  }, [trackWidth]);

  const panResponder = useMemo(
    () => PanResponder.create({
      onStartShouldSetPanResponder: () => !submitted,
      onMoveShouldSetPanResponder: () => !submitted,
      onPanResponderGrant: (evt) => updateSliderFromX(evt.nativeEvent.locationX),
      onPanResponderMove: (evt) => updateSliderFromX(evt.nativeEvent.locationX),
    }),
    [submitted, updateSliderFromX],
  );

  const onTrackLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(Math.max(1, event.nativeEvent.layout.width));
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
    const nextFreq = pickTarget();
    setRound(r => r + 1);
    setPhase('playing');
    void playFrequency(nextFreq, 1.0);
  };

  if (phase === 'setup' || phase === 'results') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView contentContainerStyle={{ paddingTop: insets.top + 48, paddingHorizontal: 20, paddingBottom: 40 }}>
          {phase === 'results' ? (
            <>
              <Text style={{ color: colors.text, fontSize: 28, fontWeight: '700', marginBottom: 4 }}>Slider Complete!</Text>
              <View style={{ backgroundColor: colors.card, borderRadius: radii.xl, padding: 20, borderWidth: 1, borderColor: colors.border, marginBottom: 20, alignItems: 'center' }}>
                <Text style={{ color: ACCENT, fontSize: 48, fontWeight: '700' }}>{score}</Text>
                <Text style={{ color: colors.textSecondary, marginTop: 4 }}>points</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
                {[
                  { label: 'Avg Error', value: `${results.length ? Math.round(results.reduce((s, r) => s + Math.abs(r.centsOff), 0) / results.length) : 0}¢` },
                  { label: 'Streak', value: `🔥 ${streak}` },
                ].map(s => (
                  <View key={s.label} style={{ flex: 1, backgroundColor: colors.card, borderRadius: radii.lg, padding: 14, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}>
                    <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>{s.value}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>{s.label}</Text>
                  </View>
                ))}
              </View>
              {results.map((r, i) => (
                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Round {i + 1}</Text>
                  <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600' }}>{r.freq.toFixed(1)} Hz</Text>
                  <Text style={{ color: Math.abs(r.centsOff) <= 15 ? colors.success : colors.warning, fontSize: 13 }}>{r.centsOff}¢</Text>
                </View>
              ))}
            </>
          ) : (
            <>
              <Text style={{ color: colors.text, ...typography.title2, marginBottom: 4 }}>Frequency Slider</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 20 }}>Drag the thumb to match a hidden frequency. No typing, no clipped labels.</Text>
              <Pressable onPress={() => router.back()} style={{ alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' }}>
                <Text style={{ color: ACCENT, fontWeight: '700' }}>← Back</Text>
              </Pressable>
            </>
          )}
          <Pressable accessibilityRole="button" onPress={startGame} style={{ backgroundColor: ACCENT, borderRadius: radii.lg, padding: 16, alignItems: 'center', marginTop: 24 }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{phase === 'results' ? 'Play Again' : 'Start Game'}</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  const answerFreq = pctToFreq(sliderPct);
  const targetPct = freqToPct(targetFreq);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GameHeader score={score} round={round} totalRounds={TOTAL_ROUNDS} streak={streak} accent={ACCENT} />
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 32 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Replay target tone" onPress={() => playFrequency(targetFreq, 1.0)} style={{ alignSelf: 'center', width: 72, height: 72, borderRadius: 18, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 28 }}>🔊</Text>
        </Pressable>
        <Text style={{ textAlign: 'center', color: colors.textSecondary, fontSize: 13, marginBottom: 8 }}>Tap to replay tone</Text>
        <Text style={{ textAlign: 'center', color: colors.textTertiary, fontSize: 12 }}>Your pick: {answerFreq.toFixed(1)} Hz</Text>

        <View style={{ marginTop: 24 }}>
          <View
            onLayout={onTrackLayout}
            {...panResponder.panHandlers}
            style={{ height: 56, backgroundColor: colors.card, borderRadius: 28, position: 'relative', overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}
          >
            {REFERENCE_NOTES.map(n => (
              <View key={n.name} style={{ position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: colors.divider, left: `${freqToPct(n.freq)}%` }} />
            ))}
            <View style={{ position: 'absolute', top: 14, left: `${sliderPct}%`, width: 28, height: 28, borderRadius: 14, backgroundColor: ACCENT, marginLeft: -14, borderWidth: 3, borderColor: '#fff' }} />
            {submitted && (
              <View style={{ position: 'absolute', top: 8, bottom: 8, left: `${targetPct}%`, width: 4, borderRadius: 2, backgroundColor: colors.success, marginLeft: -2 }} />
            )}
          </View>
          <View style={{ height: 20, position: 'relative', marginTop: 6 }}>
            {REFERENCE_NOTES.map(n => (
              <Text key={n.name} style={{ position: 'absolute', left: `${freqToPct(n.freq)}%`, marginLeft: -10, fontSize: 9, color: colors.textTertiary }}>{n.name}</Text>
            ))}
          </View>
          <Text style={{ textAlign: 'center', color: colors.textTertiary, fontSize: 11, marginTop: 8 }}>Drag anywhere on the rail</Text>
        </View>

        {submitted && (
          <View accessibilityLiveRegion="polite" style={{ backgroundColor: ACCENT + '14', borderRadius: radii.lg, padding: 14, marginTop: 16, borderWidth: 1, borderColor: ACCENT + '33', alignItems: 'center' }}>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Target: <Text style={{ color: colors.text, fontWeight: '700' }}>{targetFreq.toFixed(1)} Hz</Text></Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Answer: <Text style={{ color: colors.text, fontWeight: '700' }}>{answerFreq.toFixed(1)} Hz</Text></Text>
            <Text style={{ color: Math.abs(1200 * Math.log2(answerFreq / targetFreq)) <= 15 ? colors.success : colors.warning, fontSize: 16, fontWeight: '700', marginTop: 4 }}>
              {Math.abs(Math.round(1200 * Math.log2(answerFreq / targetFreq)))}¢ off
            </Text>
          </View>
        )}

        <Pressable accessibilityRole="button" onPress={submitted ? (round >= TOTAL_ROUNDS ? () => setPhase('results') : nextRound) : handleSubmit} style={{ backgroundColor: ACCENT, borderRadius: radii.lg, padding: 16, alignItems: 'center', marginTop: 20 }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
            {!submitted ? 'Lock In' : round >= TOTAL_ROUNDS ? 'See Results' : 'Next Round →'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
