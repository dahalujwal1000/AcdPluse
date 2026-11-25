"use client";

import React from "react";
import { ShieldCheck, AlertTriangle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type SupportTier = "Safe" | "Moderate" | "High";

interface StatusBadgeProps {
  tier: SupportTier;
  size?: "sm" | "md";
  showIcon?: boolean;
  className?: string;
}

const TIER_CONFIG: Record<
  SupportTier,
  {
    label: string;
    classes: string;
    Icon: React.ComponentType<{ className?: string }>;
  }
> = {
  Safe: {
    label: "Safe",
    classes: "text-emerald-300 bg-emerald-500/10 border-emerald-500/25",
    Icon: ShieldCheck,
  },
  Moderate: {
    label: "Moderate Support",
    classes: "text-amber-300 bg-amber-500/10 border-amber-500/25",
    Icon: AlertCircle,
  },
  High: {
    label: "High Support Priority",
    classes: "text-rose-300 bg-rose-500/10 border-rose-500/25",
    Icon: AlertTriangle,
  },
};

export function StatusBadge({
  tier,
  size = "md",
  showIcon = true,
  className,
}: StatusBadgeProps) {
  const { label, classes, Icon } = TIER_CONFIG[tier];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-semibold whitespace-nowrap",
        size === "sm" ? "px-2.5 py-0.5 text-[11px]" : "px-3.5 py-1.5 text-xs",
        classes,
        className
      )}
    >
      {showIcon && (
        <Icon className={size === "sm" ? "w-3 h-3 shrink-0" : "w-3.5 h-3.5 shrink-0"} />
      )}
      <span>{label}</span>
    </span>
  );
}
