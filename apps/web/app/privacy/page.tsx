import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Pitch Therapy",
  description: "How Pitch Therapy handles your data.",
};

export default function PrivacyPage() {
  return (
    <main
      id="main-content"
      style={{
        maxWidth: 680,
        margin: "0 auto",
        padding: "48px 20px 80px",
        lineHeight: 1.65,
      }}
    >
      <h1 style={{ fontSize: 32, marginBottom: 8 }}>Privacy Policy</h1>
      <p style={{ opacity: 0.68, marginBottom: 28 }}>
        Last updated: October 17, 2026
      </p>

      <h2 style={{ fontSize: 20, marginTop: 24, marginBottom: 8 }}>
        What we store
      </h2>
      <p>
        Pitch Therapy stores your training history — game results, streaks,
        settings, and progress — locally in your browser using localStorage.
        This data never leaves your device unless you explicitly sign in to
        sync it. Clearing your browser data removes it permanently.
      </p>

      <h2 style={{ fontSize: 20, marginTop: 24, marginBottom: 8 }}>
        Accounts
      </h2>
      <p>
        Optional account sync is handled by Supabase. If you create an
        account, your email address and synced training results are stored by
        Supabase on our behalf. You can keep using every game without an
        account.
      </p>

      <h2 style={{ fontSize: 20, marginTop: 24, marginBottom: 8 }}>
        Advertising
      </h2>
      <p>
        This site may show ads served by Google AdSense. Google and its
        partners may use cookies or device identifiers to serve and measure
        ads based on your visits to this and other sites. You can opt out of
        personalized advertising by visiting Google&apos;s Ads Settings at
        adssettings.google.com. For more detail, see Google&apos;s advertising
        privacy page at policies.google.com/technologies/ads.
      </p>

      <h2 style={{ fontSize: 20, marginTop: 24, marginBottom: 8 }}>
        Microphone
      </h2>
      <p>
        Games that listen to your voice use your browser&apos;s microphone
        only while the game screen is open. Audio is analyzed in real time in
        your browser to detect pitch and is never recorded, stored, or
        uploaded.
      </p>

      <h2 style={{ fontSize: 20, marginTop: 24, marginBottom: 8 }}>
        Contact
      </h2>
      <p>
        Questions about this policy? Reach us through the repository:
        github.com/jiracipika/pitch-therapy.
      </p>
    </main>
  );
}
