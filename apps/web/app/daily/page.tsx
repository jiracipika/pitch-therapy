import Link from "next/link";
import { GAME_MODE_META, type GameMode } from "@pitch-therapy/core";

const modeOrder: GameMode[] = [
  "pitch-match", "note-id", "frequency-guess", "note-wordle", "frequency-wordle",
];

export default function DailyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-zinc-300">
        ← Back to Dashboard
      </Link>
      <h1 className="mt-4 text-3xl font-black">Daily Challenge</h1>
      <p className="mt-2 text-zinc-400">
        Complete all five modes today for a streak bonus.
      </p>

      <div className="mt-8 flex flex-col gap-4">
        {modeOrder.map((mode) => {
          const meta = GAME_MODE_META[mode];
          return (
            <Link
              key={mode}
              href={`/play/${mode}`}
              className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition hover:border-zinc-700"
            >
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: meta.accentHex }}
              />
              <span className="font-semibold">{meta.label}</span>
              <span className="ml-auto text-xs text-zinc-600">Not completed</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
