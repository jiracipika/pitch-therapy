import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, radii, shadows } from '@/lib/theme';

// ─── Glass Card ──────────────────────────────────────────────────────────────

interface GlassCardProps {
  children: React.ReactNode;
  style?: any;
  onPress?: () => void;
  padding?: number;
}

export function GlassCard({ children, style, onPress, padding = 18 }: GlassCardProps) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={[
          styles.glass,
          { padding, borderRadius: radii.lg },
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.glass,
        { padding, borderRadius: radii.lg },
        style,
      ]}
    >
      {children}
    </View>
  );
}

// ─── Section Header ──────────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
}

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      </View>
      {action && (
        <Pressable onPress={action.onPress}>
          <Text style={styles.sectionAction}>{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── Apple Button ────────────────────────────────────────────────────────────

interface AppleButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'text';
  color?: string;
  loading?: boolean;
  disabled?: boolean;
  style?: any;
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
        {
          backgroundColor: isPrimary
            ? (disabled ? colors.surfaceElevated : color)
            : 'transparent',
          borderRadius: radii.md,
          paddingVertical: 15,
          paddingHorizontal: 24,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: isSecondary ? 1 : 0,
          borderColor: isSecondary ? colors.border : 'transparent',
          opacity: pressed ? 0.7 : disabled ? 0.4 : 1,
        },
        style,
      ]}
    >
      <Text
        style={{
          fontSize: 17,
          fontWeight: '600',
          letterSpacing: -0.41,
          color: isPrimary ? '#FFFFFF' : colors.textSecondary,
        }}
      >
        {loading ? 'Loading...' : title}
      </Text>
    </Pressable>
  );
}

// ─── Badge / Pill ────────────────────────────────────────────────────────────

interface PillProps {
  label: string;
  color?: string;
  style?: any;
}

export function Pill({ label, color = colors.blue, style }: PillProps) {
  return (
    <View
      style={[
        {
          backgroundColor: color + '18',
          borderRadius: radii.full,
          paddingHorizontal: 10,
          paddingVertical: 4,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: 0.02,
          color,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

// ─── Stat Item ───────────────────────────────────────────────────────────────

interface StatItemProps {
  label: string;
  value: string | number;
  color?: string;
}

export function StatItem({ label, value, color = colors.text }: StatItemProps) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: '700', color, letterSpacing: -0.5 }}>
        {value}
      </Text>
      <Text style={{ fontSize: 12, color: colors.textTertiary, marginTop: 4, letterSpacing: 0.02 }}>
        {label}
      </Text>
    </View>
  );
}

// ─── Input Field ─────────────────────────────────────────────────────────────

import { TextInput } from 'react-native';

interface AppleInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words';
  keyboardType?: 'default' | 'email-address' | 'numeric';
  autoCorrect?: boolean;
  style?: any;
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
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 16,
          paddingVertical: 15,
          fontSize: 17,
          color: colors.text,
          letterSpacing: -0.41,
        },
        style,
      ]}
    />
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────

export function Divider() {
  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.border,
        marginVertical: 1,
      }}
    />
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  glass: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    ...shadows.card,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 2,
    letterSpacing: -0.2,
  },
  sectionAction: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.blue,
    letterSpacing: -0.2,
  },
});
