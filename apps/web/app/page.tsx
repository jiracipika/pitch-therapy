"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

import { GAME_MODE_META, GAME_MODES, MODE_CATEGORIES } from "@pitch-therapy/core";

const MODES = GAME_MODES.map((id) => {
  const mode = GAME_MODE_META[id];
  return {
    id: mode.id,
    label: mode.label,
    color: mode.accentHex,
    icon: mode.icon,
    desc: mode.description,
    href: `/play/${mode.id}`,
  };
});

const CATEGORIES = MODE_CATEGORIES.map((category) => ({
  label: category.label,
  ids: GAME_MODES.filter((id) => GAME_MODE_META[id].category === category.id),
  color: category.accentHex,
}));

const QUICK_FLOWS = [
  { href: "/play-modes", title: "Explore Modes", subtitle: "Browse all 18 training experiences", icon: "grid" },
  { href: "/daily", title: "Play Daily", subtitle: "One curated challenge for today", icon: "calendar" },
  { href: "/progress", title: "Track Progress", subtitle: "Review streaks and trend lines", icon: "chart" },
] as const;

const PRACTICE_PLAN = [
  { step: "Listen", copy: "Start with note ID or pitch match" },
  { step: "Lock in", copy: "Use daily challenge to build streaks" },
  { step: "Review", copy: "Check progress and repeat weak modes" },
];

/* ── Inline SVG icons (SF Symbol style) ── */
function FlowIcon({ name }: { name: string }) {
  const icons: Record<string, React.ReactElement> = {
    grid: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
    calendar: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2.5" />
        <path d="M8 2v3M16 2v3M3 10h18" />
      </svg>
    ),
    chart: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="6" y1="20" x2="6" y2="14" />
        <line x1="12" y1="20" x2="12" y2="9" />
        <line x1="18" y1="20" x2="18" y2="4" />
      </svg>
    ),
  };
  return icons[name] ?? icons.grid;
}

export default function Home() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [isSafari, setIsSafari] = useState(false);
  const [leavingTo, setLeavingTo] = useState<string | null>(null);
  const transitionTimeout = useRef<number | null>(null);
  const motionLite = reduceMotion || isSafari;

  useEffect(() => {
    const ua = navigator.userAgent;
    const safari = /Safari/i.test(ua) && !/Chrome|Chromium|CriOS|Edg|OPR|FxiOS/i.test(ua);
    setIsSafari(safari);
  }, []);

  useEffect(() => {
    return () => {
      if (transitionTimeout.current) {
        window.clearTimeout(transitionTimeout.current);
      }
    };
  }, []);

  const transitionTo = useCallback(
    (href: string) => {
      if (leavingTo) return;
      setLeavingTo(href);
      transitionTimeout.current = window.setTimeout(() => {
        router.push(href);
      }, 380);
    },
    [leavingTo, router],
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--ios-bg)" }}>
      <AnimatePresence>
        {leavingTo && (
          <motion.div
            key="page-leave-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: motionLite ? 0.16 : 0.34, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none fixed inset-0 z-[120]"
            style={{
              background:
                "radial-gradient(140% 100% at 50% 50%, color-mix(in srgb, var(--ios-blue) 8%, var(--ios-bg)) 0%, var(--ios-bg) 100%)",
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.78, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: motionLite ? 0.16 : 0.34, ease: [0.34, 1.56, 0.64, 1] }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{
                width: 74,
                height: 74,
                borderRadius: 18,
                background: "linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 16px 48px rgba(10, 132, 255, 0.28)",
              }}
            >
              <span style={{ fontSize: 34 }} role="img" aria-label="Pitch Therapy">🎵</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating note symbols */}
      <div className="pointer-events-none fixed inset-0 select-none overflow-hidden" aria-hidden>
        <span className="animate-note-1 absolute left-[8%] top-[18%] font-serif text-6xl" style={{ color: "var(--ios-label4)" }}>♪</span>
        <span className="animate-note-2 absolute left-[75%] top-[12%] font-serif text-5xl" style={{ color: "var(--ios-label4)" }}>♫</span>
        <span className="animate-note-3 absolute left-[20%] top-[55%] font-serif text-7xl" style={{ color: "var(--ios-label4)" }}>♬</span>
        <span className="animate-note-2 absolute left-[65%] top-[45%] font-serif text-5xl" style={{ color: "var(--ios-label4)" }}>♩</span>
        <span className="animate-note-1 absolute left-[45%] top-[72%] font-serif text-4xl" style={{ color: "var(--ios-label4)" }}>♪</span>

        <motion.div
          className="absolute inset-x-[-10%] top-[14%] h-44"
          animate={motionLite ? undefined : { x: ["-3%", "3%", "-3%"] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          style={{
            background: "linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--ios-blue) 10%, transparent) 18%, color-mix(in srgb, var(--ios-indigo) 12%, transparent) 52%, color-mix(in srgb, var(--ios-teal) 10%, transparent) 86%, transparent 100%)",
            filter: `blur(${motionLite ? 16 : 24}px)`,
          }}
        />
        <motion.div
          className="absolute inset-x-[-12%] top-[52%] h-40"
          animate={motionLite ? undefined : { x: ["4%", "-4%", "4%"] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          style={{
            background: "linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--ios-purple) 9%, transparent) 20%, color-mix(in srgb, var(--ios-blue) 10%, transparent) 50%, color-mix(in srgb, var(--ios-green) 7%, transparent) 82%, transparent 100%)",
            filter: `blur(${motionLite ? 14 : 22}px)`,
          }}
        />
      </div>

      {/* ── HERO ── */}
      <section className="pt-home-hero relative flex min-h-[100dvh] flex-col items-center justify-center px-6 pb-16 pt-14">
        <div className="pt-home-hero-inner">
          <div className="pt-home-hero-main text-center">
            <motion.div
              initial={motionLite ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
              className="mb-6"
            >
              <div
                className="ios-app-icon mx-auto"
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: "21.6px",
                  boxShadow: "0 24px 64px rgba(10, 132, 255, 0.35), 0 8px 24px rgba(10, 132, 255, 0.2)",
                }}
              >
                <span style={{ fontSize: 44 }} role="img" aria-label="Pitch Therapy">🎵</span>
              </div>
            </motion.div>

            <motion.div
              initial={motionLite ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="mb-3"
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "color-mix(in srgb, var(--ios-blue) 12%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--ios-blue) 22%, transparent)",
                  borderRadius: 20,
                  padding: "5px 14px",
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: "-0.08px",
                  color: "var(--ios-blue)",
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: 3, background: "var(--ios-blue)", display: "inline-block" }} />
                Simple daily ear training
              </span>
            </motion.div>

            <motion.h1
              initial={motionLite ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="ios-large-title mb-3"
              style={{ fontSize: "clamp(36px, 7vw, 52px)", letterSpacing: "-0.5px", lineHeight: 1.05 }}
            >
              Pitch Therapy
            </motion.h1>

            <motion.p
              initial={motionLite ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="ios-callout mb-8 max-w-xs"
              style={{ color: "var(--ios-label2)", lineHeight: 1.5, margin: "0 auto 32px" }}
            >
              A clearer, faster way to train pitch, intervals, frequency, and musical memory — one guided drill at a time.
            </motion.p>

            <motion.div
              initial={motionLite ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.42, duration: 0.45 }}
              className="pt-home-benefits"
            >
              <span>2-minute sessions</span>
              <span>Clear progress</span>
              <span>No setup needed</span>
            </motion.div>

            <motion.div
              initial={motionLite ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.48, duration: 0.45 }}
              className="flex w-full max-w-xs flex-col gap-3"
              style={{ margin: "0 auto" }}
            >
              <motion.button
                whileHover={{ scale: 1.015, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => transitionTo("/dashboard")}
                className="ios-btn-primary"
                style={{ fontSize: 17 }}
              >
                Start with Guided Training
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.012 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => transitionTo("/daily")}
                className="ios-btn-secondary"
                style={{ fontSize: 17 }}
              >
                Do Today&apos;s Challenge
              </motion.button>
            </motion.div>

            {/* Mobile practice plan */}
            <motion.div
              initial={motionLite ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.58, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="pt-home-mobile-plan"
            >
              {PRACTICE_PLAN.map((item, index) => (
                <div key={item.step} className="pt-home-plan-row">
                  <span className="pt-home-plan-index">{index + 1}</span>
                  <span>
                    <b>{item.step}</b>
                    <small>{item.copy}</small>
                  </span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Desktop sidebar */}
          <motion.aside
            initial={motionLite ? { opacity: 1, y: 0 } : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="pt-home-hero-side ios-card"
          >
            <div className="pt-home-side-header">
              <span className="pt-home-side-title">Today&apos;s Training Flow</span>
            </div>
            <div className="pt-home-side-list">
              {QUICK_FLOWS.map((item) => (
                <Link key={item.href} href={item.href} className="pt-home-side-link" style={{ color: "var(--ios-label2)" }}>
                  <span className="pt-home-side-icon" style={{ color: "var(--ios-blue)" }}>
                    <FlowIcon name={item.icon} />
                  </span>
                  <span className="pt-home-side-copy">
                    <span className="pt-home-side-link-title">{item.title}</span>
                    <span className="pt-home-side-link-subtitle">{item.subtitle}</span>
                  </span>
                </Link>
              ))}
            </div>
            <div className="pt-home-category-strip">
              {CATEGORIES.map((cat) => (
                <div key={cat.label} className="pt-home-category-row">
                  <span className="pt-home-category-dot" style={{ background: cat.color }} />
                  <span className="pt-home-category-name">{cat.label}</span>
                  <span className="pt-home-category-count">{cat.ids.length}</span>
                </div>
              ))}
            </div>
            <div className="pt-home-practice-plan">
              <span className="pt-home-side-title">Recommended path</span>
              {PRACTICE_PLAN.map((item, index) => (
                <div key={item.step} className="pt-home-plan-row" style={{ borderBottom: "none", paddingBottom: 0, paddingTop: index === 0 ? 0 : 10 }}>
                  <span className="pt-home-plan-index">{index + 1}</span>
                  <span>
                    <b>{item.step}</b>
                    <small>{item.copy}</small>
                  </span>
                </div>
              ))}
            </div>
          </motion.aside>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.35 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="pt-home-scroll-indicator absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1"
        >
          <span style={{ fontSize: 11, color: "var(--ios-label3)", letterSpacing: 1, textTransform: "uppercase", fontWeight: 500 }}>
            Scroll
          </span>
          <motion.svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="var(--ios-label3)" strokeWidth="2" strokeLinecap="round"
            animate={motionLite ? undefined : { y: [0, 5, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <path d="M12 5v14M5 12l7 7 7-7" />
          </motion.svg>
        </motion.div>
      </section>

      {/* ── MODE GRID ── */}
      <section className="pt-home-modes mx-auto max-w-6xl px-4 pb-20">
        {CATEGORIES.map((cat, ci) => {
          const catModes = MODES.filter((m) => cat.ids.includes(m.id));
          return (
            <motion.div
              key={cat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: ci * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="pt-home-category-block mb-8"
            >
              <div className="mb-3 flex items-center gap-2 px-1">
                <div style={{ width: 3, height: 16, borderRadius: 2, background: cat.color }} />
                <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", color: "var(--ios-label2)" }}>
                  {cat.label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {catModes.map((m, i) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -3 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                  >
                    <Link
                      href={m.href}
                      className="ios-game-card ios-card-lift block h-full"
                      style={{ textDecoration: "none" }}
                    >
                      <div
                        style={{
                          width: 44, height: 44, borderRadius: 10,
                          background: `${m.color}18`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          marginBottom: 10, fontSize: 22,
                        }}
                      >
                        {m.icon}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.2px", color: "var(--ios-label)", marginBottom: 3 }}>
                        {m.label}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--ios-label3)", letterSpacing: "-0.08px", lineHeight: 1.4, textWrap: "pretty" }}>
                        {m.desc}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          );
        })}

        {/* CTA block */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="pt-home-cta ios-card mt-4 p-6 text-center"
          style={{
            background: "linear-gradient(135deg, color-mix(in srgb, var(--ios-orange) 12%, transparent) 0%, color-mix(in srgb, var(--ios-pink) 10%, transparent) 100%)",
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 10 }}>🔥</div>
          <div className="ios-title3 mb-2">Do Today&apos;s Challenge</div>
          <div style={{ fontSize: 15, color: "var(--ios-label2)", marginBottom: 18, letterSpacing: "-0.2px" }}>
            A new challenge every day. Keep your streak alive.
          </div>
          <Link href="/daily" className="ios-btn-tonal" style={{ display: "inline-flex", width: "auto" }}>
            Play Today&apos;s Challenge
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
