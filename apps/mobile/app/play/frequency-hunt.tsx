import { View, Text, Pressable, StyleSheet, Slider } from 'react-native';
import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { playFrequency } from '@/lib/audio';

const ACCENT = '#F97316';
const MIN_FREQ = 100;
const MAX_FREQ = 2000;

const sliderToFreq = (pos: number) => Math.round(MIN_FREQ * Math.pow(MAX_FREQ / MIN_FREQ, pos));
const freqToSlider = (freq: number) => Math.log(freq / MIN_FREQ) / Math.log(MAX_FREQ / MIN_FREQ);

type Phase = 'idle' | 'hunting' | 'result' | 'done';

export default function FrequencyHuntScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('idle');
  const [round, setRound] = useState(0);
  const [totalRounds] = useState(8);
  const [score, setScore] = useState(0);
  const [targetFreq, setTargetFreq] = useState(440);
  const [sliderPos, setSliderPos] = useState(0.5);
  const [results, setResults] = useState<{ diff: number; points: number }[]>([]);
  const previewRef = useRef<ReturnType<typeof setTimeout>>();

  const startRound = () => {
    const freq = Math.round((MIN_FREQ + Math.random() * (MAX_FREQ - MIN_FREQ)) / 10) * 10;
    setTargetFreq(freq);
    setSliderPos(freqToSlider(freq) * 0.3 + Math.random() * 0.4);
    setPhase('hunting');
    setRound((r) => r + 1);
    playFrequency(freq, 1.0);
  };

  const handleStart = () => {
    setRound(0); setScore(0); setResults([]);
    startRound();
  };

  const handleLock = () => {
    clearTimeout(previewRef.current);
    const guess = sliderToFreq(sliderPos);
    const diff = Math.abs(guess - targetFreq);
    const points = Math.max(0, Math.round(1000 * Math.exp(-diff / 30)));
    setScore((s) => s + points);
    setResults((r) => [...r, { diff, points }]);
    playFrequency(targetFreq, 0.5);
    setPhase('result');
    setTimeout(() => {
      if (round >= totalRounds) setPhase('done');
      else startRound();
    }, 2000);
  };

  const handleSliderChange = (value: number) => {
    setSliderPos(value);
    clearTimeout(previewRef.current);
    previewRef.current = setTimeout(() => {
      playFrequency(sliderToFreq(value), 0.2);
    }, 80);
  };

  if (phase === 'done') {
    const avgDiff = Math.round(results.reduce((s, r) => s + r.diff, 0) / results.length);
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <View style={[styles.iconCircle, { borderColor: ACCENT, backgroundColor: ACCENT + '15' }]}>
            <Text style={{ fontSize: 36 }}>🔍</Text>
          </View>
          <Text style={styles.title}>Hunt Complete</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}><Text style={[styles.statValue, { color: ACCENT }]}>{score}</Text><Text style={styles.statLabel}>Score</Text></View>
            <View style={styles.statCard}><Text style={styles.statValue}>{avgDiff} Hz</Text><Text style={styles.statLabel}>Avg Error</Text></View>
          </View>
          <Pressable onPress={handleStart} style={[styles.btnPrimary, { backgroundColor: ACCENT }]}><Text style={styles.btnPrimaryText}>Play Again</Text></Pressable>
          <Pressable onPress={() => router.back()} style={styles.linkBtn}><Text style={styles.linkBtnText}>← Dashboard</Text></Pressable>
        </View>
      </View>
    );
  }

  if (phase === 'idle') {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <View style={[styles.iconCircle, { borderColor: ACCENT, backgroundColor: ACCENT + '12' }]}>
            <Text style={{ fontSize: 32 }}>🔍</Text>
          </View>
          <Text style={[styles.title, { fontSize: 24 }]}>Frequency Hunt</Text>
          <Text style={styles.subtitle}>Find exact frequencies by ear</Text>
          <Pressable onPress={handleStart} style={[styles.btnPrimary, { backgroundColor: ACCENT }]}><Text style={styles.btnPrimaryText}>Start Hunting</Text></Pressable>
          <Pressable onPress={() => router.back()} style={styles.linkBtn}><Text style={styles.linkBtnText}>← Back</Text></Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}><Text style={{ color: '#71717a' }}>←</Text></Pressable>
          <Text style={{ fontSize: 16, fontWeight: '600', color: ACCENT }}>Frequency Hunt</Text>
          <View style={styles.scoreBadge}><Text style={styles.scoreText}>{score}</Text></View>
        </View>

        <Text style={{ textAlign: 'center', fontSize: 12, color: '#52525b', marginBottom: 8 }}>Round {round}/{totalRounds}</Text>

        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          {phase === 'result' ? (
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 28, fontWeight: '800', color: ACCENT }}>{targetFreq} Hz</Text>
              <Text style={{ fontSize: 13, color: '#71717a', marginTop: 4 }}>Your guess: {Math.round(sliderToFreq(sliderPos))} Hz</Text>
            </View>
          ) : (
            <>
              <Text style={{ fontSize: 11, color: '#52525b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Find this frequency</Text>
              <Pressable onPress={() => playFrequency(targetFreq, 1.0)} style={styles.playBtn}>
                <Text style={{ fontSize: 16, color: '#71717a' }}>▶ Play Target Again</Text>
              </Pressable>
            </>
          )}
        </View>

        {/* Slider */}
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 10, color: '#3f3f46' }}>100 Hz</Text>
            <Text style={{ fontSize: 10, color: '#3f3f46' }}>2000 Hz</Text>
          </View>
          <Slider
            value={sliderPos}
            onValueChange={handleSliderChange}
            minimumValue={0}
            maximumValue={1}
            step={0.001}
            disabled={phase !== 'hunting'}
            minimumTrackTintColor={ACCENT}
            maximumTrackTintColor="rgba(255,255,255,0.1)"
            thumbTintColor={ACCENT}
          />
          <Text style={{ textAlign: 'center', fontSize: 28, fontWeight: '800', color: '#f4f4f5', marginTop: 12 }}>
            {Math.round(sliderToFreq(sliderPos))} Hz
          </Text>
        </View>

        {phase === 'hunting' && (
          <Pressable onPress={handleLock} style={[styles.btnPrimary, { backgroundColor: ACCENT }]}>
            <Text style={styles.btnPrimaryText}>Lock In Guess</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '700', color: '#f4f4f5', letterSpacing: '-0.025em' },
  subtitle: { fontSize: 14, color: '#71717a', marginTop: 8, marginBottom: 40 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 24, marginBottom: 32 },
  statCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', alignItems: 'center', flex: 1 },
  statValue: { fontSize: 24, fontWeight: '700', color: '#f4f4f5' },
  statLabel: { fontSize: 11, color: '#71717a', marginTop: 4 },
  btnPrimary: { borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 16, width: '100%' },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  linkBtn: { padding: 16, marginTop: 8 },
  linkBtnText: { color: '#71717a', textAlign: 'center', fontSize: 13 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  scoreBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' },
  scoreText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  playBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
});
