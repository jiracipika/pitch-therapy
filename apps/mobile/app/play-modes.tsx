import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { GAME_MODE_META } from '@pitch-therapy/core';
import { AnimatedTabBar } from '@/components/AnimatedTabBar';

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
    <View style={{ flex: 1, backgroundColor: '#09090b' }}>
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 16 }}
        contentContainerStyle={{ paddingTop: 56, paddingBottom: 100 }}
      >
        <Text style={{ color: '#f4f4f5', fontSize: 28, fontWeight: '700', marginBottom: 4 }}>
          Play Modes
        </Text>
        <Text style={{ color: '#71717a', fontSize: 14, marginBottom: 32 }}>
          Choose your training mode
        </Text>

        {MODE_CATEGORIES.map((category) => (
          <View key={category.id} style={{ marginBottom: 28 }}>
            <Text
              style={{
                color: '#71717a',
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 12,
              }}
            >
              {category.label}
            </Text>

            <View style={{ gap: 10 }}>
              {category.modes.map((modeId) => {
                const mode = GAME_MODE_META[modeId];
                return (
                  <Pressable
                    key={modeId}
                    onPress={() => router.push(`/play/${modeId}`)}
                    style={({ pressed }) => ({
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      borderRadius: 16,
                      padding: 18,
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.07)',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 14,
                      opacity: pressed ? 0.75 : 1,
                    })}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: mode.accentHex + '20',
                      }}
                    >
                      <Text style={{ color: mode.accentHex, fontSize: 20, fontWeight: '700' }}>◉</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#f4f4f5', fontWeight: '600', fontSize: 16 }}>
                        {mode.label}
                      </Text>
                      <Text style={{ color: '#71717a', fontSize: 13, marginTop: 2 }}>
                        {mode.description}
                      </Text>
                    </View>
                    <Text style={{ color: mode.accentHex, fontSize: 18 }}>›</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      <AnimatedTabBar />
    </View>
  );
}
