"use client";

import Link from "next/link";
import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useStatsContext } from "@/components/StatsProvider";
import { GAME_MODE_META, buildAdaptivePracticePlan, estimatePlanDuration } from "@pitch-therapy/core";
import { buildCategoryMastery, calculateTotalXP, getLevelProgress, levelTitle, todayXP, DAILY_GOAL_XP, getLastPlayedMode } from "@/lib/gamification";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function Ring({ value, label }: { value: number; label: string }) {
  const circumference = 2 * Math.PI * 42;
  return (
    <div className="studio-ring" aria-label={`${label}: ${Math.round(value)} percent`}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="42" />
        <motion.circle cx="50" cy="50" r="42" initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: circumference * (1 - value / 100) }} style={{ strokeDasharray: circumference }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} />
      </svg>
      <span><b>{Math.round(value)}%</b><small>{label}</small></span>
    </div>
  );
}

export default function Dashboard() {
  const { stats, loaded, getModeStats } = useStatsContext();
  const reduce = useReducedMotion();
  const totalXP = useMemo(() => calculateTotalXP(stats.results), [stats.results]);
  const level = useMemo(() => getLevelProgress(totalXP), [totalXP]);
  const dayXP = useMemo(() => todayXP(stats.results), [stats.results]);
  const lastMode = useMemo(() => getLastPlayedMode(stats.results), [stats.results]);
  const categories = useMemo(() => buildCategoryMastery(stats.results, getModeStats), [stats.results, getModeStats]);
  const plan = buildAdaptivePracticePlan(stats.results);
  const duration = estimatePlanDuration(plan);
  const totalGames = stats.results.length;
  const avgAccuracy = totalGames ? Math.round(stats.results.reduce((sum, result) => sum + result.accuracy, 0) / totalGames * 100) : 0;
  const dailyPct = Math.min(100, dayXP / DAILY_GOAL_XP * 100);
  const resumeId = lastMode ?? "pitch-match";
  const resume = GAME_MODE_META[resumeId];

  return (
    <div className="studio-app-page">
      <div className="pt-page-shell studio-dashboard">
        <motion.header className="studio-dashboard-header" initial={reduce ? false : { opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <div><span className="studio-overline">{greeting()} / LISTENING STUDIO</span><h1>{totalGames ? "Ready for another round?" : "Let’s train your ear."}</h1><p>{totalGames ? "Your next focused session is ready." : "Start small. Three minutes is enough to begin hearing differently."}</p></div>
          <div className="studio-level-chip"><span>LEVEL</span><b>{loaded ? level.level : "—"}</b><small>{loaded ? levelTitle(level.level) : "Loading"}</small></div>
        </motion.header>

        <section className="studio-dashboard-grid">
          <div className="studio-dashboard-main">
            <motion.div className="studio-session-card" initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <div className="studio-session-card-top"><span>{lastMode ? "CONTINUE TRAINING" : "RECOMMENDED FIRST DRILL"}</span><span>≈ 3 MIN</span></div>
              <div className="studio-session-card-body">
                <div className="studio-session-art" style={{ "--session-accent": resume.accentHex } as React.CSSProperties}><span>{resume.icon}</span><i /><i /><i /><i /><i /></div>
                <div><span className="studio-session-category">FOCUSED EXERCISE</span><h2>{resume.label}</h2><p>{resume.description}</p><Link href={`/play/${resumeId}`}>Start session <span aria-hidden="true">→</span></Link></div>
              </div>
            </motion.div>

            <div className="studio-metric-grid">
              <article><span>STREAK</span><b>{loaded ? stats.streak : "—"}<small> days</small></b><p>{stats.streak ? "Momentum is building." : "Begin today’s streak."}</p></article>
              <article><span>ACCURACY</span><b>{loaded ? avgAccuracy : "—"}<small>%</small></b><p>Across every exercise.</p></article>
              <article><span>SESSIONS</span><b>{loaded ? totalGames : "—"}</b><p>Short, focused repetitions.</p></article>
            </div>

            <section className="studio-panel">
              <div className="studio-panel-heading"><div><span>YOUR CURRICULUM</span><h2>Recommended next</h2></div><span className="studio-time-chip">{duration.label || "≈ 10 min"}</span></div>
              <div className="studio-plan-list">
                {plan.modeIds.map((modeId, index) => {
                  const mode = GAME_MODE_META[modeId];
                  return <Link key={modeId} href={`/play/${modeId}`}><span className="studio-plan-number">0{index + 1}</span><span className="studio-plan-icon" style={{ background: `color-mix(in srgb, ${mode.accentHex} 15%, transparent)` }}>{mode.icon}</span><span><b>{mode.label}</b><small>{plan.steps[index]?.label ?? mode.description}</small></span><i aria-hidden="true">↗</i></Link>;
                })}
              </div>
            </section>
          </div>

          <aside className="studio-dashboard-side">
            <section className="studio-panel studio-daily-panel">
              <div className="studio-panel-heading"><div><span>TODAY</span><h2>Daily goal</h2></div><Ring value={dailyPct} label="complete" /></div>
              <p>{dailyPct >= 100 ? "Goal complete. Your ear got sharper today." : `${Math.max(0, DAILY_GOAL_XP - dayXP)} XP left — one focused drill can close the gap.`}</p>
              <Link href="/daily">Open daily challenge <span aria-hidden="true">→</span></Link>
            </section>

            <section className="studio-panel">
              <div className="studio-panel-heading"><div><span>MASTERY MAP</span><h2>Skill tracks</h2></div><Link href="/progress">Insights ↗</Link></div>
              <div className="studio-mastery-list">
                {categories.map((category) => <Link href="/play-modes" key={category.categoryId}><span className="studio-mastery-icon" style={{ background: `color-mix(in srgb, ${category.accentHex} 14%, transparent)` }}>{category.icon}</span><span><b>{category.label}</b><i><em style={{ width: `${category.masteryPct}%`, background: category.accentHex }} /></i></span><strong>{category.masteryPct}%</strong></Link>)}
              </div>
            </section>

            <section className="studio-xp-panel">
              <div><span>LEVEL {level.level}</span><b>{levelTitle(level.level)}</b></div><strong>{totalXP}<small> XP</small></strong>
              <i><em style={{ width: `${level.pct}%` }} /></i>
              <p>{level.xpForNext - level.xpInLevel} XP until your next level.</p>
            </section>
          </aside>
        </section>
      </div>
    </div>
  );
}
