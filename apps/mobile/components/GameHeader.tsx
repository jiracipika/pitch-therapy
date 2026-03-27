import { View, Text } from 'react-native';
import { colors } from '@/lib/theme';

interface GameHeaderProps {
  score: number;
  round: number;
  totalRounds: number;
  streak: number;
  accent?: string;
}

export function GameHeader({ score, round, totalRounds, streak, accent = colors.pitchMatch }: GameHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-4 py-3 bg-card border-b border-border">
      <View className="flex-row items-center gap-2">
        <Text className="text-muted text-sm">Round</Text>
        <Text className="text-text font-bold text-lg">{round}/{totalRounds}</Text>
      </View>
      <Text className="font-bold text-2xl" style={{ color: accent }}>{score}</Text>
      <View className="flex-row items-center gap-2">
        <Text className="text-muted text-sm">🔥</Text>
        <Text className="text-text font-bold">{streak}</Text>
      </View>
    </View>
  );
}
