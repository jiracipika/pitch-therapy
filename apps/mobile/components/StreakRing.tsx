import { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useReducedMotionPreference } from '@/lib/motion';
import { colors, typography } from '@/lib/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface StreakRingProps {
  streak: number;
  max?: number;
  size?: number;
  /** Pulse the ring subtly when the streak is active (>0). */
  pulse?: boolean;
}

export function StreakRing({ streak, max = 7, size = 80, pulse = true }: StreakRingProps) {
  const reducedMotion = useReducedMotionPreference();
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(streak / max, 1);
  const initialOffset = circumference * (1 - 0); // starts fully empty

  // Animated dashoffset for the fill
  const dashOffset = useRef(new Animated.Value(initialOffset)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const targetOffset = circumference * (1 - progress);
    if (reducedMotion) {
      dashOffset.setValue(targetOffset);
      return;
    }

    Animated.spring(dashOffset, {
      toValue: targetOffset,
      damping: 18,
      stiffness: 80,
      mass: 1,
      useNativeDriver: false, // SVG props need JS driver
    }).start();
  }, [circumference, dashOffset, progress, reducedMotion]);

  // Subtle pulse on active streaks
  useEffect(() => {
    if (reducedMotion || !pulse || streak === 0) {
      pulseScale.setValue(1);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.03,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseScale, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, pulseScale, reducedMotion, streak]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale: pulseScale }] }}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.borderStrong}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.speedRound}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
      </Animated.View>
      <View style={[styles.overlay, { width: size, height: size }]}>
        <Text style={styles.streakText}>{streak}</Text>
      </View>
    </View>
  );
}

// Animated Circle wrapper — created via createAnimatedComponent at top of file

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakText: {
    color: colors.text,
    ...typography.title3,
    fontVariant: ['tabular-nums'],
  },
});
