import { Image, Switch, Text, View } from 'react-native';
import { GlassCard, SectionHeader } from '@/components/AppleUI';
import { AppPage } from '@/components/AppPage';
import { triggerSelectionHaptic } from '@/lib/haptics';
import { useAppSettings } from '@/lib/settings';
import { colors, typography } from '@/lib/theme';

const referenceItems = [
  { label: 'Reference Pitch', value: 'A4 = 440 Hz' },
  { label: 'Tuning System', value: '12-TET' },
];

export default function SettingsScreen() {
  const { soundEnabled, hapticEnabled, setSoundEnabled, setHapticEnabled } = useAppSettings();

  return (
    <AppPage title="Settings" subtitle="Make the training loop feel right for you.">
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
