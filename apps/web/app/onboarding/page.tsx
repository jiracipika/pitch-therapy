import Link from 'next/link';

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4 text-center">
      <div className="glass-card p-10 max-w-sm">
        <div className="text-6xl mb-6">🎵</div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Welcome to Pitch Therapy</h1>
        <p className="mt-3 max-w-sm text-zinc-500">Your daily ear training gym. Five game modes, daily challenges, and detailed progress tracking.</p>
        <Link href="/dashboard" className="mt-8 inline-block rounded-full bg-white px-6 py-2.5 font-semibold text-black transition-all duration-300 ease-out hover:bg-zinc-200">
          Get Started →
        </Link>
      </div>
    </div>
  );
}
