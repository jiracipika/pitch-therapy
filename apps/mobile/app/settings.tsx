import { Image, Pressable, Switch, Text, View } from 'react-native';
import { useMemo } from 'react';
import { GlassCard, MotionStatusCard, SectionHeader } from '@/components/AppleUI';
import { AppPage } from '@/components/AppPage';
import { triggerSelectionHaptic } from '@/lib/haptics';
import { useResponsiveLayout } from '@/lib/responsive';
import { useAppSettings } from '@/lib/settings';
import { colors, typography } from '@/lib/theme';

const referenceItems = [
  { label: 'Reference Pitch', value: 'A4 = 440 Hz' },
  { label: 'Tuning System', value: '12-TET' },
];

export default function SettingsScreen() {
  const { isDesktop } = useResponsiveLayout();
  const { soundEnabled, hapticEnabled, glassMode, setSoundEnabled, setHapticEnabled, setGlassMode } = useAppSettings();
  const status = useMemo(() => {
    if (!soundEnabled && !hapticEnabled) {
      return {
        tone: 'error' as const,
        title: 'Low-feedback mode',
        message: 'Sound and haptics are both off. Training still works, but feedback is minimal.',
      };
    }

    if (soundEnabled && hapticEnabled) {
      return {
        tone: 'success' as const,
        title: 'Feedback fully enabled',
        message: 'Sound and haptics are active for responsive training cues.',
      };
    }

    return {
      tone: 'loading' as const,
      title: 'Partial feedback',
      message: 'One feedback channel is active. This keeps sessions quieter but still guided.',
    };
  }, [hapticEnabled, soundEnabled]);

  return (
    <AppPage
      title="Settings"
      subtitle="Make the training loop feel right for you."
      heroVariant="settings"
      heroHint="Dial in feedback and defaults for your ideal rhythm"
    >
      <MotionStatusCard tone={status.tone} title={status.title} message={status.message} />
      <GlassCard accent={colors.pink}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Image
            source={require('../assets/logo-placeholder.png')}
            style={{ width: 58, height: 58, borderRadius: 8, borderWidth: 1, borderColor: colors.borderStrong }}
          />
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={{ color: colors.text, ...typography.headline }}>Pitch Therapy</Text>
            <Text style={{ color: colors.textSecondary, ...typography.caption1, lineHeight: 18 }}>
              Focused ear training with modern feedback and daily practice.
            </Text>
          </View>
        </View>
      </GlassCard>

      <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 10 }}>
        <View style={{ flex: 1, gap: 10 }}>
          <SectionHeader title="Feedback" subtitle="Persistent across app restarts." />
          <GlassCard padding={0}>
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
              <SettingRow
                title="Sound Effects"
                subtitle="Play tones and answer feedback"
                value={soundEnabled}
                onValueChange={(value) => {
                  setSoundEnabled(value);
                  void triggerSelectionHaptic();
                }}
                color={colors.blue}
              />
            </View>
            <View style={{ padding: 16 }}>
              <SettingRow
                title="Haptic Feedback"
                subtitle="Vibrate on tab switches and answers"
                value={hapticEnabled}
                onValueChange={(value) => {
                  setHapticEnabled(value);
                  if (value) {
                    void triggerSelectionHaptic();
                  }
                }}
                color={colors.green}
              />
            </View>
          </GlassCard>
        </View>

        <View style={{ flex: 1, gap: 10 }}>
          <SectionHeader title="Appearance" subtitle="Matches the desktop glass controls." />
          <GlassCard padding={0}>
            <View style={{ padding: 16 }}>
              <View style={{ gap: 10 }}>
                <View style={{ gap: 3 }}>
                  <Text style={{ color: colors.text, ...typography.subhead }}>Liquid Glass</Text>
                  <Text style={{ color: colors.textTertiary, ...typography.caption1 }}>Surface intensity and ambient motion</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {(['high', 'reduced'] as const).map((mode) => {
                    const active = glassMode === mode;
                    return (
                      <Pressable
                        key={mode}
                        onPress={() => {
                          setGlassMode(mode);
                          void triggerSelectionHaptic();
                        }}
                        style={({ pressed }) => ({
                          flex: 1,
                          minHeight: 36,
                          borderRadius: 8,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: 1,
                          borderColor: active ? colors.blue + '80' : colors.border,
                          backgroundColor: active ? colors.blue + '2E' : 'rgba(255,255,255,0.04)',
                          opacity: pressed ? 0.78 : 1,
                          transform: [{ scale: pressed ? 0.985 : 1 }],
                        })}
                      >
                        <Text style={{ color: active ? colors.text : colors.textSecondary, ...typography.caption1, fontWeight: '800' }}>
                          {mode === 'high' ? 'High' : 'Reduced'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>
          </GlassCard>

          <SectionHeader title="Reference" />
          <GlassCard padding={0}>
            {referenceItems.map((item, index) => (
              <View
                key={item.label}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  borderBottomWidth: index < referenceItems.length - 1 ? 1 : 0,
                  borderBottomColor: colors.divider,
                }}
              >
                <Text style={{ color: colors.text, flex: 1, ...typography.subhead }}>{item.label}</Text>
                <Text style={{ color: colors.textSecondary, ...typography.caption1 }}>{item.value}</Text>
              </View>
            ))}
          </GlassCard>
        </View>
      </View>

      <GlassCard accent={colors.teal}>
        <View style={{ gap: 5 }}>
          <Text style={{ color: colors.text, ...typography.headline }}>Version 0.1.0</Text>
          <Text style={{ color: colors.textSecondary, ...typography.caption1, lineHeight: 18 }}>
            Built for quick reps, daily consistency, and sharper pitch intuition.
          </Text>
        </View>
      </GlassCard>
    </AppPage>
  );
}

function SettingRow({
  title,
  subtitle,
  value,
  onValueChange,
  color,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  color: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ color: colors.text, ...typography.subhead }}>{title}</Text>
        <Text style={{ color: colors.textTertiary, ...typography.caption1 }}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.surfaceElevated, true: color + '99' }}
        thumbColor={value ? colors.text : colors.textTertiary}
      />
    </View>
  );
}
