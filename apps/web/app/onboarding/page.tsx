import Link from 'next/link';

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="text-6xl mb-4">🎵</div>
      <h1 className="text-3xl font-bold">Welcome to Pitch Therapy</h1>
      <p className="mt-2 max-w-md text-zinc-400">Your daily ear training gym. Five game modes, daily challenges, and detailed progress tracking.</p>
      <Link href="/dashboard" className="mt-8 rounded-xl bg-blue-500 px-8 py-3 font-bold text-white hover:bg-blue-600">
        Get Started →
      </Link>
    </div>
  );
}
