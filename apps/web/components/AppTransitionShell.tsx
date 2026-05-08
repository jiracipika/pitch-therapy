'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { usePathname } from 'next/navigation';

function useAmbientEnabled(pathname: string) {
  if (pathname === '/') return true;
  if (pathname.startsWith('/auth')) return false;
  if (pathname.startsWith('/onboarding')) return true;
  return true;
}

export default function AppTransitionShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const showAmbient = useAmbientEnabled(pathname);

  return (
    <div className="pt-route-root">
      {showAmbient && (
        <div className="pt-ambient" aria-hidden>
          <motion.div
            className="pt-ambient-glow pt-ambient-glow-a"
            animate={reducedMotion ? undefined : { x: ['-2%', '2%', '-2%'], y: ['0%', '-3%', '0%'] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="pt-ambient-glow pt-ambient-glow-b"
            animate={reducedMotion ? undefined : { x: ['3%', '-3%', '3%'], y: ['1%', '-2%', '1%'] }}
            transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="pt-ambient-grid"
            animate={reducedMotion ? undefined : { opacity: [0.2, 0.32, 0.2] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      )}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          className="pt-route-page"
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 14, filter: 'blur(6px)' }}
          animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -8, filter: 'blur(4px)' }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

