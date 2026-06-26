'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { GAME_MODE_META, GAME_MODES, MODE_CATEGORIES } from '@pitch-therapy/core';
import { PageHero, Reveal } from '@/components/PremiumMotion';

function tint(color: string, amount = 12) {
  return `color-mix(in srgb, ${color} ${amount}%, transparent)`;
}

export default function PlayModesPage() {
  const reduceMotion = useReducedMotion();
  const modes = GAME_MODES.map((id) => GAME_MODE_META[id]);

  return (
    <div className="pb-tab" style={{ background: 'var(--ios-bg)', minHeight: '100dvh' }}>
      <div className="pt-page-shell px-4 pt-14">
        <PageHero
          variant="dashboard"
          eyebrow="Training library"
          title="Pick your next drill"
          subtitle="Browse every real Pitch Therapy mode, grouped by the skill it trains."
        />

        <div style={{ display: 'grid', gap: 18 }}>
          {MODE_CATEGORIES.map((category, categoryIndex) => {
            const categoryModes = modes.filter((mode) => mode.category === category.id);
            return (
              <Reveal key={category.id} delay={0.04 + categoryIndex * 0.03}>
                <section className="pt-desktop-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 10, paddingLeft: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 14, display: 'grid', placeItems: 'center', background: tint(category.accentHex, 16), fontSize: 22 }}>
                        {category.icon}
                      </div>
                      <div>
                        <h2 style={{ color: 'var(--ios-label)', fontSize: 20, fontWeight: 760, letterSpacing: '-0.035em' }}>{category.label}</h2>
                        <p style={{ color: 'var(--ios-label3)', fontSize: 13, marginTop: 2 }}>{category.description}</p>
                      </div>
                    </div>
                    <span style={{ color: category.accentHex, fontSize: 13, fontWeight: 800 }}>{categoryModes.length}</span>
                  </div>

                  <div className="pt-mobile-game-grid">
                    {categoryModes.map((mode, modeIndex) => (
                      <motion.div
                        key={mode.id}
                        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{ delay: Math.min(modeIndex * 0.025, 0.12), duration: 0.28 }}
                      >
                        <Link
                          href={`/play/${mode.id}`}
                          className="ios-game-card"
                          style={{
                            minHeight: 132,
                            display: 'flex',
                            flexDirection: 'column',
                            textDecoration: 'none',
                            padding: 16,
                            borderColor: tint(mode.accentHex, 24),
                            background: `linear-gradient(135deg, ${tint(mode.accentHex, 12)} 0%, var(--ios-bg2) 80%)`,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                            <span style={{ fontSize: 28 }}>{mode.icon}</span>
                            <span style={{ color: mode.accentHex, fontWeight: 800 }}>→</span>
                          </div>
                          <div style={{ marginTop: 'auto' }}>
                            <div style={{ color: 'var(--ios-label)', fontSize: 16, fontWeight: 700, letterSpacing: '-0.03em' }}>{mode.label}</div>
                            <div style={{ color: 'var(--ios-label3)', fontSize: 12, lineHeight: 1.35, marginTop: 3 }}>{mode.description}</div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </section>
              </Reveal>
            );
          })}
        </div>
      </div>
    </div>
  );
}
