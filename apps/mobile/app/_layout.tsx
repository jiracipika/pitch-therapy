import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, Component, type ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();

// ─── Error Boundary ─────────────────────────────────────────────────────────
class RootErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state: { hasError: boolean; error: Error | null } = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidMount() {
    // Always hide splash, even if there's an error
    SplashScreen.hideAsync().catch(() => {});
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
  useEffect(() => {
    // Hide splash after a small delay to ensure the JS bundle is fully loaded
    const hide = async () => {
      try {
        await SplashScreen.hideAsync();
      } catch {
        // splash may already be hidden
      }
    };

    // Short delay ensures the first frame has rendered
    const timer = setTimeout(hide, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <RootErrorBoundary>
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
        <Stack.Screen name="play-modes" options={{ title: 'Play Modes' }} />
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
