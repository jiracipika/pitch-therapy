import { View, Text } from 'react-native';
import { GAME_MODE_META } from '@pitch-therapy/core';
import { StreakRing } from '@/components/StreakRing';
import { AppPage } from '@/components/AppPage';

const STATS = [
  { label: 'Total Sessions', value: '0' },
  { label: 'Notes Correct',  value: '0' },
  { label: 'Avg Accuracy',   value: '—' },
  { label: 'Best Score',     value: '0' },
];

export default function ProgressScreen() {
  return (
    <AppPage title="Progress" subtitle="Track consistency and performance.">
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
        <Text style={{ color: '#9ca3af', fontSize: 12, textTransform: 'uppercase', fontWeight: '700', marginBottom: 12 }}>
          Best Streak
        </Text>
        <StreakRing streak={0} size={104} />
        <Text style={{ color: '#f5f5f5', fontWeight: '700', marginTop: 8, fontSize: 18 }}>0 days</Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {STATS.map((stat) => (
          <View
            key={stat.label}
            style={{
              flex: 1,
              minWidth: '47%',
              backgroundColor: 'rgba(255,255,255,0.04)',
              borderRadius: 14,
              padding: 14,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
            }}
          >
            <Text style={{ color: '#9ca3af', fontSize: 12, marginBottom: 6 }}>{stat.label}</Text>
            <Text style={{ color: '#f5f5f5', fontWeight: '700', fontSize: 24, fontVariant: ['tabular-nums'] }}>{stat.value}</Text>
          </View>
        ))}
      </View>

      <View style={{ gap: 10 }}>
        <Text style={{ color: '#9ca3af', fontSize: 12, textTransform: 'uppercase', fontWeight: '700' }}>By Mode</Text>
        {Object.values(GAME_MODE_META).map((mode) => (
          <View
            key={mode.id}
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              borderRadius: 14,
              padding: 14,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: mode.accentHex,
                marginRight: 12,
              }}
            />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#f5f5f5', fontWeight: '700', fontSize: 14 }}>{mode.label}</Text>
              <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 2 }}>0 sessions played</Text>
            </View>
            <Text style={{ color: '#9ca3af', fontSize: 13, fontWeight: '700' }}>—</Text>
          </View>
        ))}
      </View>
    </AppPage>
  );
}
