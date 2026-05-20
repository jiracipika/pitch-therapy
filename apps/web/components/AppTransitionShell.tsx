'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { usePathname } from 'next/navigation';

type GlassMode = 'high' | 'reduced';
const GLASS_MODE_KEY = 'pt_glass_mode';

function useAmbientEnabled(pathname: string) {
  if (pathname === '/') return true;
  if (pathname.startsWith('/auth')) return false;
  if (pathname.startsWith('/onboarding')) return true;
  return true;
}

export default function AppTransitionShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const [isSafari, setIsSafari] = useState(false);
  const [isLowResourceProfile, setIsLowResourceProfile] = useState(false);
  const [glassMode, setGlassMode] = useState<GlassMode>('high');
  const showAmbient = useAmbientEnabled(pathname);
  const motionLite = reducedMotion || isSafari || isLowResourceProfile || glassMode === 'reduced';

  useEffect(() => {
    const ua = navigator.userAgent;
    const safari = /Safari/i.test(ua) && !/Chrome|Chromium|CriOS|Edg|OPR|FxiOS/i.test(ua);
    setIsSafari(safari);

    const nav = navigator as Navigator & { deviceMemory?: number };
    const lowMemory = typeof nav.deviceMemory === 'number' ? nav.deviceMemory <= 4 : false;
    const lowCoreCount = typeof navigator.hardwareConcurrency === 'number' ? navigator.hardwareConcurrency <= 4 : false;
    setIsLowResourceProfile(lowMemory || lowCoreCount);
  }, []);

  useEffect(() => {
    const readGlassMode = () => {
      const next = window.localStorage.getItem(GLASS_MODE_KEY);
      if (next === 'reduced' || next === 'high') {
        setGlassMode(next);
        return;
      }
      setGlassMode('high');
    };

    readGlassMode();
    const handleStorage = (event: StorageEvent) => {
      if (event.key === GLASS_MODE_KEY) {
        readGlassMode();
      }
    };
    const handleLocal = () => readGlassMode();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('pt:glass-mode-changed', handleLocal);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('pt:glass-mode-changed', handleLocal);
    };
  }, []);

  useEffect(() => {
    const reduced = glassMode === 'reduced';
    document.body.classList.toggle('pt-glass-reduced', reduced);
    document.body.classList.toggle('pt-glass-high', !reduced);
    return () => {
      document.body.classList.remove('pt-glass-reduced');
      document.body.classList.remove('pt-glass-high');
    };
  }, [glassMode]);

  useEffect(() => {
    if (motionLite) {
      document.body.classList.add('pt-motion-lite');
    } else {
      document.body.classList.remove('pt-motion-lite');
    }
    return () => document.body.classList.remove('pt-motion-lite');
  }, [motionLite]);

  const ambientDurations = useMemo(
    () => ({
      a: motionLite ? 26 : 18,
      b: motionLite ? 30 : 22,
      grid: motionLite ? 0 : 8,
    }),
    [motionLite],
  );

  return (
    <div className="pt-route-root">
      {showAmbient && (
        <div className="pt-ambient" aria-hidden>
          <motion.div
            className="pt-ambient-glow pt-ambient-glow-a"
            animate={motionLite ? undefined : { x: ['-2%', '2%', '-2%'], y: ['0%', '-3%', '0%'] }}
            transition={{ duration: ambientDurations.a, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="pt-ambient-glow pt-ambient-glow-b"
            animate={motionLite ? undefined : { x: ['3%', '-3%', '3%'], y: ['1%', '-2%', '1%'] }}
            transition={{ duration: ambientDurations.b, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="pt-ambient-grid"
            animate={motionLite ? undefined : { opacity: [0.2, 0.32, 0.2] }}
            transition={{ duration: ambientDurations.grid, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      )}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          className="pt-route-page"
          initial={motionLite ? { opacity: 1 } : { opacity: 0, y: 12 }}
          animate={motionLite ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={motionLite ? { opacity: 1 } : { opacity: 0, y: -8 }}
          transition={{ duration: motionLite ? 0.22 : 0.42, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
