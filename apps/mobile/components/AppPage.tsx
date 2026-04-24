import { type ReactNode, useEffect, useMemo, useRef } from 'react';
import { Animated, PanResponder, ScrollView, Text, View } from 'react-native';
import { type Href, usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedTabBar } from '@/components/AnimatedTabBar';
import { MAIN_TABS } from '@/lib/main-tabs';

interface AppPageProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function AppPage({ title, subtitle, children }: AppPageProps) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  const activeIndex = MAIN_TABS.findIndex((tab) => tab.route === pathname);
  const canSwipeTabs = activeIndex >= 0;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          if (!canSwipeTabs) return false;
          const dx = Math.abs(gestureState.dx);
          const dy = Math.abs(gestureState.dy);
          return dx > 14 && dx > dy * 1.2;
        },
        onPanResponderRelease: (_, gestureState) => {
          if (!canSwipeTabs) return;
          const trigger = Math.abs(gestureState.dx) > 72 || Math.abs(gestureState.vx) > 0.45;
          if (!trigger) return;

          const targetIndex = gestureState.dx < 0 ? activeIndex + 1 : activeIndex - 1;
          const targetTab = MAIN_TABS[targetIndex];
          if (!targetTab) return;
          router.replace(targetTab.route as Href);
        },
      }),
    [activeIndex, canSwipeTabs, router],
  );

  useEffect(() => {
    opacity.setValue(0);
    translateY.setValue(12);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  return (
    <View style={{ flex: 1, backgroundColor: '#07070a' }}>
      <Animated.View
        style={{ flex: 1, opacity, transform: [{ translateY }] }}
        {...(canSwipeTabs ? panResponder.panHandlers : {})}
      >
        <ScrollView
          contentInsetAdjustmentBehavior="never"
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingTop: insets.top + 16,
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 120,
            gap: 20,
          }}
        >
          <View style={{ gap: 6 }}>
            <Text style={{ color: '#f5f5f5', fontSize: 30, fontWeight: '700' }}>{title}</Text>
            {subtitle ? <Text style={{ color: '#9ca3af', fontSize: 14 }}>{subtitle}</Text> : null}
            {canSwipeTabs ? (
              <Text style={{ color: '#6b7280', fontSize: 12 }}>Swipe left or right to move between sections</Text>
            ) : null}
          </View>
          {children}
        </ScrollView>
      </Animated.View>
      <AnimatedTabBar />
    </View>
  );
}
