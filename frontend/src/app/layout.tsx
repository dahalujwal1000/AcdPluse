import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AcadPulse — Academic Early-Warning & Intervention",
  description: "Explainable academic early-warning, persona segmentation, and counterfactual intervention simulator.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
