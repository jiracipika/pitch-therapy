import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { triggerImpactLight, triggerCorrectHaptic, triggerIncorrectHaptic } from '@/lib/haptics';
import { useReducedMotionPreference } from '@/lib/motion';
import { colors, radii, typography } from '@/lib/theme';

// ─── Toast types ─────────────────────────────────────────────────────────────

type ToastTone = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
  icon?: string;
  duration: number;
}

interface ToastContextValue {
  show: (tone: ToastTone, message: string, opts?: { icon?: string; duration?: number }) => void;
  success: (message: string, opts?: { icon?: string }) => void;
  error: (message: string, opts?: { icon?: string }) => void;
  info: (message: string, opts?: { icon?: string }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

// ─── Tone styling ────────────────────────────────────────────────────────────

const toneConfig: Record<ToastTone, { color: string; defaultIcon: string }> = {
  success: { color: colors.green, defaultIcon: '✓' },
  error: { color: colors.danger, defaultIcon: '!' },
  info: { color: colors.blue, defaultIcon: 'i' },
  warning: { color: colors.orange, defaultIcon: '▲' },
};

// ─── Single toast card ───────────────────────────────────────────────────────

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
  const reducedMotion = useReducedMotionPreference();
  const slideIn = useRef(new Animated.Value(-100)).current;
  const scale = useRef(new Animated.Value(reducedMotion ? 1 : 0.85)).current;
  const opacity = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  const cfg = toneConfig[toast.tone];

  useEffect(() => {
    if (reducedMotion) return;

    Animated.parallel([
      Animated.spring(slideIn, {
        toValue: 0,
        damping: 14,
        stiffness: 180,
        mass: 0.8,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        damping: 12,
        stiffness: 200,
        mass: 0.7,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, reducedMotion, scale, slideIn]);

  const handleDismiss = () => {
    if (reducedMotion) {
      onDismiss(toast.id);
      return;
    }
    Animated.parallel([
      Animated.timing(slideIn, { toValue: -100, duration: 200, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onDismiss(toast.id));
  };

  return (
    <Animated.View
      style={{
        transform: [{ translateY: slideIn }, { scale }],
        opacity,
      }}
    >
      <Pressable
        onPress={handleDismiss}
        style={[
          styles.toastCard,
          {
            borderColor: cfg.color + '55',
            backgroundColor: colors.card,
          },
        ]}
      >
        <View
          style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            backgroundColor: cfg.color,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#00121f', fontSize: 13, fontWeight: '900' }}>
            {toast.icon ?? cfg.defaultIcon}
          </Text>
        </View>
        <Text style={styles.toastMessage} numberOfLines={3}>
          {toast.message}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── Toast container / provider ──────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idCounter = useRef(0);
  const insets = useSafeAreaInsets();

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback<ToastContextValue['show']>(
    (tone, message, opts) => {
      const id = idCounter.current++;
      const duration = opts?.duration ?? (tone === 'error' ? 4000 : 2800);

      setToasts((prev) => [...prev, { id, tone, message, icon: opts?.icon, duration }]);

      // Trigger haptic based on tone
      if (tone === 'success') void triggerCorrectHaptic();
      else if (tone === 'error') void triggerIncorrectHaptic();
      else void triggerImpactLight();

      // Auto-dismiss
      setTimeout(() => dismiss(id), duration);
    },
    [dismiss],
  );

  const value: ToastContextValue = {
    show,
    success: (msg, opts) => show('success', msg, opts),
    error: (msg, opts) => show('error', msg, opts),
    info: (msg, opts) => show('info', msg, opts),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: insets.top + 8,
          left: 12,
          right: 12,
          gap: 8,
          zIndex: 9999,
          elevation: 9999,
        }}
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radii.lg,
    borderWidth: 1,
    boxShadow: '4px 5px 0 rgba(0,0,0,0.32)',
  },
  toastMessage: {
    flex: 1,
    color: colors.text,
    ...typography.subhead,
  },
});
