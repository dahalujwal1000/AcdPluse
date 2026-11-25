import "./globals.css";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { AppShell } from "@/components/AppShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AcadPulse — Explainable Academic Early-Warning & Intervention",
  description:
    "Explainable academic early-warning, persona segmentation, and counterfactual intervention simulator.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-[#080c14] font-sans text-slate-100 antialiased selection:bg-blue-500/30 selection:text-blue-100">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
