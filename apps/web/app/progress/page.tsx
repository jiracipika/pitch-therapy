'use client';

import { motion } from 'framer-motion';
import { useStatsContext } from '@/components/StatsProvider';
import Link from 'next/link';

const MODES = [
  { id: 'pitch-match',      label: 'Pitch Match',      icon: '🎤', color: '#0A84FF' },
  { id: 'note-id',          label: 'Note ID',           icon: '🎵', color: '#BF5AF2' },
  { id: 'frequency-guess',  label: 'Freq Guess',        icon: '📡', color: '#FF9F0A' },
  { id: 'note-wordle',      label: 'Note Wordle',       icon: '🟩', color: '#30D158' },
  { id: 'frequency-wordle', label: 'Freq Wordle',       icon: '🔊', color: '#5AC8FA' },
  { id: 'pitch-memory',     label: 'Pitch Memory',      icon: '🧠', color: '#FF375F' },
  { id: 'name-that-note',   label: 'Name That Note',    icon: '🎼', color: '#32ADE6' },
  { id: 'frequency-hunt',   label: 'Freq Hunt',         icon: '🔍', color: '#FF9F0A' },
  { id: 'drone-lock',       label: 'Drone Lock',        icon: '🔒', color: '#63E6E2' },
  { id: 'speed-round',      label: 'Speed Round',       icon: '⚡', color: '#FF9F0A' },
  { id: 'chord-detective',  label: 'Chord Detective',   icon: '🕵️', color: '#FF375F' },
  { id: 'waveform-match',   label: 'Waveform Match',    icon: '〰️', color: '#5E5CE6' },
  { id: 'tuning-battle',    label: 'Tuning Battle',     icon: '⚔️', color: '#FF453A' },
  { id: 'tune-in',          label: 'Tune In',           icon: '📻', color: '#FF375F' },
  { id: 'piano-tap',        label: 'Piano Tap',         icon: '🎹', color: '#5E5CE6' },
  { id: 'frequency-slider', label: 'Freq Slider',       icon: '🎚️', color: '#5AC8FA' },
  { id: 'cents-deviation',  label: 'Cents Deviation',   icon: '📐', color: '#30D158' },
  { id: 'interval-archer',  label: 'Interval Archer',   icon: '🏹', color: '#BF5AF2' },
];

const WEEKS = 12;
const DAYS = 7;
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function ProgressPage() {
  const { stats, loaded, getModeStats } = useStatsContext();

  // Build activity map: date -> count
  const activityMap: Record<string, number> = {};
  stats.results.forEach((r) => {
    const day = r.date.slice(0, 10);
    activityMap[day] = (activityMap[day] || 0) + 1;
  });
  const maxActivity = Math.max(1, ...Object.values(activityMap));

  // Build grid data (last 12 weeks)
  const today = new Date();
  const gridDays: { date: string; count: number; future: boolean }[] = [];
  for (let w = WEEKS - 1; w >= 0; w--) {
    for (let d = 0; d < DAYS; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (w * 7 + ((today.getDay() + 6) % 7) - d));
      const dateStr = date.toISOString().slice(0, 10);
      gridDays.push({
        date: dateStr,
        count: activityMap[dateStr] || 0,
        future: date > today,
      });
    }
  }

  // Find the most played mode
  const modePlayCounts = MODES.map((m) => {
    const ms = getModeStats(m.id);
    return { ...m, ...ms };
  }).sort((a, b) => b.gamesPlayed - a.gamesPlayed);

  const totalGames = stats.results.length;
  const avgAccuracy = totalGames > 0
    ? Math.round((stats.results.reduce((s, r) => s + r.accuracy, 0) / totalGames) * 100)
    : 0;
  const totalTimeMin = Math.round(stats.results.reduce((s, r) => s + r.timeMs, 0) / 60000);

  return (
    <div className="pb-tab" style={{ background: 'var(--ios-bg)', minHeight: '100dvh' }}>
      <div className="max-w-lg mx-auto px-4 pt-14">

        {/* ── HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <div style={{ fontSize: 13, color: 'var(--ios-label3)', letterSpacing: '-0.08px', marginBottom: 2 }}>
            Your journey
          </div>
          <h1 className="ios-large-title">Progress</h1>
        </motion.div>

        {/* ── SUMMARY STATS ── */}
        <motion.div
          className="grid grid-cols-4 gap-2 mb-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.4 }}
        >
          {[
            { label: 'Games', value: loaded ? String(totalGames) : '—', color: 'var(--ios-blue)' },
            { label: 'Best Streak', value: loaded ? String(stats.bestStreak) : '—', color: 'var(--ios-orange)' },
            { label: 'Avg Acc', value: loaded ? `${avgAccuracy}%` : '—', color: 'var(--ios-green)' },
            { label: 'Time', value: loaded ? `${totalTimeMin}m` : '—', color: 'var(--ios-purple)' },
          ].map((s) => (
            <div
              key={s.label}
              className="ios-card"
              style={{ padding: '12px 8px', textAlign: 'center' }}
            >
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', color: s.color, lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 10, color: 'var(--ios-label3)', marginTop: 4, letterSpacing: '-0.08px', lineHeight: 1.3 }}>
                {s.label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* ── ACTIVITY CALENDAR ── */}
        <div style={{ fontSize: 13, color: 'var(--ios-label3)', textTransform: 'uppercase', letterSpacing: '-0.08px', padding: '20px 4px 8px' }}>
          Activity (Last 12 Weeks)
        </div>

        <motion.div
          className="ios-card"
          style={{ padding: '16px', overflowX: 'auto' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.4 }}
        >
          {/* Day labels */}
          <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
            {DAY_LABELS.map((d, i) => (
              <div key={i} style={{ width: 14, textAlign: 'center', fontSize: 9, fontWeight: 600, color: 'var(--ios-label3)', letterSpacing: 0.3 }}>
                {d}
              </div>
            ))}
          </div>

          {/* Grid — columns = weeks */}
          <div style={{ display: 'flex', gap: 3 }}>
            {Array.from({ length: WEEKS }).map((_, w) => (
              <div key={w} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {Array.from({ length: DAYS }).map((_, d) => {
                  const cell = gridDays[w * DAYS + d];
                  const intensity = cell?.future ? 0 : cell?.count
                    ? Math.max(0.15, cell.count / maxActivity)
                    : 0;
                  return (
                    <div
                      key={d}
                      title={cell ? `${cell.date}: ${cell.count} games` : ''}
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 3,
                        background: intensity === 0
                          ? 'rgba(255,255,255,0.04)'
                          : `rgba(10, 132, 255, ${intensity})`,
                        transition: 'background 0.3s ease',
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 10 }}>
            <span style={{ fontSize: 10, color: 'var(--ios-label3)' }}>Less</span>
            {[0, 0.15, 0.35, 0.6, 0.85].map((i) => (
              <div key={i} style={{ width: 12, height: 12, borderRadius: 2, background: `rgba(10,132,255,${i || 0.04})` }} />
            ))}
            <span style={{ fontSize: 10, color: 'var(--ios-label3)' }}>More</span>
          </div>
        </motion.div>

        {/* ── FAVORITE MODE ── */}
        {loaded && totalGames > 0 && modePlayCounts[0].gamesPlayed > 0 && (
          <motion.div
            className="ios-card"
            style={{
              padding: 20,
              marginTop: 12,
              background: `linear-gradient(135deg, ${modePlayCounts[0].color}12 0%, ${modePlayCounts[0].color}06 100%)`,
              border: `0.5px solid ${modePlayCounts[0].color}20`,
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.4 }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--ios-label3)', marginBottom: 8 }}>
              Most Played
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 32 }}>{modePlayCounts[0].icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--ios-label)', letterSpacing: '-0.4px' }}>
                  {modePlayCounts[0].label}
                </div>
                <div style={{ fontSize: 13, color: 'var(--ios-label2)', marginTop: 2 }}>
                  {modePlayCounts[0].gamesPlayed} games · {Math.round(modePlayCounts[0].avgAccuracy * 100)}% avg accuracy
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: modePlayCounts[0].color }}>{modePlayCounts[0].bestScore}</div>
                <div style={{ fontSize: 11, color: 'var(--ios-label3)' }}>Best</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── PER MODE ── */}
        <div style={{ fontSize: 13, color: 'var(--ios-label3)', textTransform: 'uppercase', letterSpacing: '-0.08px', padding: '24px 4px 8px' }}>
          Per Mode
        </div>

        <motion.div
          className="ios-group"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          {MODES.map((m, idx) => {
            const ms = getModeStats(m.id);
            const progressPct = ms.gamesPlayed > 0 ? Math.min(100, Math.round(ms.avgAccuracy * 100)) : 0;

            return (
              <div
                key={m.id}
                className="ios-row"
                style={{
                  padding: '14px 16px',
                  borderTop: idx === 0 ? 'none' : '0.5px solid var(--ios-sep)',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  gap: 0,
                }}
              >
                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: ms.gamesPlayed > 0 ? 10 : 0 }}>
                  <Link href={`/play/${m.id}`} style={{ display: 'flex', alignItems: 'center', flex: 1, textDecoration: 'none' }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 9,
                        background: `${m.color}18`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        marginRight: 12,
                        flexShrink: 0,
                      }}
                    >
                      {m.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--ios-label)', letterSpacing: '-0.32px' }}>
                        {m.label}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--ios-label3)', marginTop: 1 }}>
                        {ms.gamesPlayed > 0
                          ? `${ms.gamesPlayed} game${ms.gamesPlayed !== 1 ? 's' : ''} · ${Math.round(ms.avgAccuracy * 100)}% accuracy`
                          : 'Not played yet'}
                      </div>
                    </div>
                  </Link>
                  {ms.gamesPlayed > 0 && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ios-label2)' }}>{ms.bestScore}</div>
                      <div style={{ fontSize: 11, color: 'var(--ios-label3)' }}>Best</div>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                {ms.gamesPlayed > 0 && (
                  <div className="ios-progress-track">
                    <div
                      className="ios-progress-fill"
                      style={{ width: `${progressPct}%`, background: m.color, transition: 'width 0.6s ease-out' }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </motion.div>

        {/* ── RECENT RESULTS ── */}
        {loaded && stats.results.length > 0 && (
          <>
            <div style={{ fontSize: 13, color: 'var(--ios-label3)', textTransform: 'uppercase', letterSpacing: '-0.08px', padding: '24px 4px 8px' }}>
              Recent Games
            </div>
            <div className="ios-group">
              {stats.results.slice(-10).reverse().map((r, idx) => {
                const mode = MODES.find((m) => m.id === r.mode);
                return (
                  <div
                    key={idx}
                    className="ios-row"
                    style={{
                      padding: '12px 16px',
                      borderTop: idx === 0 ? 'none' : '0.5px solid var(--ios-sep)',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: `${mode?.color || '#888'}18`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, marginRight: 10, flexShrink: 0,
                      }}
                    >
                      {mode?.icon || '🎵'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ios-label)' }}>{mode?.label || r.mode}</div>
                      <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 1 }}>
                        {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        {' · '}{r.rounds} rounds
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ios-label)' }}>{r.score}</div>
                      <div style={{ fontSize: 11, color: Math.round(r.accuracy * 100) >= 70 ? 'var(--ios-green)' : 'var(--ios-orange)' }}>
                        {Math.round(r.accuracy * 100)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── EMPTY STATE ── */}
        {loaded && totalGames === 0 && (
          <motion.div
            className="ios-card"
            style={{ padding: '32px 20px', textAlign: 'center', marginTop: 12, marginBottom: 8 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ios-label)', letterSpacing: '-0.23px', marginBottom: 6 }}>
              No data yet
            </div>
            <div style={{ fontSize: 13, color: 'var(--ios-label3)', letterSpacing: '-0.08px', marginBottom: 16 }}>
              Play games to see your progress charts here.
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
