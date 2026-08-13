"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useStatsContext } from "@/components/StatsProvider";
import {
  GAME_MODE_META,
  GAME_MODES,
  MODE_CATEGORIES,
  getModeTrainingCue,
  type ModeCategoryId,
} from "@pitch-therapy/core";
import {
  buildCategoryMastery,
  MASTERY_CONFIG,
  type CategoryMastery,
} from "@/lib/gamification";

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

function CategorySection({ cat, index }: { cat: CategoryMastery; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);
  const reduceMotion = useReducedMotion();
  const mc = MASTERY_CONFIG[cat.level];

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      style={{ marginBottom: 16 }}
    >
      {/* Category Banner */}
      <button
        onClick={() => setExpanded((e) => !e)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "16px 18px",
          borderRadius: 18,
          background: `linear-gradient(135deg, ${cat.accentHex} 0%, color-mix(in srgb, ${cat.accentHex} 70%, #000) 100%)`,
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          position: "relative",
          overflow: "hidden",
          transition: "transform 0.15s ease",
        }}
        className="pt-category-banner-trigger"
      >
        {/* Decorative pattern overlay */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at 85% 50%, rgba(255,255,255,0.10), transparent 50%)",
          pointerEvents: "none",
        }} />

        <div style={{
          width: 54,
          height: 54,
          borderRadius: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          flexShrink: 0,
          background: "rgba(255,255,255,0.15)",
          backdropFilter: "blur(10px)",
        }}>
          {cat.icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 19,
            fontWeight: 800,
            letterSpacing: "-0.4px",
            color: "#fff",
            textShadow: "0 1px 4px rgba(0,0,0,0.2)",
          }}>
            {cat.label}
          </div>
          <div style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.85)",
            marginTop: 2,
          }}>
            {cat.description}
          </div>
          {/* Mastery bar */}
          <div style={{
            height: 6,
            borderRadius: 999,
            background: "rgba(255,255,255,0.2)",
            marginTop: 8,
            overflow: "hidden",
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${cat.masteryPct}%` }}
              transition={{ duration: reduceMotion ? 0.3 : 0.8, ease: [0.22, 1, 0.36, 1] }}
              style={{
                height: "100%",
                borderRadius: 999,
                background: "rgba(255,255,255,0.9)",
              }}
            />
          </div>
        </div>

        {/* Mastery ring */}
        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 999,
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            fontWeight: 800,
            color: "#fff",
          }}>
            {cat.masteryPct}%
          </div>
          <span style={{
            fontSize: 9,
            fontWeight: 700,
            color: "rgba(255,255,255,0.8)",
            textTransform: "uppercase",
            letterSpacing: 0.3,
          }}>
            {mc.label}
          </span>
        </div>

        {/* Expand chevron */}
        <div style={{
          flexShrink: 0,
          color: "rgba(255,255,255,0.7)",
          fontSize: 14,
          transition: "transform 0.2s ease",
          transform: expanded ? "rotate(180deg)" : "none",
        }}>
          ▾
        </div>
      </button>

      {/* Expanded mode list */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.25 }}
          style={{ display: "grid", gap: 8, padding: "12px 4px 4px" }}
        >
          {cat.modes.map((mode, modeIdx) => {
            const cue = getModeTrainingCue(mode.modeId);
            const mmc = MASTERY_CONFIG[mode.level];
            return (
              <motion.div
                key={mode.modeId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: modeIdx * 0.02, duration: 0.25 }}
              >
                <Link href={`/play/${mode.modeId}`} className="pt-mode-list-item">
                  <div className="pt-mode-list-icon" style={{
                    background: `color-mix(in srgb, ${mode.accentHex} 14%, transparent)`,
                    position: "relative",
                  }}>
                    {mode.icon}
                    {mode.level === "mastered" && (
                      <div style={{
                        position: "absolute",
                        top: -4,
                        right: -4,
                        width: 18,
                        height: 18,
                        borderRadius: 999,
                        background: "#30D158",
                        color: "#fff",
                        fontSize: 10,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                      }}>
                        ✓
                      </div>
                    )}
                  </div>
                  <div className="pt-mode-list-body">
                    <div className="pt-mode-list-title">{mode.label}</div>
                    <div className="pt-mode-list-sub">
                      {mode.gamesPlayed > 0
                        ? `${mode.gamesPlayed} games · Best: ${mode.bestScore} · ${Math.round(mode.avgAccuracy * 100)}% avg`
                        : cue.sessionGoal}
                    </div>
                  </div>

                  {/* Mastery indicator */}
                  {mode.gamesPlayed > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flexShrink: 0 }}>
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: 999,
                        border: `3px solid ${mmc.ringColor}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        fontWeight: 800,
                        color: mmc.color,
                        background: mmc.bg,
                      }}>
                        {mode.masteryPct}%
                      </div>
                    </div>
                  ) : (
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: mode.accentHex,
                      background: `color-mix(in srgb, ${mode.accentHex} 14%, transparent)`,
                      borderRadius: 999,
                      padding: "4px 8px",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}>
                      {cue.durationLabel}
                    </span>
                  )}

                  <span style={{
                    flexShrink: 0,
                    color: "var(--ios-label4)",
                    marginLeft: 4,
                  }}>
                    <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
                      <path d="M1 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.section>
  );
}

export default function PlayModesPage() {
  const { stats, loaded, getModeStats } = useStatsContext();
  const categoryMastery = useMemo(
    () => buildCategoryMastery(stats.results, getModeStats),
    [stats.results, getModeStats],
  );

  return (
    <div className="pb-tab" style={{ background: "var(--ios-bg)", minHeight: "100dvh" }}>
      <div className="pt-page-shell px-4 pt-14">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ padding: "8px 4px 16px" }}
        >
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.6px", color: "var(--ios-label)" }}>
            All Courses
          </h1>
          <p style={{ fontSize: 14, color: "var(--ios-label3)", marginTop: 4 }}>
            {GAME_MODES.length} ear-training modes across {MODE_CATEGORIES.length} skill tracks. Tap a track to expand.
          </p>
        </motion.div>

        {/* ── Overall mastery summary ── */}
        {loaded && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04, duration: 0.4 }}
            style={{
              display: "flex",
              gap: 10,
              marginBottom: 20,
            }}
          >
            {Object.entries(
              categoryMastery.reduce((acc, cat) => {
                acc[cat.level] = (acc[cat.level] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).filter(([level]) => level !== "not-started").map(([level, count]) => {
              const mc = MASTERY_CONFIG[level as keyof typeof MASTERY_CONFIG];
              return (
                <div key={level} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 999,
                  background: mc.bg,
                  border: `1px solid ${mc.ringColor}33`,
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: 999,
                    background: mc.ringColor,
                  }} />
                  <span style={{
                    fontSize: 12, fontWeight: 700,
                    color: mc.color,
                  }}>
                    {count} {mc.label}
                  </span>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* ── Category Sections ── */}
        <div>
          {categoryMastery.map((cat, idx) => (
            <CategorySection key={cat.categoryId} cat={cat} index={idx} />
          ))}
        </div>

        {/* ── Footer hint ── */}
        <div style={{ textAlign: "center", padding: "24px 16px 40px" }}>
          <p style={{ fontSize: 13, color: "var(--ios-label3)" }}>
            Play each mode 5+ times at 80%+ accuracy to achieve mastery 🏆
          </p>
        </div>
      </div>
    </div>
  );
}
