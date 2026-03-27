'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const STEPS = [
  {
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13"/>
        <circle cx="6" cy="18" r="3"/>
        <circle cx="18" cy="16" r="3"/>
      </svg>
    ),
    title: 'Train Your Ear',
    desc: 'Five game modes designed to sharpen your sense of pitch, frequency, and musical intervals. From beginner to expert.',
    color: '#60A5FA',
  },
  {
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
      </svg>
    ),
    title: 'Daily Challenges',
    desc: 'A fresh challenge every day. Keep your streak alive and compete with yourself to build consistency.',
    color: '#FBBF24',
  },
  {
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
    title: 'Track Progress',
    desc: 'Detailed stats, accuracy trends, and streak tracking. See your growth over time and identify areas to improve.',
    color: '#4ADE80',
  },
  {
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
    ),
    title: 'Practice Mode',
    desc: 'No pressure, no scoring. Just explore sounds, test your ear, and learn at your own pace.',
    color: '#A78BFA',
  },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);

  const currentStep = STEPS[step]!;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card w-full max-w-sm p-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 250, damping: 20 }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl"
            style={{ background: `${currentStep.color}10`, border: `1px solid ${currentStep.color}25` }}
          >
            {currentStep.icon}
          </motion.div>

          <h1 className="text-2xl font-semibold text-white" style={{ letterSpacing: '-0.03em' }}>
            {currentStep.title}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-500">
            {currentStep.desc}
          </p>

          {/* Step dots */}
          <div className="mt-8 flex items-center justify-center gap-2">
            {STEPS.map((_, i) => (
              <motion.div
                key={i}
                className="h-1.5 rounded-full"
                animate={{
                  width: i === step ? 24 : 8,
                  backgroundColor: i === step ? currentStep.color : 'rgba(255,255,255,0.15)',
                }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="mt-8 flex gap-3">
            {step < STEPS.length - 1 ? (
              <>
                <button
                  onClick={() => setStep(s => s + 1)}
                  className="btn-primary flex-1"
                >
                  Next
                </button>
                <Link href="/dashboard" className="btn-secondary">
                  Skip
                </Link>
              </>
            ) : (
              <Link href="/dashboard" className="btn-primary flex-1">
                Get Started →
              </Link>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
