import { View, Text, Pressable, ScrollView, PanResponder, LayoutChangeEvent } from 'react-native';
import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'expo-router';
import { GAME_MODE_META, DIFFICULTY_CONFIG, type Difficulty } from '@pitch-therapy/core';
import { GameHeader } from '@/components/GameHeader';
import { playFrequency, NOTE_FREQS_4 } from '@/lib/audio';
import { triggerCorrectHaptic, triggerIncorrectHaptic } from '@/lib/haptics';

const MODE = GAME_MODE_META['frequency-guess'];
const ACCENT = MODE.accentHex;

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
const QUIZ_FREQS: Array<{ note: string; hz: number }> = NOTE_NAMES.map((n) => ({
  note: n + '4',
  hz: NOTE_FREQS_4[n],
}));

const MIN_FREQ = 100;
const MAX_FREQ = 1000;

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pctError(guess: number, target: number): number {
  return Math.abs(guess - target) / target;
}

type Phase = 'select-difficulty' | 'playing' | 'results';
interface RoundResult { targetHz: number; targetNote: string; guessHz: number; errorPct: number; correct: boolean }

// ── Simple horizontal slider ──────────────────────────────────────────────────
function FreqSlider({ value, onChange, accent }: { value: number; onChange: (v: number) => void; accent: string }) {
  const trackWidthRef = useRef(300);
  const ratio = (value - MIN_FREQ) / (MAX_FREQ - MIN_FREQ);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const x = e.nativeEvent.locationX;
        const r = Math.max(0, Math.min(1, x / trackWidthRef.current));
        onChange(Math.round(MIN_FREQ + r * (MAX_FREQ - MIN_FREQ)));
      },
      onPanResponderMove: (e) => {
        const x = e.nativeEvent.locationX;
        const r = Math.max(0, Math.min(1, x / trackWidthRef.current));
        onChange(Math.round(MIN_FREQ + r * (MAX_FREQ - MIN_FREQ)));
      },
    })
  ).current;

  const handleLayout = (e: LayoutChangeEvent) => {
    trackWidthRef.current = e.nativeEvent.layout.width;
  };

  return (
    <View style={{ paddingVertical: 20 }} {...panResponder.panHandlers}>
      <View
        onLayout={handleLayout}
        style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, position: 'relative' }}
      >
        <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${ratio * 100}%`, backgroundColor: accent, borderRadius: 3 }} />
        <View style={{
          position: 'absolute',
          top: -9,
          left: `${ratio * 100}%`,
          marginLeft: -12,
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: accent,
          shadowColor: accent,
          shadowOpacity: 0.5,
          shadowRadius: 4,
          elevation: 4,
        }} />
      </View>
    </View>
  );
}

export default function FrequencyGuessScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('select-difficulty');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [targetNote, setTargetNote] = useState('');
  const [targetHz, setTargetHz] = useState(440);
  const [sliderVal, setSliderVal] = useState(440);
  const [feedback, setFeedback] = useState<null | { correct: boolean; errorPct: number; pts: number }>(null);
  const [roundStart, setRoundStart] = useState(0);

  const totalRounds = DIFFICULTY_CONFIG[difficulty].rounds;

  const startRound = useCallback(() => {
    const pick = pickRandom(QUIZ_FREQS);
    setTargetNote(pick.note);
    setTargetHz(pick.hz);
    setSliderVal(440);
    setFeedback(null);
    setRoundStart(Date.now());
    playFrequency(pick.hz);
  }, []);

  const startGame = useCallback((diff: Difficulty) => {
    setDifficulty(diff);
    setRound(1);
    setScore(0);
    setStreak(0);
    setResults([]);
    setFeedback(null);
    setPhase('playing');
    const pick = pickRandom(QUIZ_FREQS);
    setTargetNote(pick.note);
    setTargetHz(pick.hz);
    setSliderVal(440);
    setRoundStart(Date.now());
    playFrequency(pick.hz);
  }, []);

  const handlePlay = useCallback(() => { playFrequency(targetHz); }, [targetHz]);
  const handlePlayGuess = useCallback(() => { playFrequency(sliderVal); }, [sliderVal]);

  const handleSubmit = useCallback(() => {
    if (feedback !== null) return;
    const elapsed = Date.now() - roundStart;
    const err = pctError(sliderVal, targetHz);
    const correct = err < 0.05;
    const acc = Math.max(0, 1 - err * 2);
    const pts = Math.round(acc * 100 * Math.max(0, 1 - elapsed / 15000));
    const newStreak = correct ? streak + 1 : 0;
    if (correct) void triggerCorrectHaptic();
    else void triggerIncorrectHaptic();

    setFeedback({ correct, errorPct: err, pts });
    setScore((s) => s + pts);
    setStreak(newStreak);
    setResults((r) => [...r, { targetHz, targetNote, guessHz: sliderVal, errorPct: err, correct }]);

    setTimeout(() => {
      if (round >= totalRounds) {
        setPhase('results');
      } else {
        setRound((r) => r + 1);
        startRound();
      }
    }, 1400);
  }, [feedback, sliderVal, targetHz, targetNote, round, totalRounds, streak, roundStart, startRound]);

  // ── Difficulty Selection ───────────────────────────────────────────────────
  if (phase === 'select-difficulty') {
    return (
      <View style={{ flex: 1, backgroundColor: '#08090D' }}>
        <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: ACCENT }} />
          <Text style={{ color: '#F8FAFC', fontSize: 22, fontWeight: '700' }}>{MODE.label}</Text>
        </View>
        <View style={{ flex: 1, paddingHorizontal: 20, justifyContent: 'center' }}>
          <Text style={{ color: '#97A3B6', fontSize: 14, marginBottom: 8 }}>
            Hear a tone, then drag to match its frequency.
          </Text>
          <Text style={{ color: '#F8FAFC', fontSize: 18, fontWeight: '600', marginBottom: 32 }}>Select difficulty</Text>
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
            <Pressable
              key={d}
              onPress={() => startGame(d)}
              style={({ pressed }) => ({
                backgroundColor: 'rgba(21,24,32,0.86)',
                borderRadius: 16,
                padding: 20,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.10)',
                marginBottom: 12,
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <Text style={{ color: '#F8FAFC', fontWeight: '600', fontSize: 16, textTransform: 'capitalize' }}>{d}</Text>
              <Text style={{ color: '#97A3B6', fontSize: 13, marginTop: 3 }}>{DIFFICULTY_CONFIG[d].rounds} rounds</Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={() => router.back()} style={{ padding: 20 }}>
          <Text style={{ color: '#97A3B6', textAlign: 'center' }}>← Back</Text>
        </Pressable>
      </View>
    );
  }

  // ── Results ────────────────────────────────────────────────────────────────
  if (phase === 'results') {
    const correct = results.filter((r) => r.correct).length;
    const avgErr = results.reduce((s, r) => s + r.errorPct, 0) / results.length;
    return (
      <View style={{ flex: 1, backgroundColor: '#08090D' }}>
        <ScrollView contentContainerStyle={{ paddingTop: 80, paddingHorizontal: 20, paddingBottom: 40 }}>
          <Text style={{ color: '#F8FAFC', fontSize: 28, fontWeight: '700', marginBottom: 4 }}>Complete!</Text>
          <Text style={{ color: '#97A3B6', marginBottom: 32 }}>{MODE.label} · {difficulty}</Text>

          <View style={{ backgroundColor: 'rgba(21,24,32,0.86)', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', marginBottom: 20, alignItems: 'center' }}>
            <Text style={{ color: ACCENT, fontSize: 48, fontWeight: '700' }}>{score}</Text>
            <Text style={{ color: '#97A3B6', marginTop: 4 }}>points</Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
            {[
              { label: 'Correct', value: `${correct}/${totalRounds}` },
              { label: 'Avg Error', value: `${Math.round(avgErr * 100)}%` },
            ].map((s) => (
              <View key={s.label} style={{ flex: 1, backgroundColor: 'rgba(21,24,32,0.86)', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', alignItems: 'center' }}>
                <Text style={{ color: '#F8FAFC', fontSize: 20, fontWeight: '700' }}>{s.value}</Text>
                <Text style={{ color: '#97A3B6', fontSize: 12, marginTop: 2 }}>{s.label}</Text>
              </View>
            ))}
          </View>

          {results.map((r, i) => (
            <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}>
              <Text style={{ color: '#97A3B6', fontSize: 13 }}>R{i + 1}</Text>
              <Text style={{ color: '#F8FAFC', fontSize: 13 }}>{r.targetNote} ({Math.round(r.targetHz)} Hz)</Text>
              <Text style={{ color: r.correct ? '#4ade80' : '#f87171', fontSize: 13 }}>
                {r.correct ? '✓' : `${Math.round(r.errorPct * 100)}% off`}
              </Text>
            </View>
          ))}

          <Pressable onPress={() => startGame(difficulty)} style={{ backgroundColor: ACCENT, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 24 }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Play Again</Text>
          </Pressable>
          <Pressable onPress={() => router.back()} style={{ padding: 16 }}>
            <Text style={{ color: '#97A3B6', textAlign: 'center' }}>← Dashboard</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  // ── Playing ────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#08090D' }}>
      <GameHeader score={score} round={round} totalRounds={totalRounds} streak={streak} accent={ACCENT} />

      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 32, justifyContent: 'center' }}>
        {/* Play target */}
        <View style={{ alignItems: 'center', marginBottom: 36 }}>
          <Pressable
            onPress={handlePlay}
            style={({ pressed }) => ({
              width: 88,
              height: 88,
              borderRadius: 44,
              backgroundColor: ACCENT + '22',
              borderWidth: 2,
              borderColor: ACCENT,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <Text style={{ fontSize: 34 }}>▶</Text>
          </Pressable>
          <Text style={{ color: '#97A3B6', marginTop: 10, fontSize: 14 }}>Tap to hear the target</Text>
        </View>

        {/* Slider card */}
        <View style={{
          backgroundColor: 'rgba(21,24,32,0.86)',
          borderRadius: 16,
          padding: 20,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.10)',
          marginBottom: 20,
        }}>
          <Text style={{ color: '#97A3B6', fontSize: 12, textAlign: 'center', marginBottom: 4 }}>Your guess</Text>
          <Text style={{ color: '#F8FAFC', fontSize: 40, fontWeight: '700', textAlign: 'center', marginBottom: 4 }}>
            {Math.round(sliderVal)} Hz
          </Text>
          <FreqSlider value={sliderVal} onChange={setSliderVal} accent={ACCENT} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: '#97A3B6', fontSize: 11 }}>{MIN_FREQ} Hz</Text>
            <Text style={{ color: '#97A3B6', fontSize: 11 }}>{MAX_FREQ} Hz</Text>
          </View>
          <Pressable onPress={handlePlayGuess} style={{ marginTop: 12, alignItems: 'center' }}>
            <Text style={{ color: ACCENT, fontSize: 13 }}>▶ Preview my guess</Text>
          </Pressable>
        </View>

        {/* Feedback */}
        {feedback && (
          <View style={{
            backgroundColor: feedback.correct ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
            borderRadius: 12,
            padding: 14,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: feedback.correct ? '#4ade80' : '#f87171',
            alignItems: 'center',
          }}>
            <Text style={{ color: feedback.correct ? '#4ade80' : '#f87171', fontWeight: '700', fontSize: 16 }}>
              {feedback.correct
                ? `✓ Spot on! +${feedback.pts} pts`
                : `${Math.round(feedback.errorPct * 100)}% off — target was ${Math.round(targetHz)} Hz`}
            </Text>
          </View>
        )}

        {feedback === null && (
          <Pressable
            onPress={handleSubmit}
            style={{ backgroundColor: ACCENT, borderRadius: 14, padding: 16, alignItems: 'center' }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Submit Guess</Text>
          </Pressable>
        )}
      </View>

      <Pressable onPress={() => router.back()} style={{ padding: 20 }}>
        <Text style={{ color: '#97A3B6', textAlign: 'center', fontSize: 13 }}>← Dashboard</Text>
      </Pressable>
    </View>
  );
}
