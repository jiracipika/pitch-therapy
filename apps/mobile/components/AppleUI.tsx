import { type ReactNode, useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import { AnimatedCounter, useReducedMotionPreference } from '@/lib/motion';
import { colors, radii, typography } from '@/lib/theme';

interface GlassCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  padding?: number;
  accent?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

// Inset-grouped card (iOS Settings/Fitness): flat elevated surface, hairline
// edge, no gradient/glow. `accent` is accepted for API compatibility and
// intentionally unused — grouping, not accent tinting, carries the hierarchy.
export function GlassCard({
  children,
  style,
  onPress,
  padding = 16,
  accessibilityLabel,
  accessibilityHint,
}: GlassCardProps) {
  const content = <View style={[styles.glass, { padding }, style]}>{children}</View>;

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => ({
        minHeight: 48,
        opacity: pressed ? 0.88 : 1,
        transform: [{ scale: pressed ? 0.988 : 1 }],
      })}
    >
      {content}
    </Pressable>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
}

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {action ? (
        <Pressable onPress={action.onPress} hitSlop={8}>
          <Text style={styles.sectionAction}>{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

interface AppleButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'text';
  color?: string;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function AppleButton({
  title,
  onPress,
  variant = 'primary',
  color = colors.blue,
  loading,
  disabled,
  style,
  accessibilityLabel,
  accessibilityHint,
}: AppleButtonProps) {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: Boolean(disabled || loading), busy: Boolean(loading) }}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: isPrimary ? color : isSecondary ? colors.surfaceElevated : 'transparent',
          borderWidth: isSecondary ? 0 : 0,
          opacity: pressed ? 0.75 : disabled ? 0.4 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      <Text style={[styles.buttonText, { color: isPrimary ? '#FFFFFF' : colors.text }]}>
        {loading ? 'Loading...' : title}
      </Text>
    </Pressable>
  );
}

interface PillProps {
  label: string;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export function Pill({ label, color = colors.blue, style }: PillProps) {
  return (
    <View style={[styles.pill, { backgroundColor: color + '1F', borderColor: color + '4D' }, style]}>
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

interface StatItemProps {
  label: string;
  value: string | number;
  color?: string;
}

export function StatItem({ label, value, color = colors.text }: StatItemProps) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── AnimatedStatItem ───────────────────────────────────────────────────────
// Stat item with a count-up animation for numeric values. Falls back to
// plain text for non-numeric values and when reduced-motion is active.

interface AnimatedStatItemProps {
  label: string;
  /** Numeric value to count up, or a string for non-animated display. */
  value: number | string;
  color?: string;
  /** Suffix for the count-up (e.g. '%', 'd'). */
  suffix?: string;
  /** Prefix for the count-up (e.g. '▲ '). */
  prefix?: string;
}

export function AnimatedStatItem({
  label,
  value,
  color = colors.text,
  suffix = '',
  prefix = '',
}: AnimatedStatItemProps) {
  const isNumeric = typeof value === 'number' && Number.isFinite(value);
  return (
    <View style={styles.statItem}>
      {isNumeric ? (
        <AnimatedCounter
          value={value as number}
          suffix={suffix}
          prefix={prefix}
          style={[styles.statValue, { color }]}
        />
      ) : (
        <Text style={[styles.statValue, { color }]}>{value}</Text>
      )}
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

interface RecommendedStep {
  label: string;
  detail: string;
  modeId?: string;
  cue?: { durationLabel: string };
}

interface RecommendedPathProps {
  steps: RecommendedStep[];
  accent?: string;
  compact?: boolean;
  onStepPress?: (step: RecommendedStep) => void;
}

export function RecommendedPath({ steps, accent = colors.blue, compact, onStepPress }: RecommendedPathProps) {
  return (
    <GlassCard accent={accent} padding={compact ? 12 : 14}>
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <Text style={{ color: colors.text, ...typography.headline }}>Recommended path</Text>
          <Pill label={onStepPress ? 'Tap to train' : 'Guided flow'} color={accent} />
        </View>
        <View style={{ gap: 8 }}>
          {steps.map((step, index) => {
            const row = (
              <>
                <View style={[styles.pathIndex, { borderColor: accent + '55', backgroundColor: accent + '24' }]}>
                  <Text style={[styles.pathIndexText, { color: accent }]}>{index + 1}</Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.pathLabel, { flex: 1 }]}>{step.label}</Text>
                    {step.cue ? <Text style={{ color: accent, ...typography.caption2, fontWeight: '700' }}>{step.cue.durationLabel}</Text> : null}
                  </View>
                  <Text style={styles.pathDetail}>{step.detail}</Text>
                </View>
                {onStepPress ? <Text style={{ color: accent, fontSize: 24 }}>›</Text> : null}
              </>
            );

            return onStepPress ? (
              <Pressable
                key={`${step.label}-${index}`}
                onPress={() => onStepPress(step)}
                accessibilityRole="button"
                accessibilityLabel={`${step.label}: ${step.detail}`}
                accessibilityHint="Starts this recommended practice step"
                style={({ pressed }) => [styles.pathRow, { opacity: pressed ? 0.8 : 1, backgroundColor: pressed ? accent + '18' : 'rgba(255,255,255,0.045)' }]}
              >
                {row}
              </Pressable>
            ) : (
              <View key={`${step.label}-${index}`} style={styles.pathRow}>{row}</View>
            );
          })}
        </View>
      </View>
    </GlassCard>
  );
}

interface MotionStatusCardProps {
  tone: 'loading' | 'success' | 'error' | 'empty';
  title: string;
  message: string;
}

const toneToColor: Record<MotionStatusCardProps['tone'], string> = {
  loading: colors.blue,
  success: colors.green,
  error: colors.red,
  empty: colors.textTertiary,
};

export function MotionStatusCard({ tone, title, message }: MotionStatusCardProps) {
  const pulse = useRef(new Animated.Value(0)).current;
  const reducedMotion = useReducedMotionPreference();

  useEffect(() => {
    if (reducedMotion) {
      pulse.setValue(tone === 'loading' ? 0.35 : 0);
      return;
    }

    if (tone === 'loading') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 820, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0, duration: 820, useNativeDriver: true }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }

    Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 230, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 420, useNativeDriver: true }),
    ]).start();
  }, [pulse, reducedMotion, tone]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });
  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });
  const toneColor = toneToColor[tone];
  const toneGlyph = tone === 'success' ? 'check' : tone === 'error' ? '!' : tone === 'empty' ? 'i' : '...';

  return (
    <GlassCard accent={toneColor} padding={14}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Animated.View
          style={{
            width: 18,
            height: 18,
            borderRadius: 18,
            backgroundColor: toneColor,
            opacity,
            transform: [{ scale }],
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: colors.text, fontSize: tone === 'loading' ? 8 : 10, fontWeight: '800' }}>{toneGlyph}</Text>
        </Animated.View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, ...typography.subhead }} numberOfLines={2}>
            {title}
          </Text>
          <Text style={{ color: colors.textSecondary, ...typography.caption1, marginTop: 2, lineHeight: 17 }} numberOfLines={3}>
            {message}
          </Text>
        </View>
      </View>
      {tone === 'loading' ? (
        <View
          style={{
            marginTop: 10,
            height: 6,
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.08)',
            overflow: 'hidden',
          }}
        >
          <Animated.View
            style={{
              width: '45%',
              height: '100%',
              borderRadius: 999,
              backgroundColor: toneColor,
              opacity: reducedMotion ? 0.45 : opacity,
              transform: reducedMotion ? undefined : [{ scaleX: scale }],
            }}
          />
        </View>
      ) : null}
    </GlassCard>
  );
}

interface AppleInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words';
  keyboardType?: 'default' | 'email-address' | 'numeric';
  autoCorrect?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function AppleInput({
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  autoCapitalize = 'none',
  keyboardType = 'default',
  autoCorrect = false,
  style,
  accessibilityLabel,
  accessibilityHint,
}: AppleInputProps) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textTertiary}
      secureTextEntry={secureTextEntry}
      autoCapitalize={autoCapitalize}
      keyboardType={keyboardType}
      autoCorrect={autoCorrect}
      accessibilityLabel={accessibilityLabel ?? placeholder}
      accessibilityHint={accessibilityHint}
      style={[styles.input, style]}
    />
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  glass: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    color: colors.text,
    ...typography.title3,
  },
  sectionSubtitle: {
    color: colors.textTertiary,
    ...typography.footnote,
  },
  sectionAction: {
    color: colors.blue,
    ...typography.subhead,
  },
  button: {
    minHeight: 50,
    borderRadius: radii.md,
    paddingVertical: 15,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    ...typography.headline,
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: radii.full,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillText: {
    ...typography.caption1,
    fontWeight: '700',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    ...typography.title2,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    color: colors.textTertiary,
    ...typography.caption1,
    textAlign: 'center',
  },
  pathRow: {
    minHeight: 58,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceElevated,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
  },
  pathIndex: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pathIndexText: {
    ...typography.caption1,
    fontWeight: '700',
  },
  pathLabel: {
    color: colors.text,
    ...typography.subhead,
    fontWeight: '600',
  },
  pathDetail: {
    color: colors.textSecondary,
    ...typography.footnote,
    lineHeight: 17,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    borderWidth: 0,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: colors.text,
    ...typography.body,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
  },
});
