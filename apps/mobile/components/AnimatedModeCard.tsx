import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import type { GameModeMeta } from '@pitch-therapy/core';

interface AnimatedModeCardProps {
  mode: GameModeMeta;
}

export function AnimatedModeCard({ mode }: AnimatedModeCardProps) {
  const router = useRouter();
  const route = `/play/${mode.id}` as const;

  return (
    <Pressable
      onPress={() => router.push(route)}
      style={({ pressed }) => ({
        transform: [{ scale: pressed ? 0.98 : 1 }],
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <View
        style={{
          backgroundColor: 'rgba(255,255,255,0.04)',
          borderRadius: 16,
          padding: 20,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.07)',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 2 }}>
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: mode.accentHex,
            }}
          />
          <Text style={{ color: '#f4f4f5', fontWeight: '700', fontSize: 18 }}>
            {mode.label}
          </Text>
        </View>
        <Text style={{ color: '#71717a', fontSize: 14, marginLeft: 24 }}>
          {mode.description}
        </Text>
      </View>
    </Pressable>
  );
}
