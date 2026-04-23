import { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { GAME_MODE_META, getDailySeed } from '@pitch-therapy/core';
import { AppPage } from '@/components/AppPage';

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
  const [timeRemaining, setTimeRemaining] = useState(getTimeUntilMidnight);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(getTimeUntilMidnight());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <AppPage title="Daily Challenge" subtitle="Fresh goals every midnight.">
      <View
        style={{
          backgroundColor: 'rgba(255,255,255,0.04)',
          borderRadius: 18,
          padding: 20,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.08)',
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#9ca3af', fontSize: 12, textTransform: 'uppercase', fontWeight: '700', marginBottom: 8 }}>
          Next Reset
        </Text>
        <Text style={{ color: '#f5f5f5', fontSize: 32, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
          {timeRemaining}
        </Text>
        <Text style={{ color: '#a78bfa', fontSize: 13, marginTop: 8 }}>Seed: {seed.note}</Text>
      </View>

      <View style={{ gap: 12 }}>
        <Text style={{ color: '#9ca3af', fontSize: 12, textTransform: 'uppercase', fontWeight: '700' }}>
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
                padding: 16,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.08)',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: mode.accentHex + '20',
                  borderWidth: 1,
                  borderColor: mode.accentHex + '55',
                }}
              >
                <Text style={{ color: mode.accentHex, fontSize: 18, fontWeight: '700' }}>◉</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#f5f5f5', fontWeight: '700', fontSize: 15 }}>{mode.label}</Text>
                <Text style={{ color: '#9ca3af', fontSize: 13, marginTop: 2 }}>{mode.description}</Text>
              </View>
              <Text style={{ color: mode.accentHex, fontSize: 18 }}>›</Text>
            </Pressable>
          );
        })}
      </View>

      <View
        style={{
          backgroundColor: 'rgba(167,139,250,0.1)',
          borderRadius: 16,
          padding: 14,
          borderWidth: 1,
          borderColor: 'rgba(167,139,250,0.28)',
        }}
      >
        <Text style={{ color: '#ddd6fe', fontWeight: '700', marginBottom: 4 }}>Streak Bonus</Text>
        <Text style={{ color: '#c4b5fd', fontSize: 13 }}>Complete both daily modes to keep your streak alive.</Text>
      </View>
    </AppPage>
  );
}
