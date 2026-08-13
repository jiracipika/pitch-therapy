'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useSwipeNav } from '@/lib/useSwipeNav';

const SWIPE_ROUTES = [
  '/dashboard',
  '/play-modes',
  '/daily',
  '/progress',
  '/profile',
  '/settings',
];

export default function AppTransitionShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const [isSafari, setIsSafari] = useState(false);
  const [isLowResourceProfile, setIsLowResourceProfile] = useState(false);
  const motionLite = reducedMotion || isSafari || isLowResourceProfile;

  // Swipe navigation: live drag feedback + keyboard arrows
  const { dragOffset, dragOpacity, canSwipe } = useSwipeNav({
    routes: SWIPE_ROUTES,
    enabled: !SWIPE_ROUTES.every((r) => pathname === r || !pathname.startsWith('/')),
  });

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
    document.body.classList.toggle('pt-motion-lite', motionLite);
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

  // Determine direction for enter animation based on route order
  const routeIndex = SWIPE_ROUTES.indexOf(pathname);
  const enterDirection = routeIndex >= 0 ? 1 : 0;

  return (
    <div className="pt-route-root">
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

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          className="pt-route-page"
          initial={motionLite ? { opacity: 1 } : { opacity: 0, x: enterDirection * 20 }}
          animate={motionLite ? { opacity: 1 } : { opacity: 1, x: 0 }}
          exit={motionLite ? { opacity: 0 } : { opacity: 0, x: -enterDirection * 12 }}
          transition={{ duration: motionLite ? 0.22 : 0.38, ease: [0.22, 1, 0.36, 1] }}
          style={{
            // Live drag feedback during touch swipe
            transform: canSwipe && dragOffset !== 0 ? `translateX(${dragOffset}px)` : undefined,
            opacity: canSwipe && dragOpacity < 1 ? dragOpacity : undefined,
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
