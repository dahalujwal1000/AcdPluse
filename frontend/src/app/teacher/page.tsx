"use client";

import React, { useState } from "react";
import {
  Users,
  Search,
  Filter,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  FileText,
  ChevronRight,
  TrendingDown,
  Clock,
  Sparkles,
  BarChart2,
  Calendar,
  Send,
  X,
  ShieldCheck
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from "recharts";

interface StudentRow {
  id: string;
  name: string;
  email: string;
  riskProb: number;
  tier: "High" | "Moderate" | "Safe";
  persona: string;
  personaCluster: number;
  engagement: number;
  scoreMean: number;
  lateSubs: number;
  lastActive: string;
  shap: { feature: string; impact: number }[];
}

const MOCK_COHORT: StudentRow[] = [
  {
    id: "STD-8812",
    name: "Alex Rivera",
    email: "a.rivera@lincoln.edu.my",
    riskProb: 0.68,
    tier: "High",
    persona: "Inconsistent Pacer",
    personaCluster: 1,
    engagement: 0.45,
    scoreMean: 54.0,
    lateSubs: 2,
    lastActive: "3 days ago",
    shap: [
      { feature: "Rolling Engagement", impact: 0.18 },
      { feature: "Assessment Score Mean", impact: 0.14 },
      { feature: "Late Submissions (2)", impact: 0.08 },
      { feature: "Early Quiz Activity", impact: -0.06 },
    ],
  },
  {
    id: "STD-9023",
    name: "Priya Sharma",
    email: "p.sharma@lincoln.edu.my",
    riskProb: 0.72,
    tier: "High",
    persona: "Low Engagement / At-Risk",
    personaCluster: 2,
    engagement: 0.32,
    scoreMean: 48.0,
    lateSubs: 3,
    lastActive: "6 days ago",
    shap: [
      { feature: "Rolling Engagement", impact: 0.22 },
      { feature: "Assessment Score Mean", impact: 0.16 },
      { feature: "VLE Click Volume", impact: 0.10 },
      { feature: "Prior Attempts", impact: -0.02 },
    ],
  },
  {
    id: "STD-7741",
    name: "David Chen",
    email: "d.chen@lincoln.edu.my",
    riskProb: 0.44,
    tier: "Moderate",
    persona: "Inconsistent Pacer",
    personaCluster: 1,
    engagement: 0.62,
    scoreMean: 66.0,
    lateSubs: 1,
    lastActive: "Yesterday",
    shap: [
      { feature: "Late Submissions (1)", impact: 0.06 },
      { feature: "Rolling Engagement", impact: -0.05 },
      { feature: "Assessment Score Mean", impact: -0.07 },
    ],
  },
  {
    id: "STD-6619",
    name: "Elena Rostova",
    email: "e.rostova@lincoln.edu.my",
    riskProb: 0.15,
    tier: "Safe",
    persona: "Consistent Achiever",
    personaCluster: 0,
    engagement: 0.88,
    scoreMean: 86.0,
    lateSubs: 0,
    lastActive: "Today",
    shap: [
      { feature: "Rolling Engagement", impact: -0.19 },
      { feature: "Assessment Score Mean", impact: -0.21 },
      { feature: "Submission Punctuality", impact: -0.08 },
    ],
  },
  {
    id: "STD-5524",
    name: "Marcus Vance",
    email: "m.vance@lincoln.edu.my",
    riskProb: 0.52,
    tier: "Moderate",
    persona: "Inconsistent Pacer",
    personaCluster: 1,
    engagement: 0.55,
    scoreMean: 61.5,
    lateSubs: 1,
    lastActive: "2 days ago",
    shap: [
      { feature: "Rolling Engagement", impact: 0.07 },
      { feature: "Assessment Score Mean", impact: -0.03 },
      { feature: "Late Submissions (1)", impact: 0.04 },
    ],
  },
];

export default function TeacherPortal() {
  const [selectedStudent, setSelectedStudent] = useState<StudentRow>(MOCK_COHORT[0]);
  const [filterTier, setFilterTier] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [interventionNote, setInterventionNote] = useState<string>("");
  const [interventionType, setInterventionType] = useState<string>("meeting");
  const [savedLogs, setSavedLogs] = useState<{ id: string; type: string; note: string; date: string }[]>([
    { id: "LOG-1", type: "email", note: "Sent checkpoint 4 check-in regarding TMA1 deadline.", date: "Oct 12, 2026" },
  ]);

  const filteredCohort = MOCK_COHORT.filter((s) => {
    const matchesTier = filterTier === "all" || s.tier.toLowerCase() === filterTier.toLowerCase();
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTier && matchesSearch;
  });

  const handleSaveIntervention = (e: React.FormEvent) => {
    e.preventDefault();
    if (!interventionNote.trim()) return;
    setSavedLogs([
      {
        id: `LOG-${Date.now()}`,
        type: interventionType,
        note: interventionNote,
        date: "Just now",
      },
      ...savedLogs,
    ]);
    setInterventionNote("");
    setModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 p-6 md:p-10">
      {/* Header */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-slate-800/80 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
            <Users className="w-3.5 h-3.5" /> Teacher & Advisor Portal
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            CS302 Cohort Risk Roster
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Data Structures & Algorithms • Active Checkpoint: Week 8
          </p>
        </div>

        {/* Top Cohort Stats Summary */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-center">
            <span className="text-[11px] text-slate-400 block font-medium">Cohort Size</span>
            <span className="text-base font-bold text-white font-mono">{MOCK_COHORT.length}</span>
          </div>
          <div className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center">
            <span className="text-[11px] text-rose-300 block font-medium">Support Priority</span>
            <span className="text-base font-bold text-rose-400 font-mono">
              {MOCK_COHORT.filter((s) => s.tier === "High").length}
            </span>
          </div>
          <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
            <span className="text-[11px] text-amber-300 block font-medium">Moderate</span>
            <span className="text-base font-bold text-amber-400 font-mono">
              {MOCK_COHORT.filter((s) => s.tier === "Moderate").length}
            </span>
          </div>
          <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
            <span className="text-[11px] text-emerald-300 block font-medium">Safe</span>
            <span className="text-base font-bold text-emerald-400 font-mono">
              {MOCK_COHORT.filter((s) => s.tier === "Safe").length}
            </span>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        {/* Left Column: Student Roster Table (7 Cols) */}
        <section className="lg:col-span-7 space-y-4">
          {/* Controls: Search and Filter */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search student by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#111827] border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-1.5 bg-[#111827] border border-slate-800 rounded-xl p-1 text-xs">
              {["all", "high", "moderate", "safe"].map((tier) => (
                <button
                  key={tier}
                  onClick={() => setFilterTier(tier)}
                  className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-colors ${
                    filterTier === tier ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tier === "high" ? "Priority" : tier}
                </button>
              ))}
            </div>
          </div>

          {/* Roster Cards */}
          <div className="space-y-2.5">
            {filteredCohort.map((student) => {
              const isSelected = selectedStudent.id === student.id;
              const isPriority = student.tier === "High";
              const isMod = student.tier === "Moderate";

              return (
                <div
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? "bg-slate-800/80 border-blue-500/80 shadow-lg shadow-blue-500/5"
                      : "bg-[#111827] border-slate-800/80 hover:bg-slate-850 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-300 font-mono">
                      {student.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{student.name}</span>
                        <span className="text-xs text-slate-400 font-mono">{student.id}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                        <span>Persona: <span className="text-slate-300 font-medium">{student.persona}</span></span>
                        <span>•</span>
                        <span>Eng: {(student.engagement * 100).toFixed(0)}%</span>
                        <span>•</span>
                        <span>Score: {student.scoreMean}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-sm font-bold font-mono text-white block">
                        {(student.riskProb * 100).toFixed(0)}%
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase tracking-wider ${
                          isPriority
                            ? "bg-rose-500/10 text-rose-400"
                            : isMod
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-emerald-500/10 text-emerald-400"
                        }`}
                      >
                        {isPriority ? "Priority" : student.tier}
                      </span>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isSelected ? "text-blue-400" : "text-slate-600"}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right Column: Diagnostic Inspection & SHAP Waterfall (5 Cols) */}
        <section className="lg:col-span-5 space-y-6">
          <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-6 sticky top-6">
            {/* Student Header */}
            <div className="flex items-start justify-between pb-5 border-b border-slate-800">
              <div>
                <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">
                  Diagnostic Inspection
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">{selectedStudent.name}</h3>
                <p className="text-xs text-slate-400">{selectedStudent.email} • {selectedStudent.id}</p>
              </div>
              <button
                onClick={() => setModalOpen(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <FileText className="w-3.5 h-3.5" /> Log Action
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 my-5">
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">Risk Score</span>
                <span className="text-lg font-bold text-white font-mono">
                  {(selectedStudent.riskProb * 100).toFixed(0)}%
                </span>
              </div>
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">Attendance</span>
                <span className="text-lg font-bold text-white font-mono">
                  {(selectedStudent.engagement * 100).toFixed(0)}%
                </span>
              </div>
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">Lates</span>
                <span className="text-lg font-bold text-white font-mono">
                  {selectedStudent.lateSubs}
                </span>
              </div>
            </div>

            {/* SHAP Waterfall Attribution Chart */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> SHAP Feature Attributions
                </h4>
                <span className="text-[10px] text-slate-500 font-mono">Week 8 Checkpoint</span>
              </div>

              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={selectedStudent.shap}
                    margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                  >
                    <XAxis type="number" domain={[-0.25, 0.25]} stroke="#64748b" tickLine={false} />
                    <YAxis dataKey="feature" type="category" stroke="#94a3b8" tickLine={false} width={130} textAnchor="end" />
                    <ReferenceLine x={0} stroke="#475569" strokeDasharray="3 3" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#162033", borderColor: "#1f2d47", borderRadius: "8px", color: "#f8fafc" }}
                      formatter={(val: number) => [val > 0 ? `+${val.toFixed(2)} (Risk)` : `${val.toFixed(2)} (Safe)`, "Impact"]}
                    />
                    <Bar dataKey="impact" radius={4}>
                      {selectedStudent.shap.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.impact > 0 ? "#ef4444" : "#10b981"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Past Advisor Interventions */}
            <div className="mt-6 pt-5 border-t border-slate-800">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                Intervention History
              </h4>
              <div className="space-y-2.5">
                {savedLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-xs">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="font-semibold text-blue-400 capitalize">{log.type}</span>
                      <span className="font-mono text-[10px]">{log.date}</span>
                    </div>
                    <p className="text-slate-300">{log.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Intervention Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Log Academic Intervention</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIntervention} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">Action Type</label>
                <select
                  value={interventionType}
                  onChange={(e) => setInterventionType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="meeting">1-on-1 Advising Meeting</option>
                  <option value="email">Direct Outreach Email</option>
                  <option value="tutoring">Peer Tutoring Referral</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">Advising Notes</label>
                <textarea
                  rows={4}
                  placeholder="Detail discussion, agreed goals, or tutoring recommendations..."
                  value={interventionNote}
                  onChange={(e) => setInterventionNote(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
