import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { GAME_MODE_META } from '@pitch-therapy/core';
import { GameHeader } from '@/components/GameHeader';
import { playFrequency, NOTE_FREQS_4 } from '@/lib/audio';

const MODE = GAME_MODE_META['pitch-match'];
const ACCENT = MODE.accentHex;
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

type Phase = 'idle' | 'playing' | 'done';

// Self-assessment accuracy levels matching the web scoring formula:
// Perfect ~0¢ → 100pts, Good ~30¢ → 40pts, Missed → 0pts
const ACCURACY_OPTIONS = [
  { label: 'Perfect', emoji: '🎯', cents: 0,  points: 100, correct: true },
  { label: 'Good',    emoji: '👍', cents: 30, points: 40,  correct: true },
  { label: 'Missed',  emoji: '✗',  cents: 80, points: 0,   correct: false },
] as const;

export default function PitchMatchScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('idle');
  const [round, setRound] = useState(0);
  const totalRounds = 5;
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [targetNote, setTargetNote] = useState(0);
  const resultsRef = useRef<{ round: number; correct: boolean; points: number; target: string }[]>([]);

  const freq = (i: number) => NOTE_FREQS_4[NOTE_NAMES[i]] ?? 440;

  const startRound = (nextRound: number) => {
    const noteIdx = Math.floor(Math.random() * 12);
    setTargetNote(noteIdx);
    setPhase('playing');
    setRound(nextRound);
    playFrequency(freq(noteIdx));
  };

  const handleStart = () => {
    setScore(0);
    setStreak(0);
    resultsRef.current = [];
    startRound(1);
  };

  const handleAssess = (option: typeof ACCURACY_OPTIONS[number]) => {
    const targetName = NOTE_NAMES[targetNote];
    const nextScore = score + option.points;
    const nextStreak = option.correct ? streak + 1 : 0;
    setScore(nextScore);
    setStreak(nextStreak);
    resultsRef.current = [
      ...resultsRef.current,
      { round, correct: option.correct, points: option.points, target: targetName },
    ];
    if (round >= totalRounds) {
      setPhase('done');
    } else {
      setTimeout(() => startRound(round + 1), 800);
    }
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
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: ACCENT }]}>{score}</Text>
              <Text style={styles.statLabel}>Score</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{correct}/{totalRounds}</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{streak}</Text>
              <Text style={styles.statLabel}>Streak</Text>
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
            <Text style={{ fontSize: 32 }}>🎤</Text>
          </View>
          <Text style={[styles.title, { fontSize: 24 }]}>Ready to train?</Text>
          <Text style={styles.subtitle}>Sing or hum to match the target pitch</Text>

          <View style={styles.howToBox}>
            <Text style={[styles.howToTitle, { color: ACCENT }]}>HOW TO PLAY</Text>
            <Text style={styles.howToLine}>1. A target note appears — tap 🔊 to hear it</Text>
            <Text style={styles.howToLine}>2. Sing or play that exact note</Text>
            <Text style={styles.howToLine}>3. Self-assess how accurate you were</Text>
            <Text style={styles.howToLine}>4. Score 100 pts for perfect, 40 for good</Text>
          </View>

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
        {/* Target note */}
        <View style={{ alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ color: '#71717a', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Match this note
          </Text>
          <Text style={{ fontSize: 56, fontWeight: '800', color: ACCENT, letterSpacing: -2 }}>
            {NOTE_NAMES[targetNote]}4
          </Text>
          <Text style={{ color: '#52525b', fontSize: 13, marginTop: 4 }}>
            {(freq(targetNote)).toFixed(1)} Hz
          </Text>
        </View>

        {/* Hear button */}
        <Pressable
          onPress={() => playFrequency(freq(targetNote))}
          style={styles.playBtn}
        >
          <Text style={{ fontSize: 14, color: '#a1a1aa' }}>🔊 Hear Target</Text>
        </Pressable>

        {/* Instructions */}
        <Text style={{ textAlign: 'center', color: '#52525b', fontSize: 13, marginTop: 40, marginBottom: 24 }}>
          Sing or play the note, then mark how accurate you were
        </Text>

        {/* Self-assessment buttons */}
        <View style={{ gap: 12 }}>
          {ACCURACY_OPTIONS.map(option => (
            <Pressable
              key={option.label}
              onPress={() => handleAssess(option)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 18,
                borderRadius: 16,
                borderWidth: 1,
                backgroundColor: option.correct
                  ? (option.cents === 0 ? 'rgba(74,222,128,0.08)' : 'rgba(251,191,36,0.08)')
                  : 'rgba(248,113,113,0.08)',
                borderColor: option.correct
                  ? (option.cents === 0 ? 'rgba(74,222,128,0.3)' : 'rgba(251,191,36,0.3)')
                  : 'rgba(248,113,113,0.3)',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ fontSize: 22 }}>{option.emoji}</Text>
              <Text style={{ color: '#f4f4f5', fontWeight: '700', fontSize: 16, flex: 1, marginLeft: 14 }}>
                {option.label}
              </Text>
              <Text style={{ color: '#52525b', fontSize: 13 }}>
                {option.points > 0 ? `+${option.points} pts` : '0 pts'}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable onPress={() => setPhase('idle')} style={styles.linkBtn}>
          <Text style={[styles.linkBtnText, { marginTop: 8 }]}>Stop</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '700', color: '#f4f4f5', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#71717a', marginTop: 8, marginBottom: 24, textAlign: 'center' },
  howToBox: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 32, alignSelf: 'stretch' },
  howToTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10 },
  howToLine: { color: '#71717a', fontSize: 13, marginBottom: 6 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 24, marginBottom: 32 },
  statCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', alignItems: 'center', flex: 1 },
  statValue: { fontSize: 24, fontWeight: '700', color: '#f4f4f5' },
  statLabel: { fontSize: 11, color: '#71717a', marginTop: 4 },
  btnPrimary: { borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8, width: '100%' },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  linkBtn: { padding: 16, marginTop: 4 },
  linkBtnText: { color: '#71717a', textAlign: 'center', fontSize: 13 },
  playBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 20, paddingVertical: 10, paddingHorizontal: 20, alignSelf: 'center' },
});
