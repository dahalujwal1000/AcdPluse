"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  subtext?: React.ReactNode;
  subtextTone?: "neutral" | "positive" | "warning" | "danger";
  icon?: React.ReactNode;
  className?: string;
}

const TONE_CLASSES = {
  neutral: "text-slate-400",
  positive: "text-emerald-400",
  warning: "text-amber-400",
  danger: "text-rose-400",
};

export function MetricCard({
  label,
  value,
  subtext,
  subtextTone = "neutral",
  icon,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "bg-[#0f172a] border border-slate-800/80 hover:border-slate-700/80 transition-colors rounded-2xl p-5",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-400">{label}</span>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>
      <div className="text-2xl font-bold text-white mt-2 tabular-nums tracking-tight">
        {value}
      </div>
      {subtext && (
        <div className={cn("text-xs font-medium mt-1.5", TONE_CLASSES[subtextTone])}>
          {subtext}
        </div>
      )}
    </div>
  );
}
