"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * Web swipe navigation hook — Resonance Studio edition.
 *
 * Touch swipe + trackpad two-finger swipe + keyboard arrows to move
 * between the main tab routes, with live drag feedback.
 *
 * Design decisions (mirrors the polished mobile swipe system):
 * - Gesture claim: |dx| > 14px AND |dx| > |dy| * 1.6 (never steals vertical scroll)
 * - Commit: 20% viewport width OR fast flick (velocity > 0.6 px/ms past 40% of threshold)
 * - Rubber-band 0.3x at first/last tab, drag clamped to ±160px
 * - Trackpad: accumulate wheel deltaX; commit on a clearly horizontal flick,
 *   with a momentum lock so one gesture = one tab change
 * - Reports drag direction + target tab so the shell can animate + hint correctly
 * - Respects prefers-reduced-motion (no live drag transform)
 * - Never claims from inputs; router.push keeps back-button semantics
 */

interface SwipeNavOptions {
  /** Routes in tab order */
  routes: string[];
  /** Whether swipe is enabled (e.g. false on detail pages) */
  enabled?: boolean;
}

/** Live drag state consumed by AppTransitionShell for feedback + hints. */
export interface DragFeedback {
  /** Clamped horizontal drag in px; negative = dragging toward next tab. */
  offset: number;
  /** Index of the tab the drag would commit to, or null when idle/at edge. */
  targetIndex: number | null;
  /** -1 = toward previous tab, 1 = toward next tab, 0 idle. */
  direction: -1 | 0 | 1;
}

const CLAIM_PX = 14;
const DOMINANCE = 1.6;
const MAX_DRAG = 160;
const COMMIT_RATIO = 0.2;
const FLICK_VELOCITY = 0.6; // px/ms
const WHEEL_COMMIT_PX = 120;

export function useSwipeNav({ routes, enabled = true }: SwipeNavOptions) {
  const router = useRouter();
  const pathname = usePathname();

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchLastX = useRef<number | null>(null);
  const touchLastT = useRef<number | null>(null);
  const touchVelocity = useRef(0);
  const touchDeltaX = useRef(0);
  const isSwiping = useRef(false);
  const wheelDx = useRef(0);
  const wheelDy = useRef(0);
  const wheelLock = useRef(false);

  const [drag, setDrag] = useState<DragFeedback>({ offset: 0, targetIndex: null, direction: 0 });

  // Current route index (prefix match for nested routes, exact for first)
  const currentIndex = routes.findIndex(
    (route) => pathname === route || (route !== routes[0] && pathname.startsWith(`${route}/`)),
  );
  const canSwipe = enabled && currentIndex >= 0;

  const navigateTo = useCallback(
    (route: string) => {
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      }
      router.push(route);
    },
    [router],
  );

  const goNext = useCallback(() => {
    if (currentIndex < 0 || currentIndex >= routes.length - 1) return;
    navigateTo(routes[currentIndex + 1]!);
  }, [currentIndex, routes, navigateTo]);

  const goPrev = useCallback(() => {
    if (currentIndex <= 0) return;
    navigateTo(routes[currentIndex - 1]!);
  }, [currentIndex, routes, navigateTo]);

  /** Commit rule: distance threshold OR fast flick past 40% of threshold. */
  const shouldCommit = (dx: number, velocity: number) => {
    const threshold = window.innerWidth * COMMIT_RATIO;
    if (Math.abs(dx) > threshold) return true;
    return Math.abs(velocity) > FLICK_VELOCITY && Math.abs(dx) > threshold * 0.4;
  };

  /** Which tab this raw drag would land on; null at an edge. */
  const targetFor = useCallback(
    (rawDx: number): { targetIndex: number | null; direction: -1 | 0 | 1 } => {
      if (rawDx === 0) return { targetIndex: null, direction: 0 };
      const dir: 1 | -1 = rawDx < 0 ? 1 : -1; // negative dx = next tab
      const target = currentIndex + dir;
      const valid = target >= 0 && target < routes.length;
      return { targetIndex: valid ? target : null, direction: valid ? dir : 0 };
    },
    [currentIndex, routes.length],
  );

  const isFormField = (target: EventTarget | null) => {
    const el = target as HTMLElement | null;
    if (!el) return false;
    return (
      el.tagName === "INPUT" ||
      el.tagName === "TEXTAREA" ||
      el.tagName === "SELECT" ||
      el.isContentEditable
    );
  };

  // Keyboard navigation: Ctrl/Cmd + ArrowLeft/Right
  useEffect(() => {
    if (!canSwipe) return;

    const handleKey = (e: KeyboardEvent) => {
      if (isFormField(e.target)) return;

      if ((e.ctrlKey || e.metaKey) && e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [canSwipe, goNext, goPrev]);

  // Touch swipe navigation
  useEffect(() => {
    if (!canSwipe) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1 || isFormField(e.target)) return;
      touchStartX.current = e.touches[0]!.clientX;
      touchStartY.current = e.touches[0]!.clientY;
      touchLastX.current = touchStartX.current;
      touchLastT.current = performance.now();
      touchVelocity.current = 0;
      touchDeltaX.current = 0;
      isSwiping.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;
      if (e.touches.length !== 1) return;

      const x = e.touches[0]!.clientX;
      const y = e.touches[0]!.clientY;
      const dx = x - touchStartX.current;
      const dy = y - touchStartY.current;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // Track smoothed velocity (px/ms) between move samples
      const now = performance.now();
      if (touchLastX.current !== null && touchLastT.current !== null) {
        const dt = Math.max(1, now - touchLastT.current);
        const vx = (x - touchLastX.current) / dt;
        touchVelocity.current = touchVelocity.current * 0.6 + vx * 0.4;
      }
      touchLastX.current = x;
      touchLastT.current = now;

      // Claim only when clearly horizontal
      if (!isSwiping.current) {
        if (absDx < CLAIM_PX || absDx < absDy * DOMINANCE) return;
        isSwiping.current = true;
      }

      // Once claimed, block vertical scroll for a horizontal gesture
      if (absDx > absDy) {
        e.preventDefault();
      }

      // Rubber-band at edges
      let clampedDx = dx;
      if (currentIndex === 0 && dx > 0) clampedDx = dx * 0.3;
      if (currentIndex === routes.length - 1 && dx < 0) clampedDx = dx * 0.3;
      clampedDx = Math.max(-MAX_DRAG, Math.min(MAX_DRAG, clampedDx));

      touchDeltaX.current = clampedDx;
      if (!reducedMotion) {
        const { targetIndex, direction } = targetFor(dx);
        setDrag((prev) =>
          prev.offset === clampedDx && prev.targetIndex === targetIndex && prev.direction === direction
            ? prev
            : { offset: clampedDx, targetIndex, direction },
        );
      }
    };

    const handleTouchEnd = () => {
      if (touchStartX.current === null || !isSwiping.current) {
        touchStartX.current = null;
        touchStartY.current = null;
        return;
      }

      const dx = touchDeltaX.current;
      if (shouldCommit(dx, touchVelocity.current)) {
        if (dx < 0) goNext();
        else goPrev();
      }

      setDrag({ offset: 0, targetIndex: null, direction: 0 });
      touchStartX.current = null;
      touchStartY.current = null;
      touchLastX.current = null;
      touchLastT.current = null;
      touchVelocity.current = 0;
      touchDeltaX.current = 0;
      isSwiping.current = false;
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [canSwipe, currentIndex, routes.length, goNext, goPrev, targetFor]);

  // Trackpad two-finger horizontal swipe (wheel deltaX).
  // macOS trackpads emit a stream of small deltaX wheel events per gesture.
  // Accumulate deltas; commit one tab change when horizontal dominates and
  // the accumulated distance passes the threshold. A momentum lock ignores
  // the tail of the gesture so one flick = exactly one tab change.
  useEffect(() => {
    if (!canSwipe) return;

    const handleWheel = (e: WheelEvent) => {
      if (isFormField(e.target)) return;

      wheelDx.current += e.deltaX;
      wheelDy.current += e.deltaY;

      // Momentum lock: after a commit, ignore wheel until deltas settle
      if (wheelLock.current) {
        if (Math.abs(e.deltaX) < 2 && Math.abs(e.deltaY) < 2) {
          wheelLock.current = false;
          wheelDx.current = 0;
          wheelDy.current = 0;
        }
        return;
      }

      const totalDx = wheelDx.current;
      const totalDy = wheelDy.current;

      if (Math.abs(totalDx) > WHEEL_COMMIT_PX && Math.abs(totalDx) > Math.abs(totalDy)) {
        if (totalDx > 0) goNext();
        else goPrev();
        wheelDx.current = 0;
        wheelDy.current = 0;
        wheelLock.current = true;
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [canSwipe, goNext, goPrev]);

  // Reset transient drag state when the route changes
  useEffect(() => {
    setDrag({ offset: 0, targetIndex: null, direction: 0 });
    wheelDx.current = 0;
    wheelDy.current = 0;
    wheelLock.current = false;
  }, [pathname]);

  return {
    drag,
    canSwipe,
    currentIndex,
    goNext,
    goPrev,
  };
}
