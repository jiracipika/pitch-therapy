import { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { type Href, usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { triggerSelectionHaptic } from '@/lib/haptics';
import { MAIN_TABS } from '@/lib/main-tabs';

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
    outputRange: [1, 1.06],
  });
  const labelOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
  });
  const activeBgOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
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
        minHeight: 48,
        justifyContent: 'center',
        transform: [{ scale: pressed ? 0.97 : 1 }],
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <View style={{ alignItems: 'center', paddingVertical: 9, paddingHorizontal: 6, position: 'relative' }}>
        <Animated.View
          style={{
            position: 'absolute',
            top: 4,
            bottom: 4,
            left: 4,
            right: 4,
            borderRadius: 12,
            backgroundColor: 'rgba(167,139,250,0.18)',
            borderWidth: 1,
            borderColor: 'rgba(167,139,250,0.35)',
            opacity: activeBgOpacity,
          }}
        />
        <Animated.Text
          style={{
            fontSize: 18,
            marginBottom: 2,
            color: active ? '#ddd6fe' : '#71717a',
            transform: [{ scale: iconScale }],
          }}
        >
          {tab.icon}
        </Animated.Text>
        <Animated.Text
          style={{
            fontSize: 10,
            fontWeight: '600',
            color: active ? '#ddd6fe' : '#9ca3af',
            opacity: labelOpacity,
          }}
        >
          {tab.label}
        </Animated.Text>
      </View>
    </Pressable>
  );
}

export function AnimatedTabBar() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        position: 'absolute',
        bottom: Math.max(insets.bottom, 10),
        left: 12,
        right: 12,
        flexDirection: 'row',
        backgroundColor: 'rgba(24,24,27,0.92)',
        borderTopWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        paddingVertical: 6,
        paddingHorizontal: 6,
        borderRadius: 16,
      }}
    >
      {MAIN_TABS.map((tab) => {
        const active = pathname === tab.route || (pathname === '/' && tab.route === '/dashboard');
        return (
          <TabButton key={tab.route} tab={tab} active={active} />
        );
      })}
    </View>
  );
}
