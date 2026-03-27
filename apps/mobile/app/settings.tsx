import { View, Text, ScrollView, Switch } from 'react-native';
import { useState } from 'react';
import { TabBar } from '@/components/TabBar';

export default function SettingsScreen() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);

  return (
    <View style={{ flex: 1, backgroundColor: '#09090b' }}>
      <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} contentContainerStyle={{ paddingTop: 56, paddingBottom: 100 }}>
        <Text style={{ color: '#f4f4f5', fontSize: 28, fontWeight: '700', marginBottom: 24 }}>
          Settings
        </Text>

        <Text style={{ color: '#71717a', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
          Audio
        </Text>

        <View
          style={{
            backgroundColor: 'rgba(255,255,255,0.04)',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.07)',
            marginBottom: 20,
            overflow: 'hidden',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#f4f4f5', fontWeight: '600' }}>Sound Effects</Text>
              <Text style={{ color: '#71717a', fontSize: 12, marginTop: 2 }}>Play tones and feedback sounds</Text>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ false: '#27272a', true: '#7c3aed' }}
              thumbColor={soundEnabled ? '#a78bfa' : '#71717a'}
            />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#f4f4f5', fontWeight: '600' }}>Haptic Feedback</Text>
              <Text style={{ color: '#71717a', fontSize: 12, marginTop: 2 }}>Vibrate on correct/incorrect</Text>
            </View>
            <Switch
              value={hapticEnabled}
              onValueChange={setHapticEnabled}
              trackColor={{ false: '#27272a', true: '#7c3aed' }}
              thumbColor={hapticEnabled ? '#a78bfa' : '#71717a'}
            />
          </View>
        </View>

        <Text style={{ color: '#71717a', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
          Reference
        </Text>

        <View
          style={{
            backgroundColor: 'rgba(255,255,255,0.04)',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.07)',
            marginBottom: 20,
          }}
        >
          {[
            { label: 'Reference Pitch', value: 'A4 = 440 Hz' },
            { label: 'Tuning System',   value: '12-TET' },
          ].map((item, i, arr) => (
            <View
              key={item.label}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                borderBottomWidth: i < arr.length - 1 ? 1 : 0,
                borderBottomColor: 'rgba(255,255,255,0.07)',
              }}
            >
              <Text style={{ color: '#f4f4f5', flex: 1 }}>{item.label}</Text>
              <Text style={{ color: '#71717a', fontSize: 13 }}>{item.value}</Text>
            </View>
          ))}
        </View>

        <Text style={{ color: '#71717a', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
          About
        </Text>

        <View
          style={{
            backgroundColor: 'rgba(255,255,255,0.04)',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.07)',
            padding: 16,
          }}
        >
          <Text style={{ color: '#f4f4f5', fontWeight: '600', marginBottom: 4 }}>Pitch Therapy</Text>
          <Text style={{ color: '#71717a', fontSize: 13, lineHeight: 20 }}>
            Train your ear with scientifically designed exercises. Identify notes, match frequencies, and build musical intuition — every day.
          </Text>
          <Text style={{ color: '#71717a', fontSize: 12, marginTop: 12 }}>Version 0.1.0</Text>
        </View>
      </ScrollView>

      <TabBar />
    </View>
  );
}
