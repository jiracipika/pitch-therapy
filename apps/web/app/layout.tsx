import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

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
        <Nav />
        <main className="pb-20">{children}</main>
      </body>
    </html>
  );
}
