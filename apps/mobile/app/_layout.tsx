import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '@/lib/theme';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="dashboard" options={{ title: 'Dashboard' }} />
        <Stack.Screen name="daily" options={{ title: 'Daily Challenge' }} />
        <Stack.Screen name="progress" options={{ title: 'Progress' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        <Stack.Screen name="play/[mode]" options={{ headerShown: false }} />
        <Stack.Screen name="play/pitch-match" options={{ headerShown: false }} />
        <Stack.Screen name="play/note-id" options={{ headerShown: false }} />
        <Stack.Screen name="play/frequency-guess" options={{ headerShown: false }} />
        <Stack.Screen name="play/note-wordle" options={{ headerShown: false }} />
        <Stack.Screen name="play/frequency-wordle" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
