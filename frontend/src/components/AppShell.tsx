"use client";

import React from "react";
import Link from "next/link";
import { Activity, Cpu, FlaskConical } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#080c14] text-slate-100">
      {/* Top Navigation Bar */}
      <nav
        aria-label="Primary navigation"
        className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#080c14]/85 backdrop-blur-md"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg pr-2"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/10 group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-white">
                  AcadPulse
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-blue-500/10 text-blue-300 border border-blue-500/20">
                  <FlaskConical className="w-2.5 h-2.5" /> Synthetic Cohort
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden md:block leading-none mt-0.5">
                Explainable Early-Warning &amp; Intervention
              </p>
            </div>
          </Link>

          {/* Local Runtime Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0f172a] border border-slate-800/80 text-[11px] text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium">Local ML Runtime</span>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <div className="flex-1">{children}</div>

      {/* Institutional Footer */}
      <footer className="border-t border-slate-800/70 bg-[#080c14] py-5 px-4 sm:px-6 lg:px-10 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <p>
            AcadPulse • 100% local inference (XGBoost + TreeExplainer + k-Means).
            Predictions represent support guidance based on past cohorts, not a guarantee.
          </p>
          <p className="font-mono text-slate-500">
            Lincoln University College • BIT Capstone
          </p>
        </div>
      </footer>
    </div>
  );
}
