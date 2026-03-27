import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { GAME_MODE_META } from '@pitch-therapy/core';
import { ModeCard } from '@/components/ModeCard';
import { StreakRing } from '@/components/StreakRing';
import { colors } from '@/lib/theme';

const tabs = [
  { label: 'Dashboard', route: '/dashboard' },
  { label: 'Daily', route: '/daily' },
  { label: 'Progress', route: '/progress' },
  { label: 'Settings', route: '/settings' },
] as const;

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4 pt-4 pb-24">
        <Text className="text-text text-2xl font-bold mb-1">Pitch Therapy</Text>
        <Text className="text-muted text-sm mb-6">Choose your training mode</Text>

        <View className="flex-row items-center justify-between mb-6 bg-card rounded-2xl p-4 border border-border">
          <View>
            <Text className="text-muted text-xs uppercase tracking-wide">Current Streak</Text>
            <Text className="text-text font-bold text-lg mt-1">3 days 🔥</Text>
          </View>
          <StreakRing streak={3} />
        </View>

        {Object.values(GAME_MODE_META).map((mode) => (
          <View key={mode.id} className="mb-3">
            <ModeCard mode={mode} />
          </View>
        ))}
      </ScrollView>

      {/* Bottom tab bar */}
      <View className="absolute bottom-0 left-0 right-0 bg-card border-t border-border flex-row">
        {tabs.map((tab) => (
          <Pressable
            key={tab.route}
            onPress={() => router.push(tab.route)}
            className="flex-1 py-3 items-center"
          >
            <Text className="text-muted text-xs font-medium">{tab.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
