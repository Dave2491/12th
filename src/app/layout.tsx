import type { Metadata } from "next";
import { Syne, Inter } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/providers/Web3Provider";
import { FlagPolyfill } from "@/components/FlagPolyfill";

const syne  = Syne({ subsets: ["latin"], variable: "--font-syne",  weight: ["400","600","700","800"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Twelfth — The Supporter Layer",
  description:
    "Join your national squad, check in for matches, earn badges, and help your country climb the global fan leaderboard.",
  openGraph: {
    title: "Twelfth — The Supporter Layer",
    description: "Football fan identity, powered by X Layer.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${inter.variable}`}>
      <body className="min-h-screen text-white" style={{ backgroundColor: "var(--bg-base)" }}>
        <FlagPolyfill />
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}
