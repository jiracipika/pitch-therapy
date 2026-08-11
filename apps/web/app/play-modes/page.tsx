"use client";

import Link from "next/link";
import { useRef, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  GAME_MODE_META,
  GAME_MODES,
  MODE_CATEGORIES,
  getModeTrainingCue,
} from "@pitch-therapy/core";
import { PageHero, Reveal } from "@/components/PremiumMotion";

function tint(color: string, amount = 12) {
  return `color-mix(in srgb, ${color} ${amount}%, transparent)`;
}

export default function PlayModesPage() {
  const reduceMotion = useReducedMotion();
  const modes = GAME_MODES.map((id) => GAME_MODE_META[id]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollByAmount = useCallback((dir: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 320, behavior: reduceMotion ? "auto" : "smooth" });
  }, [reduceMotion]);

  return (
    <div className="pb-tab" style={{ background: "var(--ios-bg)", minHeight: "100dvh" }}>
      <div className="pt-page-shell px-4 pt-14">
        <PageHero
          variant="dashboard"
          eyebrow="Training library"
          title="Pick your next drill"
          subtitle="Swipe through 18 focused ear-training modes, grouped by the skill they train."
        />

        {/* ── HORIZONTAL CAROUSEL: All Modes ── */}
        <Reveal delay={0.04}>
          <div style={{ marginTop: 20, marginBottom: 28 }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
              paddingLeft: 4,
            }}>
              <div>
                <h2 style={{
                  color: "var(--ios-label)",
                  fontSize: 22,
                  fontWeight: 760,
                  letterSpacing: "-0.04em",
                }}>
                  All Modes
                </h2>
                <p style={{ color: "var(--ios-label3)", fontSize: 13, marginTop: 2 }}>
                  {GAME_MODES.length} drills · swipe horizontally to browse
                </p>
              </div>
              {/* Scroll buttons */}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => scrollByAmount(-1)}
                  aria-label="Scroll modes left"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 999,
                    border: "1px solid var(--pt-stroke)",
                    background: "var(--pt-surface-1)",
                    color: "var(--ios-label2)",
                    cursor: "pointer",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 16,
                    transition: "transform 120ms ease-out, opacity 120ms",
                  }}
                  className="pt-carousel-btn"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => scrollByAmount(1)}
                  aria-label="Scroll modes right"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 999,
                    border: "1px solid var(--pt-stroke)",
                    background: "var(--pt-surface-1)",
                    color: "var(--ios-label2)",
                    cursor: "pointer",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 16,
                    transition: "transform 120ms ease-out, opacity 120ms",
                  }}
                  className="pt-carousel-btn"
                >
                  ›
                </button>
              </div>
            </div>

            {/* Scrollable carousel */}
            <div
              ref={scrollRef}
              style={{
                display: "flex",
                gap: 12,
                overflowX: "auto",
                scrollSnapType: "x mandatory",
                paddingBottom: 12,
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                WebkitOverflowScrolling: "touch",
              }}
              className="pt-carousel-track"
            >
              {modes.map((mode, index) => {
                const cue = getModeTrainingCue(mode.id);
                return (
                  <motion.div
                    key={mode.id}
                    initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                    whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ delay: Math.min(index * 0.02, 0.12), duration: 0.28 }}
                    style={{ scrollSnapAlign: "start", flexShrink: 0 }}
                  >
                    <Link
                      href={`/play/${mode.id}`}
                      className="ios-game-card pt-carousel-card"
                      style={{
                        width: 220,
                        minHeight: 200,
                        display: "flex",
                        flexDirection: "column",
                        textDecoration: "none",
                        padding: 18,
                        borderColor: tint(mode.accentHex, 24),
                        background: `linear-gradient(160deg, ${tint(mode.accentHex, 14)} 0%, var(--ios-bg2) 70%)`,
                      }}
                    >
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 14,
                      }}>
                        <span style={{ fontSize: 30 }}>{mode.icon}</span>
                        <span
                          style={{
                            color: mode.accentHex,
                            fontWeight: 800,
                            fontSize: 12,
                            background: tint(mode.accentHex, 18),
                            borderRadius: 999,
                            padding: "3px 8px",
                          }}
                        >
                          {cue.durationLabel}
                        </span>
                      </div>
                      <div style={{ marginTop: "auto" }}>
                        <div style={{
                          color: "var(--ios-label)",
                          fontSize: 16,
                          fontWeight: 700,
                          letterSpacing: "-0.03em",
                        }}>
                          {mode.label}
                        </div>
                        <div style={{
                          color: "var(--ios-label3)",
                          fontSize: 12,
                          lineHeight: 1.4,
                          marginTop: 4,
                        }}>
                          {mode.description}
                        </div>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginTop: 12,
                          color: mode.accentHex,
                          fontSize: 11,
                          fontWeight: 700,
                        }}>
                          <span style={{
                            background: tint(mode.accentHex, 16),
                            border: `1px solid ${tint(mode.accentHex, 24)}`,
                            borderRadius: 999,
                            padding: "3px 8px",
                          }}>
                            {cue.skillLabel}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </Reveal>

        {/* ── CATEGORY SECTIONS ── */}
        <div style={{ display: "grid", gap: 18 }}>
          {MODE_CATEGORIES.map((category, categoryIndex) => {
            const categoryModes = modes.filter((mode) => mode.category === category.id);
            return (
              <Reveal key={category.id} delay={0.04 + categoryIndex * 0.03}>
                <section className="pt-desktop-card">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                      marginBottom: 10,
                      paddingLeft: 4,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 14,
                          display: "grid",
                          placeItems: "center",
                          background: tint(category.accentHex, 16),
                          fontSize: 22,
                        }}
                      >
                        {category.icon}
                      </div>
                      <div>
                        <h2
                          style={{
                            color: "var(--ios-label)",
                            fontSize: 20,
                            fontWeight: 760,
                            letterSpacing: "-0.035em",
                          }}
                        >
                          {category.label}
                        </h2>
                        <p style={{ color: "var(--ios-label3)", fontSize: 13, marginTop: 2 }}>
                          {category.description}
                        </p>
                      </div>
                    </div>
                    <span style={{ color: category.accentHex, fontSize: 13, fontWeight: 800 }}>
                      {categoryModes.length}
                    </span>
                  </div>

                  <div className="pt-mobile-game-grid">
                    {categoryModes.map((mode, modeIndex) => {
                      const cue = getModeTrainingCue(mode.id);
                      return (
                        <motion.div
                          key={mode.id}
                          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: "-40px" }}
                          transition={{ delay: Math.min(modeIndex * 0.025, 0.12), duration: 0.28 }}
                        >
                          <Link
                            href={`/play/${mode.id}`}
                            className="ios-game-card"
                            style={{
                              minHeight: 148,
                              display: "flex",
                              flexDirection: "column",
                              textDecoration: "none",
                              padding: 16,
                              borderColor: tint(mode.accentHex, 24),
                              background: `linear-gradient(135deg, ${tint(mode.accentHex, 12)} 0%, var(--ios-bg2) 80%)`,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: 16,
                              }}
                            >
                              <span style={{ fontSize: 28 }}>{mode.icon}</span>
                              <span style={{ color: mode.accentHex, fontWeight: 800 }}>→</span>
                            </div>
                            <div style={{ marginTop: "auto" }}>
                              <div
                                style={{
                                  color: "var(--ios-label)",
                                  fontSize: 16,
                                  fontWeight: 700,
                                  letterSpacing: "-0.03em",
                                }}
                              >
                                {mode.label}
                              </div>
                              <div
                                style={{
                                  color: "var(--ios-label3)",
                                  fontSize: 12,
                                  lineHeight: 1.35,
                                  marginTop: 3,
                                }}
                              >
                                {mode.description}
                              </div>
                              <div
                                style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}
                              >
                                <span
                                  style={{
                                    color: mode.accentHex,
                                    background: tint(mode.accentHex, 16),
                                    border: `1px solid ${tint(mode.accentHex, 24)}`,
                                    borderRadius: 999,
                                    fontSize: 11,
                                    fontWeight: 800,
                                    padding: "4px 8px",
                                  }}
                                >
                                  {cue.durationLabel}
                                </span>
                                <span
                                  style={{
                                    color: "var(--ios-label2)",
                                    background: "rgba(255,255,255,0.06)",
                                    border: "1px solid var(--ios-sep)",
                                    borderRadius: 999,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    padding: "4px 8px",
                                  }}
                                >
                                  {cue.skillLabel}
                                </span>
                              </div>
                              <p
                                style={{
                                  color: "var(--ios-label3)",
                                  fontSize: 11,
                                  lineHeight: 1.4,
                                  marginTop: 10,
                                }}
                              >
                                {cue.sessionGoal}
                              </p>
                            </div>
                          </Link>
                        </motion.div>
                      );
                    })}
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
