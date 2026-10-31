import { useEffect, useRef } from 'react';
import { Animated, View, Text, Pressable, StyleSheet, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReducedMotionPreference } from '@/lib/motion';
import { colors, radii, shadows, typography } from '@/lib/theme';

interface GameHeaderProps {
  score: number;
  round: number;
  totalRounds: number;
  streak: number;
  accent?: string;
  /** Renders a back chevron — for screens whose playing phase has no other exit. */
  onBack?: () => void;
}

export function GameHeader({ score, round, totalRounds, streak, accent = colors.pitchMatch, onBack }: GameHeaderProps) {
  const insets = useSafeAreaInsets();
  const reduce = useReducedMotionPreference();

  // Pulse the score pill and streak metric whenever their values change,
  // so point gains register visually without pulling the whole header.
  const scorePulse = useRef(new Animated.Value(1)).current;
  const streakPulse = useRef(new Animated.Value(1)).current;
  const prevScore = useRef(score);
  const prevStreak = useRef(streak);

  useEffect(() => {
    if (score === prevScore.current) return;
    prevScore.current = score;
    if (reduce) return;
    scorePulse.setValue(1);
    Animated.sequence([
      Animated.timing(scorePulse, {
        toValue: 1.18,
        duration: 130,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(scorePulse, { toValue: 1, stiffness: 320, damping: 17, mass: 0.7, useNativeDriver: true }),
    ]).start();
  }, [score, reduce, scorePulse]);

  useEffect(() => {
    if (streak === prevStreak.current) return;
    prevStreak.current = streak;
    if (reduce) return;
    streakPulse.setValue(1);
    Animated.sequence([
      Animated.timing(streakPulse, {
        toValue: 1.16,
        duration: 130,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(streakPulse, { toValue: 1, stiffness: 320, damping: 17, mass: 0.7, useNativeDriver: true }),
    ]).start();
  }, [streak, reduce, streakPulse]);

  return (
    <LinearGradient
      colors={[accent + '22', colors.card, colors.card]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { borderColor: accent + '40', marginTop: Math.max(14, insets.top + 8) }]}
    >
      <View style={styles.metric}>
        <View style={styles.metricInner}>
          {onBack ? (
            <Pressable
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel="Back to dashboard"
              hitSlop={10}
              style={styles.backBtn}
            >
              <Text style={styles.backBtnText}>‹</Text>
            </Pressable>
          ) : null}
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Round</Text>
            <Text style={styles.metricValue}>{totalRounds > 0 ? `${round}/${totalRounds}` : round}</Text>
          </View>
        </View>
      </View>
      <Animated.View style={[styles.scorePill, { transform: [{ scale: scorePulse }] }]} accessibilityLabel={`Score ${score}`}>
        <Text style={[styles.scoreText, { color: accent }]}>{score}</Text>
        <Text style={styles.scoreLabel}>Score</Text>
      </Animated.View>
      <Animated.View style={[styles.metric, styles.metricRight, { transform: [{ scale: streakPulse }] }]}>
        <Text style={styles.label}>Streak</Text>
        <Text style={styles.metricValue}>{streak}</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 14,
    padding: 12,
    borderRadius: radii.lg,
    borderWidth: 1,
    ...shadows.card,
  },
  metric: {
    flex: 1,
    gap: 3,
  },
  metricInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    color: colors.textSecondary,
    fontSize: 22,
    fontWeight: '600',
    marginTop: -2,
  },
  metricRight: {
    alignItems: 'flex-end',
  },
  label: {
    color: colors.textTertiary,
    ...typography.caption1,
  },
  metricValue: {
    color: colors.text,
    ...typography.headline,
    fontVariant: ['tabular-nums'],
  },
  scorePill: {
    minWidth: 96,
    alignItems: 'center',
    gap: 1,
  },
  scoreText: {
    ...typography.title2,
    fontVariant: ['tabular-nums'],
  },
  scoreLabel: {
    color: colors.textTertiary,
    ...typography.caption2,
  },
});
