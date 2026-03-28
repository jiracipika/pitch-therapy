'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const STEPS = [
  {
    emoji: '🎵',
    color: '#0A84FF',
    title: 'Train Your Ear',
    desc: '18 game modes designed to sharpen your pitch, frequency recognition, and musical intervals. From beginner to expert.',
  },
  {
    emoji: '🔥',
    color: '#FF9F0A',
    title: 'Daily Challenges',
    desc: 'A fresh challenge every day. Keep your streak alive and build the habit of listening closely.',
  },
  {
    emoji: '📊',
    color: '#30D158',
    title: 'Track Progress',
    desc: 'Detailed stats, accuracy trends, and streak tracking. See your growth over time.',
  },
  {
    emoji: '🎓',
    color: '#BF5AF2',
    title: 'Practice Mode',
    desc: 'No pressure, no scoring. Explore sounds and train at your own pace.',
  },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const cur = STEPS[step]!;

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--ios-bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 24px',
        paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {/* Card */}
      <div style={{ width: '100%', maxWidth: 360, position: 'relative' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 48 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -48 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Emoji icon */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.12, type: 'spring', stiffness: 280, damping: 22 }}
              style={{
                width: 88,
                height: 88,
                borderRadius: '20px',
                background: `${cur.color}18`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 44,
                margin: '0 auto 28px',
              }}
            >
              {cur.emoji}
            </motion.div>

            <h1
              style={{
                fontSize: 30,
                fontWeight: 700,
                letterSpacing: '-0.45px',
                color: 'var(--ios-label)',
                textAlign: 'center',
                marginBottom: 12,
                lineHeight: 1.1,
              }}
            >
              {cur.title}
            </h1>

            <p
              style={{
                fontSize: 17,
                color: 'var(--ios-label2)',
                textAlign: 'center',
                letterSpacing: '-0.43px',
                lineHeight: 1.5,
              }}
            >
              {cur.desc}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Page dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 36 }}>
          {STEPS.map((_, i) => (
            <motion.div
              key={i}
              animate={{
                width: i === step ? 24 : 8,
                background: i === step ? cur.color : 'rgba(235,235,245,0.18)',
              }}
              transition={{ duration: 0.28, ease: [0.34, 1.56, 0.64, 1] }}
              style={{ height: 8, borderRadius: 4 }}
            />
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 36 }}>
          {step < STEPS.length - 1 ? (
            <>
              <button
                onClick={() => setStep(s => s + 1)}
                className="ios-btn-primary"
                style={{ background: cur.color }}
              >
                Next
              </button>
              <Link href="/dashboard" className="ios-btn-secondary" style={{ textDecoration: 'none', textAlign: 'center' }}>
                Skip
              </Link>
            </>
          ) : (
            <Link href="/dashboard" className="ios-btn-primary" style={{ textDecoration: 'none', textAlign: 'center', background: cur.color }}>
              Get Started
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
