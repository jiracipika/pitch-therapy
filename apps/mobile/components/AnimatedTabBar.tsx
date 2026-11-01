import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { type Href, usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { triggerSelectionHaptic } from '@/lib/haptics';
import { MAIN_TABS } from '@/lib/main-tabs';
import { colors, typography } from '@/lib/theme';

// Extracted into its own component so hooks are at the top level (not inside .map())
function TabButton({ tab, active }: { tab: (typeof MAIN_TABS)[number]; active: boolean }) {
  const router = useRouter();
  const progress = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: active ? 1 : 0,
      useNativeDriver: true,
      stiffness: 240,
      damping: 22,
      mass: 0.9,
    }).start();
  }, [active, progress]);

  const iconScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });
  const tint = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const iconColor = tint.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.textTertiary as string, colors.blue as string],
  });
  const labelColor = tint.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.textTertiary as string, colors.blue as string],
  });

  return (
    <Pressable
      onPress={() => {
        if (!active) {
          void triggerSelectionHaptic();
          router.replace(tab.route as Href);
        }
      }}
      accessibilityRole="button"
      accessibilityLabel={`Open ${tab.label}`}
      accessibilityState={{ selected: active }}
      hitSlop={8}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 50,
        justifyContent: 'center',
        transform: [{ scale: pressed ? 0.96 : 1 }],
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{ alignItems: 'center', paddingVertical: 6, paddingHorizontal: 4 }}>
        <Animated.Text
          style={{
            fontSize: 19,
            marginBottom: 2,
            color: iconColor,
            transform: [{ scale: iconScale }],
          }}
        >
          {tab.icon}
        </Animated.Text>
        <Animated.Text
          style={{
            color: labelColor,
            ...typography.caption2,
            fontWeight: '600',
          }}
        >
          {tab.label}
        </Animated.Text>
      </View>
    </Pressable>
  );
}

// iOS-style tab bar: full-width translucent bar with a hairline top edge.
// Selected tab tints system blue; no floating pill, no decorative sweep.
export function AnimatedTabBar() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        backgroundColor: 'rgba(20, 20, 22, 0.94)',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(255, 255, 255, 0.12)',
        paddingTop: 6,
        paddingBottom: Math.max(insets.bottom, 10),
      }}
    >
      {MAIN_TABS.map((tab) => {
        const active = pathname === tab.route || (pathname === '/' && tab.route === '/dashboard');
        return <TabButton key={tab.route} tab={tab} active={active} />;
      })}
    </View>
  );
}
