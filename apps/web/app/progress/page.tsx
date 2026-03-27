'use client';

const MODES = [
  { id: 'pitch-match', label: 'Pitch Match', icon: '🎤', color: 'blue' },
  { id: 'note-id', label: 'Note ID', icon: '🎵', color: 'violet' },
  { id: 'frequency-guess', label: 'Frequency Guess', icon: '🎯', color: 'amber' },
  { id: 'note-wordle', label: 'Note Wordle', icon: '🟩', color: 'green' },
  { id: 'frequency-wordle', label: 'Frequency Wordle', icon: '🔵', color: 'teal' },
];

const colorBorder: Record<string, string> = {
  blue: 'border-l-[#60A5FA]', violet: 'border-l-[#A78BFA]', amber: 'border-l-[#FBBF24]',
  green: 'border-l-[#4ADE80]', teal: 'border-l-[#2DD4BF]',
};

export default function ProgressPage() {
  return (
    <div className="min-h-screen px-4 pt-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-semibold tracking-tight text-white">📊 Progress</h1>
        <p className="mt-1 text-zinc-500">Track your ear training journey</p>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="glass-card p-6 text-center"><div className="text-2xl font-bold text-white">0</div><div className="text-xs text-zinc-500">Games</div></div>
          <div className="glass-card p-6 text-center"><div className="text-2xl font-bold text-white">0</div><div className="text-xs text-zinc-500">Best Streak</div></div>
          <div className="glass-card p-6 text-center"><div className="text-2xl font-bold text-white">—</div><div className="text-xs text-zinc-500">Accuracy</div></div>
        </div>

        <h2 className="mt-10 text-xl font-semibold tracking-tight text-white">Per Mode</h2>
        <div className="mt-4 space-y-3">
          {MODES.map((m) => (
            <div key={m.id} className={`glass-card border-l-4 ${colorBorder[m.color]} p-5`}>
              <div className="flex items-center gap-4">
                <span className="text-2xl">{m.icon}</span>
                <div className="flex-1">
                  <h3 className="font-semibold tracking-tight text-white">{m.label}</h3>
                  <div className="mt-1 text-xs text-zinc-500">0 games • — accuracy</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-white">—</div>
                  <div className="text-xs text-zinc-600">Best</div>
                </div>
              </div>
              <div className="mt-3 h-16 rounded-2xl bg-white/[0.02] flex items-center justify-center">
                <span className="text-xs text-zinc-700">📊 Chart coming soon</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 glass-card p-8 text-center">
          <p className="text-zinc-500">Play games to see your progress here!</p>
          <p className="mt-1 text-xs text-zinc-700">Charts and detailed stats coming soon.</p>
        </div>
      </div>
    </div>
  );
}
