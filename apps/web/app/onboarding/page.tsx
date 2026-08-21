'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Link from 'next/link';

const STEPS = [
  {
    emoji: '🎵',
    color: '#c7ff4a',
    title: 'Train your ear',
    desc: '18 focused drills that sharpen pitch, frequency recognition, and musical intervals. From beginner to expert.',
  },
  {
    emoji: '🔥',
    color: '#ff7a59',
    title: 'Daily challenges',
    desc: 'A fresh challenge every day. Keep your streak alive and build the habit of listening closely.',
  },
  {
    emoji: '📊',
    color: '#62e6a7',
    title: 'Track progress',
    desc: 'Detailed stats, accuracy trends, and streak tracking. See your growth over time.',
  },
  {
    emoji: '🎓',
    color: '#9b8cff',
    title: 'Practice mode',
    desc: 'No pressure, no scoring. Explore sounds and train at your own pace.',
  },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const reduce = useReducedMotion();
  const cur = STEPS[step]!;

  return (
    <div className="studio-gate">
      <div className="studio-gate-inner">
        <div className="studio-gate-mark" aria-hidden="true">🎵</div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={reduce ? false : { opacity: 0, x: 36 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: -36 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="studio-gate-overline">STEP 0{step + 1} / 0{STEPS.length}</span>
            <h1>{cur.title.split(' ')[0]}<br /><em>{cur.title.split(' ').slice(1).join(' ')}</em></h1>
            <p className="studio-gate-sub">{cur.desc}</p>
            <motion.div
              className="studio-onboard-icon studio-onboard-emoji-ring"
              style={{ '--step-accent': cur.color, background: `color-mix(in srgb, ${cur.color} 14%, transparent)` } as React.CSSProperties}
              initial={reduce ? false : { scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 20 }}
              aria-hidden="true"
            >
              {cur.emoji}
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Step dots */}
        <div className="studio-onboard-steps" role="tablist" aria-label="Onboarding progress">
          {STEPS.map((s, i) => (
            <i key={i} className={i === step ? 'is-active' : ''} style={i === step ? { background: cur.color } : undefined} />
          ))}
        </div>

        {/* Actions */}
        <div className="studio-gate-actions">
          {step < STEPS.length - 1 ? (
            <>
              <button
                onClick={() => setStep(s => s + 1)}
                className="ios-btn-primary"
                style={{ borderRadius: 999, background: cur.color, letterSpacing: '-.01em' }}
              >
                Next step
              </button>
              <Link
                href="/dashboard"
                className="studio-gate-link"
                style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              >
                Skip intro →
              </Link>
            </>
          ) : (
            <Link
              href="/dashboard"
              className="ios-btn-primary"
              style={{ borderRadius: 999, background: cur.color, textDecoration: 'none', letterSpacing: '-.01em' }}
            >
              Enter the studio
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
