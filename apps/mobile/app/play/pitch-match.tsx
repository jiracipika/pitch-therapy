import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { GAME_MODE_META } from '@pitch-therapy/core';
import { GameHeader } from '@/components/GameHeader';
import { playFrequency, NOTE_FREQS_4 } from '@/lib/audio';
import { Audio } from 'expo-av';

const MODE = GAME_MODE_META['pitch-match'];
const ACCENT = MODE.accentHex;
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

type Phase = 'idle' | 'playing' | 'done';

export default function PitchMatchScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('idle');
  const [round, setRound] = useState(0);
  const totalRounds = 5;
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [targetNote, setTargetNote] = useState(0);
  const [cents, setCents] = useState(0);
  const resultsRef = useRef<{ round: number; correct: boolean; points: number; target: string }[]>([]);
  const streamRef = useRef<Audio.Recording | null>(null);
  const roundStart = useRef(0);

  const freq = (i: number) => NOTE_FREQS_4[NOTE_NAMES[i]] ?? 440;

  const startRound = () => {
    const noteIdx = Math.floor(Math.random() * 12);
    setTargetNote(noteIdx);
    setPhase('playing');
    setRound((r) => r + 1);
    setCents(0);
    roundStart.current = Date.now();
    playFrequency(freq(noteIdx));
  };

  const handleStart = async () => {
    setPhase('idle'); setRound(0); setScore(0); setStreak(0);
    resultsRef.current = [];
    startRound();
  };

  const submit = () => {
    const correct = Math.abs(cents) < 50;
    const points = correct ? Math.max(100 - Math.abs(cents) * 2, 10) : 0;
    const targetName = NOTE_NAMES[targetNote];
    setScore((s) => s + points);
    if (correct) setStreak((s) => s + 1); else setStreak(0);
    resultsRef.current = [...resultsRef.current, { round, correct, points, target: targetName }];
    if (round >= totalRounds) setPhase('done');
    else setTimeout(startRound, 1500);
  };

  if (phase === 'done') {
    const correct = resultsRef.current.filter(r => r.correct).length;
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <View style={[styles.iconCircle, { borderColor: ACCENT, backgroundColor: ACCENT + '15' }]}>
            <Text style={{ fontSize: 36 }}>🏆</Text>
          </View>
          <Text style={styles.title}>Game Complete</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}><Text style={[styles.statValue, { color: ACCENT }]}>{score}</Text><Text style={styles.statLabel}>Score</Text></View>
            <View style={styles.statCard}><Text style={styles.statValue}>{correct}/{totalRounds}</Text><Text style={styles.statLabel}>Correct</Text></View>
            <View style={styles.statCard}><Text style={styles.statValue}>{streak}</Text><Text style={styles.statLabel}>Streak</Text></View>
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
            <Text style={{ fontSize: 32 }}>🎤</Text>
          </View>
          <Text style={[styles.title, { fontSize: 24 }]}>Ready to train?</Text>
          <Text style={styles.subtitle}>Sing or hum to match the target pitch</Text>
          <Pressable onPress={handleStart} style={[styles.btnPrimary, { backgroundColor: ACCENT }]}>
            <Text style={styles.btnPrimaryText}>Start Training</Text>
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
      <GameHeader score={score} round={round} totalRounds={totalRounds} streak={streak} accent={ACCENT} />

      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 32 }}>
        <View style={{ alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ color: '#71717a', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Match this note</Text>
          <Text style={{ fontSize: 56, fontWeight: '800', color: ACCENT, letterSpacing: '-0.03em' }}>
            {NOTE_NAMES[targetNote]}4
          </Text>
        </View>

        <Pressable onPress={() => playFrequency(freq(targetNote))} style={styles.playBtn}>
          <Text style={{ fontSize: 20, color: '#a1a1aa' }}>▶</Text>
          <Text style={{ fontSize: 12, color: '#71717a', marginLeft: 6 }}>Play Target</Text>
        </Pressable>

        {/* Cents meter */}
        <View style={{ marginTop: 40 }}>
          <View style={styles.meterTrack}>
            <View style={styles.meterCenter} />
            <View style={[styles.meterNeedle, { backgroundColor: ACCENT, left: `${50 + Math.max(-46, Math.min(46, cents))}%` }]} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Text style={{ fontSize: 10, color: '#3f3f46' }}>-100¢</Text>
            <Text style={{ fontSize: 10, color: '#3f3f46' }}>0¢</Text>
            <Text style={{ fontSize: 10, color: '#3f3f46' }}>+100¢</Text>
          </View>
          <Text style={{ textAlign: 'center', fontSize: 24, fontWeight: '700', marginTop: 12, color: Math.abs(cents) < 25 ? '#4ade80' : Math.abs(cents) < 50 ? '#fbbf24' : '#f87171' }}>
            {cents > 0 ? '+' : ''}{cents}¢
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'center', marginTop: 'auto', marginBottom: 40 }}>
          <Pressable onPress={submit} style={[styles.btnPrimary, { backgroundColor: ACCENT, flex: 1 }]}>
            <Text style={styles.btnPrimaryText}>Submit</Text>
          </Pressable>
          <Pressable onPress={() => { setPhase('idle'); }} style={styles.btnSecondary}>
            <Text style={styles.btnSecondaryText}>Stop</Text>
          </Pressable>
        </View>
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
  btnSecondary: { borderRadius: 14, padding: 16, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  btnSecondaryText: { color: '#a1a1aa', fontWeight: '600', fontSize: 14 },
  linkBtn: { padding: 16, marginTop: 8 },
  linkBtnText: { color: '#71717a', textAlign: 'center', fontSize: 13 },
  playBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 20, paddingVertical: 10, paddingHorizontal: 16, alignSelf: 'center' },
  meterTrack: { height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.07)', position: 'relative', overflow: 'hidden' },
  meterCenter: { position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(74,222,128,0.5)' },
  meterNeedle: { position: 'absolute', top: 2, bottom: 2, width: 8, borderRadius: 4 },
});
