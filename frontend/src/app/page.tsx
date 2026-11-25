"use client";

import React, { useMemo, useState } from "react";
import {
  Sliders,
  CheckCircle2,
  Sparkles,
  Flame,
  CalendarCheck,
  TrendingDown,
  TrendingUp,
  RotateCcw,
  Wand2,
  Info,
  AlertOctagon,
  BookOpen,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { StatusBadge, type SupportTier } from "@/components/StatusBadge";
import { MetricCard } from "@/components/MetricCard";
import { cn } from "@/lib/utils";

type CheckpointWeek = 4 | 8 | 12;

interface CheckpointSnapshot {
  week: CheckpointWeek;
  persona: string;
  engagementRate: number;
  engagementDelta: string;
  avgScore: number;
  classMedian: number;
  lateSubmissions: number;
  streakWeeks: number;
  trajectory: { week: string; attendance: number; score: number }[];
  weeklyActivity: { week: number; status: "active" | "partial" | "missed" }[];
  shap: {
    feature: string;
    impact: number;
    direction: "risk" | "safe";
    description: string;
  }[];
}

const STUDENT_PROFILE = {
  name: "Alex Rivera",
  id: "STD-2026-8812",
  course: "CS302 — Data Structures & Algorithms",
  term: "Fall 2026",
};

const CHECKPOINT_DATA: Record<CheckpointWeek, CheckpointSnapshot> = {
  4: {
    week: 4,
    persona: "Steady Starter (Cluster 0)",
    engagementRate: 0.72,
    engagementDelta: "-8% from Week 2",
    avgScore: 66.0,
    classMedian: 70,
    lateSubmissions: 0,
    streakWeeks: 4,
    trajectory: [
      { week: "W1", attendance: 85, score: 74 },
      { week: "W2", attendance: 80, score: 70 },
      { week: "W3", attendance: 75, score: 68 },
      { week: "W4", attendance: 65, score: 62 },
    ],
    weeklyActivity: [
      { week: 1, status: "active" },
      { week: 2, status: "active" },
      { week: 3, status: "active" },
      { week: 4, status: "partial" },
    ],
    shap: [
      {
        feature: "Rolling Engagement Rate",
        impact: 0.05,
        direction: "risk",
        description: "Slight dip in Week 4 VLE sessions",
      },
      {
        feature: "Assessment Score (Mean)",
        impact: -0.06,
        direction: "safe",
        description: "66% average remains near cohort median",
      },
      {
        feature: "On-Time Submissions",
        impact: -0.08,
        direction: "safe",
        description: "All early formative tasks submitted on time",
      },
      {
        feature: "Prior Attempts",
        impact: -0.04,
        direction: "safe",
        description: "First-time enrollment in CS302",
      },
    ],
  },
  8: {
    week: 8,
    persona: "Inconsistent Pacer (Cluster 1)",
    engagementRate: 0.45,
    engagementDelta: "-20% from Week 4",
    avgScore: 54.0,
    classMedian: 68,
    lateSubmissions: 2,
    streakWeeks: 2,
    trajectory: [
      { week: "W1", attendance: 85, score: 74 },
      { week: "W2", attendance: 80, score: 70 },
      { week: "W3", attendance: 75, score: 68 },
      { week: "W4", attendance: 65, score: 62 },
      { week: "W5", attendance: 58, score: 59 },
      { week: "W6", attendance: 50, score: 55 },
      { week: "W7", attendance: 47, score: 55 },
      { week: "W8", attendance: 45, score: 54 },
    ],
    weeklyActivity: [
      { week: 1, status: "active" },
      { week: 2, status: "active" },
      { week: 3, status: "active" },
      { week: 4, status: "partial" },
      { week: 5, status: "partial" },
      { week: 6, status: "missed" },
      { week: 7, status: "partial" },
      { week: 8, status: "partial" },
    ],
    shap: [
      {
        feature: "Rolling Engagement Rate",
        impact: 0.18,
        direction: "risk",
        description: "Low recent VLE & session activity increases support priority",
      },
      {
        feature: "Assessment Score (Mean)",
        impact: 0.14,
        direction: "risk",
        description: "Current average (54%) is 14 pts below class median",
      },
      {
        feature: "Late Submissions (2)",
        impact: 0.08,
        direction: "risk",
        description: "2 assignments submitted past due date",
      },
      {
        feature: "Prior Attempts",
        impact: -0.04,
        direction: "safe",
        description: "No repeated course attempts",
      },
      {
        feature: "Early Quiz Activity",
        impact: -0.06,
        direction: "safe",
        description: "Completed introductory review modules",
      },
    ],
  },
  12: {
    week: 12,
    persona: "Inconsistent Pacer (Cluster 1)",
    engagementRate: 0.58,
    engagementDelta: "+13% from Week 8",
    avgScore: 61.0,
    classMedian: 69,
    lateSubmissions: 2,
    streakWeeks: 4,
    trajectory: [
      { week: "W1", attendance: 85, score: 74 },
      { week: "W2", attendance: 80, score: 70 },
      { week: "W4", attendance: 65, score: 62 },
      { week: "W6", attendance: 50, score: 55 },
      { week: "W8", attendance: 45, score: 54 },
      { week: "W10", attendance: 54, score: 58 },
      { week: "W12", attendance: 58, score: 61 },
    ],
    weeklyActivity: [
      { week: 1, status: "active" },
      { week: 2, status: "active" },
      { week: 3, status: "active" },
      { week: 4, status: "partial" },
      { week: 5, status: "partial" },
      { week: 6, status: "missed" },
      { week: 7, status: "partial" },
      { week: 8, status: "partial" },
      { week: 9, status: "active" },
      { week: 10, status: "active" },
      { week: 11, status: "active" },
      { week: 12, status: "active" },
    ],
    shap: [
      {
        feature: "Assessment Score (Mean)",
        impact: 0.1,
        direction: "risk",
        description: "Recovering (61%), still 8 pts below cohort median",
      },
      {
        feature: "Late Submissions (2)",
        impact: 0.06,
        direction: "risk",
        description: "Earlier late submissions remain in cumulative window",
      },
      {
        feature: "Recent Engagement Trend",
        impact: -0.09,
        direction: "safe",
        description: "4-week consecutive engagement recovery",
      },
      {
        feature: "Prior Attempts",
        impact: -0.04,
        direction: "safe",
        description: "No repeated course attempts",
      },
    ],
  },
};

function calculateSimulatedRisk(eng: number, score: number): number {
  const logit = -(eng * 3.8) - score * 0.045 + 3.4;
  const prob = 1.0 / (1.0 + Math.exp(-logit));
  return Math.max(0.05, Math.min(0.95, prob));
}

function getTier(risk: number): SupportTier {
  if (risk < 0.35) return "Safe";
  if (risk < 0.65) return "Moderate";
  return "High";
}

export default function StudentPortal() {
  const [checkpoint, setCheckpoint] = useState<CheckpointWeek>(8);
  const snapshot = CHECKPOINT_DATA[checkpoint];

  const [targetEngagement, setTargetEngagement] = useState<number>(
    snapshot.engagementRate
  );
  const [targetScore, setTargetScore] = useState<number>(snapshot.avgScore);
  const [constrainedMode, setConstrainedMode] = useState<boolean>(false);

  const handleCheckpointChange = (week: CheckpointWeek) => {
    setCheckpoint(week);
    setTargetEngagement(CHECKPOINT_DATA[week].engagementRate);
    setTargetScore(CHECKPOINT_DATA[week].avgScore);
    setConstrainedMode(false);
  };

  const maxEngagementBound = constrainedMode ? 0.55 : 1.0;
  const maxScoreBound = constrainedMode ? 56 : 95;

  const effectiveEng = Math.min(targetEngagement, maxEngagementBound);
  const effectiveScore = Math.min(targetScore, maxScoreBound);

  const baselineRisk = calculateSimulatedRisk(
    snapshot.engagementRate,
    snapshot.avgScore
  );
  const simRisk = calculateSimulatedRisk(effectiveEng, effectiveScore);
  const simTier = getTier(simRisk);

  // Bounded grid search for minimum-cost plan to Safe (< 0.35)
  const optimalPlan = useMemo(() => {
    if (baselineRisk < 0.35) {
      return {
        feasible: true,
        alreadySafe: true,
        eng: snapshot.engagementRate,
        score: snapshot.avgScore,
      };
    }

    let best: { eng: number; score: number; cost: number } | null = null;
    for (
      let e = snapshot.engagementRate;
      e <= maxEngagementBound + 0.001;
      e += 0.05
    ) {
      for (let s = snapshot.avgScore; s <= maxScoreBound; s += 2) {
        const risk = calculateSimulatedRisk(e, s);
        if (risk < 0.35) {
          const cost =
            (e - snapshot.engagementRate) * 1.5 +
            ((s - snapshot.avgScore) / 100) * 1.0;
          if (!best || cost < best.cost) {
            best = { eng: Math.min(1, Number(e.toFixed(2))), score: s, cost };
          }
        }
      }
    }

    if (!best) {
      return { feasible: false, alreadySafe: false };
    }
    return {
      feasible: true,
      alreadySafe: false,
      eng: best.eng,
      score: best.score,
    };
  }, [
    baselineRisk,
    snapshot.engagementRate,
    snapshot.avgScore,
    maxEngagementBound,
    maxScoreBound,
  ]);

  const applyOptimalPlan = () => {
    if (optimalPlan.feasible && optimalPlan.eng !== undefined && optimalPlan.score !== undefined) {
      setTargetEngagement(optimalPlan.eng);
      setTargetScore(optimalPlan.score);
    }
  };

  const resetToBaseline = () => {
    setTargetEngagement(snapshot.engagementRate);
    setTargetScore(snapshot.avgScore);
  };

  const maxAbsShap = Math.max(
    0.2,
    ...snapshot.shap.map((item) => Math.abs(item.impact))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-8">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Student Academic Trajectory</span>
            <span className="text-slate-600">•</span>
            <span className="font-mono text-slate-400">{STUDENT_PROFILE.id}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {STUDENT_PROFILE.name}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {STUDENT_PROFILE.course} • {STUDENT_PROFILE.term}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Checkpoint Selector */}
          <div
            role="group"
            aria-label="Checkpoint week selector"
            className="flex items-center gap-1 bg-[#0f172a] border border-slate-800 p-1 rounded-xl"
          >
            {([4, 8, 12] as CheckpointWeek[]).map((wk) => (
              <button
                key={wk}
                type="button"
                onClick={() => handleCheckpointChange(wk)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                  checkpoint === wk
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                )}
              >
                Week {wk}
              </button>
            ))}
          </div>

          <StatusBadge tier={getTier(baselineRisk)} />

          <div className="px-3.5 py-1.5 bg-[#0f172a] rounded-xl border border-slate-800 text-xs font-medium text-slate-300">
            Persona:{" "}
            <span className="text-white font-semibold">{snapshot.persona}</span>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Metrics, Trajectory, Streaks, SHAP (7 Cols) */}
        <section className="lg:col-span-7 space-y-6">
          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <MetricCard
              label="Engagement Rate"
              value={`${(snapshot.engagementRate * 100).toFixed(0)}%`}
              subtext={snapshot.engagementDelta}
              subtextTone={
                snapshot.engagementDelta.startsWith("+") ? "positive" : "danger"
              }
              icon={
                snapshot.engagementDelta.startsWith("+") ? (
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                )
              }
            />
            <MetricCard
              label="Score Mean"
              value={
                <>
                  {snapshot.avgScore}
                  <span className="text-sm font-normal text-slate-400">
                    {" "}
                    / 100
                  </span>
                </>
              }
              subtext={`Cohort median: ${snapshot.classMedian}`}
              subtextTone={
                snapshot.avgScore >= snapshot.classMedian ? "positive" : "warning"
              }
            />
            <MetricCard
              label="Late Submissions"
              value={snapshot.lateSubmissions}
              subtext={
                snapshot.lateSubmissions === 0
                  ? "All tasks on time"
                  : "Cumulative to date"
              }
              subtextTone={snapshot.lateSubmissions === 0 ? "positive" : "neutral"}
              icon={<CalendarCheck className="w-4 h-4" />}
            />
            <MetricCard
              label="Active Streak"
              value={`${snapshot.streakWeeks} wks`}
              subtext={`Up to Week ${checkpoint}`}
              subtextTone="positive"
              icon={<Flame className="w-4 h-4 text-amber-400" />}
            />
          </div>

          {/* Weekly Engagement & Submission Streak Strip */}
          <div className="bg-[#0f172a] border border-slate-800/80 rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Weekly Engagement &amp; Submission Consistency
                </h2>
                <p className="text-xs text-slate-400">
                  Leak-free observations recorded on or before Week {checkpoint}
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                  Active
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                  Partial
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500/80" />
                  Missed
                </span>
              </div>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-12 gap-2">
              {snapshot.weeklyActivity.map((item) => {
                const bg =
                  item.status === "active"
                    ? "bg-emerald-500/15 border-emerald-500/35 text-emerald-300"
                    : item.status === "partial"
                    ? "bg-amber-500/15 border-amber-500/35 text-amber-300"
                    : "bg-rose-500/15 border-rose-500/35 text-rose-300";
                return (
                  <div
                    key={item.week}
                    title={`Week ${item.week}: ${item.status}`}
                    className={cn(
                      "rounded-lg border py-2 text-center text-[11px] font-mono font-semibold",
                      bg
                    )}
                  >
                    W{item.week}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Temporal Progression Chart */}
          <div className="bg-[#0f172a] border border-slate-800/80 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Temporal Progression
                </h2>
                <p className="text-xs text-slate-400">
                  Engagement % vs. assessment score up to Week {checkpoint}
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-blue-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  Engagement %
                </span>
                <span className="flex items-center gap-1.5 text-indigo-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                  Assessment Score
                </span>
              </div>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={snapshot.trajectory}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1e293b"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="week"
                    stroke="#64748b"
                    tick={{ fontSize: 12, fill: "#94a3b8" }}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 12, fill: "#94a3b8" }}
                    tickLine={false}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#131d31",
                      borderColor: "#1e293b",
                      borderRadius: "10px",
                      color: "#f8fafc",
                      fontSize: "12px",
                    }}
                  />
                  <ReferenceLine
                    y={65}
                    stroke="#334155"
                    strokeDasharray="4 4"
                    label={{
                      value: "Target 65",
                      fill: "#64748b",
                      fontSize: 10,
                      position: "insideTopRight",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="attendance"
                    name="Engagement %"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#3b82f6" }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    name="Assessment Score"
                    stroke="#818cf8"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#818cf8" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Explainability: SHAP Feature Attributions */}
          <div className="bg-[#0f172a] border border-slate-800/80 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" /> Explainable
                  Model Factors (SHAP)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Local feature contributions to Week {checkpoint} Support
                  Priority
                </p>
              </div>
              <span className="text-[11px] px-2.5 py-1 bg-slate-800/90 text-slate-300 rounded-lg border border-slate-700/60 font-mono self-start sm:self-auto">
                TreeExplainer • w{checkpoint}-v1.0
              </span>
            </div>

            <div className="space-y-3">
              {snapshot.shap.map((item) => {
                const isRisk = item.direction === "risk";
                const barWidth = Math.min(
                  100,
                  (Math.abs(item.impact) / maxAbsShap) * 100
                );
                return (
                  <div
                    key={item.feature}
                    className="p-3.5 rounded-xl bg-[#0b1120] border border-slate-800/80"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-100">
                          {item.feature}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full font-semibold",
                            isRisk
                              ? "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                              : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                          )}
                        >
                          {isRisk ? "Increases Priority" : "Fosters Success"}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "text-sm font-mono font-bold tabular-nums shrink-0",
                          isRisk ? "text-rose-400" : "text-emerald-400"
                        )}
                      >
                        {item.impact > 0
                          ? `+${item.impact.toFixed(2)}`
                          : item.impact.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {item.description}
                    </p>
                    <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden mt-2.5">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          isRisk ? "bg-rose-500/80" : "bg-emerald-500/80"
                        )}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Right Column: Counterfactual "What-If" Simulator (5 Cols) */}
        <section className="lg:col-span-5">
          <div className="bg-[#0f172a] border border-slate-800/80 rounded-2xl p-6 lg:sticky lg:top-24 space-y-6">
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    Counterfactual &ldquo;What-If&rdquo;
                  </h2>
                  <p className="text-xs text-slate-400">
                    Explore feasible behavioural adjustments
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setConstrainedMode((prev) => !prev)}
                className={cn(
                  "text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-colors",
                  constrainedMode
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                    : "bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200"
                )}
                title="Toggle tight feasibility bounds to preview the 'No feasible plan' state"
              >
                {constrainedMode ? "Tight Bounds: On" : "Test Tight Bounds"}
              </button>
            </div>

            {/* Projected Outcome Display */}
            <div className="p-5 rounded-xl bg-[#0b1120] border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Projected Support Priority
              </span>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white font-mono tabular-nums">
                    {(simRisk * 100).toFixed(0)}%
                  </span>
                  <span className="text-xs text-slate-400">
                    (Baseline {(baselineRisk * 100).toFixed(0)}%)
                  </span>
                </div>
                <StatusBadge tier={simTier} size="sm" />
              </div>

              {/* Segmented Progress Bar */}
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mt-4">
                <div
                  className={cn(
                    "h-full transition-all duration-300",
                    simTier === "Safe"
                      ? "bg-emerald-500"
                      : simTier === "Moderate"
                      ? "bg-amber-500"
                      : "bg-rose-500"
                  )}
                  style={{ width: `${Math.min(100, simRisk * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-2">
                <span>Safe (&lt;35%)</span>
                <span>Moderate (35–65%)</span>
                <span>High (&ge;65%)</span>
              </div>
            </div>

            {/* Actionable Sliders */}
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <label htmlFor="eng-slider" className="text-slate-200">
                    Target Attendance / Engagement
                  </label>
                  <span className="text-blue-400 font-mono font-bold tabular-nums">
                    {(effectiveEng * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  id="eng-slider"
                  type="range"
                  min="0.30"
                  max={maxEngagementBound}
                  step="0.05"
                  value={effectiveEng}
                  onChange={(e) =>
                    setTargetEngagement(parseFloat(e.target.value))
                  }
                  className="w-full acad-slider"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1.5">
                  <span>
                    Baseline: {(snapshot.engagementRate * 100).toFixed(0)}%
                  </span>
                  <span>Max bound: {(maxEngagementBound * 100).toFixed(0)}%</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <label htmlFor="score-slider" className="text-slate-200">
                    Target Assessment Mean
                  </label>
                  <span className="text-blue-400 font-mono font-bold tabular-nums">
                    {effectiveScore.toFixed(0)} / 100
                  </span>
                </div>
                <input
                  id="score-slider"
                  type="range"
                  min="30"
                  max={maxScoreBound}
                  step="2"
                  value={effectiveScore}
                  onChange={(e) => setTargetScore(parseFloat(e.target.value))}
                  className="w-full acad-slider"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1.5">
                  <span>Baseline: {snapshot.avgScore} pts</span>
                  <span>Max bound: {maxScoreBound} pts</span>
                </div>
              </div>
            </div>

            {/* Solver Result / No Feasible Plan State */}
            {!optimalPlan.feasible ? (
              <div
                role="alert"
                className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-200 leading-relaxed space-y-1.5"
              >
                <div className="font-bold text-rose-300 flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4 shrink-0" />
                  No feasible plan within current bounds
                </div>
                <p className="text-slate-300">
                  Even at maximum bounded engagement (
                  {(maxEngagementBound * 100).toFixed(0)}%) and assessment score
                  ({maxScoreBound}), projected risk remains above the 35% Safe
                  threshold. Please schedule a 1-on-1 advising meeting to
                  discuss academic support options.
                </p>
              </div>
            ) : simTier === "Safe" ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-200 leading-relaxed flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-emerald-300 block mb-0.5">
                    Safe Trajectory Reached
                  </span>
                  Sustaining ~{(effectiveEng * 100).toFixed(0)}% engagement and{" "}
                  {effectiveScore.toFixed(0)}/100 assessment mean aligns with
                  the Safe support tier.
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-slate-300 leading-relaxed flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-blue-300 block mb-0.5">
                    Minimum-Cost Path Available
                  </span>
                  Reaching{" "}
                  <span className="font-mono font-semibold text-white">
                    {((optimalPlan.eng ?? 0) * 100).toFixed(0)}%
                  </span>{" "}
                  engagement and{" "}
                  <span className="font-mono font-semibold text-white">
                    {optimalPlan.score}
                  </span>{" "}
                  mean score is the lowest-cost adjustment to enter the Safe
                  tier.
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={applyOptimalPlan}
                disabled={!optimalPlan.feasible || optimalPlan.alreadySafe}
                className="py-2.5 px-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-white rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Wand2 className="w-3.5 h-3.5" />
                Apply Safe Plan
              </button>
              <button
                type="button"
                onClick={resetToBaseline}
                className="py-2.5 px-3 bg-slate-800/80 hover:bg-slate-700/80 text-xs font-semibold text-slate-200 rounded-xl transition-colors border border-slate-700/70 flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Baseline
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed pt-2 border-t border-slate-800/80">
              <strong className="text-slate-300">Support Guidance Policy:</strong>{" "}
              What-If projections reflect empirical associations from past
              cohorts, not causal guarantees. Demographic and prior-attempt
              fields remain fixed.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
