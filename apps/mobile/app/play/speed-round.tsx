import { View, Text, Pressable, ScrollView } from 'react-native';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { playTone, NOTE_FREQS_4 } from '@/lib/audio';
import { triggerCorrectHaptic, triggerIncorrectHaptic } from '@/lib/haptics';

const ACCENT = '#FB923C';
const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

type Phase = 'setup' | 'playing' | 'results';

export default function SpeedRoundScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('setup');
  const [duration, setDuration] = useState(30);
  const [currentNote, setCurrentNote] = useState('');
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pickRandom = () => ALL_NOTES[Math.floor(Math.random() * ALL_NOTES.length)];

  const nextNote = useCallback(() => { setCurrentNote(pickRandom()); }, []);

  const startGame = useCallback(() => {
    setScore(0); setCorrect(0); setTotal(0); setStreak(0); setBestStreak(0);
    setTimeLeft(duration); setFeedback(null); nextNote(); setPhase('playing');
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); setPhase('results'); return 0; }
        return t - 1;
      });
    }, 1000);
  }, [duration, nextNote]);

  const handleTap = useCallback((note: string) => {
    if (phase !== 'playing') return;
    const isCorrect = note === currentNote;
    setTotal(t => t + 1);
    const freq = NOTE_FREQS_4[note];
    if (freq) playTone(note, freq, 0.15);
    if (isCorrect) {
      void triggerCorrectHaptic();
      setCorrect(c => c + 1);
      setScore(s => s + 10 + streak * 2);
      setStreak(s => { const ns = s + 1; setBestStreak(b => Math.max(b, ns)); return ns; });
      setFeedback('correct');
    } else {
      void triggerIncorrectHaptic();
      setStreak(0); setFeedback('wrong');
    }
    nextNote();
    setTimeout(() => setFeedback(null), 300);
  }, [phase, currentNote, streak, nextNote]);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  if (phase === 'results') {
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    return (
      <View style={{ flex: 1, backgroundColor: '#09090b' }}>
        <ScrollView contentContainerStyle={{ paddingTop: 80, paddingHorizontal: 20, paddingBottom: 40, alignItems: 'center' }}>
          <Text style={{ fontSize: 48 }}>⚡</Text>
          <Text style={{ color: '#f4f4f5', fontSize: 28, fontWeight: '700', marginTop: 16 }}>Time's Up!</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 24 }}>
            {[{ l: 'Score', v: String(score) }, { l: 'Accuracy', v: `${accuracy}%` }, { l: 'Best Streak', v: `🔥 ${bestStreak}` }].map(s => (
              <View key={s.l} style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', alignItems: 'center', flex: 1 }}>
                <Text style={{ color: '#f4f4f5', fontSize: 22, fontWeight: '700' }}>{s.v}</Text>
                <Text style={{ color: '#71717a', fontSize: 12, marginTop: 4 }}>{s.l}</Text>
              </View>
            ))}
          </View>
          <Pressable onPress={startGame} style={{ backgroundColor: ACCENT, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 24, width: '100%' }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Play Again</Text>
          </Pressable>
          <Pressable onPress={() => router.back()} style={{ padding: 16 }}>
            <Text style={{ color: '#71717a', textAlign: 'center' }}>← Dashboard</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  if (phase === 'setup') {
    return (
      <View style={{ flex: 1, backgroundColor: '#09090b', paddingHorizontal: 20, justifyContent: 'center' }}>
        <Text style={{ textAlign: 'center', fontSize: 48 }}>⚡</Text>
        <Text style={{ color: ACCENT, fontSize: 26, fontWeight: '700', textAlign: 'center', marginTop: 16 }}>Speed Round</Text>
        <Text style={{ color: '#71717a', fontSize: 14, textAlign: 'center', marginTop: 8 }}>Identify notes as fast as you can</Text>
        <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'center', marginTop: 32 }}>
          {[30, 60].map(d => (
            <Pressable key={d} onPress={() => setDuration(d)} style={{
              backgroundColor: duration === d ? ACCENT : 'rgba(255,255,255,0.04)', borderRadius: 20, paddingVertical: 12, paddingHorizontal: 28, borderWidth: 1, borderColor: duration === d ? ACCENT : 'rgba(255,255,255,0.07)',
            }}>
              <Text style={{ color: duration === d ? '#fff' : '#71717a', fontWeight: '600', fontSize: 16 }}>{d}s</Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={startGame} style={{ backgroundColor: ACCENT, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 32 }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Start Sprint</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#09090b' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56 }}>
        <Pressable onPress={() => { if (timerRef.current) clearInterval(timerRef.current); router.back(); }}><Text style={{ color: '#71717a' }}>← Back</Text></Pressable>
        <Text style={{ color: ACCENT, fontWeight: '700' }}>⚡ Speed Round</Text>
        <Text style={{ color: '#71717a' }}>{score}</Text>
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
        <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden' }}>
          <View style={{ height: '100%', backgroundColor: timeLeft < 5 ? '#f87171' : ACCENT, borderRadius: 99, width: `${(timeLeft / duration) * 100}%` }} />
        </View>
      </View>

      <View style={{ alignItems: 'center', marginTop: 32 }}>
        <View style={{
          width: 120, height: 120, borderRadius: 24, backgroundColor: feedback === 'correct' ? 'rgba(74,222,128,0.15)' : feedback === 'wrong' ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.06)',
          borderWidth: 2, borderColor: feedback === 'correct' ? '#4ade80' : feedback === 'wrong' ? '#f87171' : 'rgba(255,255,255,0.1)',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ fontSize: 44, fontWeight: '800', color: '#f4f4f5' }}>{currentNote}</Text>
        </View>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 20, marginTop: 24 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
          {ALL_NOTES.map((note, i) => {
            const isBlack = note.includes('#');
            return (
              <Pressable key={note} onPress={() => handleTap(note)} style={{
                width: isBlack ? 58 : 64, height: isBlack ? 80 : 100, borderRadius: 12,
                backgroundColor: isBlack ? '#1a1a2e' : 'rgba(255,255,255,0.08)',
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
                alignItems: 'center', justifyContent: 'center', marginBottom: 4,
              }}>
                <Text style={{ color: '#f4f4f5', fontWeight: '700', fontSize: isBlack ? 13 : 15 }}>{note}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={{ textAlign: 'center', color: '#71717a', marginTop: 12, fontSize: 13 }}>🔥 {streak} • {correct}/{total} • {timeLeft}s</Text>
      </View>
    </View>
  );
}
