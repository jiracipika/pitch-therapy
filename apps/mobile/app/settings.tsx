import { View, Text, Switch } from 'react-native';
import { useState } from 'react';
import { AppPage } from '@/components/AppPage';

export default function SettingsScreen() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);

  return (
    <AppPage title="Settings" subtitle="Fine-tune your training experience.">
      <Text style={{ color: '#9ca3af', fontSize: 12, textTransform: 'uppercase', fontWeight: '700' }}>Audio</Text>

      <View
        style={{
          backgroundColor: 'rgba(255,255,255,0.04)',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.08)',
          overflow: 'hidden',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={{ color: '#f5f5f5', fontWeight: '700' }}>Sound Effects</Text>
            <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 2 }}>Play tones and answer feedback</Text>
          </View>
          <Switch
            value={soundEnabled}
            onValueChange={setSoundEnabled}
            trackColor={{ false: '#27272a', true: '#7c3aed' }}
            thumbColor={soundEnabled ? '#ddd6fe' : '#a1a1aa'}
          />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={{ color: '#f5f5f5', fontWeight: '700' }}>Haptic Feedback</Text>
            <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 2 }}>Vibrate on correct and incorrect answers</Text>
          </View>
          <Switch
            value={hapticEnabled}
            onValueChange={setHapticEnabled}
            trackColor={{ false: '#27272a', true: '#7c3aed' }}
            thumbColor={hapticEnabled ? '#ddd6fe' : '#a1a1aa'}
          />
        </View>
      </View>

      <Text style={{ color: '#9ca3af', fontSize: 12, textTransform: 'uppercase', fontWeight: '700' }}>Reference</Text>
      <View
        style={{
          backgroundColor: 'rgba(255,255,255,0.04)',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.08)',
          overflow: 'hidden',
        }}
      >
        {[
          { label: 'Reference Pitch', value: 'A4 = 440 Hz' },
          { label: 'Tuning System', value: '12-TET' },
        ].map((item, index, array) => (
          <View
            key={item.label}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
              borderBottomWidth: index < array.length - 1 ? 1 : 0,
              borderBottomColor: 'rgba(255,255,255,0.08)',
            }}
          >
            <Text style={{ color: '#f5f5f5', flex: 1 }}>{item.label}</Text>
            <Text style={{ color: '#9ca3af', fontSize: 13 }}>{item.value}</Text>
          </View>
        ))}
      </View>

      <Text style={{ color: '#9ca3af', fontSize: 12, textTransform: 'uppercase', fontWeight: '700' }}>About</Text>
      <View
        style={{
          backgroundColor: 'rgba(255,255,255,0.04)',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.08)',
          padding: 16,
        }}
      >
        <Text style={{ color: '#f5f5f5', fontWeight: '700', marginBottom: 6 }}>Pitch Therapy</Text>
        <Text style={{ color: '#9ca3af', fontSize: 13, lineHeight: 20 }}>
          Train your ear with focused drills. Improve pitch accuracy, interval recognition, and consistency over time.
        </Text>
        <Text style={{ color: '#71717a', fontSize: 12, marginTop: 12 }}>Version 0.1.0</Text>
      </View>
    </AppPage>
  );
}
