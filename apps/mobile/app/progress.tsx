import { Text, View } from 'react-native';
import { GAME_MODE_META } from '@pitch-therapy/core';
import { GlassCard, SectionHeader, StatItem } from '@/components/AppleUI';
import { StreakRing } from '@/components/StreakRing';
import { AppPage } from '@/components/AppPage';
import { useResponsiveLayout } from '@/lib/responsive';
import { colors, radii, typography } from '@/lib/theme';

const STATS = [
  { label: 'Sessions', value: '0', color: colors.blue },
  { label: 'Correct', value: '0', color: colors.green },
  { label: 'Accuracy', value: '--', color: colors.speedRound },
  { label: 'Best', value: '0', color: colors.pink },
];

export default function ProgressScreen() {
  const { isDesktop } = useResponsiveLayout();

  return (
    <AppPage title="Progress" subtitle="A clean snapshot of consistency and performance.">
      <GlassCard accent={colors.purple} padding={20}>
        <View style={{ alignItems: 'center', gap: 12 }}>
          <Text style={{ color: colors.textTertiary, ...typography.overline }}>BEST STREAK</Text>
          <StreakRing streak={0} size={108} />
          <Text style={{ color: colors.text, ...typography.title3 }}>0 days</Text>
        </View>
      </GlassCard>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {STATS.map((stat) => (
          <GlassCard key={stat.label} style={{ flex: 1, minWidth: '47%' }} padding={14} accent={stat.color}>
            <StatItem label={stat.label} value={stat.value} color={stat.color} />
          </GlassCard>
        ))}
      </View>

      <SectionHeader title="By Mode" subtitle="Mode history will fill in as sessions are recorded." />
      <View style={{ flexDirection: isDesktop ? 'row' : 'column', flexWrap: 'wrap', gap: 10 }}>
        {Object.values(GAME_MODE_META).map((mode) => (
          <GlassCard key={mode.id} padding={13} accent={mode.accentHex} style={{ width: isDesktop ? '49%' : '100%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: radii.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: mode.accentHex + '20',
                  borderWidth: 1,
                  borderColor: mode.accentHex + '55',
                }}
              >
                <Text style={{ color: mode.accentHex, fontWeight: '900' }}>♪</Text>
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ color: colors.text, ...typography.subhead }}>{mode.label}</Text>
                <Text style={{ color: colors.textTertiary, ...typography.caption1 }}>0 sessions played</Text>
              </View>
              <Text style={{ color: colors.textTertiary, ...typography.subhead }}>--</Text>
            </View>
          </GlassCard>
        ))}
      </View>
    </AppPage>
  );
}
