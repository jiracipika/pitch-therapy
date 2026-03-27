import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { GAME_MODE_META, getDailySeed } from '@pitch-therapy/core';
import { AnimatedTabBar } from '@/components/AnimatedTabBar';

const DAILY_MODES = ['note-wordle', 'frequency-wordle'] as const;

function getTimeUntilMidnight(): string {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${h}h ${m}m ${s}s`;
}

export default function DailyScreen() {
  const router = useRouter();
  const seed = getDailySeed();

  return (
    <View style={{ flex: 1, backgroundColor: '#09090b' }}>
      <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} contentContainerStyle={{ paddingTop: 56, paddingBottom: 100 }}>
        <Text style={{ color: '#f4f4f5', fontSize: 28, fontWeight: '700', marginBottom: 4 }}>
          Daily Challenge
        </Text>
        <Text style={{ color: '#71717a', fontSize: 14, marginBottom: 24 }}>
          Resets at midnight
        </Text>

        {/* Countdown card */}
        <View
          style={{
            backgroundColor: 'rgba(255,255,255,0.04)',
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.07)',
            marginBottom: 20,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#71717a', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
            Next Challenge In
          </Text>
          <Text style={{ color: '#f4f4f5', fontSize: 32, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
            {getTimeUntilMidnight()}
          </Text>
          <Text style={{ color: '#71717a', fontSize: 12, marginTop: 6 }}>
            Today's seed: {seed.note}
          </Text>
        </View>

        <Text style={{ color: '#71717a', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
          Today's Modes
        </Text>

        {DAILY_MODES.map((modeId) => {
          const mode = GAME_MODE_META[modeId];
          return (
            <Pressable
              key={modeId}
              onPress={() => router.push(`/play/${modeId}`)}
              style={({ pressed }) => ({
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderRadius: 16,
                padding: 20,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.07)',
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 16,
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: mode.accentHex + '20',
                }}
              >
                <Text style={{ color: mode.accentHex, fontSize: 20, fontWeight: '700' }}>◉</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#f4f4f5', fontWeight: '600', fontSize: 16 }}>{mode.label}</Text>
                <Text style={{ color: '#71717a', fontSize: 13, marginTop: 2 }}>{mode.description}</Text>
              </View>
              <Text style={{ color: mode.accentHex, fontSize: 18 }}>›</Text>
            </Pressable>
          );
        })}

        {/* Complete all bonus */}
        <View
          style={{
            backgroundColor: 'rgba(167,139,250,0.08)',
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: 'rgba(167,139,250,0.15)',
            marginTop: 8,
          }}
        >
          <Text style={{ color: '#a78bfa', fontWeight: '600', marginBottom: 4 }}>Streak Bonus</Text>
          <Text style={{ color: '#71717a', fontSize: 13 }}>
            Complete both daily modes to extend your streak!
          </Text>
        </View>
      </ScrollView>

      <AnimatedTabBar />
    </View>
  );
}
