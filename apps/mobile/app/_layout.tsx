import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Component, type ReactNode, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ToastProvider } from '@/components/Toast';
import { AuthProvider } from '@/lib/auth';
import { prewarmAudioSession } from '@/lib/audio';
import { preloadAppSettings } from '@/lib/settings';
import {
  installGlobalStartupErrorHandler,
  recordStartupError,
  recordStartupEvent,
  runStartupStep,
} from '@/lib/startup-diagnostics';
import { colors, typography } from '@/lib/theme';

// ─── Error Boundary ─────────────────────────────────────────────────────────
class RootErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state: { hasError: boolean; error: Error | null } = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack?: string }) {
    recordStartupError('root_error_boundary', error, errorInfo.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <Pressable
            onPress={this.handleReset}
            style={({ pressed }) => ({
              marginTop: 24,
              paddingVertical: 12,
              paddingHorizontal: 28,
              borderRadius: 10,
              backgroundColor: colors.signal,
              opacity: pressed ? 0.82 : 1,
            })}
            accessibilityRole="button"
            accessibilityLabel="Try again"
            accessibilityHint="Clears the error and reloads the app"
          >
            <Text style={{ color: colors.ink, fontSize: 16, fontWeight: '700' }}>
              Try Again
            </Text>
          </Pressable>
          <Text style={styles.errorHint}>Or restart the app manually</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

// ─── Root Layout ─────────────────────────────────────────────────────────────
export default function RootLayout() {
  useEffect(() => {
    recordStartupEvent('root_layout_mounted', 'start');
    const restoreGlobalHandler = installGlobalStartupErrorHandler();

    void (async () => {
      await runStartupStep('settings_preload', () => {
        preloadAppSettings();
      });
      await runStartupStep('audio_prewarm', async () => {
        await prewarmAudioSession();
      });
      recordStartupEvent('root_bootstrap_complete', 'ok');
    })();

    return () => {
      restoreGlobalHandler();
    };
  }, []);

  return (
    <RootErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <StatusBar style="light" translucent={false} backgroundColor={colors.background} />
        <Stack
          screenOptions={{
            headerShown: false,
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'slide_from_right',
            animationDuration: 280,
            statusBarStyle: 'light',
            statusBarAnimation: 'fade',
            statusBarTranslucent: false,
          }}
        >
          <Stack.Screen name="index" options={{ animation: 'fade' }} />
          <Stack.Screen name="dashboard" options={{ animation: 'fade' }} />
          <Stack.Screen name="play-modes" />
          <Stack.Screen name="daily" options={{ animation: 'fade' }} />
          <Stack.Screen name="progress" options={{ animation: 'fade' }} />
          <Stack.Screen name="settings" options={{ animation: 'fade' }} />
          {/* Individual play/ screens are auto-registered by Expo Router's
              file-based routing. No explicit Stack.Screen entries needed. */}
        </Stack>
        </ToastProvider>
      </AuthProvider>
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
  errorTitle: {
    color: colors.text,
    ...typography.title2,
    marginBottom: 8,
  },
  errorMessage: {
    color: colors.textSecondary,
    ...typography.caption1,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorHint: {
    color: colors.textTertiary,
    ...typography.caption1,
  },
});
