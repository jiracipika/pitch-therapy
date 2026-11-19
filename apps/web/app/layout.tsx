import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, DM_Serif_Display, Caveat } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import { AuthProvider } from "@/components/AuthProvider";
import { SettingsProvider } from "@/components/SettingsProvider";
import { StatsProvider } from "@/components/StatsProvider";
import AppTransitionShell from "@/components/AppTransitionShell";
import DesktopTopBar from "@/components/DesktopTopBar";
import { GAME_MODES } from "@pitch-therapy/core";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

// MedBrewery-family type roles, self-hosted by Next (no external requests)
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});
const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-dm-serif",
  display: "swap",
});
const caveat = Caveat({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-caveat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pitch Therapy",
  description: `Train your ear with ${GAME_MODES.length} game modes. Daily challenges, streaks, and stats.`,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pitch Therapy",
  },
  icons: {
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#faf8f1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${dmSerif.variable} ${caveat.variable}`}
    >
      <head>
        {/* apply saved theme before first paint (paper is the default) */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{if(localStorage.getItem("pt:theme")==="midnight")document.documentElement.dataset.theme="dark"}catch(e){}',
          }}
        />
      </head>
      <body
        className="min-h-dvh min-h-screen"
        style={{ background: "var(--ios-bg)", color: "var(--ios-label)" }}
      >
        {/* raw tag (not next/script) so the AdSense crawler sees it in raw HTML */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4128325832827761"
          crossOrigin="anonymous"
        />
        <ServiceWorkerRegister />
        <a className="pt-skip-link" href="#main-content">
          Skip to main content
        </a>
        <AuthProvider>
          <SettingsProvider>
            <StatsProvider>
              <Nav />
              <main id="main-content" className="pt-main-shell" tabIndex={-1}>
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
