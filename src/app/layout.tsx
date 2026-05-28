import type { Metadata } from "next";
import { Syne, Inter } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/providers/Web3Provider";
import { FlagPolyfill } from "@/components/FlagPolyfill";

const syne  = Syne({ subsets: ["latin"], variable: "--font-syne",  weight: ["400","600","700","800"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Twelfth — World Cup 2026 Trivia",
  description:
    "Pick your country, answer World Cup trivia, earn points, and push your nation to the top of the global leaderboard. Fan passports and badges minted on X Layer.",
  openGraph: {
    title: "Twelfth — World Cup 2026 Trivia",
    description:
      "Pick your country. Answer trivia. Represent your nation on X Layer.",
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
