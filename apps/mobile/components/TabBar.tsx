import { View, Text, Pressable } from 'react-native';
import { useRouter, usePathname } from 'expo-router';

const TABS = [
  { label: 'Home',     route: '/dashboard', icon: '⊞' },
  { label: 'Daily',    route: '/daily',     icon: '◉' },
  { label: 'Progress', route: '/progress',  icon: '▲' },
  { label: 'Settings', route: '/settings',  icon: '⚙' },
] as const;

export function TabBar() {
  const router = useRouter();
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
          <Pressable
            key={tab.route}
            onPress={() => router.push(tab.route)}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}
          >
            <Text style={{ fontSize: 18, marginBottom: 2, color: active ? '#a78bfa' : '#71717a' }}>
              {tab.icon}
            </Text>
            <Text
              style={{
                fontSize: 10,
                fontWeight: '600',
                color: active ? '#a78bfa' : '#71717a',
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
