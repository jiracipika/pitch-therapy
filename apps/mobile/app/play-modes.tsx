import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { GAME_MODE_META } from '@pitch-therapy/core';
import { AppPage } from '@/components/AppPage';

const MODE_CATEGORIES = [
  { id: 'foundational', label: 'Foundational', modes: ['note-id', 'frequency-guess', 'pitch-match'] as const },
  { id: 'wordle', label: 'Wordle Style', modes: ['note-wordle', 'frequency-wordle'] as const },
  { id: 'pitch', label: 'Pitch Training', modes: ['pitch-memory', 'interval-archer', 'name-that-note'] as const },
  { id: 'advanced', label: 'Advanced', modes: ['cents-deviation', 'chord-detective', 'waveform-match', 'tuning-battle'] as const },
  { id: 'interactive', label: 'Interactive', modes: ['piano-tap', 'frequency-slider', 'frequency-hunt', 'drone-lock', 'tune-in'] as const },
  { id: 'speed', label: 'Speed & Challenge', modes: ['speed-round'] as const },
] as const;

export default function PlayModesScreen() {
  const router = useRouter();

  return (
    <AppPage title="Play Modes" subtitle="Pick a track and start training.">
      {MODE_CATEGORIES.map((category) => (
        <View key={category.id} style={{ gap: 10 }}>
          <Text style={{ color: '#9ca3af', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' }}>
            {category.label}
          </Text>

          {category.modes.map((modeId) => {
            const mode = GAME_MODE_META[modeId];
            return (
              <Pressable
                key={modeId}
                onPress={() => router.push(`/play/${modeId}`)}
                style={({ pressed }) => ({
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.08)',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: mode.accentHex + '22',
                    borderWidth: 1,
                    borderColor: mode.accentHex + '55',
                  }}
                >
                  <Text style={{ color: mode.accentHex, fontSize: 18, fontWeight: '700' }}>◉</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#f5f5f5', fontWeight: '700', fontSize: 15 }}>{mode.label}</Text>
                  <Text style={{ color: '#9ca3af', fontSize: 13, marginTop: 2 }}>{mode.description}</Text>
                </View>
                <Text style={{ color: mode.accentHex, fontSize: 18 }}>›</Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </AppPage>
  );
}
