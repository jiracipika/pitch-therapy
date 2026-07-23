"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useRef, useState } from "react";
import { GAME_MODE_META, GAME_MODES, MODE_CATEGORIES } from "@pitch-therapy/core";

const MODES = GAME_MODES.map((id) => ({
  ...GAME_MODE_META[id],
  href: `/play/${id}`,
}));

const CATEGORIES = MODE_CATEGORIES.map((category) => ({
  ...category,
  modes: MODES.filter((mode) => mode.category === category.id),
}));

const SIGNAL_BARS = [28, 54, 39, 78, 92, 46, 68, 34, 82, 58, 96, 42, 72, 30, 62, 88, 48, 70, 36, 56, 84, 44, 66, 32];

function Waveform({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`pt-signal-wave ${compact ? "is-compact" : ""}`} aria-hidden="true">
      {SIGNAL_BARS.map((height, index) => (
        <motion.span
          key={`${height}-${index}`}
          style={{ height: `${height}%` }}
          animate={compact ? undefined : { scaleY: [0.55, 1, 0.7, 0.92, 0.55] }}
          transition={{ duration: 2.4 + (index % 5) * 0.18, repeat: Infinity, delay: index * 0.045, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function SignalMark() {
  return (
    <div className="pt-signal-mark" aria-label="Pitch Therapy signal mark" role="img">
      <span>PT</span>
      <Waveform compact />
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [leavingTo, setLeavingTo] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const transitionTo = useCallback((href: string) => {
    if (leavingTo) return;
    setLeavingTo(href);
    timeoutRef.current = window.setTimeout(() => router.push(href), reduceMotion ? 90 : 280);
  }, [leavingTo, reduceMotion, router]);

  return (
    <div className="pt-signal-home">
      <AnimatePresence>
        {leavingTo ? (
          <motion.div
            className="pt-signal-transition"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.08 : 0.24 }}
          >
            <SignalMark />
            <span>CALIBRATING SESSION</span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <header className="pt-signal-header">
        <Link href="/" className="pt-signal-brand" aria-label="Pitch Therapy home">
          <SignalMark />
          <span className="pt-signal-brand-copy">
            <b>Pitch Therapy</b>
            <small>Ear training / signal lab</small>
          </span>
        </Link>
        <nav aria-label="Landing navigation">
          <Link href="/play-modes">Modes</Link>
          <Link href="/progress">Progress</Link>
          <button type="button" onClick={() => transitionTo("/dashboard")}>Enter studio</button>
        </nav>
      </header>

      <main id="landing-content">
        <section className="pt-signal-hero">
          <motion.div
            className="pt-signal-hero-copy"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="pt-signal-kicker"><span /> LIVE EAR TRAINING SYSTEM</div>
            <h1>Hear it.<br /><em>Lock it in.</em></h1>
            <p>
              Train pitch, intervals, frequency, and musical memory through short,
              focused drills that adapt to how you listen.
            </p>
            <div className="pt-signal-actions">
              <button type="button" onClick={() => transitionTo("/dashboard")} className="pt-signal-primary">
                Start a guided session <span aria-hidden="true">↗</span>
              </button>
              <button type="button" onClick={() => transitionTo("/daily")} className="pt-signal-secondary">
                Today&apos;s challenge
              </button>
            </div>
            <div className="pt-signal-proof" aria-label="Product highlights">
              <span><b>18</b> focused modes</span>
              <span><b>2–5</b> minute sessions</span>
              <span><b>0</b> setup required</span>
            </div>
          </motion.div>

          <motion.aside
            className="pt-signal-console"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96, rotate: 1.2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            aria-label="Live training signal preview"
          >
            <div className="pt-signal-console-head">
              <span>INPUT MONITOR / A4</span>
              <span className="pt-signal-live"><i /> LIVE</span>
            </div>
            <div className="pt-signal-frequency">
              <span>440.0</span><small>HZ</small>
            </div>
            <Waveform />
            <div className="pt-signal-meter">
              <span>−50</span><span>−25</span><strong>0</strong><span>+25</span><span>+50</span>
              <i style={{ left: "49.5%" }} />
            </div>
            <div className="pt-signal-console-foot">
              <span><i className="is-green" /> PITCH LOCKED</span>
              <span>DEVIATION <b>+02¢</b></span>
            </div>
          </motion.aside>
        </section>

        <section className="pt-signal-path" aria-labelledby="path-title">
          <div>
            <span className="pt-signal-section-number">01</span>
            <h2 id="path-title">Your next ten minutes</h2>
          </div>
          <ol>
            <li><b>01</b><span><strong>Calibrate</strong><small>Note ID · 2 min</small></span></li>
            <li><b>02</b><span><strong>Build control</strong><small>Pitch Match · 4 min</small></span></li>
            <li><b>03</b><span><strong>Pressure test</strong><small>Speed Round · 3 min</small></span></li>
          </ol>
          <Link href="/dashboard">Run this session <span aria-hidden="true">→</span></Link>
        </section>

        <section className="pt-signal-catalog" aria-labelledby="catalog-title">
          <div className="pt-signal-section-heading">
            <div><span className="pt-signal-section-number">02</span><h2 id="catalog-title">Choose your frequency</h2></div>
            <p>Every mode isolates one listening skill. Pick a weakness and get precise.</p>
          </div>

          <div className="pt-signal-category-grid">
            {CATEGORIES.map((category, categoryIndex) => (
              <motion.article
                key={category.id}
                className="pt-signal-category"
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: categoryIndex * 0.04, duration: 0.4 }}
              >
                <header style={{ "--category": category.accentHex } as React.CSSProperties}>
                  <span>{String(categoryIndex + 1).padStart(2, "0")}</span>
                  <h3>{category.label}</h3>
                  <small>{category.modes.length} MODES</small>
                </header>
                <div>
                  {category.modes.map((mode) => (
                    <Link key={mode.id} href={mode.href} className="pt-signal-mode">
                      <span className="pt-signal-mode-icon" style={{ "--mode": mode.accentHex } as React.CSSProperties}>{mode.icon}</span>
                      <span><b>{mode.label}</b><small>{mode.description}</small></span>
                      <i aria-hidden="true">↗</i>
                    </Link>
                  ))}
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="pt-signal-final">
          <span className="pt-signal-section-number">03</span>
          <h2>Less guessing.<br />More hearing.</h2>
          <p>Your daily challenge is tuned and ready.</p>
          <Link href="/daily">Play today&apos;s challenge <span aria-hidden="true">→</span></Link>
        </section>
      </main>

      <footer className="pt-signal-footer">
        <span>PITCH THERAPY © 2026</span>
        <span>LISTEN / RESPOND / IMPROVE</span>
      </footer>
    </div>
  );
}
