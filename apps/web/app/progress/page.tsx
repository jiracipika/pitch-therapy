'use client';

const MODES = [
  { id: 'pitch-match', label: 'Pitch Match', icon: '🎤', color: 'blue' },
  { id: 'note-id', label: 'Note ID', icon: '🎵', color: 'violet' },
  { id: 'frequency-guess', label: 'Frequency Guess', icon: '🎯', color: 'amber' },
  { id: 'note-wordle', label: 'Note Wordle', icon: '🟩', color: 'green' },
  { id: 'frequency-wordle', label: 'Frequency Wordle', icon: '🔵', color: 'teal' },
];

const colorBorder: Record<string, string> = {
  blue: 'border-blue-500/30', violet: 'border-violet-500/30', amber: 'border-amber-500/30',
  green: 'border-green-500/30', teal: 'border-teal-500/30',
};

export default function ProgressPage() {
  return (
    <div className="min-h-screen px-4 pt-8">
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl font-bold">📊 Progress</h1>
        <p className="mt-1 text-zinc-400">Track your ear training journey</p>

        {/* Stats Overview */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 text-center">
            <div className="text-2xl font-bold">0</div>
            <div className="text-xs text-zinc-400">Games</div>
          </div>
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 text-center">
            <div className="text-2xl font-bold">0</div>
            <div className="text-xs text-zinc-400">Best Streak</div>
          </div>
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 text-center">
            <div className="text-2xl font-bold">—</div>
            <div className="text-xs text-zinc-400">Accuracy</div>
          </div>
        </div>

        {/* Per-mode breakdown */}
        <h2 className="mt-8 text-xl font-bold">Per Mode</h2>
        <div className="mt-4 space-y-3">
          {MODES.map((m) => (
            <div key={m.id} className={`rounded-xl border ${colorBorder[m.color]} bg-zinc-900 p-4`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{m.icon}</span>
                <div className="flex-1">
                  <h3 className="font-bold">{m.label}</h3>
                  <div className="mt-1 text-xs text-zinc-400">0 games • — accuracy</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">—</div>
                  <div className="text-xs text-zinc-500">Best</div>
                </div>
              </div>
              {/* Chart placeholder */}
              <div className="mt-3 h-16 rounded-lg bg-zinc-800/50 flex items-center justify-center">
                <span className="text-xs text-zinc-600">📊 Chart coming soon</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center">
          <p className="text-zinc-400">Play games to see your progress here!</p>
          <p className="mt-1 text-xs text-zinc-600">Charts and detailed stats coming soon.</p>
        </div>
      </div>
    </div>
  );
}
