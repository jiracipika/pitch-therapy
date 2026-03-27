import Link from 'next/link';

const MODES = [
  { id: 'pitch-match', label: 'Pitch Match', icon: '🎤', color: 'blue', desc: 'Match a target pitch with your voice', href: '/play/pitch-match' },
  { id: 'note-id', label: 'Note ID', icon: '🎵', color: 'violet', desc: 'Identify notes by ear', href: '/play/note-id' },
  { id: 'frequency-guess', label: 'Frequency Guess', icon: '🎯', color: 'amber', desc: 'Guess the frequency of a tone', href: '/play/frequency-guess' },
  { id: 'note-wordle', label: 'Note Wordle', icon: '🟩', color: 'green', desc: 'Wordle-style note identification', href: '/play/note-wordle' },
  { id: 'frequency-wordle', label: 'Frequency Wordle', icon: '🔵', color: 'teal', desc: 'Wordle-style frequency guessing', href: '/play/frequency-wordle' },
];

const colorMap: Record<string, { border: string; accent: string; text: string }> = {
  blue: { border: 'border-l-[#60A5FA]', accent: '#60A5FA', text: 'text-[#60A5FA]' },
  violet: { border: 'border-l-[#A78BFA]', accent: '#A78BFA', text: 'text-[#A78BFA]' },
  amber: { border: 'border-l-[#FBBF24]', accent: '#FBBF24', text: 'text-[#FBBF24]' },
  green: { border: 'border-l-[#4ADE80]', accent: '#4ADE80', text: 'text-[#4ADE80]' },
  teal: { border: 'border-l-[#2DD4BF]', accent: '#2DD4BF', text: 'text-[#2DD4BF]' },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-black">
      {/* Floating Music Notes */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <span className="animate-note-1 absolute left-[10%] top-[20%] text-3xl text-zinc-600">♪</span>
        <span className="animate-note-2 absolute left-[80%] top-[15%] text-2xl text-zinc-700">♫</span>
        <span className="animate-note-3 absolute left-[25%] top-[60%] text-4xl text-zinc-700">♬</span>
        <span className="animate-note-2 absolute left-[70%] top-[50%] text-3xl text-zinc-600">♩</span>
        <span className="animate-note-1 absolute left-[50%] top-[80%] text-2xl text-zinc-700">♪</span>
      </div>

      {/* Hero */}
      <section className="relative flex min-h-[75vh] flex-col items-center justify-center px-4 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-white md:text-7xl">
          Train Your Ear.
        </h1>
        <p className="mt-4 max-w-md text-lg text-zinc-400">
          A daily gym for your ears. Five modes. Infinite growth.
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            href="/dashboard"
            className="rounded-full bg-white px-6 py-2.5 font-semibold text-black transition-all duration-300 ease-out hover:bg-zinc-200 hover:scale-105"
          >
            Start Training
          </Link>
          <Link
            href="/daily"
            className="rounded-full border border-white/10 bg-white/5 px-6 py-2.5 font-medium text-zinc-300 transition-all duration-300 ease-out hover:bg-white/10 hover:text-white backdrop-blur-xl"
          >
            Daily Challenge
          </Link>
        </div>
      </section>

      {/* Mode Cards */}
      <section className="mx-auto max-w-5xl px-4 pb-12">
        <h2 className="mb-8 text-center text-2xl font-semibold tracking-tight text-white">
          Five modes. One goal.
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODES.map((m) => {
            const c = colorMap[m.color] ?? { border: '', accent: '', text: '' };
            return (
              <Link
                key={m.id}
                href={m.href}
                className={`glass-card border-l-4 ${c.border} group p-6 transition-all duration-300 ease-out hover:scale-[1.02]`}
              >
                <div className="mb-3 text-3xl">{m.icon}</div>
                <h3 className={`text-lg font-semibold tracking-tight ${c.text}`}>{m.label}</h3>
                <p className="mt-1 text-sm text-zinc-500">{m.desc}</p>
                <div className="mt-4 text-sm font-medium text-zinc-500 transition-colors duration-300 group-hover:text-zinc-300">
                  Play →
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Daily CTA */}
      <section className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="glass-card p-8">
          <div className="mb-3 text-4xl">🔥</div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">Daily Challenge</h2>
          <p className="mt-2 text-zinc-500">
            A fresh challenge every day. Can you keep your streak alive?
          </p>
          <Link
            href="/daily"
            className="mt-6 inline-block rounded-full bg-white px-6 py-2.5 font-semibold text-black transition-all duration-300 ease-out hover:bg-zinc-200 hover:scale-105"
          >
            Today&apos;s Challenge →
          </Link>
        </div>
      </section>
    </div>
  );
}
