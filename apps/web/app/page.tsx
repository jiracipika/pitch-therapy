'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const MODES = [
  {
    id: 'pitch-match',
    label: 'Pitch Match',
    color: '#60A5FA',
    desc: 'Match a target pitch with your voice and tune your ear in real time.',
    href: '/play/pitch-match',
    practiceHref: '/play/pitch-match?practice=true',
  },
  {
    id: 'note-id',
    label: 'Note ID',
    color: '#A78BFA',
    desc: 'Hear a note and identify it by ear across increasing difficulty.',
    href: '/play/note-id',
    practiceHref: '/play/note-id?practice=true',
  },
  {
    id: 'frequency-guess',
    label: 'Frequency Guess',
    color: '#FBBF24',
    desc: 'Guess the exact frequency of a pure tone within a sliding range.',
    href: '/play/frequency-guess',
    practiceHref: '/play/frequency-guess?practice=true',
  },
  {
    id: 'note-wordle',
    label: 'Note Wordle',
    color: '#4ADE80',
    desc: 'Six attempts to identify a mystery note. Hot and cold feedback.',
    href: '/play/note-wordle',
    practiceHref: '/play/note-wordle?practice=true',
  },
  {
    id: 'frequency-wordle',
    label: 'Frequency Wordle',
    color: '#2DD4BF',
    desc: 'Hunt for an unknown frequency in six guesses with directional hints.',
    href: '/play/frequency-wordle',
    practiceHref: '/play/frequency-wordle?practice=true',
  },
  {
    id: 'pitch-memory',
    label: 'Pitch Memory',
    color: '#F43F5E',
    desc: 'Listen to note sequences and reproduce them on the piano. Ramps up in difficulty.',
    href: '/play/pitch-memory',
    practiceHref: '/play/pitch-memory?practice=true',
  },
  {
    id: 'name-that-note',
    label: 'Name That Note',
    color: '#0EA5E9',
    desc: 'Read notes on the musical staff and identify them by tapping the right key.',
    href: '/play/name-that-note',
    practiceHref: '/play/name-that-note?practice=true',
  },
  {
    id: 'frequency-hunt',
    label: 'Frequency Hunt',
    color: '#F97316',
    desc: 'Scrub a log-scale bar to find the exact frequency of a sine wave by ear.',
    href: '/play/frequency-hunt',
    practiceHref: '/play/frequency-hunt?practice=true',
  },
  {
    id: 'drone-lock',
    label: 'Drone Lock',
    color: '#10B981',
    desc: 'Sing intervals relative to a continuous drone. Real-time tuning meter feedback.',
    href: '/play/drone-lock',
    practiceHref: '/play/drone-lock?practice=true',
  },
  {
    id: 'speed-round',
    label: 'Speed Round',
    color: '#FB923C',
    desc: 'Notes flash on screen — tap the piano keyboard as fast and accurately as possible in a 30s or 60s sprint.',
    href: '/play/speed-round',
    practiceHref: '/play/speed-round?practice=true',
  },
  {
    id: 'chord-detective',
    label: 'Chord Detective',
    color: '#F472B6',
    desc: 'A chord plays — identify its quality (major, minor, dim, aug, 7ths). Advanced mode also finds the root.',
    href: '/play/chord-detective',
    practiceHref: '/play/chord-detective?practice=true',
  },
  {
    id: 'waveform-match',
    label: 'Waveform Match',
    color: '#818CF8',
    desc: 'Two waveforms side by side — one target, one detuned. Identify sharp/flat and drag a slider to align.',
    href: '/play/waveform-match',
    practiceHref: '/play/waveform-match?practice=true',
  },
  {
    id: 'tuning-battle',
    label: 'Tuning Battle',
    color: '#F43F5E',
    desc: 'Two players on one device race to lock in the correct note. Best of 5 or 10 rounds wins.',
    href: '/play/tuning-battle',
    practiceHref: '/play/tuning-battle?practice=true',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen pb-12">
      {/* Floating musical note symbols */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden select-none" aria-hidden>
        <span className="animate-note-1 absolute left-[8%] top-[18%] text-5xl text-zinc-800/60 font-serif">♪</span>
        <span className="animate-note-2 absolute left-[78%] top-[12%] text-4xl text-zinc-800/50 font-serif">♫</span>
        <span className="animate-note-3 absolute left-[22%] top-[58%] text-6xl text-zinc-800/40 font-serif">♬</span>
        <span className="animate-note-2 absolute left-[68%] top-[48%] text-5xl text-zinc-800/50 font-serif">♩</span>
        <span className="animate-note-1 absolute left-[48%] top-[75%] text-4xl text-zinc-800/40 font-serif">♪</span>
        <span className="animate-note-3 absolute left-[88%] top-[65%] text-3xl text-zinc-800/30 font-serif">♫</span>
      </div>

      {/* ── HERO ── */}
      <section className="relative flex min-h-[92vh] flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/4 px-4 py-1.5 backdrop-blur-xl"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#60A5FA]" style={{ boxShadow: '0 0 6px #60A5FA' }} />
          <span className="text-xs font-medium tracking-wide text-zinc-400">Ear Training, Reimagined</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="gradient-text text-6xl font-bold md:text-8xl"
          style={{ letterSpacing: '-0.04em', lineHeight: 1.0 }}
        >
          Train Your Ear.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 max-w-sm text-lg text-zinc-500"
          style={{ letterSpacing: '-0.01em', lineHeight: 1.6 }}
        >
          A daily gym for your ears. Five modes. Infinite growth.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <Link href="/dashboard" className="btn-primary">
            Start Training
          </Link>
          <Link href="/daily" className="btn-secondary">
            Daily Challenge
          </Link>
        </motion.div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
          <div className="h-8 w-px bg-gradient-to-b from-transparent to-white/40" />
        </div>
      </section>

      {/* ── MODE CARDS ── */}
      <section className="mx-auto max-w-4xl px-5 pb-10">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.1em] text-zinc-600"
        >
          Nine Modes
        </motion.div>
        <motion.h3
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-10 text-center text-2xl font-semibold text-white"
          style={{ letterSpacing: '-0.025em' }}
        >
          One goal: perfect pitch.
        </motion.h3>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MODES.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                href={m.href}
                className="glass-card group relative overflow-hidden p-6 block transition-all duration-300 ease-out hover:scale-[1.02]"
              >
                <div
                  className="absolute right-4 top-4 h-2 w-2 rounded-full"
                  style={{ backgroundColor: m.color, boxShadow: `0 0 8px ${m.color}80` }}
                />

                <h3
                  className="text-base font-semibold"
                  style={{ letterSpacing: '-0.02em', color: m.color }}
                >
                  {m.label}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{m.desc}</p>

                <div className="mt-5 flex items-center gap-1 text-xs font-medium text-zinc-600 transition-colors duration-200 group-hover:text-zinc-400">
                  <span>Play now</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-200 group-hover:translate-x-0.5">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>

                {/* Practice mode link */}
                <div className="mt-3 flex items-center gap-1 text-[10px] font-medium text-zinc-700 transition-colors duration-200 group-hover:text-zinc-500">
                  <span>🎓 Practice mode</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── DAILY CTA ── */}
      <section className="mx-auto max-w-md px-5 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="glass-card p-8 text-center"
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.15)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
            </svg>
          </div>

          <h2 className="text-xl font-semibold text-white" style={{ letterSpacing: '-0.025em' }}>
            Daily Challenge
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            A fresh challenge every day. Can you keep your streak alive?
          </p>
          <Link href="/daily" className="btn-primary mt-6 inline-flex">
            Today&apos;s Challenge
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
