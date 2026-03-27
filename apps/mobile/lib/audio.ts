import { Alert } from 'react-native';

// Placeholder audio playback — will be wired to real audio engine later
export async function playTone(note: string, hz: number): Promise<void> {
  console.log(`[audio] Playing ${note} at ${hz}Hz`);
  Alert.alert('🔊 Audio', `Playing ${note} at ${hz}Hz`);
}
