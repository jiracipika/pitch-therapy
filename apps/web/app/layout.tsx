import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pitch Therapy — Ear Training Gym",
  description: "Train your ear with five game modes. Daily challenges, streaks, and stats.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-zinc-950 font-sans text-zinc-100">
        {children}
      </body>
    </html>
  );
}
