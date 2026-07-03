"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AnimatedStatCard, PageHero, Reveal, StatusCard } from "@/components/PremiumMotion";
import { useStatsContext } from "@/components/StatsProvider";
import { GAME_MODE_META, GAME_MODES, buildAdaptivePracticePlan } from "@pitch-therapy/core";

const MODES = GAME_MODES.map((id) => {
  const mode = GAME_MODE_META[id];
  return {
    id: mode.id,
    label: mode.label,
    icon: mode.icon,
    color: mode.accentHex,
    desc: mode.description,
    href: `/play/${mode.id}`,
  };
});

const TIPS = [
  "Train your weakest category first — consistent practice beats cramming.",
  "Try Speed Round to sharpen reflexes under pressure.",
  "Use Drone Lock daily to build interval intuition.",
  "Perfect pitch is rare, but relative pitch is trainable.",
  "Short sessions beat long ones — 5 min/day is enough.",
  "Note Wordle is great for building note-from-scratch memory.",
  "Your ear improves most when you guess before checking.",
];

function AnimatedNumber({ value, delay = 0 }: { value: number; delay?: number }) {
  const [display, setDisplay] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(value);
      return;
    }
    const timeout = setTimeout(() => {
      const duration = 800;
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        setDisplay(Math.round(eased * value));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay * 1000);
    return () => clearTimeout(timeout);
  }, [value, delay, reduceMotion]);

  return <>{display}</>;
}

const QUICK_ACTIONS = [
  { href: "/daily", label: "1. Run Daily Drill", sub: "A guided warm-up for today" },
  { href: "/play-modes", label: "2. Pick a Focus Mode", sub: "Choose by ear-training skill" },
  { href: "/progress", label: "3. Review Weak Spots", sub: "See low-accuracy modes" },
];

function StreakRing({ streak, size = 80 }: { streak: number; size?: number }) {
  const sw = 3.5;
  const r = (size - sw * 2) / 2;
  const circ = 2 * Math.PI * r;
  const progress = Math.min(streak / 7, 1);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={sw}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#streakGrad)"
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - progress) }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        />
        <defs>
          <linearGradient id="streakGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF9F0A" />
            <stop offset="100%" stopColor="#FF375F" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span
          style={{ fontSize: 22 }}
          animate={streak > 0 ? { scale: [1, 1.15, 1] } : {}}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          🔥
        </motion.span>
      </div>
    </div>
  );
}

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const next = new Date(now);
      next.setDate(next.getDate() + 1);
      next.setHours(0, 0, 0, 0);
      const diff = next.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(
        `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`,
      );
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span
      style={{
        fontFamily: '-apple-system, "SF Mono", monospace',
        fontSize: 24,
        fontWeight: 700,
        letterSpacing: "-0.5px",
        color: "var(--ios-label)",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {timeLeft}
    </span>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};
const rowItem = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

export default function Dashboard() {
  const { stats, loaded } = useStatsContext();
  const tip = TIPS[Math.floor(Date.now() / 86400000) % TIPS.length];
  const recentModes = [
    ...new Set(
      stats.results
        .slice(-10)
        .reverse()
        .map((r) => r.mode),
    ),
  ].slice(0, 3);
  const totalGames = stats.results.length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayGames = stats.results.filter((r) => r.date.startsWith(todayStr)).length;
  const practicePlan = buildAdaptivePracticePlan(stats.results);
  const practiceModes = practicePlan.modeIds.map((modeId) => GAME_MODE_META[modeId]);

  return (
    <div className="pb-tab" style={{ background: "var(--ios-bg)", minHeight: "100dvh" }}>
      <div className="pt-page-shell pt-page-dashboard px-4 pt-14">
        <PageHero
          variant="dashboard"
          eyebrow={greeting()}
          title="Your practice cockpit"
          subtitle="Start the daily drill, review weak spots, or jump into a focused mode without hunting through menus."
        />

        {!loaded ? (
          <Reveal delay={0.04}>
            <StatusCard
              tone="loading"
              title="Syncing your training dashboard"
              body="Pulling streak, session totals, and your latest mode performance."
            />
          </Reveal>
        ) : null}

        <div className="pt-dashboard-layout">
          <div className="pt-dashboard-main">
            {/* ── STREAK + DAILY ROW ── */}
            <motion.div
              className="pt-desktop-card mb-3 grid grid-cols-2 gap-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Streak card */}
              <div
                className="ios-card ios-card-lift flex items-center gap-4 p-4"
                style={{
                  minHeight: 96,
                  background:
                    "linear-gradient(135deg, rgba(255,159,10,0.08) 0%, rgba(255,55,95,0.04) 100%)",
                }}
              >
                <StreakRing streak={stats.streak} />
                <div>
                  <div
                    style={{
                      fontSize: 36,
                      fontWeight: 700,
                      letterSpacing: "-1px",
                      color: "var(--ios-label)",
                      lineHeight: 1,
                    }}
                  >
                    {loaded ? <AnimatedNumber value={stats.streak} delay={0.2} /> : "—"}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--ios-label3)", marginTop: 2 }}>
                    Day Streak{stats.bestStreak > 0 ? ` · Best: ${stats.bestStreak}` : ""}
                  </div>
                </div>
              </div>

              {/* Daily card */}
              <div
                className="ios-card ios-card-lift flex flex-col justify-between p-4"
                style={{
                  minHeight: 96,
                  background:
                    "linear-gradient(135deg, rgba(10,132,255,0.08) 0%, rgba(94,92,230,0.04) 100%)",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                      color: "var(--ios-label3)",
                      marginBottom: 4,
                    }}
                  >
                    Daily Reset
                  </div>
                  <CountdownTimer />
                </div>
                <Link
                  href="/daily"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    height: 32,
                    borderRadius: 8,
                    background: "linear-gradient(135deg, #0A84FF 0%, #5E5CE6 100%)",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: "-0.08px",
                    textDecoration: "none",
                    marginTop: 8,
                    boxShadow: "0 2px 12px rgba(10,132,255,0.3)",
                  }}
                >
                  Play Today
                  <svg width="4" height="8" viewBox="0 0 4 8" fill="none">
                    <path d="M0 0l4 4-4 4" fill="currentColor" />
                  </svg>
                </Link>
              </div>
            </motion.div>

            {/* ── TIP OF THE DAY ── */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.4 }}
              className="pt-desktop-card mb-3"
            >
              <div
                className="ios-card"
                style={{
                  padding: "14px 16px",
                  background:
                    "linear-gradient(135deg, rgba(48,209,88,0.06) 0%, rgba(90,200,250,0.04) 100%)",
                  border: "1px solid rgba(48,209,88,0.1)",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ fontSize: 16, marginTop: 1 }}>💡</span>
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: 0.3,
                        textTransform: "uppercase",
                        color: "var(--ios-green)",
                        marginBottom: 4,
                      }}
                    >
                      Tip of the Day
                    </div>
                    <div style={{ fontSize: 14, color: "var(--ios-label2)", lineHeight: 1.45 }}>
                      {tip}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ── TODAY'S SUMMARY ── */}
            {loaded && totalGames > 0 && (
              <div className="pt-desktop-card mb-3 grid grid-cols-3 gap-2">
                <AnimatedStatCard
                  label="Today"
                  value={todayGames}
                  color="var(--ios-blue)"
                  delay={0.04}
                />
                <AnimatedStatCard
                  label="All Time"
                  value={totalGames}
                  color="var(--ios-purple)"
                  delay={0.08}
                />
                <AnimatedStatCard
                  label="Avg Acc"
                  value={`${totalGames > 0 ? Math.round((stats.results.reduce((s, r) => s + r.accuracy, 0) / totalGames) * 100) : 0}%`}
                  color="var(--ios-green)"
                  delay={0.12}
                />
              </div>
            )}

            {/* ── RECENTLY PLAYED ── */}
            {loaded && recentModes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14, duration: 0.4 }}
                className="pt-desktop-card mb-6"
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 400,
                    letterSpacing: "-0.08px",
                    textTransform: "uppercase",
                    color: "var(--ios-label3)",
                    marginBottom: 8,
                    marginTop: 16,
                    paddingLeft: 4,
                  }}
                >
                  Recently Played
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {recentModes.map((modeId) => {
                    const m = MODES.find((mode) => mode.id === modeId);
                    if (!m) return null;
                    return (
                      <Link
                        key={m.id}
                        href={m.href}
                        className="ios-game-card"
                        style={{ textDecoration: "none", padding: 12 }}
                      >
                        <div style={{ fontSize: 24, marginBottom: 6 }}>{m.icon}</div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "var(--ios-label)",
                            letterSpacing: "-0.2px",
                            lineHeight: 1.3,
                          }}
                        >
                          {m.label}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ── QUICK PLAY (fallback when no recent) ── */}
            {loaded && recentModes.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14, duration: 0.4 }}
                className="pt-desktop-card mb-6"
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 400,
                    letterSpacing: "-0.08px",
                    textTransform: "uppercase",
                    color: "var(--ios-label3)",
                    marginBottom: 8,
                    marginTop: 20,
                    paddingLeft: 4,
                  }}
                >
                  Quick Play
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {MODES.slice(0, 2).map((m) => (
                    <Link
                      key={m.id}
                      href={m.href}
                      className="ios-game-card"
                      style={{ textDecoration: "none", padding: 14 }}
                    >
                      <div style={{ fontSize: 26, marginBottom: 8 }}>{m.icon}</div>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: "var(--ios-label)",
                          letterSpacing: "-0.23px",
                        }}
                      >
                        {m.label}
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}

            {loaded && totalGames === 0 ? (
              <Reveal delay={0.16}>
                <StatusCard
                  tone="empty"
                  title="Your training log is ready"
                  body="Start one mode to unlock personalized streaks, accuracy, and progression insights."
                  action={
                    <Link
                      href="/play-modes"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: 36,
                        borderRadius: 10,
                        padding: "0 14px",
                        background: "linear-gradient(135deg, #0A84FF 0%, #5E5CE6 100%)",
                        color: "#fff",
                        fontSize: 13,
                        fontWeight: 600,
                        textDecoration: "none",
                        boxShadow: "0 2px 12px rgba(10,132,255,0.3)",
                      }}
                    >
                      Start First Session
                    </Link>
                  }
                />
              </Reveal>
            ) : null}
          </div>
          <div className="pt-dashboard-side">
            <motion.div
              className="ios-card pt-desktop-card"
              style={{
                padding: 14,
                marginBottom: 12,
                background: "linear-gradient(160deg, rgba(48,209,88,0.1), rgba(10,132,255,0.06))",
                border: "0.5px solid rgba(48,209,88,0.18)",
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.35 }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--ios-label3)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Today's Plan
                </div>
                <span
                  style={{
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: practicePlan.personalized ? "var(--ios-green)" : "var(--ios-blue)",
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "3px 8px",
                    background: "rgba(255,255,255,0.04)",
                  }}
                >
                  {practicePlan.personalized ? "Adaptive" : "Daily"}
                </span>
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "var(--ios-label)",
                  letterSpacing: "-0.3px",
                  marginBottom: 4,
                }}
              >
                {practicePlan.title}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--ios-label2)",
                  lineHeight: 1.45,
                  marginBottom: 12,
                }}
              >
                {practicePlan.summary}
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {practiceModes.map((mode, index) => (
                  <Link
                    key={mode.id}
                    href={`/play/${mode.id}`}
                    style={{
                      textDecoration: "none",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.035)",
                      padding: "10px 11px",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 8,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: `${mode.accentHex}22`,
                        color: mode.accentHex,
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {index + 1}
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span
                        style={{
                          display: "block",
                          fontSize: 13,
                          fontWeight: 650,
                          color: "var(--ios-label)",
                          letterSpacing: "-0.08px",
                        }}
                      >
                        {mode.label}
                      </span>
                      <span
                        style={{
                          display: "block",
                          fontSize: 11,
                          color: "var(--ios-label3)",
                          marginTop: 1,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {practicePlan.steps[index]?.label}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </motion.div>
            <motion.div
              className="ios-card pt-desktop-card"
              style={{
                padding: 14,
                marginBottom: 12,
                background: "linear-gradient(160deg, rgba(10,132,255,0.12), rgba(94,92,230,0.08))",
                border: "0.5px solid rgba(10,132,255,0.2)",
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.35 }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: "var(--ios-label3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: 10,
                }}
              >
                Guided Flow
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {QUICK_ACTIONS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      textDecoration: "none",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.03)",
                      padding: "9px 10px",
                      display: "block",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--ios-label)",
                        letterSpacing: "-0.08px",
                      }}
                    >
                      {item.label}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--ios-label3)", marginTop: 2 }}>
                      {item.sub}
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* ── ALL MODES ── */}
            <div className="pt-desktop-card">
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 400,
                  letterSpacing: "-0.08px",
                  textTransform: "uppercase",
                  color: "var(--ios-label3)",
                  marginBottom: 8,
                  paddingLeft: 4,
                }}
              >
                All Modes
              </div>
              <div className="ios-group">
                <motion.div variants={stagger} initial="hidden" animate="visible">
                  {MODES.map((m, idx) => {
                    const modeStats = loaded ? stats.results.filter((r) => r.mode === m.id) : [];
                    const gamesPlayed = modeStats.length;
                    const bestScore =
                      gamesPlayed > 0 ? Math.max(...modeStats.map((r) => r.score)) : null;

                    return (
                      <motion.div key={m.id} variants={rowItem}>
                        <Link
                          href={m.href}
                          className="ios-row"
                          style={{
                            textDecoration: "none",
                            borderTop: idx === 0 ? "none" : "0.5px solid var(--ios-sep)",
                            padding: "11px 16px",
                          }}
                        >
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 9,
                              background: `linear-gradient(135deg, ${m.color}22, ${m.color}0A)`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 18,
                              marginRight: 12,
                              flexShrink: 0,
                            }}
                          >
                            {m.icon}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 16,
                                fontWeight: 500,
                                color: "var(--ios-label)",
                                letterSpacing: "-0.32px",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {m.label}
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: "var(--ios-label3)",
                                marginTop: 1,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {gamesPlayed > 0
                                ? `${gamesPlayed} games · Best: ${bestScore}`
                                : m.desc}
                            </div>
                          </div>
                          <svg
                            width="7"
                            height="12"
                            viewBox="0 0 7 12"
                            fill="none"
                            style={{ flexShrink: 0, marginLeft: 8 }}
                          >
                            <path
                              d="M1 1l5 5-5 5"
                              stroke="var(--ios-label4)"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </Link>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
