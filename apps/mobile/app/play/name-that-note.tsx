import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { playFrequency, NOTE_FREQS_4 } from '@/lib/audio';
import NoteComparisonStaff from '@/components/NoteComparisonStaff';

const ACCENT = '#0EA5E9';
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

const QUIZ_NOTES = [
  { name: 'E4', idx: 4, label: 'E' },
  { name: 'F4', idx: 5, label: 'F' },
  { name: 'G4', idx: 7, label: 'G' },
  { name: 'A4', idx: 9, label: 'A' },
  { name: 'B4', idx: 11, label: 'B' },
  { name: 'C5', idx: 0, label: 'C' },
  { name: 'D5', idx: 2, label: 'D' },
  { name: 'E5', idx: 4, label: 'E' },
  { name: 'F5', idx: 5, label: 'F' },
];

type Phase = 'idle' | 'playing' | 'timed-out' | 'done';

export default function NameThatNoteScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('idle');
  const [round, setRound] = useState(0);
  const [totalRounds] = useState(10);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [targetNote, setTargetNote] = useState(QUIZ_NOTES[0]);
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [guessedLabel, setGuessedLabel] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const startRound = () => {
    const note = QUIZ_NOTES[Math.floor(Math.random() * QUIZ_NOTES.length)];
    setTargetNote(note);
    setRound((r) => r + 1);
    setFeedback('none');
    setGuessedLabel(null);
    setPhase('playing');
    setTimeLeft(10);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timerRef.current); setPhase('timed-out'); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const handleStart = () => {
    setRound(0); setScore(0); setStreak(0);
    startRound();
  };

  const handleAnswer = (label: string) => {
    if (phase !== 'playing') return;
    clearInterval(timerRef.current);
    setGuessedLabel(label);
    const correct = label === targetNote.label;
    const points = correct ? Math.max(100 - (10 - timeLeft) * 8, 20) : 0;
    setScore((s) => s + points);
    if (correct) { setStreak((s) => s + 1); setFeedback('correct'); }
    else { setStreak(0); setFeedback('wrong'); }
    playFrequency(NOTE_FREQS_4[targetNote.label] ?? 440, 0.5);
    if (round >= totalRounds) setTimeout(() => setPhase('done'), 1000);
    else setTimeout(startRound, 1200);
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  const staffY = (noteName: string) => {
    const pos: Record<string, number> = { 'E4': 0, 'F4': 1, 'G4': 2, 'A4': 3, 'B4': 4, 'C5': 5, 'D5': 6, 'E5': 7, 'F5': 8 };
    return pos[noteName] ?? 0;
  };

  if (phase === 'done') {
    const correct = Math.round(score / 100);
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <View style={[styles.iconCircle, { borderColor: ACCENT, backgroundColor: ACCENT + '15' }]}>
            <Text style={{ fontSize: 36 }}>📖</Text>
          </View>
          <Text style={styles.title}>Game Complete</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}><Text style={[styles.statValue, { color: ACCENT }]}>{score}</Text><Text style={styles.statLabel}>Score</Text></View>
            <View style={styles.statCard}><Text style={styles.statValue}>{correct}/{totalRounds}</Text><Text style={styles.statLabel}>Correct</Text></View>
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
            <Text style={{ fontSize: 32 }}>📖</Text>
          </View>
          <Text style={[styles.title, { fontSize: 24 }]}>Name That Note</Text>
          <Text style={styles.subtitle}>Identify notes on the staff</Text>
          <Pressable onPress={handleStart} style={[styles.btnPrimary, { backgroundColor: ACCENT }]}><Text style={styles.btnPrimaryText}>Start</Text></Pressable>
          <Pressable onPress={() => router.back()} style={styles.linkBtn}><Text style={styles.linkBtnText}>← Back</Text></Pressable>
        </View>
      </View>
    );
  }

  const y = staffY(targetNote.name);

  return (
    <View style={styles.container}>
      <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}><Text style={{ color: '#71717a' }}>←</Text></Pressable>
          <Text style={{ fontSize: 16, fontWeight: '600', color: ACCENT }}>Name That Note</Text>
          <View style={styles.scoreBadge}><Text style={styles.scoreText}>{score}</Text></View>
        </View>

        {/* Timer */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ fontSize: 12, color: '#71717a' }}>Time: {timeLeft}s</Text>
          <Text style={{ fontSize: 12, color: '#71717a' }}>Round {round}/{totalRounds}</Text>
        </View>
        <View style={{ height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.07)', marginBottom: 24 }}>
          <View style={{ height: '100%', borderRadius: 2, backgroundColor: timeLeft <= 3 ? '#f87171' : ACCENT, width: `${(timeLeft / 10) * 100}%` }} />
        </View>

        {/* Staff */}
        <View style={{ height: 120, position: 'relative', marginBottom: 24 }}>
          {/* Staff lines */}
          {[0, 20, 40, 60, 80].map((bottom, i) => (
            <View key={i} style={{ position: 'absolute', left: 0, right: 0, bottom, height: 1, backgroundColor: 'rgba(255,255,255,0.2)' }} />
          ))}
          {/* Treble clef */}
          <Text style={{ position: 'absolute', left: 4, bottom: 16, fontSize: 48, color: 'rgba(255,255,255,0.25)' }}>𝄞</Text>
          {/* Note head */}
          <View style={{
            position: 'absolute', width: 20, height: 16, borderRadius: 8,
            backgroundColor: feedback === 'correct' ? '#4ADE80' : feedback === 'wrong' ? '#f87171' : ACCENT,
            left: '50%', bottom: y * 10 + 10, transform: [{ translateX: -10 }],
          }} />
        </View>

        {phase === 'timed-out' && <Text style={{ textAlign: 'center', color: '#f87171', fontSize: 13, marginBottom: 16 }}>Time&apos;s up! It was {targetNote.name}</Text>}

        {/* Staff comparison after answer */}
        {feedback !== 'none' && guessedLabel && (
          <View style={{ marginBottom: 16 }}>
            <NoteComparisonStaff
              guessedNote={guessedLabel}
              correctNote={targetNote.label}
              isCorrect={feedback === 'correct'}
            />
          </View>
        )}

        <Text style={{ textAlign: 'center', fontSize: 12, color: '#52525b', marginBottom: 16 }}>Tap the correct note</Text>

        {/* Answer buttons */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
          {QUIZ_NOTES.map((note) => (
            <Pressable
              key={note.name}
              onPress={() => handleAnswer(note.label)}
              disabled={phase !== 'playing'}
              style={{
                width: 44, height: 56, borderRadius: 8,
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
                alignItems: 'center', justifyContent: 'center',
                opacity: phase === 'playing' ? 1 : 0.4,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#f4f4f5' }}>{note.label}</Text>
              <Text style={{ fontSize: 9, color: '#52525b' }}>{note.name}</Text>
            </Pressable>
          ))}
        </View>
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
