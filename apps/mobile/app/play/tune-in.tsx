import { View, Text, Pressable } from 'react-native';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { playTone, NOTE_FREQS_4 } from '@/lib/audio';
import { GameHeader } from '@/components/GameHeader';
import {
  GameResultRow,
  GameResultStats,
  GameResultsScreen,
} from '@/components/GameResultsScreen';
import { useSessionResults } from '@/lib/sessionResults';

const ACCENT = '#EC4899';
const TARGET_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
const TOTAL_ROUNDS = 5;

type Phase = 'setup' | 'playing' | 'results';

interface RoundResult {
  round: number;
  target: string;
  correct: boolean;
  points: number;
}

export default function TuneInScreen() {
  const router = useRouter();
  const { recordResult } = useSessionResults();
  const [phase, setPhase] = useState<Phase>('setup');
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [target, setTarget] = useState('A');
  const [targetFreq, setTargetFreq] = useState(440);
  const [results, setResults] = useState<RoundResult[]>([]);
  const sessionStartRef = useRef(0);
  const recordedRef = useRef(false);

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
    return { note, freq };
  }, []);

  const startGame = useCallback(() => {
    setRound(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setResults([]);
    recordedRef.current = false;
    sessionStartRef.current = Date.now();
    const { note, freq } = pickTarget();
    setRound(1);
    setPhase('playing');
    playTone(note, freq);
  }, [pickTarget]);

  const handleSuccess = useCallback(() => {
    // Scoring: base 80 pts + up to 50 streak bonus (matches web's accuracy + time formula)
    const newStreak = streak + 1;
    const points = 80 + Math.min(newStreak * 5, 50);
    const newBestStreak = Math.max(bestStreak, newStreak);

    setScore(s => s + points);
    setStreak(newStreak);
    setBestStreak(newBestStreak);
    setResults(r => [...r, { round, target, correct: true, points }]);

    setTimeout(() => {
      if (round >= TOTAL_ROUNDS) {
        setPhase('results');
      } else {
        const { note, freq } = pickTarget();
        setRound(r => r + 1);
        playTone(note, freq);
      }
    }, 600);
  }, [streak, bestStreak, round, target, pickTarget]);

  const handleSkip = useCallback(() => {
    setStreak(0);
    setResults(r => [...r, { round, target, correct: false, points: 0 }]);

    setTimeout(() => {
      if (round >= TOTAL_ROUNDS) {
        setPhase('results');
      } else {
        const { note, freq } = pickTarget();
        setRound(r => r + 1);
        playTone(note, freq);
      }
    }, 600);
  }, [round, target, pickTarget]);

  if (phase === 'setup') {
    return (
      <View style={{ flex: 1, backgroundColor: '#08090D' }}>
        <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: ACCENT }} />
            <Text style={{ color: '#F8FAFC', fontSize: 22, fontWeight: '700' }}>Tune In</Text>
          </View>
          <Text style={{ color: '#97A3B6', fontSize: 14, marginTop: 4 }}>
            Hit the target note with your voice or instrument
          </Text>
        </View>

        <View style={{ flex: 1, paddingHorizontal: 20, justifyContent: 'center' }}>
          {/* How to play */}
          <View style={{ backgroundColor: `${ACCENT}0A`, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: `${ACCENT}26`, marginBottom: 32 }}>
            <Text style={{ color: ACCENT, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10 }}>HOW TO PLAY</Text>
            <Text style={{ color: '#97A3B6', fontSize: 13, marginBottom: 6 }}>1. A target note appears — tap 🔊 to hear it</Text>
            <Text style={{ color: '#97A3B6', fontSize: 13, marginBottom: 6 }}>2. Sing or play that note on your instrument</Text>
            <Text style={{ color: '#97A3B6', fontSize: 13, marginBottom: 6 }}>3. Mark ✓ if you nailed it or ✗ to skip</Text>
            <Text style={{ color: '#97A3B6', fontSize: 13 }}>4. Build a streak for bonus points!</Text>
          </View>

          <Pressable
            onPress={startGame}
            style={({ pressed }) => ({
              backgroundColor: ACCENT,
              borderRadius: 14,
              padding: 16,
              alignItems: 'center',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Start Game</Text>
          </Pressable>
        </View>

        <Pressable onPress={() => router.back()} style={{ padding: 20 }}>
          <Text style={{ color: '#97A3B6', textAlign: 'center' }}>← Back</Text>
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
    <View style={{ flex: 1, backgroundColor: '#08090D' }}>
      <GameHeader score={score} round={round} totalRounds={TOTAL_ROUNDS} streak={streak} accent={ACCENT} />

      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 40, justifyContent: 'space-between', paddingBottom: 40 }}>
        {/* Target note */}
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: '#7E8A9A', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>
            Target Note
          </Text>
          <Text style={{ color: ACCENT, fontSize: 72, fontWeight: '800', letterSpacing: 0 }}>
            {target}
          </Text>
          <Text style={{ color: '#7E8A9A', fontSize: 14, marginTop: 6 }}>
            {targetFreq.toFixed(1)} Hz
          </Text>

          {/* Hear button */}
          <Pressable
            onPress={() => playTone(target, targetFreq)}
            style={({ pressed }) => ({
              marginTop: 24,
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 24,
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.10)',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ fontSize: 18 }}>🔊</Text>
            <Text style={{ color: '#a1a1aa', fontSize: 14, fontWeight: '600' }}>Hear target</Text>
          </Pressable>

          <Text style={{ color: '#3f3f46', fontSize: 13, marginTop: 20 }}>
            Sing or play the note, then mark your result
          </Text>
        </View>

        {/* Self-assessment buttons */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Pressable
            onPress={handleSuccess}
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
            <Text style={{ color: '#4ade80', fontWeight: '700', fontSize: 15 }}>Got it</Text>
          </Pressable>

          <Pressable
            onPress={handleSkip}
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
            <Text style={{ color: '#f87171', fontWeight: '700', fontSize: 15 }}>Skip</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
