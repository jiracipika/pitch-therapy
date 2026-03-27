import { View, Text, ScrollView } from 'react-native';
import { GAME_MODE_META } from '@pitch-therapy/core';
import { StreakRing } from '@/components/StreakRing';
import { AnimatedTabBar } from '@/components/AnimatedTabBar';

const STATS = [
  { label: 'Total Sessions', value: '0' },
  { label: 'Notes Correct',  value: '0' },
  { label: 'Avg Accuracy',   value: '—' },
  { label: 'Best Score',     value: '0' },
];

export default function ProgressScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#09090b' }}>
      <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} contentContainerStyle={{ paddingTop: 56, paddingBottom: 100 }}>
        <Text style={{ color: '#f4f4f5', fontSize: 28, fontWeight: '700', marginBottom: 24 }}>
          Progress
        </Text>

        {/* Streak ring */}
        <View
          style={{
            backgroundColor: 'rgba(255,255,255,0.04)',
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.07)',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <Text style={{ color: '#71717a', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            Best Streak
          </Text>
          <StreakRing streak={0} size={100} />
          <Text style={{ color: '#f4f4f5', fontWeight: '700', marginTop: 8 }}>0 days</Text>
        </View>

        {/* Stats grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
          {STATS.map((stat) => (
            <View
              key={stat.label}
              style={{
                flex: 1,
                minWidth: '45%',
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderRadius: 12,
                padding: 14,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.07)',
              }}
            >
              <Text style={{ color: '#71717a', fontSize: 11, marginBottom: 4 }}>{stat.label}</Text>
              <Text style={{ color: '#f4f4f5', fontWeight: '700', fontSize: 22 }}>{stat.value}</Text>
            </View>
          ))}
        </View>

        {/* Per-mode breakdown */}
        <Text style={{ color: '#71717a', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
          By Mode
        </Text>
        {Object.values(GAME_MODE_META).map((mode) => (
          <View
            key={mode.id}
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.07)',
              marginBottom: 8,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: mode.accentHex,
                marginRight: 12,
              }}
            />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#f4f4f5', fontWeight: '600', fontSize: 14 }}>{mode.label}</Text>
              <Text style={{ color: '#71717a', fontSize: 12, marginTop: 1 }}>0 sessions played</Text>
            </View>
            <Text style={{ color: '#71717a', fontSize: 13, fontWeight: '600' }}>—</Text>
          </View>
        ))}
      </ScrollView>

      <AnimatedTabBar />
    </View>
  );
}
