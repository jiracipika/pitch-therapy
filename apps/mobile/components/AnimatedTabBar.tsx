import { View, Text, Pressable } from 'react-native';
import { useRouter, usePathname } from 'expo-router';

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

  return (
    <Pressable
      onPress={() => router.push(tab.route)}
      style={({ pressed }) => ({
        flex: 1,
        transform: [{ scale: pressed ? 0.94 : 1 }],
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <View
        style={{ alignItems: 'center', paddingVertical: 4 }}
      >
        <Text
          style={{
            fontSize: 18,
            marginBottom: 2,
            color: active ? '#a78bfa' : '#71717a',
            transform: [{ scale: active ? 1.2 : 1 }],
          }}
        >
          {tab.icon}
        </Text>
        <Text
          style={{
            fontSize: 10,
            fontWeight: '600',
            color: active ? '#a78bfa' : '#71717a',
            opacity: active ? 1 : 0.7,
          }}
        >
          {tab.label}
        </Text>
      </View>
    </Pressable>
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
