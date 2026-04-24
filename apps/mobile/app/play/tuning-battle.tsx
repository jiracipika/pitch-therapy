import { View, Text, Pressable, ScrollView } from 'react-native';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { playTone, NOTE_FREQS_4 } from '@/lib/audio';

const ACCENT = '#F43F5E';
const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

type Phase = 'setup' | 'countdown' | 'playing' | 'roundResult' | 'done';
interface Player { score: number; selectedNote: string; lockedIn: boolean }

function pickRandom() { return ALL_NOTES[Math.floor(Math.random() * ALL_NOTES.length)]; }

export default function TuningBattleScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('setup');
  const [totalRounds, setTotalRounds] = useState(5);
  const [currentRound, setCurrentRound] = useState(0);
  const [targetNote, setTargetNote] = useState('');
  const [countdown, setCountdown] = useState(3);
  const [roundWinner, setRoundWinner] = useState<string | null>(null);
  const [players, setPlayers] = useState<[Player, Player]>([
    { score: 0, selectedNote: '', lockedIn: false },
    { score: 0, selectedNote: '', lockedIn: false },
  ]);

  const targetRef = useRef('');

  const startGame = useCallback(() => {
    setPlayers([{ score: 0, selectedNote: '', lockedIn: false }, { score: 0, selectedNote: '', lockedIn: false }]);
    setCurrentRound(1);
    const note = pickRandom();
    setTargetNote(note); targetRef.current = note;
    setPhase('countdown');
  }, []);

  useEffect(() => {
    if (phase !== 'countdown') return;
    let c = 3;
    setCountdown(c);
    playTone(targetNote, NOTE_FREQS_4[targetNote] || 440, 0.3);
    const iv = setInterval(() => {
      c--;
      if (c > 0) { setCountdown(c); playTone(targetNote, NOTE_FREQS_4[targetNote] || 440, 0.3); }
      else { clearInterval(iv); startRound(); }
    }, 1000);
    return () => clearInterval(iv);
  }, [phase]);

  const startRound = useCallback(() => {
    const note = pickRandom();
    setTargetNote(note); targetRef.current = note;
    setPlayers(p => p.map(pl => ({ ...pl, selectedNote: '', lockedIn: false })) as [Player, Player]);
    setRoundWinner(null); setPhase('playing');
    playTone(targetNote, NOTE_FREQS_4[targetNote] || 440, 0.8);
  }, [targetNote]);

  const selectNote = useCallback((pIdx: number, note: string) => {
    if (phase !== 'playing') return;
    setPlayers(p => { const n = [...p] as [Player, Player]; n[pIdx] = { ...n[pIdx], selectedNote: note }; return n; });
    playTone(note, NOTE_FREQS_4[note] || 261.63, 0.2);
  }, [phase]);

  const lockIn = useCallback((pIdx: number) => {
    if (phase !== 'playing') return;
    const p = players[pIdx];
    if (!p.selectedNote || p.lockedIn) return;

    setPlayers(prev => { const n = [...prev] as [Player, Player]; n[pIdx] = { ...n[pIdx], lockedIn: true }; return n; });

    const otherIdx = 1 - pIdx;
    const other = players[otherIdx];

    // Wait briefly for other player, or auto-judge if other already locked or has no selection
    setTimeout(() => {
      setPlayers(prev => {
        const current = prev;
        const me = current[pIdx];
        const otherP = current[otherIdx];
        const myCorrect = me.selectedNote === targetRef.current;
        const otherCorrect = otherP.selectedNote === targetRef.current;

        let winner: string | null = null;
        if (myCorrect && !otherCorrect) winner = 'P1' + (pIdx === 0 ? '' : ' (via P2 lock)');
        else if (otherCorrect && !myCorrect) winner = otherIdx === 0 ? 'Player 1' : 'Player 2';
        else if (myCorrect && otherCorrect) winner = pIdx === 0 ? 'Player 1' : 'Player 2';

        const wn = myCorrect && !otherCorrect ? (pIdx === 0 ? 'Player 1' : 'Player 2')
          : !myCorrect && otherCorrect ? (otherIdx === 0 ? 'Player 1' : 'Player 2')
          : myCorrect && otherCorrect ? (pIdx === 0 ? 'Player 1' : 'Player 2')
          : null;

        setRoundWinner(wn);
        const next = [...current] as [Player, Player];
        if (wn === 'Player 1') next[0] = { ...next[0], score: next[0].score + 1 };
        if (wn === 'Player 2') next[1] = { ...next[1], score: next[1].score + 1 };
        return next;
      });
      setPhase('roundResult');
    }, other.lockedIn ? 100 : 2000);
  }, [phase, players]);

  const nextOrEnd = useCallback(() => {
    if (currentRound >= totalRounds) { setPhase('done'); }
    else { setCurrentRound(r => r + 1); const n = pickRandom(); setTargetNote(n); targetRef.current = n; setPhase('countdown'); }
  }, [currentRound, totalRounds]);

  const P1_NOTES = ALL_NOTES.slice(0, 6);
  const P2_NOTES = ALL_NOTES.slice(6);

  if (phase === 'setup') {
    return (
      <View style={{ flex: 1, backgroundColor: '#08090D', paddingHorizontal: 20, justifyContent: 'center' }}>
        <Text style={{ textAlign: 'center', fontSize: 48 }}>⚔️</Text>
        <Text style={{ color: ACCENT, fontSize: 26, fontWeight: '700', textAlign: 'center', marginTop: 16 }}>Tuning Battle</Text>
        <Text style={{ color: '#97A3B6', fontSize: 14, textAlign: 'center', marginTop: 8 }}>Two players, one target note. First to lock in wins!</Text>
        <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'center', marginTop: 32 }}>
          {[5, 10].map(n => (
            <Pressable key={n} onPress={() => setTotalRounds(n)} style={{
              backgroundColor: totalRounds === n ? ACCENT : 'rgba(255,255,255,0.04)', borderRadius: 20, paddingVertical: 12, paddingHorizontal: 28, borderWidth: 1, borderColor: totalRounds === n ? ACCENT : 'rgba(255,255,255,0.07)',
            }}>
              <Text style={{ color: totalRounds === n ? '#fff' : '#71717a', fontWeight: '600', fontSize: 16 }}>Best of {n}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={startGame} style={{ backgroundColor: ACCENT, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 32 }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Start Battle</Text>
        </Pressable>
      </View>
    );
  }

  if (phase === 'countdown') {
    return (
      <View style={{ flex: 1, backgroundColor: '#08090D', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#97A3B6', marginBottom: 8 }}>Target: <Text style={{ color: '#F8FAFC', fontWeight: '700', fontSize: 20 }}>{targetNote}</Text></Text>
        <Text style={{ fontSize: 72, fontWeight: '800', color: '#F8FAFC' }}>{countdown > 0 ? countdown : 'GO!'}</Text>
      </View>
    );
  }

  if (phase === 'roundResult') {
    return (
      <View style={{ flex: 1, backgroundColor: '#08090D', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
        <Text style={{ fontSize: 56 }}>{roundWinner ? '🏆' : '🤝'}</Text>
        <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: '700', marginTop: 16 }}>{roundWinner ? `${roundWinner} wins!` : 'Tie!'}</Text>
        <Text style={{ color: '#97A3B6', marginTop: 8 }}>Target was <Text style={{ color: '#F8FAFC', fontWeight: '600' }}>{targetNote}</Text></Text>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
          <View style={{ backgroundColor: 'rgba(21,24,32,0.86)', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', alignItems: 'center' }}>
            <Text style={{ color: '#F8FAFC', fontSize: 20, fontWeight: '700' }}>P1: {players[0].score}</Text>
          </View>
          <View style={{ backgroundColor: 'rgba(21,24,32,0.86)', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', alignItems: 'center' }}>
            <Text style={{ color: '#F8FAFC', fontSize: 20, fontWeight: '700' }}>P2: {players[1].score}</Text>
          </View>
        </View>
        <Pressable onPress={nextOrEnd} style={{ backgroundColor: ACCENT, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 24 }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{currentRound >= totalRounds ? 'See Results' : 'Next Round'}</Text>
        </Pressable>
      </View>
    );
  }

  if (phase === 'done') {
    const w = players[0].score > players[1].score ? 'Player 1' : players[1].score > players[0].score ? 'Player 2' : null;
    return (
      <View style={{ flex: 1, backgroundColor: '#08090D', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
        <Text style={{ fontSize: 56 }}>👑</Text>
        <Text style={{ color: '#F8FAFC', fontSize: 28, fontWeight: '700', marginTop: 16 }}>{w ? `${w} Wins!` : "It's a Tie!"}</Text>
        <View style={{ flexDirection: 'row', gap: 16, marginTop: 24 }}>
          {[{ n: 'Player 1', s: players[0].score }, { n: 'Player 2', s: players[1].score }].map(p => (
            <View key={p.n} style={{ backgroundColor: 'rgba(21,24,32,0.86)', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', alignItems: 'center', flex: 1 }}>
              <Text style={{ color: '#F8FAFC', fontSize: 32, fontWeight: '700' }}>{p.s}</Text>
              <Text style={{ color: '#97A3B6', fontSize: 14, marginTop: 4 }}>{p.n}</Text>
            </View>
          ))}
        </View>
        <Pressable onPress={startGame} style={{ backgroundColor: ACCENT, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 24, width: '100%' }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Rematch</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} style={{ marginTop: 12 }}><Text style={{ color: '#97A3B6', textAlign: 'center' }}>← Dashboard</Text></Pressable>
      </View>
    );
  }

  // Playing
  return (
    <View style={{ flex: 1, backgroundColor: '#08090D' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56 }}>
        <Pressable onPress={() => router.back()}><Text style={{ color: '#97A3B6' }}>← Back</Text></Pressable>
        <Text style={{ color: ACCENT, fontWeight: '700' }}>⚔️ Tuning Battle</Text>
        <Text style={{ color: '#97A3B6' }}>R{currentRound}/{totalRounds}</Text>
      </View>

      <View style={{ alignItems: 'center', marginTop: 20 }}>
        <Text style={{ color: '#97A3B6', fontSize: 14 }}>Target: </Text>
        <Text style={{ color: ACCENT, fontSize: 32, fontWeight: '800' }}>{targetNote}</Text>
        <Pressable onPress={() => playTone(targetNote, NOTE_FREQS_4[targetNote] || 440, 0.5)} style={{ marginTop: 8 }}>
          <Text style={{ fontSize: 24 }}>🔊</Text>
        </Pressable>
      </View>

      <View style={{ flex: 1, flexDirection: 'row', gap: 8, paddingHorizontal: 12, marginTop: 16 }}>
        {/* Player 1 */}
        <View style={{ flex: 1, backgroundColor: 'rgba(21,24,32,0.86)', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: '#F8FAFC', fontWeight: '700', fontSize: 14 }}>P1 • {players[0].score}</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
            {P1_NOTES.map(note => (
              <Pressable key={note} onPress={() => selectNote(0, note)} style={{
                width: 52, height: 52, borderRadius: 10,
                backgroundColor: players[0].selectedNote === note ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)',
                borderWidth: 1, borderColor: players[0].selectedNote === note ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.07)',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ color: players[0].selectedNote === note ? '#fff' : '#a1a1aa', fontWeight: '700', fontSize: 13 }}>{note}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={() => lockIn(0)} disabled={!players[0].selectedNote || players[0].lockedIn} style={{
            backgroundColor: players[0].lockedIn ? 'rgba(74,222,128,0.15)' : players[0].selectedNote ? `${ACCENT}30` : 'rgba(255,255,255,0.03)',
            borderRadius: 12, padding: 10, alignItems: 'center', marginTop: 8,
            borderWidth: 1, borderColor: players[0].lockedIn ? '#4ade80' : players[0].selectedNote ? ACCENT : 'rgba(255,255,255,0.05)',
          }}>
            <Text style={{ color: players[0].lockedIn ? '#4ade80' : players[0].selectedNote ? '#f4f4f5' : '#52525b', fontWeight: '700', fontSize: 13 }}>
              {players[0].lockedIn ? '✓ Locked' : '🔒 Lock In'}
            </Text>
          </Pressable>
        </View>

        {/* Player 2 */}
        <View style={{ flex: 1, backgroundColor: 'rgba(21,24,32,0.86)', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: '#F8FAFC', fontWeight: '700', fontSize: 14 }}>P2 • {players[1].score}</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
            {P2_NOTES.map(note => (
              <Pressable key={note} onPress={() => selectNote(1, note)} style={{
                width: 52, height: 52, borderRadius: 10,
                backgroundColor: players[1].selectedNote === note ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)',
                borderWidth: 1, borderColor: players[1].selectedNote === note ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.07)',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ color: players[1].selectedNote === note ? '#fff' : '#a1a1aa', fontWeight: '700', fontSize: 13 }}>{note}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={() => lockIn(1)} disabled={!players[1].selectedNote || players[1].lockedIn} style={{
            backgroundColor: players[1].lockedIn ? 'rgba(74,222,128,0.15)' : players[1].selectedNote ? `${ACCENT}30` : 'rgba(255,255,255,0.03)',
            borderRadius: 12, padding: 10, alignItems: 'center', marginTop: 8,
            borderWidth: 1, borderColor: players[1].lockedIn ? '#4ade80' : players[1].selectedNote ? ACCENT : 'rgba(255,255,255,0.05)',
          }}>
            <Text style={{ color: players[1].lockedIn ? '#4ade80' : players[1].selectedNote ? '#f4f4f5' : '#52525b', fontWeight: '700', fontSize: 13 }}>
              {players[1].lockedIn ? '✓ Locked' : '🔒 Lock In'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
