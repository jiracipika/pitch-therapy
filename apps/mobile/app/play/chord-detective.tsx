import { View, Text, Pressable, ScrollView } from 'react-native';
import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'expo-router';
import { playTone, NOTE_FREQS_4, playFrequency } from '@/lib/audio';
import { triggerCorrectHaptic, triggerIncorrectHaptic } from '@/lib/haptics';

const ACCENT = '#F472B6';

const CHORD_TYPES = [
  { id: 'major', label: 'Major' },
  { id: 'minor', label: 'Minor' },
  { id: 'dim', label: 'Dim' },
  { id: 'aug', label: 'Aug' },
  { id: 'dom7', label: 'Dom 7' },
  { id: 'min7', label: 'Min 7' },
];

const CHORD_INTERVALS: Record<string, number[]> = {
  major: [0, 4, 7], minor: [0, 3, 7], dim: [0, 3, 6],
  aug: [0, 4, 8], dom7: [0, 4, 7, 10], min7: [0, 3, 7, 10],
};

const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

function playChord(root: string, chordType: string) {
  const rootIdx = ALL_NOTES.indexOf(root as typeof ALL_NOTES[number]);
  if (rootIdx < 0) return;
  const intervals = CHORD_INTERVALS[chordType] || CHORD_INTERVALS.major;
  intervals.forEach((semi, i) => {
    const note = ALL_NOTES[(rootIdx + semi) % 12];
    const freq = NOTE_FREQS_4[note];
    if (freq) setTimeout(() => playFrequency(freq, 1.0), i * 30);
  });
}

type Phase = 'setup' | 'playing' | 'feedback' | 'results';
interface Result { round: number; correct: boolean; root: string; type: string }

const ROUNDS = 10;

export default function ChordDetectiveScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('setup');
  const [advanced, setAdvanced] = useState(false);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [root, setRoot] = useState('');
  const [chordType, setChordType] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedRoot, setSelectedRoot] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const targetRef = useRef({ root: '', type: '' });

  const pickRandom = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

  const nextChord = useCallback(() => {
    const r = pickRandom(ALL_NOTES);
    const ct = pickRandom(CHORD_TYPES).id;
    setRoot(r); setChordType(ct);
    targetRef.current = { root: r, type: ct };
    setSelectedType(''); setSelectedRoot(''); setFeedback(null);
    playChord(r, ct);
  }, []);

  const startGame = useCallback(() => {
    setRound(0); setScore(0); setStreak(0); setBestStreak(0); setResults([]);
    nextChord(); setRound(1); setPhase('playing');
  }, [nextChord]);

  const submit = useCallback(() => {
    const correctType = selectedType === targetRef.current.type;
    const correctRoot = !advanced || selectedRoot === targetRef.current.root;
    const allCorrect = correctType && correctRoot;

    if (allCorrect) {
      void triggerCorrectHaptic();
      setScore(s => s + (advanced ? 150 : 100));
      setStreak(s => { const ns = s + 1; setBestStreak(b => Math.max(b, ns)); return ns; });
      setFeedback('correct');
    } else {
      void triggerIncorrectHaptic();
      setStreak(0); setFeedback('wrong');
    }

    setResults(r => [...r, { round, correct: allCorrect, root: targetRef.current.root, type: targetRef.current.type }]);
    setPhase('feedback');

    setTimeout(() => {
      if (round >= ROUNDS) { setPhase('results'); return; }
      nextChord(); setRound(r => r + 1); setPhase('playing');
    }, 1200);
  }, [selectedType, selectedRoot, advanced, round, nextChord]);

  if (phase === 'results') {
    const c = results.filter(r => r.correct).length;
    return (
      <View style={{ flex: 1, backgroundColor: '#09090b' }}>
        <ScrollView contentContainerStyle={{ paddingTop: 80, paddingHorizontal: 20, paddingBottom: 40, alignItems: 'center' }}>
          <Text style={{ fontSize: 48 }}>🕵️</Text>
          <Text style={{ color: '#f4f4f5', fontSize: 28, fontWeight: '700', marginTop: 16 }}>Case Closed!</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 24 }}>
            {[{ l: 'Score', v: String(score) }, { l: 'Correct', v: `${c}/${ROUNDS}` }, { l: 'Best Streak', v: `🔥 ${bestStreak}` }].map(s => (
              <View key={s.l} style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', alignItems: 'center', flex: 1 }}>
                <Text style={{ color: '#f4f4f5', fontSize: 22, fontWeight: '700' }}>{s.v}</Text>
                <Text style={{ color: '#71717a', fontSize: 12, marginTop: 4 }}>{s.l}</Text>
              </View>
            ))}
          </View>
          <Pressable onPress={startGame} style={{ backgroundColor: ACCENT, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 24, width: '100%' }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Play Again</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  if (phase === 'setup') {
    return (
      <View style={{ flex: 1, backgroundColor: '#09090b', paddingHorizontal: 20, justifyContent: 'center' }}>
        <Text style={{ textAlign: 'center', fontSize: 48 }}>🕵️</Text>
        <Text style={{ color: ACCENT, fontSize: 26, fontWeight: '700', textAlign: 'center', marginTop: 16 }}>Chord Detective</Text>
        <Text style={{ color: '#71717a', fontSize: 14, textAlign: 'center', marginTop: 8 }}>Identify chord quality by ear</Text>
        <Pressable onPress={() => setAdvanced(!advanced)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 24 }}>
          <Text style={{ color: '#a1a1aa', fontSize: 14 }}>Advanced: Identify root too</Text>
          <View style={{ width: 48, height: 28, borderRadius: 14, backgroundColor: advanced ? ACCENT : 'rgba(255,255,255,0.1)', justifyContent: 'center', paddingHorizontal: 3 }}>
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', marginLeft: advanced ? 23 : 0 }} />
          </View>
        </Pressable>
        <Pressable onPress={startGame} style={{ backgroundColor: ACCENT, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 32 }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Start Investigation</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#09090b' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56 }}>
        <Pressable onPress={() => router.back()}><Text style={{ color: '#71717a' }}>← Back</Text></Pressable>
        <Text style={{ color: ACCENT, fontWeight: '700' }}>🕵️ Chord Detective</Text>
        <Text style={{ color: '#71717a' }}>{score}</Text>
      </View>

      <View style={{ alignItems: 'center', marginTop: 32 }}>
        <Pressable onPress={() => playChord(root, chordType)} style={{
          width: 96, height: 96, borderRadius: 48, backgroundColor: `${ACCENT}22`, borderWidth: 2, borderColor: ACCENT, alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ fontSize: 36 }}>🔊</Text>
        </Pressable>
        <Text style={{ color: '#71717a', marginTop: 12, fontSize: 14 }}>Tap to replay chord</Text>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 20, marginTop: 24 }}>
        <Text style={{ color: '#71717a', fontSize: 12, fontWeight: '600', marginBottom: 8, textAlign: 'center' }}>CHORD QUALITY</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {CHORD_TYPES.map(ct => (
            <Pressable key={ct.id} onPress={() => phase === 'playing' && setSelectedType(ct.id)} style={{
              backgroundColor: selectedType === ct.id ? `${ACCENT}30` : 'rgba(255,255,255,0.04)', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 20,
              borderWidth: selectedType === ct.id ? 2 : 1, borderColor: selectedType === ct.id ? ACCENT : 'rgba(255,255,255,0.07)',
            }}>
              <Text style={{ color: selectedType === ct.id ? '#fff' : '#a1a1aa', fontWeight: '600', fontSize: 15 }}>{ct.label}</Text>
            </Pressable>
          ))}
        </View>

        {advanced && (
          <View style={{ marginTop: 16 }}>
            <Text style={{ color: '#71717a', fontSize: 12, fontWeight: '600', marginBottom: 8, textAlign: 'center' }}>ROOT NOTE</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
              {ALL_NOTES.map(note => (
                <Pressable key={note} onPress={() => setSelectedRoot(note)} style={{
                  backgroundColor: selectedRoot === note ? `${ACCENT}30` : 'rgba(255,255,255,0.04)', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14,
                  borderWidth: selectedRoot === note ? 2 : 1, borderColor: selectedRoot === note ? ACCENT : 'rgba(255,255,255,0.07)',
                }}>
                  <Text style={{ color: selectedRoot === note ? '#fff' : '#a1a1aa', fontWeight: '700', fontSize: 14 }}>{note}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {feedback && (
          <View style={{
            marginTop: 16, borderRadius: 12, padding: 14, alignItems: 'center',
            backgroundColor: feedback === 'correct' ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
            borderWidth: 1, borderColor: feedback === 'correct' ? '#4ade80' : '#f87171',
          }}>
            <Text style={{ color: feedback === 'correct' ? '#4ade80' : '#f87171', fontWeight: '700', fontSize: 16 }}>
              {feedback === 'correct' ? '✓ Correct!' : `✗ It was ${root} ${CHORD_TYPES.find(c => c.id === chordType)?.label}`}
            </Text>
          </View>
        )}

        <Pressable onPress={submit} disabled={!selectedType || (advanced && !selectedRoot)} style={{
          backgroundColor: (selectedType && (!advanced || selectedRoot)) ? ACCENT : 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 16, marginBottom: 20,
        }}>
          <Text style={{ color: (selectedType && (!advanced || selectedRoot)) ? '#fff' : '#52525b', fontWeight: '700', fontSize: 16 }}>Submit</Text>
        </Pressable>
        <Text style={{ textAlign: 'center', color: '#71717a', marginBottom: 20 }}>🔥 {streak} • Round {round}/{ROUNDS}</Text>
      </ScrollView>
    </View>
  );
}
