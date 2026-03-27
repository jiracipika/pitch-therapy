'use client';

const MODES = [
  { id: 'pitch-match', label: 'Pitch Match', color: '#60A5FA' },
  { id: 'note-id', label: 'Note ID', color: '#A78BFA' },
  { id: 'frequency-guess', label: 'Frequency Guess', color: '#FBBF24' },
  { id: 'note-wordle', label: 'Note Wordle', color: '#4ADE80' },
  { id: 'frequency-wordle', label: 'Frequency Wordle', color: '#2DD4BF' },
];

// 7 columns × 5 rows activity grid (35 cells)
const WEEKS = 5;
const DAYS = 7;

export default function ProgressPage() {
  return (
    <div className="min-h-screen pb-nav px-4 pt-12">
      <div className="mx-auto max-w-lg">

        {/* ── HEADER ── */}
        <div className="mb-8">
          <p className="text-sm font-medium text-zinc-600" style={{ letterSpacing: '0.01em' }}>
            Your journey
          </p>
          <h1
            className="mt-0.5 text-3xl font-semibold text-white"
            style={{ letterSpacing: '-0.03em' }}
          >
            Progress
          </h1>
        </div>

        {/* ── SUMMARY STATS ── */}
        <div className="grid grid-cols-3 gap-2.5 mb-8">
          {[
            { label: 'Games Played', value: '0' },
            { label: 'Best Streak', value: '0' },
            { label: 'Avg Accuracy', value: '—' },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div
                className="text-2xl font-bold text-white"
                style={{ letterSpacing: '-0.03em' }}
              >
                {s.value}
              </div>
              <div className="mt-1 text-[11px] text-zinc-600 leading-tight">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── ACTIVITY CALENDAR ── */}
        <p className="section-header">Activity</p>
        <div className="glass-card p-5 mb-8">
          <div className="flex gap-1 mb-3">
            {(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']).map((d) => (
              <div key={d} className="flex-1 text-center text-[9px] font-medium text-zinc-700">{d}</div>
            ))}
          </div>
          <div className="space-y-1.5">
            {Array.from({ length: WEEKS }).map((_, w) => (
              <div key={w} className="flex gap-1">
                {Array.from({ length: DAYS }).map((_, d) => (
                  <div
                    key={d}
                    className="activity-cell flex-1"
                    style={{ height: '12px', borderRadius: '3px' }}
                  />
                ))}
              </div>
            ))}
          </div>
          <p className="mt-3 text-right text-[10px] text-zinc-700">Play games to fill this in</p>
        </div>

        {/* ── PER MODE BREAKDOWN ── */}
        <p className="section-header">Per Mode</p>
        <div className="space-y-2.5">
          {MODES.map((m) => (
            <div key={m.id} className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${m.color}12`, border: `1px solid ${m.color}22` }}
                  >
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: m.color }}
                    />
                  </div>
                  <div>
                    <h3
                      className="text-sm font-semibold text-white"
                      style={{ letterSpacing: '-0.01em' }}
                    >
                      {m.label}
                    </h3>
                    <p className="text-[11px] text-zinc-600">0 games · — accuracy</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-zinc-500">—</div>
                  <div className="text-[10px] text-zinc-700">Best</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{ width: '0%', backgroundColor: m.color }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* ── EMPTY STATE ── */}
        <div className="mt-8 glass-card p-8 text-center">
          <div
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(113,113,122)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
          </div>
          <p className="text-sm font-medium text-zinc-500">Play games to see your progress here.</p>
          <p className="mt-1 text-xs text-zinc-700">Detailed charts and stats coming soon.</p>
        </div>

      </div>
    </div>
  );
}
