import { View, Text, Pressable, ScrollView } from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { GAME_MODE_META, DIFFICULTY_CONFIG, type Difficulty } from '@pitch-therapy/core';
import { GameHeader } from '@/components/GameHeader';
import NoteComparisonStaff from '@/components/NoteComparisonStaff';
import { playTone, NOTE_FREQS_4 } from '@/lib/audio';

const MODE = GAME_MODE_META['note-id'];
const ACCENT = MODE.accentHex;

const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

const DIFFICULTY_NOTES: Record<Difficulty, string[]> = {
  easy:   ['C', 'D', 'E', 'G', 'A'],
  medium: ['C', 'C#', 'D', 'E', 'F', 'G', 'A', 'B'],
  hard:   [...ALL_NOTES],
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

type Phase = 'select-difficulty' | 'playing' | 'results';

interface RoundResult { target: string; answer: string; correct: boolean }

export default function NoteIdScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('select-difficulty');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [target, setTarget] = useState('');
  const [feedback, setFeedback] = useState<null | 'correct' | 'wrong'>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [roundStart, setRoundStart] = useState(0);

  const totalRounds = DIFFICULTY_CONFIG[difficulty].rounds;
  const notePool = DIFFICULTY_NOTES[difficulty];

  const startGame = useCallback((diff: Difficulty) => {
    setDifficulty(diff);
    const first = pickRandom(DIFFICULTY_NOTES[diff]);
    setTarget(first);
    setRound(1);
    setScore(0);
    setStreak(0);
    setResults([]);
    setFeedback(null);
    setSelected(null);
    setRoundStart(Date.now());
    setPhase('playing');
    const freq = NOTE_FREQS_4[first];
    if (freq) playTone(first, freq);
  }, []);

  const handlePlay = useCallback(() => {
    const freq = NOTE_FREQS_4[target];
    if (freq) playTone(target, freq);
  }, [target]);

  const handleAnswer = useCallback((note: string) => {
    if (feedback !== null) return;
    const correct = note === target;
    const elapsed = Date.now() - roundStart;
    const pts = correct ? Math.max(10, Math.round(100 * Math.max(0, 1 - elapsed / 8000))) : 0;
    const newStreak = correct ? streak + 1 : 0;

    setSelected(note);
    setFeedback(correct ? 'correct' : 'wrong');
    setScore((s) => s + pts);
    setStreak(newStreak);
    setResults((r) => [...r, { target, answer: note, correct }]);

    setTimeout(() => {
      if (round >= totalRounds) {
        setPhase('results');
      } else {
        const next = pickRandom(notePool);
        setTarget(next);
        setRound((r) => r + 1);
        setFeedback(null);
        setSelected(null);
        setRoundStart(Date.now());
        const freq = NOTE_FREQS_4[next];
        if (freq) playTone(next, freq);
      }
    }, 900);
  }, [feedback, target, round, totalRounds, streak, notePool, roundStart]);

  // ── Select Difficulty ──────────────────────────────────────────────────────
  if (phase === 'select-difficulty') {
    return (
      <View style={{ flex: 1, backgroundColor: '#09090b' }}>
        <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: ACCENT }} />
          <Text style={{ color: '#f4f4f5', fontSize: 22, fontWeight: '700' }}>{MODE.label}</Text>
        </View>
        <View style={{ flex: 1, paddingHorizontal: 20, justifyContent: 'center' }}>
          <Text style={{ color: '#71717a', fontSize: 14, marginBottom: 8 }}>Identify the note you hear.</Text>
          <Text style={{ color: '#f4f4f5', fontSize: 18, fontWeight: '600', marginBottom: 32 }}>
            Select difficulty
          </Text>
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
            <Pressable
              key={d}
              onPress={() => startGame(d)}
              style={({ pressed }) => ({
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderRadius: 16,
                padding: 20,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.07)',
                marginBottom: 12,
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <Text style={{ color: '#f4f4f5', fontWeight: '600', fontSize: 16, textTransform: 'capitalize' }}>{d}</Text>
              <Text style={{ color: '#71717a', fontSize: 13, marginTop: 3 }}>
                {DIFFICULTY_NOTES[d].length} notes · {DIFFICULTY_CONFIG[d].rounds} rounds
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={() => router.back()} style={{ padding: 20 }}>
          <Text style={{ color: '#71717a', textAlign: 'center' }}>← Back</Text>
        </Pressable>
      </View>
    );
  }

  // ── Results ────────────────────────────────────────────────────────────────
  if (phase === 'results') {
    const correct = results.filter((r) => r.correct).length;
    return (
      <View style={{ flex: 1, backgroundColor: '#09090b' }}>
        <ScrollView contentContainerStyle={{ paddingTop: 80, paddingHorizontal: 20, paddingBottom: 40 }}>
          <Text style={{ color: '#f4f4f5', fontSize: 28, fontWeight: '700', marginBottom: 4 }}>Round Complete!</Text>
          <Text style={{ color: '#71717a', marginBottom: 32 }}>{MODE.label} · {difficulty}</Text>

          <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', marginBottom: 20, alignItems: 'center' }}>
            <Text style={{ color: ACCENT, fontSize: 48, fontWeight: '700' }}>{score}</Text>
            <Text style={{ color: '#71717a', marginTop: 4 }}>points</Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
            {[
              { label: 'Correct', value: `${correct}/${totalRounds}` },
              { label: 'Accuracy', value: `${Math.round((correct / totalRounds) * 100)}%` },
            ].map((s) => (
              <View key={s.label} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', alignItems: 'center' }}>
                <Text style={{ color: '#f4f4f5', fontSize: 20, fontWeight: '700' }}>{s.value}</Text>
                <Text style={{ color: '#71717a', fontSize: 12, marginTop: 2 }}>{s.label}</Text>
              </View>
            ))}
          </View>

          {results.map((r, i) => (
            <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}>
              <Text style={{ color: '#71717a', fontSize: 13 }}>Round {i + 1}</Text>
              <Text style={{ color: '#f4f4f5', fontSize: 13, fontWeight: '600' }}>Target: {r.target}</Text>
              <Text style={{ color: r.correct ? '#4ade80' : '#f87171', fontSize: 13 }}>
                {r.correct ? '✓' : `✗ ${r.answer}`}
              </Text>
            </View>
          ))}

          <Pressable
            onPress={() => startGame(difficulty)}
            style={{ backgroundColor: ACCENT, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 24 }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Play Again</Text>
          </Pressable>
          <Pressable onPress={() => router.back()} style={{ padding: 16 }}>
            <Text style={{ color: '#71717a', textAlign: 'center' }}>← Dashboard</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  // ── Playing ────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#09090b' }}>
      <GameHeader score={score} round={round} totalRounds={totalRounds} streak={streak} accent={ACCENT} />

      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 32 }}>
        {/* Play button */}
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <Pressable
            onPress={handlePlay}
            style={({ pressed }) => ({
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: ACCENT + '22',
              borderWidth: 2,
              borderColor: ACCENT,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <Text style={{ fontSize: 36 }}>▶</Text>
          </Pressable>
          <Text style={{ color: '#71717a', marginTop: 12, fontSize: 14 }}>Tap to replay tone</Text>
        </View>

        {/* Feedback banner */}
        {feedback && (
          <View style={{
            backgroundColor: feedback === 'correct' ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
            borderRadius: 12,
            padding: 12,
            marginBottom: 20,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: feedback === 'correct' ? '#4ade80' : '#f87171',
          }}>
            <Text style={{ color: feedback === 'correct' ? '#4ade80' : '#f87171', fontWeight: '700', fontSize: 16 }}>
              {feedback === 'correct' ? '✓ Correct!' : `✗ It was ${target}`}
            </Text>
          </View>
        )}

        {/* Staff comparison after reveal */}
        {feedback && selected && (
          <NoteComparisonStaff
            guessedNote={selected}
            correctNote={target}
            isCorrect={feedback === 'correct'}
          />
        )}

        {/* Note grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
          {notePool.map((note) => {
            const isSelected = selected === note;
            const isTarget = feedback !== null && note === target;
            let bgColor = 'rgba(255,255,255,0.04)';
            let borderColor = 'rgba(255,255,255,0.07)';
            let textColor = '#f4f4f5';

            if (isTarget && feedback !== null) {
              bgColor = 'rgba(74,222,128,0.15)';
              borderColor = '#4ade80';
              textColor = '#4ade80';
            } else if (isSelected && feedback === 'wrong') {
              bgColor = 'rgba(248,113,113,0.15)';
              borderColor = '#f87171';
              textColor = '#f87171';
            }

            return (
              <Pressable
                key={note}
                onPress={() => handleAnswer(note)}
                style={({ pressed }) => ({
                  width: 64,
                  height: 56,
                  borderRadius: 12,
                  backgroundColor: bgColor,
                  borderWidth: 1,
                  borderColor,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <Text style={{ color: textColor, fontWeight: '700', fontSize: 15 }}>{note}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable onPress={() => router.back()} style={{ padding: 20 }}>
        <Text style={{ color: '#71717a', textAlign: 'center', fontSize: 13 }}>← Dashboard</Text>
      </Pressable>
    </View>
  );
}
