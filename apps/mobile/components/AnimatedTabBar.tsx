import { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { type Href, usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { triggerSelectionHaptic } from '@/lib/haptics';
import { MAIN_TABS } from '@/lib/main-tabs';
import { colors, radii, shadows, typography } from '@/lib/theme';

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
  const labelTranslate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [3, 0],
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
        minHeight: 54,
        justifyContent: 'center',
        transform: [{ scale: pressed ? 0.97 : 1 }],
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <View style={{ alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4, position: 'relative' }}>
        <Animated.View
          style={{
            position: 'absolute',
            top: 3,
            bottom: 3,
            left: 3,
            right: 3,
            borderRadius: radii.md,
            backgroundColor: active ? tab.color + '24' : colors.glassLight,
            borderWidth: 1,
            borderColor: active ? tab.color + '66' : colors.border,
            opacity: activeBgOpacity,
          }}
        />
        <Animated.Text
          style={{
            fontSize: 19,
            marginBottom: 2,
            color: active ? tab.color : colors.textTertiary,
            transform: [{ scale: iconScale }],
          }}
        >
          {tab.icon}
        </Animated.Text>
        <Animated.Text
          style={{
            color: active ? colors.text : colors.textTertiary,
            opacity: labelOpacity,
            transform: [{ translateY: labelTranslate }],
            ...typography.caption2,
            fontWeight: active ? '800' : '600',
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
        backgroundColor: 'rgba(12,14,19,0.92)',
        borderWidth: 1,
        borderColor: colors.glassBorder,
        paddingVertical: 6,
        paddingHorizontal: 6,
        borderRadius: radii.lg,
        ...shadows.tab,
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
