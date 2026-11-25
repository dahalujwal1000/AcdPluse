"use client";

import React, { useState } from "react";
import { 
  ShieldCheck, 
  AlertTriangle, 
  HelpCircle, 
  Sliders, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  Users, 
  ArrowRight,
  Sparkles,
  BarChart3,
  Layers
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  CartesianGrid
} from "recharts";

// Mock Student Profile
const INITIAL_STUDENT = {
  name: "Alex Rivera",
  id: "STD-2026-8812",
  course: "CS302 — Data Structures & Algorithms",
  term: "Fall 2026",
  checkpoint: 8,
  riskProb: 0.68,
  tier: "High", // Support Priority
  persona: "Inconsistent Pacer (Cluster 1)",
  engagementRate: 0.45,
  avgScore: 54.0,
  lateSubmissions: 2,
};

const TRAJECTORY_DATA = [
  { week: "Week 2", attendance: 80, score: 70, clicks: 85 },
  { week: "Week 4", attendance: 65, score: 62, clicks: 60 },
  { week: "Week 6", attendance: 50, score: 55, clicks: 40 },
  { week: "Week 8", attendance: 45, score: 54, clicks: 35 },
];

const INITIAL_SHAP = [
  { feature: "Rolling Engagement Rate", impact: 0.18, direction: "risk", description: "Low recent attendance increases risk" },
  { feature: "Assessment Score (Mean)", impact: 0.14, direction: "risk", description: "Current average (54%) is below class median" },
  { feature: "Late Submissions (2)", impact: 0.08, direction: "risk", description: "2 assignments submitted past due date" },
  { feature: "Prior Attempts", impact: -0.04, direction: "safe", description: "No repeated course attempts" },
  { feature: "Early Quiz Activity", impact: -0.06, direction: "safe", description: "Completed introductory review modules" },
];

export default function StudentPortal() {
  // Slider states for What-If
  const [targetEngagement, setTargetEngagement] = useState(INITIAL_STUDENT.engagementRate);
  const [targetScore, setTargetScore] = useState(INITIAL_STUDENT.avgScore);

  // Dynamic risk calculation based on sliders
  const calculateSimulatedRisk = (eng: number, score: number) => {
    const logit = -(eng * 3.8) - (score * 0.045) + 3.4;
    const prob = 1.0 / (1.0 + Math.exp(-logit));
    return Math.max(0.05, Math.min(0.95, prob));
  };

  const simRisk = calculateSimulatedRisk(targetEngagement, targetScore);
  const isSafe = simRisk < 0.35;
  const isModerate = simRisk >= 0.35 && simRisk < 0.65;

  const currentTier = isSafe ? "Safe" : isModerate ? "Moderate Support" : "High Support Priority";
  const tierColor = isSafe 
    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" 
    : isModerate 
    ? "text-amber-400 bg-amber-500/10 border-amber-500/20" 
    : "text-rose-400 bg-rose-500/10 border-rose-500/20";

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 p-6 md:p-10">
      {/* Top Header */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-slate-800/80 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
            <Layers className="w-3.5 h-3.5" /> AcadPulse Academic Trajectory
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            {INITIAL_STUDENT.name}
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {INITIAL_STUDENT.course} • Checkpoint Week {INITIAL_STUDENT.checkpoint}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-xl border text-sm font-semibold flex items-center gap-2 ${tierColor}`}>
            {isSafe ? <ShieldCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            Status: {currentTier}
          </div>
          <div className="px-3.5 py-2 bg-slate-800/60 rounded-xl border border-slate-700/50 text-xs font-medium text-slate-300">
            Persona: <span className="text-white font-semibold">{INITIAL_STUDENT.persona}</span>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        {/* Left Column: Trajectory and SHAP Diagnostics (7 Cols) */}
        <section className="lg:col-span-7 space-y-8">
          {/* Diagnostic Key Numbers */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-4.5">
              <span className="text-xs font-medium text-slate-400">Engagement Rate</span>
              <p className="text-2xl font-bold text-white mt-1">{(INITIAL_STUDENT.engagementRate * 100).toFixed(0)}%</p>
              <span className="text-xs text-rose-400 flex items-center gap-1 mt-1 font-medium">
                -20% from W2
              </span>
            </div>
            <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-4.5">
              <span className="text-xs font-medium text-slate-400">Score Mean</span>
              <p className="text-2xl font-bold text-white mt-1">{INITIAL_STUDENT.avgScore} <span className="text-sm font-normal text-slate-400">/ 100</span></p>
              <span className="text-xs text-amber-400 flex items-center gap-1 mt-1 font-medium">
                Median is 68
              </span>
            </div>
            <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-4.5">
              <span className="text-xs font-medium text-slate-400">Late Deliveries</span>
              <p className="text-2xl font-bold text-white mt-1">{INITIAL_STUDENT.lateSubmissions}</p>
              <span className="text-xs text-slate-400 mt-1 block">Due dates missed</span>
            </div>
          </div>

          {/* Trajectory Trend Chart */}
          <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-semibold text-white">Temporal Progression</h3>
                <p className="text-xs text-slate-400">Attendance vs. Assessment performance up to Week 8</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-blue-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Attendance %
                </span>
                <span className="flex items-center gap-1.5 text-indigo-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span> Assessment Score
                </span>
              </div>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={TRAJECTORY_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2d47" vertical={false} />
                  <XAxis dataKey="week" stroke="#64748b" tickLine={false} textAnchor="middle" />
                  <YAxis stroke="#64748b" tickLine={false} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#162033", borderColor: "#1f2d47", borderRadius: "8px", color: "#f8fafc" }} 
                  />
                  <Line type="monotone" dataKey="attendance" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="score" stroke="#818cf8" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Explainability: SHAP Feature Attributions */}
          <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" /> Explainable Model Factors (SHAP)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Local feature contributions to Week 8 risk assessment
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg border border-slate-700/60 font-mono">
                TreeExplainer v1.0
              </span>
            </div>

            <div className="space-y-3 mt-4">
              {INITIAL_SHAP.map((item, idx) => {
                const isRisk = item.direction === "risk";
                return (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-200">{item.feature}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${isRisk ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                          {isRisk ? "+ Increased Risk" : "- Fosters Success"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                    </div>
                    <div className="text-right pl-4">
                      <span className={`text-sm font-mono font-bold ${isRisk ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {item.impact > 0 ? `+${item.impact.toFixed(2)}` : item.impact.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Right Column: Counterfactual "What-If" Simulator (5 Cols) */}
        <section className="lg:col-span-5 space-y-6">
          <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-6 sticky top-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Counterfactual "What-If"</h3>
                  <p className="text-xs text-slate-400">Simulate feasible behavioural adjustments</p>
                </div>
              </div>
            </div>

            {/* Simulated Outcome Display */}
            <div className="my-6 p-4.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Projected Trajectory
              </span>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-3xl font-extrabold text-white font-mono">
                    {(simRisk * 100).toFixed(0)}%
                  </span>
                  <span className="text-xs text-slate-400 ml-1.5 font-medium">Support Priority</span>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-bold border ${tierColor}`}>
                  {currentTier}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mt-3 relative">
                <div 
                  className={`h-full transition-all duration-300 ${isSafe ? 'bg-emerald-500' : isModerate ? 'bg-amber-500' : 'bg-rose-500'}`}
                  style={{ width: `${Math.min(100, simRisk * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 font-mono mt-1.5">
                <span>Safe (&lt;35%)</span>
                <span>Moderate (35-65%)</span>
                <span>High (&ge;65%)</span>
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-6">
              {/* Engagement Slider */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <span className="text-slate-300">Target Attendance / Engagement</span>
                  <span className="text-blue-400 font-mono font-bold">{(targetEngagement * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0.30" 
                  max="1.0" 
                  step="0.05"
                  value={targetEngagement}
                  onChange={(e) => setTargetEngagement(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Current baseline: {(INITIAL_STUDENT.engagementRate * 100).toFixed(0)}%
                </span>
              </div>

              {/* Score Slider */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <span className="text-slate-300">Target Assessment Mark</span>
                  <span className="text-blue-400 font-mono font-bold">{targetScore.toFixed(0)} / 100</span>
                </div>
                <input 
                  type="range" 
                  min="30" 
                  max="95" 
                  step="2"
                  value={targetScore}
                  onChange={(e) => setTargetScore(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Current baseline: {INITIAL_STUDENT.avgScore} pts
                </span>
              </div>
            </div>

            {/* Solver Guidance Note */}
            <div className="mt-6 p-4 rounded-xl bg-blue-950/20 border border-blue-900/40 text-xs text-slate-300 leading-relaxed">
              <span className="font-bold text-blue-400 block mb-1">Support Guidance Policy</span>
              {isSafe ? (
                <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Feasible path reached! Maintaining ~{(targetEngagement * 100).toFixed(0)}% engagement moves student to the Safe trajectory.
                </span>
              ) : (
                "These projections reflect empirical trends from past cohorts, not a causal guarantee. Increasing engagement by +20% and quiz scores by +15 pts is estimated to transition to the Safe tier."
              )}
            </div>

            {/* Reset Button */}
            <button
              onClick={() => {
                setTargetEngagement(INITIAL_STUDENT.engagementRate);
                setTargetScore(INITIAL_STUDENT.avgScore);
              }}
              className="w-full mt-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-xs font-semibold text-slate-300 rounded-xl transition-colors border border-slate-700/60"
            >
              Reset to Current Baseline
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
