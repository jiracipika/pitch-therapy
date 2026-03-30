'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
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

  // Calculate ear profile score (0-100) based on variety + accuracy
  const modesPlayed = new Set(stats.results.map((r) => r.mode)).size;
  const varietyScore = Math.min(100, Math.round((modesPlayed / 18) * 50));
  const accuracyScore = Math.min(100, avgAccuracy);
  const earProfileScore = Math.round((varietyScore * 0.4) + (accuracyScore * 0.4) + (Math.min(stats.bestStreak, 7) / 7 * 20));

  // Category scores
  const categoryScores = CATEGORIES.map((cat) => {
    const catModes = MODES.filter((m) => m.category === cat.label);
    const catResults = stats.results.filter((r) => catModes.some((m) => m.id === r.mode));
    const games = catResults.length;
    const accuracy = games > 0
      ? Math.round((catResults.reduce((s, r) => s + r.accuracy, 0) / games) * 100)
      : 0;
    return { ...cat, games, accuracy };
  });

  // Ear profile title
  const getProfileTitle = (score: number) => {
    if (score >= 90) return { title: 'Perfect Pitch Prodigy', emoji: '🎯', color: '#FFD60A' };
    if (score >= 75) return { title: 'Sharp Ear', emoji: '🎵', color: '#30D158' };
    if (score >= 55) return { title: 'Tuned Listener', emoji: '📻', color: '#0A84FF' };
    if (score >= 35) return { title: 'Rising Musician', emoji: '🎶', color: '#BF5AF2' };
    if (score >= 15) return { title: 'Eager Ear', emoji: '👂', color: '#FF9F0A' };
    return { title: 'New Listener', emoji: '🌱', color: 'var(--ios-label3)' };
  };

  const profile = getProfileTitle(earProfileScore);

  return (
    <div className="pb-tab" style={{ background: 'var(--ios-bg)', minHeight: '100dvh' }}>
      <div className="max-w-lg mx-auto px-4 pt-14">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <div style={{ fontSize: 13, color: 'var(--ios-label3)', letterSpacing: '-0.08px', marginBottom: 2 }}>
            Your ear profile
          </div>
          <h1 className="ios-large-title">Ear Profile</h1>
        </motion.div>

        {/* Profile score card */}
        <motion.div
          className="ios-card"
          style={{
            padding: 24,
            textAlign: 'center',
            background: `linear-gradient(135deg, ${profile.color}10 0%, ${profile.color}05 100%)`,
            border: `0.5px solid ${profile.color}25`,
            marginBottom: 12,
          }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.4 }}
        >
          <div style={{ fontSize: 52, marginBottom: 12, lineHeight: 1 }}>{profile.emoji}</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: profile.color, letterSpacing: '-0.5px', marginBottom: 4 }}>
            {loaded ? profile.title : '...'}
          </div>
          <div style={{ fontSize: 15, color: 'var(--ios-label2)', marginBottom: 16 }}>
            {loaded ? `Ear Profile Score: ${earProfileScore}/100` : 'Play games to discover your profile'}
          </div>

          {/* Score ring */}
          <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 16px' }}>
            <svg width={120} height={120} viewBox="0 0 120 120">
              <circle
                cx={60} cy={60} r={52}
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={8}
              />
              <circle
                cx={60} cy={60} r={52}
                fill="none"
                stroke={profile.color}
                strokeWidth={8}
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 52}
                strokeDashoffset={2 * Math.PI * 52 * (1 - earProfileScore / 100)}
                style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 32, fontWeight: 700, color: 'var(--ios-label)', letterSpacing: '-1px' }}>
                {loaded ? earProfileScore : '—'}
              </span>
              <span style={{ fontSize: 11, color: 'var(--ios-label3)' }}>Score</span>
            </div>
          </div>

          {/* Quick stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 8 }}>
            {[
              { label: 'Games', value: loaded ? String(totalGames) : '—' },
              { label: 'Streak', value: loaded ? String(stats.streak) : '—' },
              { label: 'Accuracy', value: loaded ? `${avgAccuracy}%` : '—' },
              { label: 'Time', value: loaded ? `${totalTimeMin}m` : '—' },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ios-label)', letterSpacing: '-0.5px' }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Category breakdown */}
        <div style={{ fontSize: 13, color: 'var(--ios-label3)', textTransform: 'uppercase', letterSpacing: '-0.08px', padding: '20px 4px 8px' }}>
          Skills Breakdown
        </div>

        <motion.div
          className="ios-group"
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
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ios-label)', letterSpacing: '-0.32px' }}>
                    {cat.label}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ios-label3)', marginTop: 2 }}>
                    {cat.desc} · {cat.games} games
                  </div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: cat.games > 0 ? cat.color : 'var(--ios-label3)' }}>
                  {cat.games > 0 ? `${cat.accuracy}%` : '—'}
                </div>
              </div>
              <div
                style={{
                  height: 6,
                  borderRadius: 3,
                  background: 'rgba(255,255,255,0.06)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    borderRadius: 3,
                    background: cat.color,
                    width: `${cat.accuracy}%`,
                    transition: 'width 0.8s ease-out',
                  }}
                />
              </div>
            </div>
          ))}
        </motion.div>

        {/* Tips card */}
        {loaded && totalGames > 0 && (
          <motion.div
            className="ios-card"
            style={{
              padding: 16,
              marginTop: 12,
              marginBottom: 8,
              background: 'rgba(10,132,255,0.06)',
              border: '0.5px solid rgba(10,132,255,0.12)',
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ios-blue)', marginBottom: 6 }}>
              Next Steps
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
          <motion.div
            className="ios-card"
            style={{ padding: '32px 20px', textAlign: 'center', marginTop: 12, marginBottom: 8 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>👂</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ios-label)', letterSpacing: '-0.23px', marginBottom: 6 }}>
              Discover Your Ear Profile
            </div>
            <div style={{ fontSize: 13, color: 'var(--ios-label3)', letterSpacing: '-0.08px', marginBottom: 16 }}>
              Play games to unlock your personalized ear training profile.
            </div>
            <Link
              href="/dashboard"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                height: 44, borderRadius: 12, padding: '0 24px',
                background: 'var(--ios-blue)', color: '#fff',
                fontSize: 15, fontWeight: 600, textDecoration: 'none',
              }}
            >
              Start Training
            </Link>
          </motion.div>
        )}

        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}
