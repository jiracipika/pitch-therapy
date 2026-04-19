import { View, Text, Pressable } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const TABS = [
  { label: 'Home',       route: '/dashboard',   icon: '⊞' },
  { label: 'Play Modes', route: '/play-modes',  icon: '▶' },
  { label: 'Daily',      route: '/daily',       icon: '◉' },
  { label: 'Progress',   route: '/progress',    icon: '▲' },
  { label: 'Settings',   route: '/settings',    icon: '⚙' },
] as const;

// Extracted into its own component so hooks are at the top level (not inside .map())
function TabButton({ tab, active }: { tab: typeof TABS[number]; active: boolean }) {
  const router = useRouter();
  const scale = useSharedValue(1);

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withTiming(1, { duration: 200 })
    );
    runOnJS(router.push)(tab.route);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={[
        animatedStyle,
        { flex: 1, alignItems: 'center', paddingVertical: 4 },
      ]}
    >
      <Animated.Text
        style={{
          fontSize: 18,
          marginBottom: 2,
          color: active ? '#a78bfa' : '#71717a',
          transform: [{ scale: active ? 1.2 : 1 }],
        }}
      >
        {tab.icon}
      </Animated.Text>
      <Animated.Text
        style={{
          fontSize: 10,
          fontWeight: '600',
          color: active ? '#a78bfa' : '#71717a',
          opacity: active ? 1 : 0.7,
        }}
      >
        {tab.label}
      </Animated.Text>
    </AnimatedPressable>
  );
}

export function AnimatedTabBar() {
  const pathname = usePathname();

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        backgroundColor: 'rgba(24,24,27,0.96)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.07)',
        paddingBottom: 20,
        paddingTop: 8,
      }}
    >
      {TABS.map((tab) => {
        const active = pathname === tab.route || (pathname === '/' && tab.route === '/dashboard');
        return (
          <TabButton key={tab.route} tab={tab} active={active} />
        );
      })}
    </View>
  );
}
