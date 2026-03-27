import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { StreakRing } from '@/components/StreakRing';
import { colors } from '@/lib/theme';

const tabs = [
  { label: 'Dashboard', route: '/dashboard' },
  { label: 'Daily', route: '/daily' },
  { label: 'Progress', route: '/progress' },
  { label: 'Settings', route: '/settings' },
] as const;

export default function ProgressScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4 pt-4 pb-24">
        <Text className="text-text text-2xl font-bold mb-6">Progress</Text>

        <View className="bg-card rounded-2xl p-5 border border-border items-center mb-6">
          <Text className="text-muted text-xs uppercase tracking-wide mb-3">Best Streak</Text>
          <StreakRing streak={7} size={100} />
          <Text className="text-text font-bold mt-2">7 days</Text>
        </View>

        {[
          { label: 'Total Sessions', value: '12' },
          { label: 'Notes Correct', value: '47/60' },
          { label: 'Avg Accuracy', value: '78%' },
        ].map((stat) => (
          <View key={stat.label} className="bg-card rounded-xl p-4 border border-border mb-2 flex-row justify-between">
            <Text className="text-muted text-sm">{stat.label}</Text>
            <Text className="text-text font-bold">{stat.value}</Text>
          </View>
        ))}
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 bg-card border-t border-border flex-row">
        {tabs.map((tab) => (
          <Pressable key={tab.route} onPress={() => router.push(tab.route)} className="flex-1 py-3 items-center">
            <Text className={`text-xs font-medium ${tab.route === '/progress' ? 'text-blue-500' : 'text-muted'}`}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
