import Link from "next/link";

export default function ProgressPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-zinc-300">
        ← Back to Dashboard
      </Link>
      <h1 className="mt-4 text-3xl font-black">Progress & Stats</h1>
      <p className="mt-2 text-zinc-400">Track your ear training journey.</p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Sessions", value: "—" },
          { label: "Current Streak", value: "0 days" },
          { label: "Best Streak", value: "0 days" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-center"
          >
            <p className="text-3xl font-bold">{stat.value}</p>
            <p className="mt-1 text-sm text-zinc-400">{stat.label}</p>
          </div>
        ))}
      </div>

      <p className="mt-12 text-center text-sm text-zinc-600">
        Detailed stats and charts coming in Phase 5.
      </p>
    </div>
  );
}
