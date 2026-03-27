import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { playFrequency, NOTE_FREQS_4 } from '@/lib/audio';

const ACCENT = '#10B981';
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

const INTERVALS = [
  { name: 'Unison', semitones: 0 },
  { name: 'Minor 2nd', semitones: 1 },
  { name: 'Major 2nd', semitones: 2 },
  { name: 'Minor 3rd', semitones: 3 },
  { name: 'Major 3rd', semitones: 4 },
  { name: 'Perfect 4th', semitones: 5 },
  { name: 'Tritone', semitones: 6 },
  { name: 'Perfect 5th', semitones: 7 },
  { name: 'Minor 6th', semitones: 8 },
  { name: 'Major 6th', semitones: 9 },
  { name: 'Minor 7th', semitones: 10 },
  { name: 'Octave', semitones: 12 },
];

type Phase = 'idle' | 'listening' | 'scored' | 'done';

export default function DroneLockScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('idle');
  const [round, setRound] = useState(0);
  const [totalRounds] = useState(8);
  const [score, setScore] = useState(0);
  const [droneNote, setDroneNote] = useState(0);
  const [targetInterval, setTargetInterval] = useState(INTERVALS[0]);
  const [cents, setCents] = useState(0);
  const [results, setResults] = useState<{ cents: number; points: number }[]>([]);

  const NOTE_FREQS = NOTE_NAMES.map((n) => NOTE_FREQS_4[n] ?? 261.63);

  const startRound = () => {
    const noteIdx = Math.floor(Math.random() * 7) + 3;
    const interval = INTERVALS[Math.floor(Math.random() * INTERVALS.length)];
    setDroneNote(noteIdx);
    setTargetInterval(interval);
    setCents(0);
    setPhase('listening');
    setRound((r) => r + 1);
    const droneHz = NOTE_FREQS[noteIdx];
    playFrequency(droneHz, 3.0);
    const targetHz = droneHz * Math.pow(2, interval.semitones / 12);
    setTimeout(() => playFrequency(targetHz, 1.0), 300);
  };

  const handleStart = () => {
    setRound(0); setScore(0); setResults([]);
    startRound();
  };

  const handleLock = () => {
    setPhase('scored');
    const absCents = Math.abs(cents);
    const points = absCents < 10 ? 200 : absCents < 25 ? 150 : absCents < 50 ? 100 : absCents < 100 ? 50 : 20;
    setScore((s) => s + points);
    setResults((r) => [...r, { cents, points }]);
    setTimeout(() => {
      if (round >= totalRounds) setPhase('done');
      else startRound();
    }, 2000);
  };

  // Simulate cents wobble for mobile (no mic on mobile easily)
  useEffect(() => {
    if (phase !== 'listening') return;
    const interval = setInterval(() => {
      setCents(Math.round((Math.random() - 0.5) * 60));
    }, 300);
    return () => clearInterval(interval);
  }, [phase]);

  if (phase === 'done') {
    const avgCents = Math.round(results.reduce((s, r) => s + Math.abs(r.cents), 0) / results.length);
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <View style={[styles.iconCircle, { borderColor: ACCENT, backgroundColor: ACCENT + '15' }]}>
            <Text style={{ fontSize: 36 }}>🎯</Text>
          </View>
          <Text style={styles.title}>Session Complete</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}><Text style={[styles.statValue, { color: ACCENT }]}>{score}</Text><Text style={styles.statLabel}>Score</Text></View>
            <View style={styles.statCard}><Text style={styles.statValue}>{avgCents}¢</Text><Text style={styles.statLabel}>Avg Error</Text></View>
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
            <Text style={{ fontSize: 32 }}>🎯</Text>
          </View>
          <Text style={[styles.title, { fontSize: 24 }]}>Drone Lock</Text>
          <Text style={styles.subtitle}>Sing intervals relative to a drone</Text>
          <Pressable onPress={handleStart} style={[styles.btnPrimary, { backgroundColor: ACCENT }]}><Text style={styles.btnPrimaryText}>Start Session</Text></Pressable>
          <Pressable onPress={() => router.back()} style={styles.linkBtn}><Text style={styles.linkBtnText}>← Back</Text></Pressable>
        </View>
      </View>
    );
  }

  const centsColor = Math.abs(cents) < 10 ? '#4ADE80' : Math.abs(cents) < 25 ? '#FBBF24' : Math.abs(cents) < 50 ? '#f97316' : '#f87171';
  const needlePos = Math.max(-48, Math.min(48, cents * 0.48));

  return (
    <View style={styles.container}>
      <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}><Text style={{ color: '#71717a' }}>←</Text></Pressable>
          <Text style={{ fontSize: 16, fontWeight: '600', color: ACCENT }}>Drone Lock</Text>
          <View style={styles.scoreBadge}><Text style={styles.scoreText}>{score}</Text></View>
        </View>

        <Text style={{ textAlign: 'center', fontSize: 12, color: '#52525b', marginBottom: 8 }}>Round {round}/{totalRounds}</Text>

        {/* Drone indicator */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, alignItems: 'center', marginBottom: 16 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: ACCENT }} />
          <Text style={{ fontSize: 12, color: '#71717a' }}>Drone: <Text style={{ color: '#f4f4f5', fontWeight: '600' }}>{NOTE_NAMES[droneNote]}4</Text></Text>
        </View>

        {/* Target interval */}
        <Text style={{ textAlign: 'center', fontSize: 11, color: '#52525b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Sing this interval</Text>
        <Text style={{ textAlign: 'center', fontSize: 30, fontWeight: '800', color: ACCENT, marginBottom: 16 }}>{targetInterval.name}</Text>

        {/* Hear target */}
        <Pressable
          onPress={() => playFrequency(NOTE_FREQS[droneNote] * Math.pow(2, targetInterval.semitones / 12), 1.0)}
          style={styles.playBtn}
        >
          <Text style={{ fontSize: 13, color: '#71717a' }}>▶ Hear Target</Text>
        </Pressable>

        {/* Tuning meter */}
        <View style={{ marginTop: 32 }}>
          <View style={styles.meterTrack}>
            <View style={{ position: 'absolute', left: '45%', right: '45%', top: 0, bottom: 0, borderRadius: 8, backgroundColor: 'rgba(74,222,128,0.15)' }} />
            <View style={styles.meterCenter} />
            <View style={[styles.meterNeedle, { backgroundColor: centsColor, left: `${50 + needlePos}%` }]} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Text style={{ fontSize: 10, color: '#3f3f46' }}>-100¢</Text>
            <Text style={{ fontSize: 10, color: '#3f3f46' }}>0¢</Text>
            <Text style={{ fontSize: 10, color: '#3f3f46' }}>+100¢</Text>
          </View>
          <Text style={{ textAlign: 'center', fontSize: 32, fontWeight: '800', marginTop: 12, color: centsColor }}>
            {cents > 0 ? '+' : ''}{cents}¢
          </Text>

          {phase === 'scored' && (
            <Text style={{ textAlign: 'center', fontSize: 14, fontWeight: '600', marginTop: 8, color: centsColor }}>
              {Math.abs(cents) < 10 ? '🎯 Perfect Lock!' : Math.abs(cents) < 25 ? '👍 Great!' : Math.abs(cents) < 50 ? '👌 Close' : '🔄 Try again'}
            </Text>
          )}
        </View>

        {phase === 'listening' && (
          <Pressable onPress={handleLock} style={[styles.btnPrimary, { backgroundColor: ACCENT, marginTop: 24 }]}>
            <Text style={styles.btnPrimaryText}>Lock In</Text>
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
  btnPrimary: { borderRadius: 14, padding: 16, alignItems: 'center', width: '100%' },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  linkBtn: { padding: 16, marginTop: 8 },
  linkBtnText: { color: '#71717a', textAlign: 'center', fontSize: 13 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  scoreBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' },
  scoreText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  playBtn: { alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  meterTrack: { height: 16, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.07)', position: 'relative', overflow: 'hidden' },
  meterCenter: { position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(74,222,128,0.5)' },
  meterNeedle: { position: 'absolute', top: 3, bottom: 3, width: 10, borderRadius: 5 },
});
