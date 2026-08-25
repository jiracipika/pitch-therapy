'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useSwipeNav } from '@/lib/useSwipeNav';

/**
 * Tab route order — must match the Nav TABS order so swipe direction,
 * transition direction, and the nav rail all agree.
 */
const SWIPE_ROUTES = ['/dashboard', '/play-modes', '/daily', '/progress', '/profile', '/settings'];
const ROUTE_LABELS: Record<string, string> = {
  '/dashboard': 'Studio',
  '/play-modes': 'Exercises',
  '/daily': 'Daily',
  '/progress': 'Insights',
  '/profile': 'Profile',
  '/settings': 'Settings',
};

export default function AppTransitionShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const [isSafari, setIsSafari] = useState(false);
  const [isLowResourceProfile, setIsLowResourceProfile] = useState(false);
  const motionLite = reducedMotion || isSafari || isLowResourceProfile;

  // Direction memory: +1 = moving forward through tabs, -1 = back.
  // Updated on every pathname change by comparing tab indexes; falls back
  // to +1 when entering the tab area from outside (e.g. a game page).
  const lastDirection = useRef(1);
  const prevIndex = useRef<number | null>(null);
  const routeIndex = SWIPE_ROUTES.indexOf(pathname);

  useEffect(() => {
    if (routeIndex >= 0 && prevIndex.current !== null && routeIndex !== prevIndex.current) {
      lastDirection.current = routeIndex > prevIndex.current ? 1 : -1;
    }
    prevIndex.current = routeIndex >= 0 ? routeIndex : null;
  }, [routeIndex]);

  // Swipe navigation: live drag feedback + trackpad flicks + keyboard arrows
  const { drag, canSwipe } = useSwipeNav({
    routes: SWIPE_ROUTES,
    enabled: routeIndex >= 0,
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

  const ambientDurations = { a: motionLite ? 26 : 18, b: motionLite ? 30 : 22, grid: motionLite ? 0 : 8 };

  // ── Live drag feedback ──────────────────────────────────────────
  // Applied to a PLAIN wrapper div (not the motion.div) so framer-motion's
  // transform management never fights the finger-follow transform.
  // While dragging: no transition (instant follow). On release: CSS spring
  // back to center while the route transition takes over.
  const dragging = canSwipe && drag.offset !== 0;
  const dragTransform = dragging ? `translateX(${drag.offset}px)` : undefined;
  const dragOpacity = dragging ? 1 - (Math.abs(drag.offset) / 160) * 0.3 : undefined;
  const dragLayerStyle: React.CSSProperties = {
    transform: dragTransform,
    opacity: dragOpacity,
    transition: dragging ? 'none' : 'transform 0.34s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.34s cubic-bezier(0.22, 1, 0.36, 1)',
  };

  // Swipe hints: fade in the label of the tab a committed drag lands on.
  const hintIntensity = Math.min(1, Math.abs(drag.offset) / 110);
  const prevLabel = drag.direction === -1 && drag.targetIndex !== null ? ROUTE_LABELS[SWIPE_ROUTES[drag.targetIndex]!] : null;
  const nextLabel = drag.direction === 1 && drag.targetIndex !== null ? ROUTE_LABELS[SWIPE_ROUTES[drag.targetIndex]!] : null;

  // ── Route transitions ───────────────────────────────────────────
  // Direction-aware: forward (dir +1) → new page enters from right, old
  // exits left; back (dir −1) → mirrored. What you see always matches the
  // swipe/click direction. popLayout lets enter+exit run simultaneously
  // (no dead "wait" gap between pages).
  const dir = lastDirection.current;
  const enterFrom = motionLite ? 0 : dir * 26;
  const exitTo = motionLite ? 0 : -dir * 16;

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

      {/* Swipe target hints — preview where the drag lands */}
      <div className="pt-swipe-hints" aria-hidden>
        <span className="pt-swipe-hint is-prev" style={{ opacity: prevLabel ? hintIntensity : 0 }}>
          {prevLabel ? <><i>←</i> {prevLabel}</> : null}
        </span>
        <span className="pt-swipe-hint is-next" style={{ opacity: nextLabel ? hintIntensity : 0 }}>
          {nextLabel ? <>{nextLabel} <i>→</i></> : null}
        </span>
      </div>

      {/* Drag layer — plain div carrying the finger-follow transform */}
      <div className="pt-route-drag-layer" style={dragLayerStyle}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={pathname}
            className="pt-route-page"
            initial={{ opacity: motionLite ? 1 : 0, x: enterFrom }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: exitTo }}
            transition={
              motionLite
                ? { duration: 0.22, ease: 'easeOut' }
                : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
            }
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
