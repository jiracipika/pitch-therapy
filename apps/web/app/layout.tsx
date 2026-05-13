import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import { AuthProvider } from "@/components/AuthProvider";
import { StatsProvider } from "@/components/StatsProvider";
import AppTransitionShell from "@/components/AppTransitionShell";

export const metadata: Metadata = {
  title: "Pitch Therapy",
  description: "Train your ear with 18 game modes. Daily challenges, streaks, and stats.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen min-h-dvh" style={{ background: 'var(--ios-bg)', color: 'var(--ios-label)' }}>
        <AuthProvider>
          <StatsProvider>
            <Nav />
            {/* Mobile: bottom-padded for tab bar. Desktop: shifted right for sidebar. */}
            <main className="pb-tab md:pb-0 md:ml-[240px]">
              <AppTransitionShell>{children}</AppTransitionShell>
            </main>
          </StatsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
