"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { GAME_MODE_META, MODE_CATEGORIES, getModeTrainingCue, type ModeCategoryId } from "@pitch-therapy/core";
import { useStatsContext } from "@/components/StatsProvider";
import { buildCategoryMastery } from "@/lib/gamification";

export default function PlayModesPage() {
  const { stats, getModeStats } = useStatsContext();
  const reduce = useReducedMotion();
  const categories = useMemo(() => buildCategoryMastery(stats.results, getModeStats), [stats.results, getModeStats]);
  const [active, setActive] = useState<ModeCategoryId>(categories[0]?.categoryId ?? MODE_CATEGORIES[0].id);
  const selected = categories.find((category) => category.categoryId === active) ?? categories[0];

  return (
    <div className="studio-app-page">
      <div className="pt-page-shell studio-catalog-page">
        <motion.header className="studio-catalog-header" initial={reduce ? false : { opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <span className="studio-overline">EXERCISE LIBRARY / 18 MODES</span>
          <h1>Train one thing<br /><em>at a time.</em></h1>
          <p>Choose the listening skill you want to sharpen. Every drill is short, focused, and built for repetition.</p>
        </motion.header>

        <nav className="studio-category-tabs" aria-label="Exercise categories">
          {categories.map((category, index) => {
            const isActive = category.categoryId === selected?.categoryId;
            return (
              <button key={category.categoryId} type="button" onClick={() => setActive(category.categoryId)} className={isActive ? "is-active" : ""} aria-pressed={isActive} style={{ "--tab-accent": category.accentHex } as React.CSSProperties}>
                <span>0{index + 1}</span><b>{category.label}</b><small>{category.totalModes} exercises</small>
              </button>
            );
          })}
        </nav>

        {selected ? (
          <motion.section key={selected.categoryId} className="studio-catalog-section" initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <header style={{ "--category-accent": selected.accentHex } as React.CSSProperties}>
              <div className="studio-catalog-symbol">{selected.icon}</div>
              <div><span>SKILL TRACK</span><h2>{selected.label}</h2><p>{selected.description}</p></div>
              <div className="studio-catalog-mastery"><b>{selected.masteryPct}%</b><span>MASTERY</span><i><em style={{ width: `${selected.masteryPct}%` }} /></i></div>
            </header>

            <div className="studio-mode-grid">
              {selected.modes.map((mode, index) => {
                const meta = GAME_MODE_META[mode.modeId];
                const cue = getModeTrainingCue(mode.modeId);
                return (
                  <motion.article key={mode.modeId} initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.045 }}>
                    <Link href={`/play/${mode.modeId}`} className="studio-mode-card" style={{ "--mode-accent": meta.accentHex } as React.CSSProperties}>
                      <div className="studio-mode-card-top"><span>0{index + 1}</span><span>{cue.durationLabel}</span></div>
                      <div className="studio-mode-card-icon">{meta.icon}</div>
                      <h3>{meta.label}</h3>
                      <p>{mode.gamesPlayed ? `${mode.gamesPlayed} sessions · ${Math.round(mode.avgAccuracy * 100)}% average accuracy` : meta.description}</p>
                      <div className="studio-mode-card-footer"><span>{mode.gamesPlayed ? `${mode.masteryPct}% mastered` : cue.sessionGoal}</span><i aria-hidden="true">↗</i></div>
                    </Link>
                  </motion.article>
                );
              })}
            </div>
          </motion.section>
        ) : null}

        <footer className="studio-catalog-footer"><span>THE PRACTICE PRINCIPLE</span><p>Five focused repetitions beat one long, distracted session.</p><Link href="/dashboard">Build today&apos;s session →</Link></footer>
      </div>
    </div>
  );
}
