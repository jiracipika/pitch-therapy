import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import type { GameModeMeta } from '@pitch-therapy/core';

interface ModeCardProps {
  mode: GameModeMeta;
}

export function ModeCard({ mode }: ModeCardProps) {
  const router = useRouter();
  const route = `/play/${mode.id}` as const;

  return (
    <Pressable
      onPress={() => router.push(route)}
      className="bg-card rounded-2xl p-5 border border-border active:opacity-80"
    >
      <View className="flex-row items-center gap-3 mb-2">
        <View
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: mode.accentHex }}
        />
        <Text className="text-text font-bold text-lg">{mode.label}</Text>
      </View>
      <Text className="text-muted text-sm">{mode.description}</Text>
    </Pressable>
  );
}
