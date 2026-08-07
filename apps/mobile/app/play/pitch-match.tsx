import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { GAME_MODE_META } from '@pitch-therapy/core';
import { GameHeader } from '@/components/GameHeader';
import { GameResultsScreen, GameResultStats, GameResultRow } from '@/components/GameResultsScreen';
import { playFrequency, NOTE_FREQS_4 } from '@/lib/audio';
import { triggerCorrectHaptic, triggerIncorrectHaptic } from '@/lib/haptics';
import { useSessionResults } from '@/lib/sessionResults';
import { colors, typography } from '@/lib/theme';

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

interface RoundRecord {
  round: number;
  correct: boolean;
  points: number;
  target: string;
}

export default function PitchMatchScreen() {
  const router = useRouter();
  const { recordResult } = useSessionResults();
  const [phase, setPhase] = useState<Phase>('idle');
  const round = useRef(0);
  const totalRounds = 5;
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [targetNote, setTargetNote] = useState(0);
  const resultsRef = useRef<RoundRecord[]>([]);
  const sessionStartRef = useRef(0);
  const recordedRef = useRef(false);

  // Persist session result once when the game completes.
  useEffect(() => {
    if (phase !== 'done' || recordedRef.current) return;
    recordedRef.current = true;
    const correct = resultsRef.current.filter((r) => r.correct).length;
    recordResult({
      mode: 'pitch-match',
      score,
      accuracy: totalRounds > 0 ? correct / totalRounds : 0,
      rounds: totalRounds,
      timeMs: Date.now() - sessionStartRef.current,
    });
  }, [phase, score, totalRounds, recordResult]);

  const freq = (i: number) => NOTE_FREQS_4[NOTE_NAMES[i]] ?? 440;

  const startRound = (nextRound: number) => {
    const noteIdx = Math.floor(Math.random() * 12);
    setTargetNote(noteIdx);
    setPhase('playing');
    round.current = nextRound;
    playFrequency(freq(noteIdx));
  };

  const handleStart = () => {
    setScore(0);
    setStreak(0);
    resultsRef.current = [];
    sessionStartRef.current = Date.now();
    recordedRef.current = false;
    startRound(1);
  };

  const handleAssess = (option: (typeof ACCURACY_OPTIONS)[number]) => {
    const targetName = NOTE_NAMES[targetNote];
    const nextScore = score + option.points;
    const nextStreak = option.correct ? streak + 1 : 0;
    if (option.correct) void triggerCorrectHaptic();
    else void triggerIncorrectHaptic();
    setScore(nextScore);
    setStreak(nextStreak);
    resultsRef.current = [
      ...resultsRef.current,
      { round: round.current, correct: option.correct, points: option.points, target: targetName },
    ];
    if (round.current >= totalRounds) {
      setPhase('done');
    } else {
      setTimeout(() => startRound(round.current + 1), 800);
    }
  };

  // ── Done ────────────────────────────────────────────────────────────────────
  if (phase === 'done') {
    const correct = resultsRef.current.filter((r) => r.correct).length;
    return (
      <GameResultsScreen
        title="Round Complete!"
        subtitle={MODE.label}
        score={score}
        accent={ACCENT}
        onPlayAgain={handleStart}
        onExit={() => router.back()}
      >
        <GameResultStats
          items={[
            { label: 'Correct', value: `${correct}/${totalRounds}` },
            { label: 'Accuracy', value: `${Math.round((correct / totalRounds) * 100)}%` },
          ]}
        />
        {resultsRef.current.map((r, i) => (
          <GameResultRow
            key={`${i}-${r.target}`}
            label={`Round ${i + 1}`}
            detail={`Target: ${r.target}`}
            outcome={r.points > 0 ? `+${r.points} pts` : 'Missed'}
            success={r.correct}
          />
        ))}
      </GameResultsScreen>
    );
  }

  // ── Idle ────────────────────────────────────────────────────────────────────
  if (phase === 'idle') {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <View style={[styles.iconCircle, { borderColor: ACCENT, backgroundColor: ACCENT + '15' }]}>
            <Text style={{ fontSize: 32 }}>🎤</Text>
          </View>
          <Text style={styles.title}>Ready to train?</Text>
          <Text style={styles.subtitle}>Sing or hum to match the target pitch</Text>

          <View style={styles.howToBox}>
            <Text style={[styles.howToTitle, { color: ACCENT }]}>HOW TO PLAY</Text>
            <Text style={styles.howToLine}>1. A target note appears — tap 🔊 to hear it</Text>
            <Text style={styles.howToLine}>2. Sing or play that exact note</Text>
            <Text style={styles.howToLine}>3. Self-assess how accurate you were</Text>
            <Text style={styles.howToLine}>4. Score 100 pts for perfect, 40 for good</Text>
          </View>

          <Pressable
            onPress={handleStart}
            style={({ pressed }) => [
              styles.btnPrimary,
              { backgroundColor: ACCENT, opacity: pressed ? 0.85 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Start training"
          >
            <Text style={styles.btnPrimaryText}>Start Training</Text>
          </Pressable>
          <Pressable
            onPress={() => router.back()}
            style={styles.linkBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.linkBtnText}>← Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Playing ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <GameHeader
        score={score}
        round={round.current}
        totalRounds={totalRounds}
        streak={streak}
        accent={ACCENT}
      />

      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 32 }}>
        {/* Target note */}
        <View style={{ alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ color: colors.textTertiary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Match this note
          </Text>
          <Text style={{ fontSize: 56, fontWeight: '800', color: ACCENT, letterSpacing: 0 }}>
            {NOTE_NAMES[targetNote]}4
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
            {freq(targetNote).toFixed(1)} Hz
          </Text>
        </View>

        {/* Hear button */}
        <Pressable
          onPress={() => playFrequency(freq(targetNote))}
          style={({ pressed }) => [styles.playBtn, { opacity: pressed ? 0.7 : 1 }]}
          accessibilityRole="button"
          accessibilityLabel="Hear target note"
        >
          <Text style={{ fontSize: 14, color: colors.textSecondary }}>🔊 Hear Target</Text>
        </Pressable>

        {/* Instructions */}
        <Text style={{ textAlign: 'center', color: colors.textSecondary, fontSize: 13, marginTop: 40, marginBottom: 24 }}>
          Sing or play the note, then mark how accurate you were
        </Text>

        {/* Self-assessment buttons */}
        <View style={{ gap: 12 }}>
          {ACCURACY_OPTIONS.map((option) => (
            <Pressable
              key={option.label}
              onPress={() => handleAssess(option)}
              accessibilityRole="button"
              accessibilityLabel={`${option.label} — ${option.points} points`}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 18,
                borderRadius: 16,
                borderWidth: 1,
                backgroundColor: option.correct
                  ? (option.cents === 0 ? colors.green + '14' : colors.warning + '14')
                  : colors.danger + '14',
                borderColor: option.correct
                  ? (option.cents === 0 ? colors.green + '4D' : colors.warning + '4D')
                  : colors.danger + '4D',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ fontSize: 22 }}>{option.emoji}</Text>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16, flex: 1, marginLeft: 14 }}>
                {option.label}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                {option.points > 0 ? `+${option.points} pts` : '0 pts'}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={() => setPhase('idle')}
          style={styles.linkBtn}
          accessibilityRole="button"
          accessibilityLabel="Stop current game"
        >
          <Text style={[styles.linkBtnText, { marginTop: 8 }]}>Stop</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, marginBottom: 20 },
  title: { ...typography.title1, color: colors.text },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 8, marginBottom: 24, textAlign: 'center' },
  howToBox: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 32,
    alignSelf: 'stretch',
  },
  howToTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10 },
  howToLine: { color: colors.textSecondary, fontSize: 13, marginBottom: 6 },
  btnPrimary: { borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8, width: '100%' },
  btnPrimaryText: { color: colors.background, fontWeight: '700', fontSize: 16 },
  linkBtn: { padding: 16, marginTop: 4 },
  linkBtnText: { color: colors.textSecondary, textAlign: 'center', fontSize: 13 },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: 'center',
  },
});
