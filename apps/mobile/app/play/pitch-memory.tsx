import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { playFrequency, NOTE_FREQS_4 } from '@/lib/audio';
import { triggerCorrectHaptic, triggerIncorrectHaptic } from '@/lib/haptics';

const ACCENT = '#F43F5E';
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

type Phase = 'idle' | 'playing' | 'input' | 'feedback' | 'done';

export default function PitchMemoryScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('idle');
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerInput, setPlayerInput] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong'>('correct');
  const [lives, setLives] = useState(3);

  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timerRef.current.forEach(clearTimeout), []);

  const freq = (i: number) => NOTE_FREQS_4[NOTE_NAMES[i]] ?? 261.63;

  const playSequence = useCallback((seq: number[]) => {
    const tempo = 0.4;
    timerRef.current = seq.map((noteIdx, i) =>
      setTimeout(() => playFrequency(freq(noteIdx), tempo), i * (tempo + 0.15) * 1000)
    );
    timerRef.current.push(
      setTimeout(() => setPhase('input'), seq.length * (tempo + 0.15) * 1000 + 300)
    );
  }, []);

  const startGame = () => {
    const seq = Array.from({ length: 2 }, () => Math.floor(Math.random() * 12));
    setSequence(seq);
    setPlayerInput([]);
    setLevel(1);
    setScore(0);
    setStreak(0);
    setLives(3);
    setPhase('playing');
    setTimeout(() => playSequence(seq), 500);
  };

  const nextLevel = () => {
    const newSeq = [...sequence, Math.floor(Math.random() * 12)];
    setSequence(newSeq);
    setPlayerInput([]);
    setLevel((l) => l + 1);
    setPhase('playing');
    setTimeout(() => playSequence(newSeq), 400);
  };

  const handlePianoTap = (noteIdx: number) => {
    if (phase !== 'input') return;
    playFrequency(freq(noteIdx), 0.3);
    const newInput = [...playerInput, noteIdx];
    setPlayerInput(newInput);

    const idx = newInput.length - 1;
    if (newInput[idx] !== sequence[idx]) {
      void triggerIncorrectHaptic();
      setFeedback('wrong');
      setPhase('feedback');
      const newLives = lives - 1;
      setLives(newLives);
      setTimeout(() => {
        if (newLives <= 0) { setPhase('done'); return; }
        setPlayerInput([]);
        setPhase('playing');
        playSequence(sequence);
      }, 1500);
      return;
    }

    if (newInput.length === sequence.length) {
      void triggerCorrectHaptic();
      const points = sequence.length * 50 + level * 20;
      setScore((s) => s + points);
      setStreak((s) => s + 1);
      setFeedback('correct');
      setPhase('feedback');
      setTimeout(nextLevel, 1200);
    }
  };

  if (phase === 'done') {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <View style={[styles.iconCircle, { borderColor: ACCENT, backgroundColor: ACCENT + '15' }]}>
            <Text style={{ fontSize: 36 }}>🎵</Text>
          </View>
          <Text style={styles.title}>Game Over</Text>
          <Text style={styles.subtitle}>You reached level {level}!</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}><Text style={[styles.statValue, { color: ACCENT }]}>{score}</Text><Text style={styles.statLabel}>Score</Text></View>
            <View style={styles.statCard}><Text style={styles.statValue}>{level}</Text><Text style={styles.statLabel}>Max Level</Text></View>
          </View>
          <Pressable onPress={startGame} style={[styles.btnPrimary, { backgroundColor: ACCENT }]}><Text style={styles.btnPrimaryText}>Play Again</Text></Pressable>
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
            <Text style={{ fontSize: 32 }}>🎵</Text>
          </View>
          <Text style={[styles.title, { fontSize: 24 }]}>Pitch Memory</Text>
          <Text style={styles.subtitle}>Listen and reproduce note sequences</Text>
          <Pressable onPress={startGame} style={[styles.btnPrimary, { backgroundColor: ACCENT }]}><Text style={styles.btnPrimaryText}>Start Game</Text></Pressable>
          <Pressable onPress={() => router.back()} style={styles.linkBtn}><Text style={styles.linkBtnText}>← Back</Text></Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}><Text style={{ color: '#71717a' }}>←</Text></Pressable>
          <Text style={{ fontSize: 16, fontWeight: '600', color: ACCENT }}>Pitch Memory</Text>
          <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
            <Text>{lives > 0 ? '❤️'.repeat(lives) : '🖤'.repeat(3)}</Text>
            <View style={styles.scoreBadge}><Text style={styles.scoreText}>{score}</Text></View>
          </View>
        </View>

        {/* Sequence dots */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {sequence.map((_, i) => (
            <View
              key={i}
              style={{
                width: 12, height: 12, borderRadius: 6,
                backgroundColor: i < playerInput.length ? ACCENT : phase === 'feedback' && feedback === 'wrong' && i === playerInput.length - 1 ? '#f87171' : 'rgba(255,255,255,0.15)',
              }}
            />
          ))}
        </View>

        <Text style={{ textAlign: 'center', color: '#71717a', fontSize: 13, marginBottom: 24 }}>
          {phase === 'playing' ? '🎵 Listen carefully...' : phase === 'feedback' ? (feedback === 'correct' ? '✅ Correct!' : '❌ Wrong!') : `Tap notes (${playerInput.length}/${sequence.length})`}
        </Text>

        {/* Piano */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 2 }}>
          {NOTE_NAMES.map((name, i) => (
            <Pressable
              key={name}
              onPress={() => handlePianoTap(i)}
              style={{
                width: '7.5%', maxWidth: 34, height: 90, borderRadius: 6,
                backgroundColor: name.includes('#') ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.12)',
                borderWidth: 1, borderColor: name.includes('#') ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)',
                opacity: phase === 'input' ? 1 : 0.4,
                alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 6,
              }}
            >
              <Text style={{ fontSize: 8, color: '#52525b' }}>{name}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={{ textAlign: 'center', fontSize: 11, color: '#3f3f46', marginTop: 16 }}>Level {level} • Streak {streak}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '700', color: '#f4f4f5', letterSpacing: -0.4 },
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
});
