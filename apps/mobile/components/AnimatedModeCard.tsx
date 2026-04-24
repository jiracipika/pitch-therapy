import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import type { GameModeMeta } from '@pitch-therapy/core';
import { triggerSelectionHaptic } from '@/lib/haptics';
import { colors, radii, shadows, typography } from '@/lib/theme';

interface AnimatedModeCardProps {
  mode: GameModeMeta;
  compact?: boolean;
}

export function AnimatedModeCard({ mode, compact = false }: AnimatedModeCardProps) {
  const router = useRouter();
  const route = `/play/${mode.id}` as const;

  return (
    <Pressable
      onPress={() => {
        void triggerSelectionHaptic();
        router.push(route);
      }}
      style={({ pressed }) => ({
        transform: [{ scale: pressed ? 0.985 : 1 }],
        opacity: pressed ? 0.88 : 1,
      })}
    >
      <LinearGradient
        colors={[mode.accentHex + '24', colors.card, colors.card]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: mode.accentHex + '40',
          padding: compact ? 14 : 16,
          gap: compact ? 8 : 10,
          ...shadows.card,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: compact ? 38 : 44,
              height: compact ? 38 : 44,
              borderRadius: radii.md,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: mode.accentHex + '22',
              borderWidth: 1,
              borderColor: mode.accentHex + '55',
            }}
          >
            <Text style={{ color: mode.accentHex, fontSize: compact ? 16 : 18, fontWeight: '900' }}>♪</Text>
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={{ color: colors.text, ...typography.headline }} numberOfLines={1}>
              {mode.label}
            </Text>
            <Text style={{ color: colors.textSecondary, ...typography.caption1, lineHeight: 17 }} numberOfLines={2}>
              {mode.description}
            </Text>
          </View>
          <Text style={{ color: mode.accentHex, fontSize: 22, fontWeight: '700' }}>›</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}
