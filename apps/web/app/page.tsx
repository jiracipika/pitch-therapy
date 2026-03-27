import Link from 'next/link';

const MODES = [
  { id: 'pitch-match', label: 'Pitch Match', icon: '🎤', color: 'blue', desc: 'Match a target pitch with your voice', href: '/play/pitch-match' },
  { id: 'note-id', label: 'Note ID', icon: '🎵', color: 'violet', desc: 'Identify notes by ear', href: '/play/note-id' },
  { id: 'frequency-guess', label: 'Frequency Guess', icon: '🎯', color: 'amber', desc: 'Guess the frequency of a tone', href: '/play/frequency-guess' },
  { id: 'note-wordle', label: 'Note Wordle', icon: '🟩', color: 'green', desc: 'Wordle-style note identification', href: '/play/note-wordle' },
  { id: 'frequency-wordle', label: 'Frequency Wordle', icon: '🔵', color: 'teal', desc: 'Wordle-style frequency guessing', href: '/play/frequency-wordle' },
];

const colorMap: Record<string, { border: string; bg: string; text: string; hover: string }> = {
  blue: { border: 'border-blue-500/30', bg: 'bg-blue-500/10', text: 'text-blue-500', hover: 'hover:border-blue-500/60' },
  violet: { border: 'border-violet-500/30', bg: 'bg-violet-500/10', text: 'text-violet-500', hover: 'hover:border-violet-500/60' },
  amber: { border: 'border-amber-500/30', bg: 'bg-amber-500/10', text: 'text-amber-500', hover: 'hover:border-amber-500/60' },
  green: { border: 'border-green-500/30', bg: 'bg-green-500/10', text: 'text-green-500', hover: 'hover:border-green-500/60' },
  teal: { border: 'border-teal-500/30', bg: 'bg-teal-500/10', text: 'text-teal-500', hover: 'hover:border-teal-500/60' },
};

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <div className="relative mb-6">
          <span className="animate-float absolute -left-8 -top-4 text-4xl opacity-60">♪</span>
          <span className="animate-float-delay absolute -right-6 top-0 text-3xl opacity-40">♫</span>
          <span className="animate-float-delay-2 absolute -left-4 bottom-0 text-2xl opacity-50">♬</span>
          <h1 className="text-5xl font-extrabold tracking-tight md:text-7xl">
            Pitch <span className="text-blue-500">Therapy</span>
          </h1>
        </div>
        <p className="mb-8 max-w-md text-lg text-zinc-400">
          Train Your Ear. Every Day.
        </p>
        <div className="flex gap-4">
          <Link
            href="/dashboard"
            className="rounded-xl bg-blue-500 px-8 py-3 font-bold text-white transition-all hover:bg-blue-600 hover:scale-105"
          >
            Start Training 🎯
          </Link>
          <Link
            href="/daily"
            className="rounded-xl border border-zinc-700 px-8 py-3 font-medium text-zinc-300 transition-all hover:border-zinc-500 hover:text-white"
          >
            Daily Challenge 📅
          </Link>
        </div>
      </section>

      {/* Mode Cards */}
      <section className="mx-auto max-w-4xl px-4 pb-8">
        <h2 className="mb-6 text-center text-2xl font-bold">Five Modes. One Goal.</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODES.map((m) => {
            const c = colorMap[m.color] ?? { border: '', bg: '', text: '', hover: '' };
            return (
              <Link
                key={m.id}
                href={m.href}
                className={`group rounded-xl border ${c.border} ${c.hover} ${c.bg} p-5 transition-all hover:scale-[1.02]`}
              >
                <div className="mb-2 text-3xl">{m.icon}</div>
                <h3 className={`text-lg font-bold ${c.text}`}>{m.label}</h3>
                <p className="mt-1 text-sm text-zinc-400">{m.desc}</p>
                <div className="mt-4 text-sm font-medium text-zinc-300 transition-colors group-hover:text-white">
                  Play →
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Daily CTA */}
      <section className="mx-auto max-w-md px-4 py-12 text-center">
        <div className="rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 p-8">
          <div className="mb-3 text-4xl">🔥</div>
          <h2 className="text-2xl font-bold">Daily Challenge</h2>
          <p className="mt-2 text-zinc-400">
            A fresh challenge every day. Can you keep your streak alive?
          </p>
          <Link
            href="/daily"
            className="mt-6 inline-block rounded-xl bg-zinc-100 px-8 py-3 font-bold text-zinc-950 transition-all hover:scale-105"
          >
            Today&apos;s Challenge →
          </Link>
        </div>
      </section>
    </div>
  );
}
