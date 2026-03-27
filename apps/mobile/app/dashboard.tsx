import { View, Text, ScrollView } from 'react-native';
import { GAME_MODE_META } from '@pitch-therapy/core';
import { AnimatedModeCard } from '@/components/AnimatedModeCard';
import { StreakRing } from '@/components/StreakRing';
import { AnimatedTabBar } from '@/components/AnimatedTabBar';

export default function DashboardScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#09090b' }}>
      <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} contentContainerStyle={{ paddingTop: 56, paddingBottom: 100 }}>
        <Text style={{ color: '#f4f4f5', fontSize: 28, fontWeight: '700', marginBottom: 4 }}>
          Pitch Therapy
        </Text>
        <Text style={{ color: '#71717a', fontSize: 14, marginBottom: 24 }}>
          Choose your training mode
        </Text>

        {/* Streak card */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
            backgroundColor: 'rgba(255,255,255,0.04)',
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.07)',
          }}
        >
          <View>
            <Text style={{ color: '#71717a', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
              Current Streak
            </Text>
            <Text style={{ color: '#f4f4f5', fontWeight: '700', fontSize: 18, marginTop: 4 }}>
              3 days 🔥
            </Text>
          </View>
          <StreakRing streak={3} />
        </View>

        {/* Mode cards */}
        {Object.values(GAME_MODE_META).map((mode) => (
          <View key={mode.id} style={{ marginBottom: 12 }}>
            <AnimatedModeCard mode={mode} />
          </View>
        ))}
      </ScrollView>

      <AnimatedTabBar />
    </View>
  );
}
