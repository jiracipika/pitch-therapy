import { View, Text, Image } from 'react-native';
import { GAME_MODE_META } from '@pitch-therapy/core';
import { AnimatedModeCard } from '@/components/AnimatedModeCard';
import { StreakRing } from '@/components/StreakRing';
import { AppPage } from '@/components/AppPage';

export default function DashboardScreen() {
  const featuredModes = Object.values(GAME_MODE_META).slice(0, 6);

  return (
    <AppPage title="Pitch Therapy" subtitle="Train daily. Hear better." showSwipeHint>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Image
          source={require('../assets/logo-placeholder.png')}
          style={{ width: 38, height: 38, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }}
        />
        <Text style={{ color: '#9ca3af', fontSize: 13 }}>Daily ear training workspace</Text>
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(255,255,255,0.04)',
          borderRadius: 18,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.08)',
          padding: 16,
        }}
      >
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={{ color: '#9ca3af', fontSize: 12, fontWeight: '600', textTransform: 'uppercase' }}>
            Current Streak
          </Text>
          <Text style={{ color: '#f5f5f5', fontWeight: '700', fontSize: 22, marginTop: 6 }}>3 days</Text>
          <Text style={{ color: '#a78bfa', marginTop: 4, fontSize: 13 }}>Keep it alive with one session today</Text>
        </View>
        <StreakRing streak={3} size={86} />
      </View>

      <View
        style={{
          backgroundColor: 'rgba(255,255,255,0.04)',
          borderRadius: 18,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.08)',
          padding: 16,
        }}
      >
        <Text style={{ color: '#f5f5f5', fontSize: 16, fontWeight: '700', marginBottom: 4 }}>Today’s Plan</Text>
        <Text style={{ color: '#9ca3af', fontSize: 13 }}>Play 2 quick modes and 1 daily challenge to extend your streak.</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <View style={{ backgroundColor: 'rgba(59,130,246,0.2)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ color: '#93c5fd', fontSize: 12, fontWeight: '600' }}>2 Quick Rounds</Text>
          </View>
          <View style={{ backgroundColor: 'rgba(167,139,250,0.2)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ color: '#ddd6fe', fontSize: 12, fontWeight: '600' }}>Daily Challenge</Text>
          </View>
        </View>
      </View>

      <View>
        <Text style={{ color: '#9ca3af', fontSize: 12, textTransform: 'uppercase', fontWeight: '700', marginBottom: 12 }}>
          Featured Modes
        </Text>
        {featuredModes.map((mode) => (
          <View key={mode.id} style={{ marginBottom: 12 }}>
            <AnimatedModeCard mode={mode} />
          </View>
        ))}
      </View>
    </AppPage>
  );
}
