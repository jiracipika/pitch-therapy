export default function OnboardingPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-8 px-6 py-20 text-center">
      <h1 className="text-4xl font-black">Welcome to Pitch Therapy</h1>
      <p className="text-zinc-400">
        This is the onboarding / tutorial placeholder. Real tutorial flow comes in Phase 3.
      </p>
      <a
        href="/dashboard"
        className="rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white transition hover:bg-blue-500"
      >
        Go to Dashboard
      </a>
    </div>
  );
}
