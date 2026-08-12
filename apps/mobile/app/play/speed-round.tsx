import { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GAME_MODE_META } from '@pitch-therapy/core';
import { GameHeader } from '@/components/GameHeader';
import { GameResultsScreen, GameResultStats } from '@/components/GameResultsScreen';
import { AnimatedProgressBar } from '@/lib/motion';
import { triggerCorrectHaptic, triggerIncorrectHaptic, triggerWarningHaptic } from '@/lib/haptics';
import { useSessionResults } from '@/lib/sessionResults';
import { colors, typography } from '@/lib/theme';

const MODE = GAME_MODE_META['speed-round'];
const ACCENT = MODE.accentHex;
const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

type Phase = 'setup' | 'playing' | 'done';

interface RoundRecord {
  note: string;
  answer: string;
  correct: boolean;
}

export default function SpeedRoundScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { recordResult } = useSessionResults();
  const [phase, setPhase] = useState<Phase>('setup');
  const [duration, setDuration] = useState(30);
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [currentNote, setCurrentNote] = useState('');
  const [feedback, setFeedback] = useState<null | 'correct' | 'wrong'>(null);
  const [answerLocked, setAnswerLocked] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resultsRef = useRef<RoundRecord[]>([]);
  const sessionStartRef = useRef(0);
  const recordedRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  // Persist session result once when the game completes.
  useEffect(() => {
    if (phase !== 'done' || recordedRef.current) return;
    recordedRef.current = true;
    recordResult({
      mode: 'speed-round',
      score,
      accuracy: total > 0 ? correct / total : 0,
      rounds: total,
      timeMs: Date.now() - sessionStartRef.current,
    });
  }, [phase, score, correct, total, recordResult]);

  // Warning haptic when entering the final 5 seconds.
  const lastWarningRef = useRef(false);
  useEffect(() => {
    if (phase === 'playing' && timeLeft <= 5 && timeLeft > 0 && !lastWarningRef.current) {
      lastWarningRef.current = true;
      void triggerWarningHaptic();
    }
    if (timeLeft > 5) lastWarningRef.current = false;
  }, [timeLeft, phase]);

  const handleTimeUp = useCallback(() => {
    setPhase('done');
  }, []);

  const startGame = useCallback(() => {
    clearTimer();
    setScore(0);
    setStreak(0);
    setCorrect(0);
    setTotal(0);
    setFeedback(null);
    setAnswerLocked(false);
    resultsRef.current = [];
    sessionStartRef.current = Date.now();
    recordedRef.current = false;
    lastWarningRef.current = false;
    setCurrentNote(pickRandom(ALL_NOTES));
    setTimeLeft(duration);
    setPhase('playing');
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearTimer();
          // Defer setPhase to avoid state-in-callback issues
          setTimeout(handleTimeUp, 0);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, [clearTimer, duration, handleTimeUp]);

  const nextNote = useCallback(() => {
    let next = pickRandom(ALL_NOTES);
    // Avoid repeating the same note back-to-back for variety
    if (ALL_NOTES.length > 1) {
      let attempts = 0;
      while (next === currentNote && attempts < 5) {
        next = pickRandom(ALL_NOTES);
        attempts++;
      }
    }
    setCurrentNote(next);
    setFeedback(null);
    setAnswerLocked(false);
  }, [currentNote]);

  const handleTap = useCallback(
    (note: string) => {
      if (answerLocked || phase !== 'playing') return;
      setAnswerLocked(true);

      const isCorrect = note === currentNote;
      const points = isCorrect ? Math.max(10, 100 - streak * 2) : 0;

      setTotal((t) => t + 1);
      setFeedback(isCorrect ? 'correct' : 'wrong');

      if (isCorrect) {
        void triggerCorrectHaptic();
        setScore((s) => s + points);
        setStreak((s) => s + 1);
        setCorrect((c) => c + 1);
      } else {
        void triggerIncorrectHaptic();
        setStreak(0);
      }

      resultsRef.current = [
        ...resultsRef.current,
        { note: currentNote, answer: note, correct: isCorrect },
      ];

      setTimeout(() => nextNote(), 350);
    },
    [answerLocked, currentNote, phase, nextNote, streak],
  );

  // ── Done ──────────────────────────────────────────────────────────────────
  if (phase === 'done') {
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const bestStreak = resultsRef.current.reduce((max, _r, i) => {
      // Re-derive best streak from results
      let s = 0;
      let best = 0;
      for (let j = 0; j <= i; j++) {
        if (resultsRef.current[j]?.correct) {
          s++;
          best = Math.max(best, s);
        } else {
          s = 0;
        }
      }
      return Math.max(max, best);
    }, 0);

    return (
      <GameResultsScreen
        title="Sprint Complete!"
        subtitle={MODE.label}
        score={score}
        accent={ACCENT}
        onPlayAgain={() => setPhase('setup')}
        onExit={() => router.back()}
      >
        <GameResultStats
          items={[
            { label: 'Correct', value: `${correct}/${total}` },
            { label: 'Accuracy', value: `${accuracy}%` },
            { label: 'Best Streak', value: `${bestStreak}` },
          ]}
        />
      </GameResultsScreen>
    );
  }

  // ── Setup ──────────────────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <View style={styles.container}>
        <View
          style={[
            styles.center,
            { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 },
          ]}
        >
          <View style={[styles.iconCircle, { borderColor: ACCENT, backgroundColor: ACCENT + '15' }]}>
            <Text style={{ fontSize: 32 }}>⚡</Text>
          </View>
          <Text style={styles.title}>Speed Round</Text>
          <Text style={styles.subtitle}>Identify notes as fast as you can</Text>

          <Text style={[styles.sectionLabel, { color: ACCENT }]}>CHOOSE DURATION</Text>
          <View style={styles.durationRow}>
            {[30, 60].map((d) => (
              <Pressable
                key={d}
                onPress={() => setDuration(d)}
                accessibilityRole="button"
                accessibilityLabel={`${d} second sprint`}
                accessibilityState={{ selected: duration === d }}
                style={({ pressed }) => [
                  styles.durationBtn,
                  {
                    backgroundColor: duration === d ? ACCENT : colors.surfaceElevated,
                    borderColor: duration === d ? ACCENT : colors.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text
                  style={{
                    color: duration === d ? colors.background : colors.textSecondary,
                    fontWeight: '700',
                    fontSize: 16,
                  }}
                >
                  {d}s
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={startGame}
            style={({ pressed }) => [
              styles.btnPrimary,
              { backgroundColor: ACCENT, opacity: pressed ? 0.85 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Start sprint"
          >
            <Text style={styles.btnPrimaryText}>Start Sprint</Text>
          </Pressable>
          <Pressable
            onPress={() => router.back()}
            style={styles.linkBtn}
            accessibilityRole="button"
            accessibilityLabel="Back to dashboard"
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
        round={total + 1}
        totalRounds={0}
        streak={streak}
        accent={ACCENT}
      />

      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 20 }}>
        {/* Timer bar */}
        <View style={{ marginBottom: 4 }}>
          <View style={styles.timerTrack}>
            <AnimatedProgressBar
              progress={timeLeft / duration}
              color={timeLeft < 5 ? colors.danger : ACCENT}
              trackColor={colors.surfaceElevated}
              height={6}
              duration={950}
            />
          </View>
          <Text style={[styles.timerLabel, { color: timeLeft < 5 ? colors.danger : colors.textSecondary }]}>
            {timeLeft}s remaining
          </Text>
        </View>

        {/* Current note */}
        <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 20 }}>
          <View
            style={[
              styles.noteBox,
              {
                backgroundColor:
                  feedback === 'correct'
                    ? colors.green + '22'
                    : feedback === 'wrong'
                      ? colors.danger + '22'
                      : ACCENT + '12',
                borderColor:
                  feedback === 'correct'
                    ? colors.green + '66'
                    : feedback === 'wrong'
                      ? colors.danger + '66'
                      : ACCENT + '33',
              },
            ]}
          >
            <Text style={styles.noteText}>{currentNote}</Text>
          </View>
        </View>

        {/* Piano keys */}
        <View style={styles.pianoRow}>
          {ALL_NOTES.map((note) => {
            const isBlack = note.includes('#');
            return (
              <Pressable
                key={note}
                onPress={() => handleTap(note)}
                disabled={answerLocked}
                accessibilityRole="button"
                accessibilityLabel={`Answer ${note}`}
                style={({ pressed }) => ({
                  width: isBlack ? 52 : 60,
                  height: isBlack ? 72 : 90,
                  borderRadius: 10,
                  backgroundColor: isBlack ? '#1a1a2e' : colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 4,
                  opacity: pressed ? 0.7 : answerLocked ? 0.5 : 1,
                })}
              >
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: isBlack ? 12 : 14 }}>
                  {note}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <Text style={styles.statPill}>🔥 {streak}</Text>
          <Text style={styles.statPill}>✓ {correct}</Text>
          <Text style={styles.statPill}>{total} total</Text>
        </View>

        <Pressable
          onPress={() => {
            clearTimer();
            setPhase('done');
          }}
          style={styles.linkBtn}
          accessibilityRole="button"
          accessibilityLabel="End sprint early"
        >
          <Text style={[styles.linkBtnText, { marginTop: 8 }]}>End Sprint</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginBottom: 20,
  },
  title: { ...typography.title1, color: colors.text },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 8, marginBottom: 24, textAlign: 'center' },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 },
  durationRow: { flexDirection: 'row', gap: 12, justifyContent: 'center', marginBottom: 32 },
  durationBtn: {
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderWidth: 1,
  },
  btnPrimary: {
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  btnPrimaryText: { color: colors.background, fontWeight: '700', fontSize: 16 },
  linkBtn: { padding: 16, marginTop: 4 },
  linkBtnText: { color: colors.textSecondary, textAlign: 'center', fontSize: 13 },
  timerTrack: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  timerLabel: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  noteBox: {
    width: 120,
    height: 120,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteText: {
    fontSize: 44,
    fontWeight: '800',
    color: colors.text,
  },
  pianoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
  },
  statPill: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
});
