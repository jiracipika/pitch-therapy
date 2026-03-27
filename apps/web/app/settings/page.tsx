import Link from "next/link";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-zinc-300">
        ← Back to Dashboard
      </Link>
      <h1 className="mt-4 text-3xl font-black">Settings</h1>

      <div className="mt-8 flex flex-col gap-6">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="font-semibold">Profile</h2>
          <p className="mt-2 text-sm text-zinc-400">Manage your account via Clerk.</p>
          <p className="mt-1 text-xs text-zinc-600">UserButton component coming in Phase 3.</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="font-semibold">Audio</h2>
          <p className="mt-2 text-sm text-zinc-400">Calibration and playback settings.</p>
          <p className="mt-1 text-xs text-zinc-600">Audio settings UI coming in Phase 4.</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="font-semibold">Notifications</h2>
          <p className="mt-2 text-sm text-zinc-400">Daily challenge reminders.</p>
          <p className="mt-1 text-xs text-zinc-600">Notification preferences coming in Phase 5.</p>
        </div>
      </div>
    </div>
  );
}
