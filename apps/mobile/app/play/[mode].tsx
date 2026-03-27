import { View, Text, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { GAME_MODE_META, type GameMode } from '@pitch-therapy/core';
import { GameHeader } from '@/components/GameHeader';
import { colors } from '@/lib/theme';
import { playTone } from '@/lib/audio';

export default function GameScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode: string }>();
  const meta = GAME_MODE_META[mode as GameMode];

  if (!meta) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted">Unknown game mode</Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="text-blue-500">Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <GameHeader score={0} round={1} totalRounds={10} streak={0} accent={meta.accentHex} />
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-text text-3xl font-bold mb-2">{meta.label}</Text>
        <Text className="text-muted text-center mb-8">{meta.description}</Text>
        <Pressable
          onPress={() => playTone('A4', 440)}
          className="rounded-2xl px-8 py-4 active:opacity-80"
          style={{ backgroundColor: meta.accentHex }}
        >
          <Text className="text-white font-bold text-lg">▶ Play Tone</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} className="mt-6">
          <Text className="text-muted text-sm">← Back to Dashboard</Text>
        </Pressable>
      </View>
    </View>
  );
}
