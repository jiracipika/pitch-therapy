import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useAppSettings } from '@/lib/settings';

export function useSystemReduceMotion() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active) {
          setEnabled(value);
        }
      })
      .catch(() => {
        if (active) {
          setEnabled(false);
        }
      });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
      setEnabled(value);
    });

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return enabled;
}

export function useReducedMotionPreference() {
  const systemReduceMotion = useSystemReduceMotion();
  const { glassMode } = useAppSettings();
  return systemReduceMotion || glassMode === 'reduced';
}
