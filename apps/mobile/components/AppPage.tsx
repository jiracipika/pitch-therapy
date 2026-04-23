import { type ReactNode, useEffect, useRef } from 'react';
import { Animated, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedTabBar } from '@/components/AnimatedTabBar';

interface AppPageProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function AppPage({ title, subtitle, children }: AppPageProps) {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

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
      <Animated.View style={{ flex: 1, opacity, transform: [{ translateY }] }}>
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
          </View>
          {children}
        </ScrollView>
      </Animated.View>
      <AnimatedTabBar />
    </View>
  );
}
