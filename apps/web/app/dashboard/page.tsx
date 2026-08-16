"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useStatsContext } from "@/components/StatsProvider";
import {
  GAME_MODE_META,
  GAME_MODES,
  MODE_CATEGORIES,
  buildAdaptivePracticePlan,
  estimatePlanDuration,
} from "@pitch-therapy/core";
import {
  buildCategoryMastery,
  calculateTotalXP,
  getLevelProgress,
  levelTitle,
  todayXP,
  DAILY_GOAL_XP,
  getLastPlayedMode,
  MASTERY_CONFIG,
} from "@/lib/gamification";

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

function MasteryRing({ pct, size = 48, color = "var(--ios-blue)" }: { pct: number; size?: number; color?: string }) {
  const sw = 4;
  const r = (size - sw * 2) / 2;
  const circ = 2 * Math.PI * r;
  const reduceMotion = useReducedMotion();

  return (
    <div className="pt-mastery-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--pt-stroke)" strokeWidth={sw} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - pct / 100) }}
          transition={{ duration: reduceMotion ? 0.3 : 1.0, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="pt-mastery-ring-pct">{pct}%</div>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { stats, loaded, getModeStats } = useStatsContext();
  const reduceMotion = useReducedMotion();

  const totalXP = useMemo(() => calculateTotalXP(stats.results), [stats.results]);
  const levelInfo = useMemo(() => getLevelProgress(totalXP), [totalXP]);
  const dayXP = useMemo(() => todayXP(stats.results), [stats.results]);
  const dailyPct = Math.min(100, (dayXP / DAILY_GOAL_XP) * 100);
  const lastMode = useMemo(() => getLastPlayedMode(stats.results), [stats.results]);
  const categoryMastery = useMemo(
    () => buildCategoryMastery(stats.results, getModeStats),
    [stats.results, getModeStats],
  );

  const totalGames = stats.results.length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayGames = stats.results.filter((r) => r.date.startsWith(todayStr)).length;

  const practicePlan = buildAdaptivePracticePlan(stats.results);
  const planDuration = estimatePlanDuration(practicePlan);

  return (
    <div className="pb-tab" style={{ background: "var(--ios-bg)", minHeight: "100dvh" }}>
      <div className="pt-page-shell pt-page-dashboard px-4 pt-14">
        {/* ── Greeting ── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ padding: "8px 4px 0" }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ios-label3)", letterSpacing: "0.3px" }}>
            {greeting()}
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.6px", color: "var(--ios-label)", marginTop: 2 }}>
            {totalGames === 0 ? "Start your journey" : "Ready to train?"}
          </h1>
        </motion.div>

        {/* ── XP / LEVEL HEADER ── */}
        <motion.div
          className="pt-xp-header"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04, duration: 0.4 }}
        >
          <div className="pt-xp-badge">
            {loaded ? <AnimatedNumber value={levelInfo.level} delay={0.15} /> : "—"}
          </div>
          <div className="pt-xp-info">
            <div className="pt-xp-title-row">
              <span className="pt-xp-level">Level {loaded ? levelInfo.level : "—"}</span>
              <span className="pt-xp-title">{loaded ? levelTitle(levelInfo.level) : "Loading..."}</span>
            </div>
            <div className="pt-xp-bar-track">
              <motion.div
                className="pt-xp-bar-fill"
                initial={{ width: 0 }}
                animate={{ width: `${loaded ? levelInfo.pct : 0}%` }}
                transition={{ duration: reduceMotion ? 0.3 : 0.8, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <div className="pt-xp-numbers">
              <span>{loaded ? levelInfo.xpInLevel : 0} XP earned</span>
              <span>{loaded ? `${levelInfo.xpForNext - levelInfo.xpInLevel}` : "—"} XP to next level</span>
            </div>
          </div>
        </motion.div>

        {/* ── STAT PILLS: Streak, Daily Goal, Games ── */}
        <motion.div
          className="pt-stat-pills"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06, duration: 0.4 }}
        >
          {/* Streak */}
          <div className="pt-stat-pill">
            <div className="pt-stat-pill-icon" style={{ background: "rgba(255,159,10,0.12)" }}>
              <span style={{ filter: stats.streak > 0 ? "none" : "grayscale(0.5)" }}>🔥</span>
            </div>
            <div className="pt-stat-pill-data">
              <div className="pt-stat-pill-value">
                {loaded ? <AnimatedNumber value={stats.streak} delay={0.2} /> : "—"}
              </div>
              <div className="pt-stat-pill-label">Day Streak</div>
            </div>
          </div>

          {/* Daily Goal */}
          <div className="pt-stat-pill">
            <div className="pt-stat-pill-icon" style={{ background: "rgba(48,209,88,0.12)" }}>
              {dailyPct >= 100 ? "✅" : "🎯"}
            </div>
            <div className="pt-stat-pill-data">
              <div className="pt-stat-pill-value">
                {loaded ? `${Math.min(dayXP, DAILY_GOAL_XP)}/${DAILY_GOAL_XP}` : "—"}
              </div>
              <div className="pt-stat-pill-label">Daily Goal</div>
            </div>
          </div>

          {/* Total Games */}
          <div className="pt-stat-pill">
            <div className="pt-stat-pill-icon" style={{ background: "rgba(10,132,255,0.12)" }}>
              🎮
            </div>
            <div className="pt-stat-pill-data">
              <div className="pt-stat-pill-value">
                {loaded ? <AnimatedNumber value={totalGames} delay={0.25} /> : "—"}
              </div>
              <div className="pt-stat-pill-label">Games Played</div>
            </div>
          </div>
        </motion.div>

        {/* ── RESUME / START CARD ── */}
        {loaded && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.4 }}
          >
            {lastMode ? (
              <Link href={`/play/${lastMode}`} className="pt-resume-card">
                <div className="pt-resume-icon">{GAME_MODE_META[lastMode].icon}</div>
                <div className="pt-resume-body">
                  <div className="pt-resume-label">Continue Training</div>
                  <div className="pt-resume-title">{GAME_MODE_META[lastMode].label}</div>
                  <div className="pt-resume-sub">{GAME_MODE_META[lastMode].description}</div>
                </div>
                <div className="pt-resume-arrow">▶</div>
              </Link>
            ) : totalGames === 0 ? (
              /* First session: one recommended exercise, not a 18-mode catalog */
              <Link href="/play/pitch-match" className="pt-resume-card">
                <div className="pt-resume-icon">🎤</div>
                <div className="pt-resume-body">
                  <div className="pt-resume-label">Start here · 3 min</div>
                  <div className="pt-resume-title">Pitch Match</div>
                  <div className="pt-resume-sub">
                    Sing or hum a note and match the target — the friendliest way to start training your ear
                  </div>
                </div>
                <div className="pt-resume-arrow">▶</div>
              </Link>
            ) : (
              <Link href="/play-modes" className="pt-resume-card">
                <div className="pt-resume-icon">🎵</div>
                <div className="pt-resume-body">
                  <div className="pt-resume-label">Get Started</div>
                  <div className="pt-resume-title">Browse all 18 modes</div>
                  <div className="pt-resume-sub">Pick a skill and start training your ear</div>
                </div>
                <div className="pt-resume-arrow">▶</div>
              </Link>
            )}
          </motion.div>
        )}

        {/* ── DAILY CHALLENGE STRIP ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          style={{ marginBottom: 20 }}
        >
          <Link
            href="/daily"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "14px 16px",
              borderRadius: 16,
              background: "linear-gradient(135deg, color-mix(in srgb, var(--ios-orange) 12%, var(--pt-surface-1)), var(--pt-surface-1))",
              border: "1px solid color-mix(in srgb, var(--ios-orange) 24%, var(--pt-stroke))",
              textDecoration: "none",
              boxShadow: "var(--ios-shadow-xs)",
              transition: "transform 0.15s ease",
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, background: "rgba(255,159,10,0.12)", flexShrink: 0,
            }}>
              📅
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.2px", color: "var(--ios-label)" }}>
                Today&apos;s Challenge
              </div>
              <div style={{ fontSize: 12, color: "var(--ios-label3)", marginTop: 1 }}>
                {stats.dailyCompleted.includes(todayStr) ? "Completed! Come back tomorrow." : "Fresh daily drill — earn bonus XP"}
              </div>
            </div>
            <span style={{ fontSize: 18, color: "var(--ios-label3)" }}>→</span>
          </Link>
        </motion.div>

        {/* ── COURSES SECTION (Khan Academy style) ── */}
        <div className="pt-section-heading">
          <div>
            <h2>Courses</h2>
            <p>Progress through each skill track</p>
          </div>
          <Link
            href="/play-modes"
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "var(--ios-blue)",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            View all →
          </Link>
        </div>

        <div className="pt-course-grid">
          {categoryMastery.map((cat, idx) => {
            const mc = MASTERY_CONFIG[cat.level];
            return (
              <motion.div
                key={cat.categoryId}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + idx * 0.03, duration: 0.35 }}
              >
                <Link href={`/play-modes`} className="pt-course-card">
                  <div className="pt-course-card-accent" style={{ background: cat.accentHex }} />
                  <div className="pt-course-card-head">
                    <div className="pt-course-icon" style={{
                      background: `color-mix(in srgb, ${cat.accentHex} 14%, transparent)`,
                    }}>
                      {cat.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="pt-course-title">{cat.label}</div>
                      <div className="pt-course-subtitle">
                        {cat.playedModes}/{cat.totalModes} modes started
                      </div>
                    </div>
                    <MasteryRing pct={cat.masteryPct} size={48} color={cat.accentHex} />
                  </div>

                  {/* Mastery bar */}
                  <div className="pt-mastery-bar-track">
                    <div
                      className="pt-mastery-bar-fill"
                      style={{
                        width: `${cat.masteryPct}%`,
                        background: cat.accentHex,
                      }}
                    />
                  </div>

                  <div className="pt-course-footer">
                    <span className="pt-mastery-badge" style={{
                      background: mc.bg,
                      color: mc.color,
                    }}>
                      <span className="pt-mastery-badge-dot" style={{ background: mc.ringColor }} />
                      {mc.label}
                    </span>
                    <span className="pt-course-stat">
                      {cat.totalGames} {cat.totalGames === 1 ? "game" : "games"}
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* ── PRACTICE PLAN (Adaptive) ── */}
        {loaded && totalGames > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            style={{ marginBottom: 20 }}
          >
            <div className="pt-section-heading">
              <div>
                <h2>Recommended Plan</h2>
                <p>{practicePlan.personalized ? "Adaptive to your weak spots" : "Daily guided session"}</p>
              </div>
              {planDuration.maxMinutes > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 700, color: "var(--ios-orange)",
                  padding: "3px 8px", borderRadius: 999,
                  border: "1px solid rgba(255,159,10,0.28)",
                  background: "rgba(255,159,10,0.08)",
                  whiteSpace: "nowrap",
                }}>
                  ⏱ {planDuration.label}
                </span>
              )}
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {practicePlan.modeIds.map((modeId, index) => {
                const mode = GAME_MODE_META[modeId];
                return (
                  <Link
                    key={modeId}
                    href={`/play/${modeId}`}
                    className="pt-mode-list-item"
                  >
                    <div className="pt-mode-list-icon" style={{
                      background: `color-mix(in srgb, ${mode.accentHex} 14%, transparent)`,
                    }}>
                      {mode.icon}
                    </div>
                    <div className="pt-mode-list-body">
                      <div className="pt-mode-list-title">{mode.label}</div>
                      <div className="pt-mode-list-sub">
                        Step {index + 1} · {practicePlan.steps[index]?.label}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: "var(--ios-label3)",
                      background: "rgba(255,255,255,0.05)", borderRadius: 999,
                      padding: "2px 7px", whiteSpace: "nowrap",
                    }}>
                      {practicePlan.steps[index]?.cue.durationLabel}
                    </span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── EMPTY STATE (no games played) ── */}
        {loaded && totalGames === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="pt-empty-state"
          >
            <div className="pt-empty-state-icon">🎓</div>
            <div className="pt-empty-state-title">Welcome to Pitch Therapy!</div>
            <div className="pt-empty-state-body">
              Complete your first drill to unlock XP, streaks, and personalized practice plans.
            </div>
            <Link
              href="/play-modes"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                height: 44,
                borderRadius: 12,
                padding: "0 24px",
                background: "var(--ios-blue)",
                color: "var(--pt-on-accent)",
                fontSize: 15,
                fontWeight: 700,
                textDecoration: "none",
                marginTop: 16,
                boxShadow: "0 4px 14px color-mix(in srgb, var(--ios-blue) 35%, transparent)",
              }}
            >
              Start First Drill
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
