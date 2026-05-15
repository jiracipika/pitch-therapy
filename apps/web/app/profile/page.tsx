'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { PageHero, Reveal, StatusCard } from '@/components/PremiumMotion';
import { useStatsContext } from '@/components/StatsProvider';

const MODES = [
  { id: 'pitch-match',      label: 'Pitch Match',      icon: '🎤', color: '#0A84FF', category: 'Voice' },
  { id: 'note-id',          label: 'Note ID',           icon: '🎵', color: '#BF5AF2', category: 'Pitch' },
  { id: 'frequency-guess',  label: 'Freq Guess',        icon: '📡', color: '#FF9F0A', category: 'Frequency' },
  { id: 'note-wordle',      label: 'Note Wordle',       icon: '🟩', color: '#30D158', category: 'Pitch' },
  { id: 'frequency-wordle', label: 'Freq Wordle',       icon: '🔊', color: '#5AC8FA', category: 'Frequency' },
  { id: 'pitch-memory',     label: 'Pitch Memory',      icon: '🧠', color: '#FF375F', category: 'Pitch' },
  { id: 'name-that-note',   label: 'Name That Note',    icon: '🎼', color: '#32ADE6', category: 'Pitch' },
  { id: 'frequency-hunt',   label: 'Freq Hunt',         icon: '🔍', color: '#FF9F0A', category: 'Frequency' },
  { id: 'drone-lock',       label: 'Drone Lock',        icon: '🔒', color: '#63E6E2', category: 'Voice' },
  { id: 'speed-round',      label: 'Speed Round',       icon: '⚡', color: '#FF9F0A', category: 'Pitch' },
  { id: 'chord-detective',  label: 'Chord Detective',   icon: '🕵️', color: '#FF375F', category: 'Advanced' },
  { id: 'waveform-match',   label: 'Waveform Match',    icon: '〰️', color: '#5E5CE6', category: 'Advanced' },
  { id: 'tuning-battle',    label: 'Tuning Battle',     icon: '⚔️', color: '#FF453A', category: 'Advanced' },
  { id: 'tune-in',          label: 'Tune In',           icon: '📻', color: '#FF375F', category: 'Voice' },
  { id: 'piano-tap',        label: 'Piano Tap',         icon: '🎹', color: '#5E5CE6', category: 'Pitch' },
  { id: 'frequency-slider', label: 'Freq Slider',       icon: '🎚️', color: '#5AC8FA', category: 'Frequency' },
  { id: 'cents-deviation',  label: 'Cents Deviation',   icon: '📐', color: '#30D158', category: 'Advanced' },
  { id: 'interval-archer',  label: 'Interval Archer',   icon: '🏹', color: '#BF5AF2', category: 'Advanced' },
];

const CATEGORIES = [
  { label: 'Voice', color: '#0A84FF', desc: 'Voice control & intonation' },
  { label: 'Pitch', color: '#BF5AF2', desc: 'Note identification' },
  { label: 'Frequency', color: '#FF9F0A', desc: 'Precise frequency perception' },
  { label: 'Advanced', color: '#FF375F', desc: 'Complex musical skills' },
];

export default function ProfilePage() {
  const { stats, loaded } = useStatsContext();

  const totalGames = stats.results.length;
  const totalTimeMin = Math.round(stats.results.reduce((s, r) => s + r.timeMs, 0) / 60000);
  const avgAccuracy = totalGames > 0
    ? Math.round((stats.results.reduce((s, r) => s + r.accuracy, 0) / totalGames) * 100)
    : 0;

  const modesPlayed = new Set(stats.results.map((r) => r.mode)).size;
  const varietyScore = Math.min(100, Math.round((modesPlayed / 18) * 50));
  const accuracyScore = Math.min(100, avgAccuracy);
  const earProfileScore = Math.round((varietyScore * 0.4) + (accuracyScore * 0.4) + (Math.min(stats.bestStreak, 7) / 7 * 20));

  const categoryScores = CATEGORIES.map((cat) => {
    const catModes = MODES.filter((m) => m.category === cat.label);
    const catResults = stats.results.filter((r) => catModes.some((m) => m.id === r.mode));
    const games = catResults.length;
    const accuracy = games > 0
      ? Math.round((catResults.reduce((s, r) => s + r.accuracy, 0) / games) * 100)
      : 0;
    return { ...cat, games, accuracy };
  });

  const getProfileTitle = (score: number) => {
    if (score >= 90) return { title: 'Perfect Pitch Prodigy', emoji: '🎯', color: '#FFD60A' };
    if (score >= 75) return { title: 'Sharp Ear', emoji: '🎵', color: '#30D158' };
    if (score >= 55) return { title: 'Tuned Listener', emoji: '📻', color: '#0A84FF' };
    if (score >= 35) return { title: 'Rising Musician', emoji: '🎶', color: '#BF5AF2' };
    if (score >= 15) return { title: 'Eager Ear', emoji: '👂', color: '#FF9F0A' };
    return { title: 'New Listener', emoji: '🌱', color: 'var(--ios-label3)' };
  };

  const profile = getProfileTitle(earProfileScore);
  const scorePct = loaded ? earProfileScore / 100 : 0;
  const circ = 2 * Math.PI * 52;

  return (
    <div className="pb-tab" style={{ background: 'var(--ios-bg)', minHeight: '100dvh' }}>
      <div className="pt-page-shell pt-page-profile px-4 pt-14">

        <PageHero
          variant="profile"
          eyebrow="Your ear profile"
          title="Ear Profile"
          subtitle="A dynamic snapshot of where your hearing strengths are evolving."
        />

        <div className="pt-profile-layout">
          <div className="pt-profile-main">

            {/* ── PROFILE SCORE CARD ── */}
            <motion.div
              className="ios-card pt-desktop-card"
              style={{
                padding: 28,
                textAlign: 'center',
                background: `linear-gradient(145deg, ${profile.color}12 0%, ${profile.color}06 50%, transparent 100%)`,
                border: `1px solid ${profile.color}18`,
                marginBottom: 12,
                position: 'relative',
                overflow: 'hidden',
              }}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Ambient glow */}
              <div style={{
                position: 'absolute',
                top: '-40%',
                left: '-20%',
                width: '140%',
                height: '80%',
                background: `radial-gradient(ellipse, ${profile.color}0D, transparent 70%)`,
                pointerEvents: 'none',
              }} />

              <motion.div
                style={{ fontSize: 56, marginBottom: 8, lineHeight: 1 }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                {profile.emoji}
              </motion.div>

              <div style={{ fontSize: 26, fontWeight: 700, color: profile.color, letterSpacing: '-0.5px', marginBottom: 4, position: 'relative' }}>
                {loaded ? profile.title : '...'}
              </div>
              <div style={{ fontSize: 15, color: 'var(--ios-label2)', marginBottom: 20, position: 'relative' }}>
                {loaded ? `Ear Profile Score: ${earProfileScore}/100` : 'Play games to discover your profile'}
              </div>

              {/* Animated score ring */}
              <div style={{ position: 'relative', width: 130, height: 130, margin: '0 auto 20px' }}>
                <svg width={130} height={130} viewBox="0 0 130 130" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx={65} cy={65} r={52} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
                  <defs>
                    <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={typeof profile.color === 'string' && profile.color.startsWith('#') ? profile.color : '#BF5AF2'} />
                      <stop offset="100%" stopColor="#0A84FF" />
                    </linearGradient>
                  </defs>
                  <motion.circle
                    cx={65} cy={65} r={52}
                    fill="none"
                    stroke="url(#scoreGrad)"
                    strokeWidth={8}
                    strokeLinecap="round"
                    strokeDasharray={circ}
                    initial={{ strokeDashoffset: circ }}
                    animate={{ strokeDashoffset: circ * (1 - scorePct) }}
                    transition={{ duration: 1.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  />
                </svg>
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 34, fontWeight: 700, color: 'var(--ios-label)', letterSpacing: '-1px' }}>
                    {loaded ? earProfileScore : '—'}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 2 }}>Score</span>
                </div>
              </div>

              {/* Quick stats grid */}
              <div className="pt-profile-stats" style={{ marginTop: 8, position: 'relative' }}>
                {[
                  { label: 'Games', value: loaded ? String(totalGames) : '—', color: 'var(--ios-blue)' },
                  { label: 'Streak', value: loaded ? String(stats.streak) : '—', color: 'var(--ios-orange)' },
                  { label: 'Accuracy', value: loaded ? `${avgAccuracy}%` : '—', color: 'var(--ios-green)' },
                  { label: 'Time', value: loaded ? `${totalTimeMin}m` : '—', color: 'var(--ios-purple)' },
                ].map((s) => (
                  <div key={s.label}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: s.color, letterSpacing: '-0.5px' }}>
                      {s.value}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Tips card */}
            {loaded && totalGames > 0 && (
              <motion.div
                className="ios-card pt-desktop-card"
                style={{
                  padding: 16,
                  marginTop: 12,
                  marginBottom: 8,
                  background: 'linear-gradient(135deg, rgba(10,132,255,0.06) 0%, rgba(94,92,230,0.04) 100%)',
                  border: '0.5px solid rgba(10,132,255,0.12)',
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 14 }}>🎯</span>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ios-blue)' }}>Next Steps</div>
                </div>
                <div style={{ fontSize: 14, color: 'var(--ios-label2)', lineHeight: 1.5 }}>
                  {modesPlayed < 5
                    ? 'Try more game modes to discover your strengths! Head to the dashboard and explore.'
                    : avgAccuracy < 60
                    ? 'Focus on accuracy over speed. Try Practice mode to build precision.'
                    : stats.streak < 3
                    ? 'Build your daily streak! Consistency is key to ear training.'
                    : 'Great progress! Challenge yourself with Advanced modes like Chord Detective and Waveform Match.'}
                </div>
              </motion.div>
            )}

            {/* Empty state */}
            {loaded && totalGames === 0 && (
              <Reveal delay={0.24}>
                <StatusCard
                  tone="empty"
                  title="Discover your ear profile"
                  body="Play a few sessions to generate your personalized score, skill breakdown, and next-step guidance."
                  action={(
                    <Link
                      href="/dashboard"
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        height: 36, borderRadius: 10, padding: '0 14px',
                        background: 'linear-gradient(135deg, #0A84FF 0%, #5E5CE6 100%)',
                        color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none',
                        boxShadow: '0 2px 12px rgba(10,132,255,0.3)',
                      }}
                    >
                      Start Training
                    </Link>
                  )}
                />
              </Reveal>
            )}
          </div>

          <div className="pt-profile-side">
            {/* ── SKILLS BREAKDOWN ── */}
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ios-label3)', textTransform: 'uppercase', letterSpacing: '-0.08px', padding: '20px 4px 8px' }}>
              Skills Breakdown
            </div>

            <motion.div
              className="ios-group pt-desktop-card"
              style={{ overflow: 'hidden', borderRadius: 12 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14, duration: 0.4 }}
            >
              {categoryScores.map((cat, idx) => (
                <div
                  key={cat.label}
                  style={{
                    padding: '14px 16px',
                    borderTop: idx === 0 ? 'none' : '0.5px solid var(--ios-sep)',
                    background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ios-label)', letterSpacing: '-0.32px' }}>
                        {cat.label}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--ios-label3)', marginTop: 2 }}>
                        {cat.desc} · {cat.games} game{cat.games !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: cat.games > 0 ? cat.color : 'var(--ios-label3)' }}>
                      {cat.games > 0 ? `${cat.accuracy}%` : '—'}
                    </div>
                  </div>
                  {/* Animated progress bar */}
                  <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${cat.accuracy}%` }}
                      transition={{ duration: 1, delay: 0.3 + idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                      style={{
                        height: '100%',
                        borderRadius: 3,
                        background: `linear-gradient(90deg, ${cat.color}, ${cat.color}AA)`,
                        boxShadow: `0 0 8px ${cat.color}33`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}
