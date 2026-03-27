import Svg, { Circle } from 'react-native-svg';
import { View, Text } from 'react-native';
import { colors } from '@/lib/theme';

interface StreakRingProps {
  streak: number;
  max?: number;
  size?: number;
}

export function StreakRing({ streak, max = 7, size = 80 }: StreakRingProps) {
  const progress = Math.min(streak / max, 1);
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View className="items-center">
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.frequencyGuess}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View className="absolute inset-0 items-center justify-center">
        <Text className="text-text font-bold text-xl">{streak}</Text>
      </View>
    </View>
  );
}
