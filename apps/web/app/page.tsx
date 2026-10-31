"use client";

import { useRef, useState, type PointerEvent } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { GAME_MODE_META, GAME_MODES, MODE_CATEGORIES } from "@pitch-therapy/core";
import { playTone, stopAllTones } from "@/lib/audio";
import LandingCanvas from "@/components/LandingCanvas";
import TiltCard from "@/components/TiltCard";

const bars = [22, 42, 68, 34, 82, 52, 94, 61, 38, 72, 88, 46, 76, 31, 64, 91, 56, 27, 70, 43, 84, 58, 35, 74, 49, 90, 62, 29, 67, 44, 80, 53];
const featured = GAME_MODES.slice(0, 6).map((id) => GAME_MODE_META[id]);
const MODE_COUNT = GAME_MODES.length;

function Waveform({ compact = false }: { compact?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <div className={`studio-wave ${compact ? "is-compact" : ""}`} aria-hidden="true">
      {bars.map((height, index) => (
        <motion.i
          key={`${height}-${index}`}
          style={{ height: `${height}%` }}
          animate={reduce || compact ? undefined : { scaleY: [0.55, 1, 0.72, 0.9, 0.55] }}
          transition={{ duration: 2 + (index % 6) * 0.22, repeat: Infinity, delay: index * 0.035, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

export default function Home() {
  const reduce = useReducedMotion();
  const [tonePlaying, setTonePlaying] = useState(false);

  const playReferenceTone = () => {
    stopAllTones();
    playTone(440, 1.6);
    setTonePlaying(true);
    window.setTimeout(() => setTonePlaying(false), 1600);
  };

  // Scroll-linked hero choreography: the copy drifts up with a slight
  // italic lean while the instrument panel sinks, rotates, and dissolves
  // through a hue-shift + progressive blur as it leaves the viewport.
  const heroRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -70]);
  const copySkew = useTransform(scrollYProgress, [0, 1], [0, -2.5]);
  const copyFade = useTransform(scrollYProgress, [0, 0.85], [1, 0.25]);
  const instrumentY = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const instrumentScale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const instrumentRotate = useTransform(scrollYProgress, [0, 1], [0, 4]);
  const instrumentFilter = useTransform(
    scrollYProgress,
    [0, 0.55, 1],
    ["hue-rotate(0deg) blur(0px)", "hue-rotate(16deg) blur(1.2px)", "hue-rotate(40deg) blur(6px)"],
  );
  const canvasHue = useTransform(scrollYProgress, [0, 1], ["hue-rotate(0deg)", "hue-rotate(55deg)"]);

  // Cursor-following spotlight on exercise cards (delegated, no re-render).
  const onCardGridMove = (event: PointerEvent<HTMLDivElement>) => {
    const card = (event.target as HTMLElement).closest<HTMLElement>(".studio-exercise-card");
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${(((event.clientX - rect.left) / rect.width) * 100).toFixed(2)}%`);
    card.style.setProperty("--my", `${(((event.clientY - rect.top) / rect.height) * 100).toFixed(2)}%`);
  };

  return (
    <div className="studio-landing">
      <header className="studio-landing-nav">
        <Link href="/" className="studio-wordmark" aria-label="Pitch Therapy home">
          <span className="studio-wordmark-mark"><Waveform compact /></span>
          <span><b>Pitch Therapy</b><small>LISTENING STUDIO</small></span>
        </Link>
        <nav aria-label="Landing navigation">
          <Link href="/play-modes">Exercises</Link>
          <Link href="/progress">Insights</Link>
          <Link className="studio-nav-cta" href="/dashboard">Open studio <span aria-hidden="true">↗</span></Link>
        </nav>
      </header>

      <main id="landing-content">
        <section ref={heroRef} className="studio-hero">
          <motion.div className="studio-hero-canvas" style={reduce ? undefined : { filter: canvasHue }} aria-hidden="true">
            <LandingCanvas className="studio-canvas" />
          </motion.div>
          <motion.div className="studio-hero-cell" style={reduce ? undefined : { y: copyY, skewY: copySkew, opacity: copyFade }}>
          <motion.div className="studio-hero-copy" initial={reduce ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}>
            <div className="studio-eyebrow"><i /> EAR TRAINING, RECOMPOSED</div>
            <h1>Hear what<br /><em>others miss.</em></h1>
            <p>Build a sharper musical ear through beautifully focused drills for pitch, intervals, frequency, and memory.</p>
            <div className="studio-hero-actions">
              <Link href="/dashboard" className="studio-button-primary">Begin your session <span aria-hidden="true">→</span></Link>
              <Link href="/play-modes" className="studio-button-ghost">Explore {MODE_COUNT} exercises</Link>
            </div>
            <div className="studio-hero-proof">
              <span><b>{MODE_COUNT}</b><small>precision drills</small></span>
              <span><b>3 min</b><small>average session</small></span>
              <span><b>∞</b><small>practice rounds</small></span>
            </div>
          </motion.div>
          </motion.div>

          <motion.div className="studio-hero-cell studio-hero-cell-right" style={reduce ? undefined : { y: instrumentY, scale: instrumentScale, rotate: instrumentRotate, filter: instrumentFilter }}>
          <TiltCard max={4.5} lift={6} className="studio-instrument-tilt">
          <motion.div className="studio-instrument" initial={reduce ? false : { opacity: 0, x: 36, rotateY: -5 }} animate={{ opacity: 1, x: 0, rotateY: 0 }} transition={{ delay: 0.12, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}>
            <div className="studio-instrument-top"><span>REFERENCE TONE / A4</span><button type="button" className="is-live" onClick={playReferenceTone} aria-label="Play reference tone A4, 440 hertz"><i /> {tonePlaying ? "PLAYING" : "PLAY A4"}</button></div>
            <div className="studio-note-readout"><span>A</span><div><b>440.0</b><small>HERTZ</small></div></div>
            <Waveform />
            <div className="studio-tuner"><span>−50</span><span>−25</span><strong>0</strong><span>+25</span><span>+50</span><i /></div>
            <div className="studio-instrument-bottom"><span>CONCERT PITCH</span><b>A440</b></div>
          </motion.div>
          </TiltCard>
          </motion.div>
        </section>

        <motion.section
          className="studio-session-strip"
          aria-labelledby="session-title"
          initial={reduce ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ type: "spring", bounce: 0.25, duration: 0.6 }}
        >
          <div><span>YOUR FIRST SESSION</span><h2 id="session-title">Ten minutes to a better ear.</h2></div>
          <ol>
            <li><b>01</b><span>Identify<small>Note ID · 2 min</small></span></li>
            <li><b>02</b><span>Match<small>Pitch Match · 4 min</small></span></li>
            <li><b>03</b><span>React<small>Speed Round · 3 min</small></span></li>
          </ol>
          <Link href="/dashboard">Run session <span aria-hidden="true">→</span></Link>
        </motion.section>

        <section className="studio-exercises" aria-labelledby="exercise-title">
          <div className="studio-section-heading"><span>THE EXERCISES</span><h2 id="exercise-title">One weakness.<br />One focused drill.</h2><p>No bloated curriculum. Choose the listening skill you want to sharpen and begin.</p></div>
          <div className="studio-exercise-grid" onPointerMove={onCardGridMove}>
            {featured.map((mode, index) => (
              <motion.article
                key={mode.id}
                initial={reduce ? false : { opacity: 0, y: 20, scale: 0.97 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ type: "spring", bounce: 0.3, duration: 0.6, delay: index * 0.05 }}
                whileHover={reduce ? undefined : { y: -4 }}
                whileTap={reduce ? undefined : { scale: 0.98 }}
              >
                <Link href={`/play/${mode.id}`} className="studio-exercise-card" style={{ "--exercise-accent": mode.accentHex } as React.CSSProperties}>
                  <span className="studio-exercise-index">0{index + 1}</span>
                  <span className="studio-exercise-icon">{mode.icon}</span>
                  <h3>{mode.label}</h3>
                  <p>{mode.description}</p>
                  <span className="studio-exercise-link">Start exercise <i aria-hidden="true">↗</i></span>
                </Link>
              </motion.article>
            ))}
          </div>
          <div className="studio-category-row">
            {MODE_CATEGORIES.map((category) => <span key={category.id}><i style={{ background: category.accentHex }} />{category.label}</span>)}
            <Link href="/play-modes">View every exercise →</Link>
          </div>
        </section>

        <motion.section
          className="studio-closing"
          initial={reduce ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ type: "spring", bounce: 0.25, duration: 0.6 }}
        >
          <Waveform compact />
          <span>YOUR EAR IS AN INSTRUMENT</span>
          <h2>Tune it daily.</h2>
          <Link href="/daily" className="studio-button-primary">Play today&apos;s challenge <span aria-hidden="true">→</span></Link>
        </motion.section>
      </main>

      <footer className="studio-footer"><span>© 2026 PITCH THERAPY</span><span>LISTEN / RESPOND / IMPROVE</span><Link href="/privacy" style={{ opacity: 0.7 }}>Privacy</Link></footer>
    </div>
  );
}
