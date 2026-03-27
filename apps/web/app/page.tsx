import Link from "next/link";
import { GAME_MODE_META, type GameMode } from "@pitch-therapy/core";

const modeOrder: GameMode[] = [
  "pitch-match", "note-id", "frequency-guess", "note-wordle", "frequency-wordle",
];

export default function LandingPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-20 px-6 py-20">
      {/* Hero */}
      <section className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-5xl font-black tracking-tight sm:text-7xl">
          Pitch <span className="text-blue-500">Therapy</span>
        </h1>
        <p className="max-w-2xl text-lg text-zinc-400">
          Five game modes. Daily challenges. Streaks and stats. The ear training gym
          that actually makes you better.
        </p>
        <Link
          href="/dashboard"
          className="rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white transition hover:bg-blue-500"
        >
          Start Training
        </Link>
      </section>

      {/* Mode Breakdown */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {modeOrder.map((mode) => {
          const meta = GAME_MODE_META[mode];
          return (
            <Link
              key={mode}
              href={`/play/${mode}`}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition hover:border-zinc-700"
            >
              <h3 className={`text-xl font-bold ${meta.color}`}>{meta.label}</h3>
              <p className="mt-2 text-sm text-zinc-400">{meta.description}</p>
              <span
                className="mt-4 inline-block h-1 w-12 rounded-full"
                style={{ backgroundColor: meta.accentHex }}
              />
            </Link>
          );
        })}
      </section>
    </div>
  );
}
