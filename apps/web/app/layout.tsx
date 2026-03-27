import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import { AuthProvider } from "@/components/AuthProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

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
      <body className={`${inter.variable} font-sans min-h-screen bg-black text-zinc-300`}>
        <AuthProvider>
          <Nav />
          <main className="pb-24">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
