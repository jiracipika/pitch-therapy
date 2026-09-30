import { View, Text, Pressable } from 'react-native';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { calculateCentsDeviation } from '@pitch-therapy/core';
import { playTone, NOTE_FREQS_4 } from '@/lib/audio';
import { GameHeader } from '@/components/GameHeader';
import {
  GameResultRow,
  GameResultStats,
  GameResultsScreen,
} from '@/components/GameResultsScreen';
import { AnimatedProgressBar } from '@/lib/motion';
import { useMicPitch } from '@/lib/micPitch';
import { triggerCorrectHaptic, triggerIncorrectHaptic } from '@/lib/haptics';
import { useSessionResults } from '@/lib/sessionResults';
import { playColors as pc } from '@/lib/theme';
const ACCENT = '#EC4899';
const TARGET_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
const TOTAL_ROUNDS = 5;
const HOLD_NEEDED_MS = 1500;

type Phase = 'setup' | 'playing' | 'results';
/** Mic detection (web parity: hold within ±10¢ to score) with the original
 *  self-marking as automatic fallback when the mic isn't available. */
type InputMode = 'mic' | 'self-assess';

interface RoundResult {
  round: number;
  target: string;
  correct: boolean;
  points: number;
}

export default function TuneInScreen() {
  const router = useRouter();
  const { recordResult } = useSessionResults();
  const mic = useMicPitch();
  const [phase, setPhase] = useState<Phase>('setup');
  const [inputMode, setInputMode] = useState<InputMode>('self-assess');
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [target, setTarget] = useState('A');
  const [targetFreq, setTargetFreq] = useState(440);
  const [cents, setCents] = useState(0);
  const [hasPitch, setHasPitch] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const sessionStartRef = useRef(0);
  const recordedRef = useRef(false);
  const answerLockedRef = useRef(false);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const targetFreqRef = useRef(440);
  const inputModeRef = useRef<InputMode>('self-assess');
  const centsRef = useRef(0);
  const hasPitchRef = useRef(false);
  const holdStartRef = useRef<number | null>(null);
  const holdProgressRef = useRef(0);

  const clearTransition = useCallback(() => {
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
  }, []);

  // A pending round transition must never outlive this screen. Without this,
  // leaving or immediately restarting can advance the replacement session.
  useEffect(() => clearTransition, [clearTransition]);

  // Persist session result once when the game completes.
  useEffect(() => {
    if (phase !== 'results' || recordedRef.current || results.length === 0) return;
    recordedRef.current = true;
    const hits = results.filter(r => r.correct).length;
    recordResult({
      mode: 'tune-in',
      score,
      accuracy: hits / results.length,
      rounds: results.length,
      timeMs: Date.now() - sessionStartRef.current,
    });
  }, [phase, results, score, recordResult]);

  const pickTarget = useCallback(() => {
    const note = TARGET_NOTES[Math.floor(Math.random() * TARGET_NOTES.length)];
    const freq = NOTE_FREQS_4[note] ?? 440;
    setTarget(note);
    setTargetFreq(freq);
    targetFreqRef.current = freq;
    return { note, freq };
  }, []);

  const beginMicRound = useCallback(() => {
    if (inputModeRef.current !== 'mic') return;
    holdStartRef.current = null;
    holdProgressRef.current = 0;
    setHoldProgress(0);
    // The target tone plays through the speaker — don't score the reference.
    mic.suppressUntil(950);
  }, [mic]);

  const startGame = useCallback(async () => {
    clearTransition();
    answerLockedRef.current = false;
    setRound(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setResults([]);
    recordedRef.current = false;
    sessionStartRef.current = Date.now();

    let mode: InputMode = 'self-assess';
    const status = await mic.start();
    if (status === 'active') mode = 'mic';
    inputModeRef.current = mode;
    setInputMode(mode);

    const { note, freq } = pickTarget();
    setRound(1);
    setPhase('playing');
    answerLockedRef.current = false;
    if (mode === 'mic') {
      holdStartRef.current = null;
      setHoldProgress(0);
      mic.suppressUntil(950);
    }
    playTone(note, freq);
    // mic.start/suppressUntil are stable; invoked from taps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearTransition, pickTarget]);

  const scheduleNextRound = useCallback(() => {
    clearTransition();
    transitionTimeoutRef.current = setTimeout(() => {
      transitionTimeoutRef.current = null;
      if (round >= TOTAL_ROUNDS) {
        mic.stop();
        setPhase('results');
      } else {
        const { note, freq } = pickTarget();
        setRound(r => r + 1);
        answerLockedRef.current = false;
        beginMicRound();
        playTone(note, freq);
      }
    }, 600);
  }, [clearTransition, pickTarget, round, mic, beginMicRound]);

  const handleSuccess = useCallback((earnedPoints?: number) => {
    // Pressable callbacks can run more than once before React commits a state
    // update. Lock synchronously so rapid taps cannot record duplicate rounds.
    if (answerLockedRef.current) return;
    answerLockedRef.current = true;

    const newStreak = streak + 1;
    // Mic mode scores like web (accuracy + speed); self-mark keeps its
    // base + streak-bonus formula.
    const points = earnedPoints ?? 80 + Math.min(newStreak * 5, 50);
    const newBestStreak = Math.max(bestStreak, newStreak);
    void triggerCorrectHaptic();

    setScore(s => s + points);
    setStreak(newStreak);
    setBestStreak(newBestStreak);
    setResults(r => [...r, { round, target, correct: true, points }]);

    scheduleNextRound();
  }, [streak, bestStreak, round, target, scheduleNextRound]);

  const handleSkip = useCallback(() => {
    if (answerLockedRef.current) return;
    answerLockedRef.current = true;
    void triggerIncorrectHaptic();

    setStreak(0);
    setResults(r => [...r, { round, target, correct: false, points: 0 }]);
    scheduleNextRound();
  }, [round, target, scheduleNextRound]);

  // Mic detection → cents against the round target (octave-agnostic, web parity).
  useEffect(() => {
    if (inputMode !== 'mic' || phase !== 'playing') return;
    const estimate = mic.latestEstimate;
    if (!estimate) {
      hasPitchRef.current = false;
      setHasPitch(false);
      return;
    }
    const measured = Math.round(calculateCentsDeviation(estimate.frequency, targetFreqRef.current));
    centsRef.current = measured;
    hasPitchRef.current = true;
    setCents(measured);
    setHasPitch(true);
  }, [mic.latestEstimate, inputMode, phase]);

  // Hold-to-score (web parity): stay within ±10¢ for 1.5s to bank the round.
  const handleMicSuccessRef = useRef<(points: number) => void>(() => {});
  useEffect(() => {
    if (inputMode !== 'mic' || phase !== 'playing') return;
    const interval = setInterval(() => {
      if (answerLockedRef.current) return;
      if (!hasPitchRef.current || Math.abs(centsRef.current) > 10) {
        holdStartRef.current = null;
        if (holdProgressRef.current !== 0) {
          holdProgressRef.current = 0;
          setHoldProgress(0);
        }
        return;
      }
      if (holdStartRef.current === null) holdStartRef.current = Date.now();
      const held = Date.now() - holdStartRef.current;
      holdProgressRef.current = Math.min(held / HOLD_NEEDED_MS, 1);
      setHoldProgress(holdProgressRef.current);
      if (held >= HOLD_NEEDED_MS) {
        const elapsed = Date.now() - sessionStartRef.current;
        const accuracy = 1 - Math.abs(centsRef.current) / 50;
        const points = Math.max(10, Math.round(accuracy * 100 + Math.max(0, 50 - elapsed / 200)));
        handleMicSuccessRef.current(points);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [inputMode, phase]);
  handleMicSuccessRef.current = (points: number) => handleSuccess(points);

  if (phase === 'setup') {
    return (
      <View style={{ flex: 1, backgroundColor: pc.screen }}>
        <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: ACCENT }} />
            <Text style={{ color: pc.text, fontSize: 22, fontWeight: '700' }}>Tune In</Text>
          </View>
          <Text style={{ color: pc.textSecondary, fontSize: 14, marginTop: 4 }}>
            Hit the target note with your voice or instrument
          </Text>
        </View>

        <View style={{ flex: 1, paddingHorizontal: 20, justifyContent: 'center' }}>
          {/* How to play */}
          <View style={{ backgroundColor: `${ACCENT}0A`, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: `${ACCENT}26`, marginBottom: 32 }}>
            <Text style={{ color: ACCENT, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10 }}>HOW TO PLAY</Text>
            <Text style={{ color: pc.textSecondary, fontSize: 13, marginBottom: 6 }}>1. A target note appears — tap 🔊 to hear it</Text>
            <Text style={{ color: pc.textSecondary, fontSize: 13, marginBottom: 6 }}>2. Sing or play that note on your instrument</Text>
            <Text style={{ color: pc.textSecondary, fontSize: 13, marginBottom: 6 }}>3. With the mic: hold within ±10¢ for 1.5s to score</Text>
            <Text style={{ color: pc.textSecondary, fontSize: 13 }}>4. No mic? Mark ✓ yourself or ✗ to skip</Text>
          </View>

          <Pressable
            onPress={startGame}
            accessibilityRole="button"
            accessibilityLabel="Start tuning game"
            style={({ pressed }) => ({
              backgroundColor: ACCENT,
              borderRadius: 14,
              padding: 16,
              alignItems: 'center',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ color: pc.text, fontWeight: '700', fontSize: 16 }}>Start Game</Text>
          </Pressable>
        </View>

        <Pressable accessibilityRole="button" accessibilityLabel="Back to dashboard" onPress={() => router.back()} style={{ padding: 20 }}>
          <Text style={{ color: pc.textSecondary, textAlign: 'center' }}>← Back</Text>
        </Pressable>
      </View>
    );
  }

  if (phase === 'results') {
    const correct = results.filter(r => r.correct).length;
    return (
      <GameResultsScreen
        title="Tune In Complete!"
        subtitle="Voice & instrument pitch matching"
        score={score}
        accent={ACCENT}
        onPlayAgain={startGame}
        onExit={() => router.back()}
      >
          <GameResultStats
            items={[
              { label: 'Hit', value: `${correct}/${TOTAL_ROUNDS}` },
              { label: 'Best Streak', value: `${bestStreak}` },
            ]}
          />

          {results.map((r, i) => (
            <GameResultRow
              key={r.round}
              label={`Round ${i + 1}`}
              detail={`Target: ${r.target}`}
              outcome={r.correct ? `+${r.points}` : 'Skipped'}
              success={r.correct}
            />
          ))}
      </GameResultsScreen>
    );
  }

  // ── Playing ──────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: pc.screen }}>
      <GameHeader score={score} round={round} totalRounds={TOTAL_ROUNDS} streak={streak} accent={ACCENT} onBack={() => router.back()} />

      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 40, justifyContent: 'space-between', paddingBottom: 40 }}>
        {/* Target note */}
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: pc.textTertiary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>
            Target Note
          </Text>
          <Text style={{ color: ACCENT, fontSize: 72, fontWeight: '800', letterSpacing: 0 }}>
            {target}
          </Text>
          <Text style={{ color: pc.textTertiary, fontSize: 14, marginTop: 6 }}>
            {targetFreq.toFixed(1)} Hz
          </Text>

          {/* Hear button */}
          <Pressable
            onPress={() => playTone(target, targetFreq)}
            accessibilityRole="button"
            accessibilityLabel="Hear target note"
            style={({ pressed }) => ({
              marginTop: 24,
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 24,
              backgroundColor: pc.cardAmbient,
              borderWidth: 1,
              borderColor: pc.cardBorder,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ fontSize: 18 }}>🔊</Text>
            <Text style={{ color: pc.textTertiary, fontSize: 14, fontWeight: '600' }}>Hear target</Text>
          </Pressable>

          <Text style={{ color: pc.textSecondary, fontSize: 13, marginTop: 20 }}>
            {inputMode === 'mic'
              ? hasPitch
                ? 'Hold the note steady — it auto-scores'
                : 'Sing or play the note — listening…'
              : 'Sing or play the note, then mark your result'}
          </Text>

          {inputMode === 'mic' ? (
            <>
              {/* Cents meter */}
              <View style={{ marginTop: 24, alignSelf: 'stretch' }}>
                <View style={{ height: 8, borderRadius: 4, backgroundColor: pc.cardAmbient, position: 'relative' }}>
                  <View style={{ position: 'absolute', left: '50%', top: -2, bottom: -2, width: 1.5, backgroundColor: pc.success, transform: [{ translateX: -0.75 }] }} />
                  <View
                    style={{
                      position: 'absolute',
                      top: 0,
                      width: 12,
                      height: 8,
                      borderRadius: 4,
                      marginLeft: -6,
                      backgroundColor: !hasPitch
                        ? pc.textSecondary
                        : Math.abs(cents) < 25
                          ? pc.success
                          : Math.abs(cents) < 50
                            ? pc.warning
                            : pc.danger,
                      left: `${50 + Math.max(-45, Math.min(45, cents / 2))}%`,
                    }}
                  />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                  <Text style={{ color: pc.textTertiary, fontSize: 10 }}>-100¢</Text>
                  <Text style={{ color: pc.textTertiary, fontSize: 10 }}>0¢</Text>
                  <Text style={{ color: pc.textTertiary, fontSize: 10 }}>+100¢</Text>
                </View>
                <Text style={{ textAlign: 'center', marginTop: 10, fontSize: 22, fontWeight: '700', color: !hasPitch ? pc.textSecondary : Math.abs(cents) < 25 ? pc.success : Math.abs(cents) < 50 ? pc.warning : pc.danger }}>
                  {hasPitch ? `${cents > 0 ? '+' : ''}${cents}¢` : mic.status === 'active' ? 'Listening…' : 'Mic unavailable'}
                </Text>

                {/* Hold progress */}
                {holdProgress > 0 && (
                  <View style={{ marginTop: 14 }}>
                    <AnimatedProgressBar progress={holdProgress} color={pc.success} trackColor={pc.cardAmbient} height={6} />
                    <Text style={{ textAlign: 'center', color: pc.textTertiary, fontSize: 12, marginTop: 4 }}>
                      Hold steady…
                    </Text>
                  </View>
                )}
              </View>

              <Pressable
                onPress={handleSkip}
                accessibilityRole="button"
                accessibilityLabel="Skip this note"
                accessibilityState={{ disabled: answerLockedRef.current }}
                disabled={answerLockedRef.current}
                style={({ pressed }) => ({
                  marginTop: 20,
                  paddingVertical: 14,
                  paddingHorizontal: 32,
                  borderRadius: 16,
                  alignSelf: 'center',
                  backgroundColor: 'rgba(248,113,113,0.08)',
                  borderWidth: 1,
                  borderColor: 'rgba(248,113,113,0.3)',
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ color: pc.danger, fontWeight: '700', fontSize: 14 }}>Skip note</Text>
              </Pressable>
            </>
          ) : (
            <>
          {/* Self-assessment buttons */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
          <Pressable
            onPress={() => handleSuccess()}
            accessibilityRole="button"
            accessibilityLabel="Mark as matched correctly"
            accessibilityState={{ disabled: answerLockedRef.current }}
            disabled={answerLockedRef.current}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: 28,
              borderRadius: 20,
              alignItems: 'center',
              backgroundColor: 'rgba(74,222,128,0.1)',
              borderWidth: 1,
              borderColor: 'rgba(74,222,128,0.35)',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ fontSize: 28, marginBottom: 6 }}>✓</Text>
            <Text style={{ color: pc.success, fontWeight: '700', fontSize: 15 }}>Got it</Text>
          </Pressable>

          <Pressable
            onPress={handleSkip}
            accessibilityRole="button"
            accessibilityLabel="Skip this note"
            accessibilityState={{ disabled: answerLockedRef.current }}
            disabled={answerLockedRef.current}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: 28,
              borderRadius: 20,
              alignItems: 'center',
              backgroundColor: 'rgba(248,113,113,0.08)',
              borderWidth: 1,
              borderColor: 'rgba(248,113,113,0.3)',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ fontSize: 28, marginBottom: 6 }}>✗</Text>
            <Text style={{ color: pc.danger, fontWeight: '700', fontSize: 15 }}>Skip</Text>
          </Pressable>
        </View>
            </>
          )}
          </View>
      </View>
    </View>
  );
}
