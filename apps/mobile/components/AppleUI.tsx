import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii, shadows, typography } from '@/lib/theme';

interface GlassCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  padding?: number;
  accent?: string;
}

export function GlassCard({ children, style, onPress, padding = 16, accent }: GlassCardProps) {
  const content = (
    <LinearGradient
      colors={accent ? [accent + '24', colors.card, colors.card] : [colors.glassLight, colors.card]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.glass, { padding }, style]}
    >
      {children}
    </LinearGradient>
  );

  if (!onPress) return content;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.86 : 1,
        transform: [{ scale: pressed ? 0.985 : 1 }],
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
}

export function AppleButton({
  title,
  onPress,
  variant = 'primary',
  color = colors.blue,
  loading,
  disabled,
  style,
}: AppleButtonProps) {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: isPrimary ? color : 'transparent',
          borderWidth: isSecondary ? 1 : 0,
          borderColor: isSecondary ? colors.borderStrong : 'transparent',
          opacity: pressed ? 0.78 : disabled ? 0.42 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
        style,
      ]}
    >
      <Text style={[styles.buttonText, { color: isPrimary ? colors.background : colors.textSecondary }]}>
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

interface AppleInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words';
  keyboardType?: 'default' | 'email-address' | 'numeric';
  autoCorrect?: boolean;
  style?: StyleProp<ViewStyle>;
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
      style={[styles.input, style]}
    />
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  glass: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
    ...shadows.card,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    color: colors.text,
    ...typography.headline,
  },
  sectionSubtitle: {
    color: colors.textTertiary,
    ...typography.caption1,
  },
  sectionAction: {
    color: colors.blue,
    ...typography.subhead,
  },
  button: {
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
    fontWeight: '800',
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
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 15,
    color: colors.text,
    ...typography.body,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
  },
});
