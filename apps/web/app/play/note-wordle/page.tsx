import { GAME_MODE_META } from "@pitch-therapy/core";
import Link from "next/link";

export default function PlayNoteWordlePage() {
  const meta = GAME_MODE_META["note-wordle"];
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-8 px-6 py-20 text-center">
      <span className="text-6xl">🎶</span>
      <h1 className={`text-4xl font-black ${meta.color}`}>{meta.label}</h1>
      <p className="text-zinc-400">{meta.description}</p>
      <p className="text-sm text-zinc-600">Game UI coming in Phase 4.</p>
      <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-zinc-300">
        ← Back to Dashboard
      </Link>
    </div>
  );
}
