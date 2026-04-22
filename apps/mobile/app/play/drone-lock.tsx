import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { playFrequency, NOTE_FREQS_4 } from '@/lib/audio';

const ACCENT = '#10B981';
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

const INTERVALS = [
  { name: 'Unison',      semitones: 0  },
  { name: 'Minor 2nd',   semitones: 1  },
  { name: 'Major 2nd',   semitones: 2  },
  { name: 'Minor 3rd',   semitones: 3  },
  { name: 'Major 3rd',   semitones: 4  },
  { name: 'Perfect 4th', semitones: 5  },
  { name: 'Tritone',     semitones: 6  },
  { name: 'Perfect 5th', semitones: 7  },
  { name: 'Minor 6th',   semitones: 8  },
  { name: 'Major 6th',   semitones: 9  },
  { name: 'Minor 7th',   semitones: 10 },
  { name: 'Octave',      semitones: 12 },
] as const;

// Accuracy options map to the same point tiers as the web version:
// <10¢ → 200, <25¢ → 150, <50¢ → 100, else → 50
const ACCURACY_OPTIONS = [
  { label: 'Perfect',  description: '< 10¢ off',  points: 200, color: '#4ade80' },
  { label: 'Good',     description: '< 25¢ off',  points: 150, color: '#fbbf24' },
  { label: 'Close',    description: '< 50¢ off',  points: 100, color: '#f97316' },
  { label: 'Off track',description: '> 50¢ off',  points: 50,  color: '#f87171' },
] as const;

type Phase = 'idle' | 'listening' | 'scored' | 'done';

export default function DroneLockScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('idle');
  const [round, setRound] = useState(0);
  const totalRounds = 8;
  const [score, setScore] = useState(0);
  const [droneNote, setDroneNote] = useState(0);
  const [targetInterval, setTargetInterval] = useState<(typeof INTERVALS)[number]>(INTERVALS[0]);
  const [lastPoints, setLastPoints] = useState(0);
  const [results, setResults] = useState<{ interval: string; points: number }[]>([]);

  const NOTE_FREQS = NOTE_NAMES.map((n) => NOTE_FREQS_4[n] ?? 261.63);

  const startRound = useCallback(() => {
    const noteIdx = Math.floor(Math.random() * 7) + 3; // D4–B4
    const interval = INTERVALS[Math.floor(Math.random() * INTERVALS.length)];
    setDroneNote(noteIdx);
    setTargetInterval(interval);
    setPhase('listening');
    setRound(r => r + 1);

    const droneHz = NOTE_FREQS[noteIdx];
    const targetHz = droneHz * Math.pow(2, interval.semitones / 12);
    // Play drone first, then target note 300ms later
    playFrequency(droneHz, 3.0);
    setTimeout(() => playFrequency(targetHz, 1.0), 300);
  }, [NOTE_FREQS]);

  const handleStart = useCallback(() => {
    setRound(0);
    setScore(0);
    setResults([]);
    startRound();
  }, [startRound]);

  const handleAssess = useCallback((option: typeof ACCURACY_OPTIONS[number]) => {
    setLastPoints(option.points);
    setScore(s => s + option.points);
    setResults(r => [...r, { interval: targetInterval.name, points: option.points }]);
    setPhase('scored');

    setTimeout(() => {
      if (round >= totalRounds) {
        setPhase('done');
      } else {
        startRound();
      }
    }, 1500);
  }, [round, totalRounds, targetInterval, startRound]);

  if (phase === 'done') {
    const avgPoints = Math.round(results.reduce((s, r) => s + r.points, 0) / results.length);
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <View style={[styles.iconCircle, { borderColor: ACCENT, backgroundColor: ACCENT + '15' }]}>
            <Text style={{ fontSize: 36 }}>🎯</Text>
          </View>
          <Text style={styles.title}>Session Complete</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: ACCENT }]}>{score}</Text>
              <Text style={styles.statLabel}>Score</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{avgPoints}</Text>
              <Text style={styles.statLabel}>Avg pts/round</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{results.length}</Text>
              <Text style={styles.statLabel}>Rounds</Text>
            </View>
          </View>
          <Pressable onPress={handleStart} style={[styles.btnPrimary, { backgroundColor: ACCENT }]}>
            <Text style={styles.btnPrimaryText}>Play Again</Text>
          </Pressable>
          <Pressable onPress={() => router.back()} style={styles.linkBtn}>
            <Text style={styles.linkBtnText}>← Dashboard</Text>
          </Pressable>
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

          <View style={styles.howToBox}>
            <Text style={[styles.howToTitle, { color: ACCENT }]}>HOW TO PLAY</Text>
            <Text style={styles.howToLine}>1. A drone note plays continuously</Text>
            <Text style={styles.howToLine}>2. You hear the target interval once</Text>
            <Text style={styles.howToLine}>3. Sing the interval above the drone</Text>
            <Text style={styles.howToLine}>4. Self-assess your tuning accuracy</Text>
          </View>

          <Pressable onPress={handleStart} style={[styles.btnPrimary, { backgroundColor: ACCENT }]}>
            <Text style={styles.btnPrimaryText}>Start Session</Text>
          </Pressable>
          <Pressable onPress={() => router.back()} style={styles.linkBtn}>
            <Text style={styles.linkBtnText}>← Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ color: '#71717a' }}>←</Text>
        </Pressable>
        <Text style={{ fontSize: 16, fontWeight: '600', color: ACCENT }}>Drone Lock</Text>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>{score} pts</Text>
        </View>
      </View>

      {/* Progress */}
      <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
        <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
          <View style={{ height: '100%', backgroundColor: ACCENT, borderRadius: 2, width: `${(round / totalRounds) * 100}%` }} />
        </View>
        <Text style={{ textAlign: 'center', fontSize: 11, color: '#52525b', marginTop: 6 }}>
          Round {round}/{totalRounds}
        </Text>
      </View>

      <View style={{ paddingHorizontal: 20 }}>
        {/* Drone indicator */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginBottom: 20 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: ACCENT }} />
          <Text style={{ fontSize: 13, color: '#71717a' }}>
            Drone: <Text style={{ color: '#f4f4f5', fontWeight: '600' }}>{NOTE_NAMES[droneNote]}4</Text>
          </Text>
        </View>

        {/* Target interval */}
        <Text style={{ textAlign: 'center', fontSize: 11, color: '#52525b', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>
          Sing this interval
        </Text>
        <Text style={{ textAlign: 'center', fontSize: 32, fontWeight: '800', color: ACCENT, marginBottom: 20 }}>
          {targetInterval.name}
        </Text>

        {/* Hear target button */}
        <Pressable
          onPress={() => {
            const droneHz = NOTE_FREQS[droneNote];
            playFrequency(droneHz, 2.0);
            setTimeout(() => playFrequency(droneHz * Math.pow(2, targetInterval.semitones / 12), 1.0), 200);
          }}
          style={styles.playBtn}
        >
          <Text style={{ fontSize: 13, color: '#71717a' }}>▶ Hear Drone + Target</Text>
        </Pressable>

        {phase === 'scored' ? (
          /* Scored feedback */
          <View style={{ alignItems: 'center', marginTop: 32 }}>
            <Text style={{ color: '#f4f4f5', fontSize: 18, fontWeight: '700' }}>
              +{lastPoints} pts
            </Text>
            <Text style={{ color: '#52525b', fontSize: 13, marginTop: 4 }}>
              {lastPoints >= 200 ? '🎯 Perfect!' : lastPoints >= 150 ? '👍 Good!' : lastPoints >= 100 ? '👌 Close' : '🔄 Keep practicing'}
            </Text>
          </View>
        ) : (
          /* Self-assessment options */
          <View style={{ marginTop: 28, gap: 10 }}>
            <Text style={{ color: '#52525b', fontSize: 13, textAlign: 'center', marginBottom: 4 }}>
              How accurate were you?
            </Text>
            {ACCURACY_OPTIONS.map(option => (
              <Pressable
                key={option.label}
                onPress={() => handleAssess(option)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 14,
                  borderRadius: 14,
                  borderWidth: 1,
                  backgroundColor: `${option.color}12`,
                  borderColor: `${option.color}40`,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ color: '#f4f4f5', fontWeight: '600', fontSize: 15 }}>{option.label}</Text>
                <Text style={{ color: option.color, fontSize: 13 }}>{option.description}</Text>
                <Text style={{ color: '#71717a', fontSize: 13, minWidth: 50, textAlign: 'right' }}>
                  +{option.points} pts
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '700', color: '#f4f4f5', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#71717a', marginTop: 8, marginBottom: 24, textAlign: 'center' },
  howToBox: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 32, alignSelf: 'stretch' },
  howToTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10 },
  howToLine: { color: '#71717a', fontSize: 13, marginBottom: 6 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 24, marginBottom: 32 },
  statCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', alignItems: 'center', flex: 1 },
  statValue: { fontSize: 22, fontWeight: '700', color: '#f4f4f5' },
  statLabel: { fontSize: 11, color: '#71717a', marginTop: 4, textAlign: 'center' },
  btnPrimary: { borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8, width: '100%' },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  linkBtn: { padding: 16, marginTop: 4 },
  linkBtnText: { color: '#71717a', textAlign: 'center', fontSize: 13 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  scoreBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' },
  scoreText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  playBtn: { alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
});
