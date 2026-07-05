import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import { AuthProvider } from "@/components/AuthProvider";
import { SettingsProvider } from "@/components/SettingsProvider";
import { StatsProvider } from "@/components/StatsProvider";
import AppTransitionShell from "@/components/AppTransitionShell";
import DesktopTopBar from "@/components/DesktopTopBar";

export const metadata: Metadata = {
  title: "Pitch Therapy",
  description: "Train your ear with 18 game modes. Daily challenges, streaks, and stats.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F2F2F7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
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
          <SettingsProvider>
            <StatsProvider>
              <Nav />
              <main className="pt-main-shell">
                <DesktopTopBar />
                <AppTransitionShell>{children}</AppTransitionShell>
              </main>
            </StatsProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
