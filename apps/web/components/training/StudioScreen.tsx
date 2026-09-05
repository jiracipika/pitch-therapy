"use client";

/**
 * StudioScreen — shared "Resonance Studio" presentation primitives for the
 * 18 game pages, matching the landing/dashboard/play-modes visual language
 * (mono micro-labels, hairline strokes, accent-tinted surfaces, big tight
 * display type). Presentation only — game logic stays in each mode page.
 */

import { type CSSProperties, type ReactNode } from "react";
import { motion } from "framer-motion";

export function StudioStack({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div className="studio-screen-stack" style={style}>
      {children}
    </div>
  );
}

export function StudioSetup({
  icon,
  eyebrow,
  title,
  description,
  accent,
  children,
  footer,
}: {
  icon: string;
  eyebrow: string;
  title: string;
  description: string;
  accent: string;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div
      className="studio-setup"
      style={{ "--mode-accent": accent } as CSSProperties}
    >
      <span className="studio-setup-eyebrow">{eyebrow}</span>
      <div className="studio-setup-icon" aria-hidden="true">
        {icon}
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
      {children}
      {footer}
    </div>
  );
}

export function StudioLabel({ children }: { children: ReactNode }) {
  return <span className="studio-micro">{children}</span>;
}

export function StudioDifficulty({
  options,
  value,
  onChange,
  accent,
  hint,
}: {
  options: readonly string[];
  value: string;
  onChange: (next: string) => void;
  accent: string;
  hint?: string;
}) {
  return (
    <div className="studio-difficulty">
      <StudioLabel>SELECT DIFFICULTY</StudioLabel>
      <div className="studio-difficulty-row" role="group" aria-label="Difficulty">
        {options.map((option) => {
          const isActive = option === value;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(option)}
              className={isActive ? "is-active" : ""}
              style={
                isActive
                  ? ({ background: accent, borderColor: accent } as CSSProperties)
                  : undefined
              }
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          );
        })}
      </div>
      {hint ? <small>{hint}</small> : null}
    </div>
  );
}

export function StudioStartButton({
  onClick,
  accent,
  children,
  disabled,
}: {
  onClick: () => void;
  accent: string;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className="studio-start-btn"
      onClick={onClick}
      disabled={disabled}
      style={{ background: accent, "--mode-accent": accent } as CSSProperties}
    >
      {children}
    </button>
  );
}

/** Big replay / listen pad used during play (replaces the plain 🔊 square). */
export function StudioListenPad({
  onClick,
  label,
  accent,
  children,
  ariaLabel,
  disabled,
}: {
  onClick: () => void;
  label: string;
  accent: string;
  children: ReactNode;
  ariaLabel: string;
  disabled?: boolean;
}) {
  return (
    <div className="studio-listen">
      <motion.button
        type="button"
        onClick={onClick}
        whileTap={{ scale: 0.93 }}
        aria-label={ariaLabel}
        disabled={disabled}
        className="studio-listen-pad"
        style={{ "--mode-accent": accent } as CSSProperties}
      >
        {children}
      </motion.button>
      <small>{label}</small>
    </div>
  );
}

/** Reusable answer-choice grid styled to match the studio cards. */
export function StudioChoice({
  options,
  onPick,
  disabled,
  accent,
  resolveState,
  renderLabel,
}: {
  options: readonly (string | number)[];
  onPick: (value: string | number) => void;
  disabled?: boolean;
  accent: string;
  /** When provided (feedback phase), highlight correct/wrong answers. */
  resolveState?: (value: string | number) => "correct" | "wrong" | null;
  renderLabel: (value: string | number) => ReactNode;
}) {
  return (
    <div className="studio-choice-grid" style={{ "--mode-accent": accent } as CSSProperties}>
      {options.map((value) => {
        const state = resolveState?.(value) ?? null;
        return (
          <motion.button
            key={String(value)}
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => onPick(value)}
            disabled={disabled}
            className={`studio-choice ${state ? `is-${state}` : ""}`}
          >
            {renderLabel(value)}
          </motion.button>
        );
      })}
    </div>
  );
}

/** Session summary replacing the trophy + 3 ios-cards done screen. */
export function StudioResults({
  eyebrow,
  headline,
  accent,
  stats,
  primaryAction,
  secondaryAction,
}: {
  eyebrow: string;
  headline: string;
  accent: string;
  stats: { value: string | number; label: string; accentValue?: boolean }[];
  primaryAction: { label: string; onClick: () => void };
  secondaryAction: { label: string; onClick: () => void };
}) {
  return (
    <div className="pb-tab studio-training" style={{ "--mode-accent": accent } as CSSProperties}>
      <div className="mx-auto max-w-sm px-4 pt-12 md:max-w-lg">
        <div className="studio-results" style={{ "--mode-accent": accent } as CSSProperties}>
          <span className="studio-setup-eyebrow">{eyebrow}</span>
          <h2>{headline}</h2>
          <div className="studio-results-grid">
            {stats.map((stat) => (
              <article key={stat.label}>
                <b className={stat.accentValue ? "is-accent" : ""}>{stat.value}</b>
                <span>{stat.label}</span>
              </article>
            ))}
          </div>
          <div className="studio-results-actions">
            <button
              type="button"
              className="studio-start-btn"
              onClick={primaryAction.onClick}
              style={{ background: accent, "--mode-accent": accent } as CSSProperties}
            >
              {primaryAction.label}
            </button>
            <button type="button" className="studio-results-secondary" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

