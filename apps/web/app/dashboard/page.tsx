import Link from "next/link";
import { GAME_MODE_META, type GameMode } from "@pitch-therapy/core";

const modeOrder: GameMode[] = [
  "pitch-match", "note-id", "frequency-guess", "note-wordle", "frequency-wordle",
];

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black">Training Gym</h1>
        <div className="flex items-center gap-4">
          {/* Streak ring placeholder */}
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-amber-500 text-sm font-bold text-amber-500">
            🔥 0
          </div>
        </div>
      </div>

      {/* Daily Challenge Banner */}
      <Link
        href="/daily"
        className="mt-8 block rounded-2xl border border-zinc-800 bg-gradient-to-r from-blue-600/20 to-violet-600/20 p-6 transition hover:border-zinc-700"
      >
        <p className="text-sm font-medium text-zinc-400">Today&apos;s Challenge</p>
        <p className="mt-1 text-xl font-bold">Daily Pitch Workout</p>
        <p className="mt-1 text-sm text-zinc-500">Complete all 5 modes for a bonus streak day.</p>
      </Link>

      {/* Mode Cards */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modeOrder.map((mode) => {
          const meta = GAME_MODE_META[mode];
          return (
            <Link
              key={mode}
              href={`/play/${mode}`}
              className="group rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition hover:border-zinc-700"
            >
              <div className="flex items-center justify-between">
                <h2 className={`text-lg font-bold ${meta.color}`}>{meta.label}</h2>
                {/* Daily badge placeholder */}
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">
                  —
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-400">{meta.description}</p>
              <div className="mt-4 flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: meta.accentHex }}
                />
                <span className="text-xs text-zinc-600">Play now</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Nav links */}
      <div className="mt-12 flex gap-4 text-sm text-zinc-500">
        <Link href="/progress" className="hover:text-zinc-300">Progress & Stats</Link>
        <Link href="/settings" className="hover:text-zinc-300">Settings</Link>
      </div>
    </div>
  );
}
