import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { GAME_MODE_META, buildProgressInsights, type ProgressResult } from '@pitch-therapy/core';
import { GlassCard, MotionStatusCard, SectionHeader, StatItem } from '@/components/AppleUI';
import { AchievementsSection } from '@/components/AchievementsSection';
import { StreakRing } from '@/components/StreakRing';
import { AppPage } from '@/components/AppPage';
import { useResponsiveLayout } from '@/lib/responsive';
import { useSessionResults, getModeStats } from '@/lib/sessionResults';
import { colors, radii, typography } from '@/lib/theme';

function formatAccuracy(value: number): string {
  return value > 0 ? `${Math.round(value * 100)}%` : '--';
}

export default function ProgressScreen() {
  const { isDesktop } = useResponsiveLayout();
  const [loaded, setLoaded] = useState(false);
  const { stats } = useSessionResults();
  const sessionResults = useMemo<ProgressResult[]>(() => stats.results, [stats.results]);
  const insights = useMemo(() => buildProgressInsights(sessionResults), [sessionResults]);
  const hasStats = sessionResults.length > 0;

  useEffect(() => {
    const timeout = setTimeout(() => setLoaded(true), 120);
    return () => clearTimeout(timeout);
  }, []);

  const statsCards = [
    { label: 'Sessions', value: String(stats.totalSessions), color: colors.blue },
    { label: 'Correct', value: String(stats.totalCorrect), color: colors.green },
    { label: 'Accuracy', value: formatAccuracy(stats.avgAccuracy), color: colors.speedRound },
    { label: 'Best', value: String(stats.bestScore), color: colors.pink },
  ];

  const status = !loaded
    ? {
        tone: 'loading' as const,
        title: 'Analyzing your sessions',
        message: 'Pulling mode accuracy and momentum trends.',
      }
    : hasStats
      ? {
          tone: 'success' as const,
          title: 'Tracking is active',
          message: 'Performance streams are up to date across all modes.',
        }
      : {
          tone: 'empty' as const,
          title: 'No sessions recorded yet',
          message: 'Complete one round to unlock detailed graphs and mode-level trends.',
        };

  return (
    <AppPage
      title="Progress"
      subtitle="A clean snapshot of consistency and performance."
      heroVariant="progress"
      heroHint="Watch trend quality as your repetitions stack"
    >
      <MotionStatusCard tone={status.tone} title={status.title} message={status.message} />
      <GlassCard accent={colors.purple} padding={20}>
        <View style={{ alignItems: 'center', gap: 12 }}>
          <Text style={{ color: colors.textTertiary, ...typography.overline }}>BEST STREAK</Text>
          <StreakRing streak={stats.bestStreak} size={108} />
          <Text style={{ color: colors.text, ...typography.title3 }}>{stats.bestStreak} days</Text>
        </View>
      </GlassCard>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {statsCards.map((stat) => (
          <GlassCard key={stat.label} style={{ flex: 1, minWidth: '47%' }} padding={14} accent={stat.color}>
            <StatItem label={stat.label} value={stat.value} color={stat.color} />
          </GlassCard>
        ))}
      </View>

      <SectionHeader
        title="By Mode"
        subtitle={
          hasStats
            ? 'Your accuracy and play count across each drill.'
            : 'Mode history will fill in as sessions are recorded.'
        }
      />
      <View style={{ flexDirection: isDesktop ? 'row' : 'column', flexWrap: 'wrap', gap: 10 }}>
        {Object.values(GAME_MODE_META).map((mode) => {
          const modeData = getModeStats(sessionResults, mode.id);
          const played = modeData.sessions > 0;
          return (
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
                  <Text style={{ color: colors.textTertiary, ...typography.caption1 }}>
                    {played ? `${modeData.sessions} session${modeData.sessions > 1 ? 's' : ''} played` : '0 sessions played'}
                  </Text>
                </View>
                <Text style={{ color: played ? colors.text : colors.textTertiary, ...typography.subhead }}>
                  {played ? formatAccuracy(modeData.avgAccuracy) : '--'}
                </Text>
              </View>
            </GlassCard>
          );
        })}
      </View>

      <AchievementsSection results={sessionResults} />

      <GlassCard accent={colors.blue} padding={16}>
        <View style={{ gap: 6 }}>
          <Text style={{ color: colors.textTertiary, ...typography.overline }}>FOCUS NEXT</Text>
          <Text style={{ color: colors.text, ...typography.subhead }}>{insights.focusTip}</Text>
        </View>
      </GlassCard>
    </AppPage>
  );
}
