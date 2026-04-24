import { View, Text, Pressable, ScrollView } from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { playTone, NOTE_FREQS_4 } from '@/lib/audio';
import { GameHeader } from '@/components/GameHeader';
import { triggerCorrectHaptic, triggerIncorrectHaptic } from '@/lib/haptics';

const ACCENT = '#6366F1';
const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const TOTAL_ROUNDS = 8;

type KeyboardMode = 'chromatic' | 'diatonic' | 'key';

const MODE_CONFIG: Record<KeyboardMode, { label: string; keys: string[] }> = {
  chromatic: { label: 'Chromatic', keys: KEYS },
  diatonic: { label: 'Diatonic', keys: ['C', 'D', 'E', 'F', 'G', 'A', 'B'] },
  key: { label: 'Key of G', keys: ['G', 'A', 'B', 'C', 'D', 'E', 'F#'] },
};

type Phase = 'setup' | 'playing' | 'results';

interface RoundResult { round: number; target: string; answer: string; correct: boolean; points: number }

export default function PianoTapScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('setup');
  const [kbMode, setKbMode] = useState<KeyboardMode>('diatonic');
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [target, setTarget] = useState('C');
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [results, setResults] = useState<RoundResult[]>([]);

  const activeKeys = MODE_CONFIG[kbMode].keys;

  const pickTarget = () => activeKeys[Math.floor(Math.random() * activeKeys.length)];

  const startGame = (mode: KeyboardMode) => {
    setKbMode(mode);
    const first = pickTarget();
    setTarget(first);
    setRound(1);
    setScore(0);
    setStreak(0);
    setResults([]);
    setFeedback(null);
    setSelected(null);
    setPhase('playing');
    const freq = NOTE_FREQS_4[first];
    if (freq) playTone(first, freq);
  };

  const handlePlay = () => {
    const freq = NOTE_FREQS_4[target];
    if (freq) playTone(target, freq);
  };

  const handleKey = (key: string) => {
    if (feedback) return;
    const freq = NOTE_FREQS_4[key];
    if (freq) playTone(key, freq, 0.3);

    const correct = key === target;
    const points = correct ? 100 : 0;
    if (correct) void triggerCorrectHaptic();
    else void triggerIncorrectHaptic();

    setSelected(key);
    setFeedback(correct ? 'correct' : 'wrong');
    if (correct) setStreak(s => s + 1); else setStreak(0);
    setScore(s => s + points);
    setResults(r => [...r, { round, target, answer: key, correct, points }]);

    setTimeout(() => {
      if (round >= TOTAL_ROUNDS) { setPhase('results'); }
      else {
        const next = pickTarget();
        setTarget(next);
        setRound(r => r + 1);
        setFeedback(null);
        setSelected(null);
        const f = NOTE_FREQS_4[next];
        if (f) playTone(next, f);
      }
    }, 900);
  };

  if (phase === 'setup') {
    return (
      <View style={{ flex: 1, backgroundColor: '#09090b' }}>
        <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 20 }}>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: ACCENT }} />
          <Text style={{ color: '#f4f4f5', fontSize: 22, fontWeight: '700', marginTop: 12 }}>Piano Tap</Text>
          <Text style={{ color: '#71717a', fontSize: 14, marginTop: 4 }}>Tap the correct piano key</Text>
        </View>
        <View style={{ flex: 1, paddingHorizontal: 20, justifyContent: 'center' }}>
          <Text style={{ color: '#f4f4f5', fontSize: 18, fontWeight: '600', marginBottom: 16 }}>Keyboard Mode</Text>
          {(Object.keys(MODE_CONFIG) as KeyboardMode[]).map(m => (
            <Pressable key={m} onPress={() => startGame(m)} style={({ pressed }) => ({ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', marginBottom: 12, opacity: pressed ? 0.75 : 1 })}>
              <Text style={{ color: '#f4f4f5', fontWeight: '600', fontSize: 16 }}>{MODE_CONFIG[m].label}</Text>
              <Text style={{ color: '#71717a', fontSize: 13, marginTop: 3 }}>{MODE_CONFIG[m].keys.length} keys · {TOTAL_ROUNDS} rounds</Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={() => router.back()} style={{ padding: 20 }}>
          <Text style={{ color: '#71717a', textAlign: 'center' }}>← Back</Text>
        </Pressable>
      </View>
    );
  }

  if (phase === 'results') {
    const correct = results.filter(r => r.correct).length;
    return (
      <View style={{ flex: 1, backgroundColor: '#09090b' }}>
        <ScrollView contentContainerStyle={{ paddingTop: 80, paddingHorizontal: 20, paddingBottom: 40 }}>
          <Text style={{ color: '#f4f4f5', fontSize: 28, fontWeight: '700', marginBottom: 4 }}>Piano Tap Complete!</Text>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', marginBottom: 20, alignItems: 'center' }}>
            <Text style={{ color: ACCENT, fontSize: 48, fontWeight: '700' }}>{score}</Text>
            <Text style={{ color: '#71717a', marginTop: 4 }}>points</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
            {[{ label: 'Correct', value: `${correct}/${TOTAL_ROUNDS}` }, { label: 'Streak', value: `🔥 ${streak}` }].map(s => (
              <View key={s.label} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', alignItems: 'center' }}>
                <Text style={{ color: '#f4f4f5', fontSize: 20, fontWeight: '700' }}>{s.value}</Text>
                <Text style={{ color: '#71717a', fontSize: 12, marginTop: 2 }}>{s.label}</Text>
              </View>
            ))}
          </View>
          <Pressable onPress={() => startGame(kbMode)} style={{ backgroundColor: ACCENT, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 24 }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Play Again</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#09090b' }}>
      <GameHeader score={score} round={round} totalRounds={TOTAL_ROUNDS} streak={streak} accent={ACCENT} />
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 32 }}>
        <Pressable onPress={handlePlay} style={{ alignSelf: 'center', width: 72, height: 72, borderRadius: 18, backgroundColor: `${ACCENT}22`, borderWidth: 2, borderColor: ACCENT, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <Text style={{ fontSize: 28 }}>🔊</Text>
        </Pressable>
        <Text style={{ textAlign: 'center', color: '#71717a', fontSize: 13, marginBottom: 24 }}>Tap to replay note</Text>

        {feedback && (
          <View style={{ backgroundColor: feedback === 'correct' ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)', borderRadius: 12, padding: 12, marginBottom: 20, alignItems: 'center', borderWidth: 1, borderColor: feedback === 'correct' ? '#4ade80' : '#f87171' }}>
            <Text style={{ color: feedback === 'correct' ? '#4ade80' : '#f87171', fontWeight: '700', fontSize: 16 }}>
              {feedback === 'correct' ? '✓ Correct!' : `✗ It was ${target}`}
            </Text>
          </View>
        )}

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {activeKeys.map(key => {
            const isTarget = feedback && key === target;
            const isSelected = selected === key && feedback === 'wrong';
            const isBlack = key.includes('#');
            let bgColor = isBlack ? 'rgba(20,20,30,0.9)' : 'rgba(255,255,255,0.06)';
            let borderColor = 'rgba(255,255,255,0.1)';
            let textColor = '#f4f4f5';

            if (isTarget) { bgColor = 'rgba(74,222,128,0.15)'; borderColor = '#4ade80'; textColor = '#4ade80'; }
            else if (isSelected) { bgColor = 'rgba(248,113,113,0.15)'; borderColor = '#f87171'; textColor = '#f87171'; }

            return (
              <Pressable key={key} onPress={() => handleKey(key)} style={({ pressed }) => ({
                width: 56, height: 80, borderRadius: 10, backgroundColor: bgColor,
                borderWidth: 1, borderColor, alignItems: 'center', justifyContent: 'flex-end',
                paddingBottom: 8, opacity: pressed ? 0.75 : 1,
              })}>
                <Text style={{ color: textColor, fontWeight: '700', fontSize: 13 }}>{key}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={{ textAlign: 'center', color: '#52525b', fontSize: 12, marginTop: 24 }}>{MODE_CONFIG[kbMode].label} mode</Text>
      </View>
    </View>
  );
}
