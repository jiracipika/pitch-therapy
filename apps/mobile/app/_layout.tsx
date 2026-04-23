import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Component, type ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/lib/theme';

// ─── Error Boundary ─────────────────────────────────────────────────────────
class RootErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state: { hasError: boolean; error: Error | null } = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <Text style={styles.errorHint}>Restart the app to try again</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

// ─── Root Layout ─────────────────────────────────────────────────────────────
export default function RootLayout() {
  return (
    <RootErrorBoundary>
      <StatusBar style="light" translucent={false} backgroundColor={colors.background} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade_from_bottom',
          statusBarStyle: 'light',
          statusBarAnimation: 'fade',
          statusBarTranslucent: false,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="play-modes" options={{ headerShown: false }} />
        <Stack.Screen name="daily" options={{ headerShown: false }} />
        <Stack.Screen name="progress" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="play/[mode]" options={{ headerShown: false }} />
        <Stack.Screen name="play/pitch-match" options={{ headerShown: false }} />
        <Stack.Screen name="play/note-id" options={{ headerShown: false }} />
        <Stack.Screen name="play/frequency-guess" options={{ headerShown: false }} />
        <Stack.Screen name="play/note-wordle" options={{ headerShown: false }} />
        <Stack.Screen name="play/frequency-wordle" options={{ headerShown: false }} />
      </Stack>
    </RootErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 32,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorMessage: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorHint: {
    color: colors.textTertiary,
    fontSize: 12,
  },
});
