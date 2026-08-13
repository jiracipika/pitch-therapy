"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Href } from "expo-router";

/**
 * Web swipe navigation hook.
 *
 * Adds touch swipe-to-switch-tab gestures and keyboard arrow navigation
 * to any Next.js app with a tab/section layout.
 *
 * Features:
 * - Touch: horizontal swipe (>20% screen width) switches to next/prev tab
 * - Keyboard: Ctrl/Cmd + ArrowLeft/ArrowRight switches tabs
 * - Scroll restoration: scrolls to top on navigation
 * - Respects prefers-reduced-motion
 * - Won't steal vertical scroll gestures
 * - Rubber-bands at first/last tab
 * - Excludes input/textarea/contenteditable from keyboard handling
 *
 * @param routes Ordered array of route paths (e.g. ["/dashboard", "/play-modes", ...])
 */

interface SwipeNavOptions {
  /** Routes in tab order */
  routes: string[];
  /** Whether swipe is enabled (e.g. false on detail pages) */
  enabled?: boolean;
}

export function useSwipeNav({ routes, enabled = true }: SwipeNavOptions) {
  const router = useRouter();
  const pathname = usePathname();
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchDeltaX = useRef(0);
  const isSwiping = useRef(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragOpacity, setDragOpacity] = useState(1);

  // Find current route index
  const currentIndex = routes.findIndex(
    (route) => pathname === route || (route !== routes[0] && pathname.startsWith(`${route}/`)),
  );
  const canSwipe = enabled && currentIndex >= 0;

  // Navigate to a route with scroll restoration
  const navigateTo = useCallback(
    (route: string) => {
      // Scroll to top before navigation for smooth feel
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

  // Keyboard navigation
  useEffect(() => {
    if (!canSwipe) return;

    const handleKey = (e: KeyboardEvent) => {
      // Don't interfere with inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        target.tagName === "SELECT"
      ) {
        return;
      }

      // Ctrl/Cmd + ArrowLeft/Right to switch tabs
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
      if (e.touches.length !== 1) return;
      // Don't capture swipes from form fields
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        target.tagName === "SELECT"
      ) {
        return;
      }
      touchStartX.current = e.touches[0]!.clientX;
      touchStartY.current = e.touches[0]!.clientY;
      touchDeltaX.current = 0;
      isSwiping.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;
      if (e.touches.length !== 1) return;

      const dx = e.touches[0]!.clientX - touchStartX.current;
      const dy = e.touches[0]!.clientY - touchStartY.current;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // Claim the gesture if clearly horizontal
      if (!isSwiping.current) {
        if (absDx < 14 || absDx < absDy * 1.6) return;
        isSwiping.current = true;
      }

      // Prevent vertical scroll while swiping horizontally
      if (absDx > absDy) {
        e.preventDefault();
      }

      // Rubber-band at edges
      let clampedDx = dx;
      if (currentIndex === 0 && dx > 0) {
        clampedDx = dx * 0.3;
      }
      if (currentIndex === routes.length - 1 && dx < 0) {
        clampedDx = dx * 0.3;
      }
      clampedDx = Math.max(-140, Math.min(140, clampedDx));

      touchDeltaX.current = clampedDx;
      if (!reducedMotion) {
        setDragOffset(clampedDx);
        setDragOpacity(1 - (Math.abs(clampedDx) / 140) * 0.25);
      }
    };

    const handleTouchEnd = () => {
      if (touchStartX.current === null || !isSwiping.current) {
        touchStartX.current = null;
        touchStartY.current = null;
        return;
      }

      const dx = touchDeltaX.current;
      const threshold = window.innerWidth * 0.2;
      const shouldCommit = Math.abs(dx) > threshold;

      if (shouldCommit) {
        if (dx < 0) {
          goNext();
        } else {
          goPrev();
        }
      }

      // Reset drag visual
      setDragOffset(0);
      setDragOpacity(1);
      touchStartX.current = null;
      touchStartY.current = null;
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
  }, [canSwipe, currentIndex, routes.length, goNext, goPrev]);

  // Scroll restoration on route change
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  }, [pathname]);

  return {
    dragOffset,
    dragOpacity,
    canSwipe,
    currentIndex,
    goNext,
    goPrev,
  };
}
