"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Users,
  Search,
  FileText,
  ChevronRight,
  Sparkles,
  Send,
  X,
  ArrowUpDown,
  SearchX,
  Clock,
  CheckCircle2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { StatusBadge, type SupportTier } from "@/components/StatusBadge";
import { PortalAuthGate } from "@/components/PortalAuthGate";
import { cn } from "@/lib/utils";

interface StudentRow {
  id: string;
  name: string;
  email: string;
  riskProb: number;
  tier: SupportTier;
  persona: string;
  personaCluster: number;
  engagement: number;
  scoreMean: number;
  lateSubs: number;
  lastActive: string;
  shap: { feature: string; impact: number }[];
}

interface InterventionLog {
  id: string;
  studentId: string;
  type: "meeting" | "email" | "tutoring";
  note: string;
  status: "pending" | "in_progress" | "completed";
  date: string;
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
    persona: "Low Engagement",
    personaCluster: 2,
    engagement: 0.32,
    scoreMean: 48.0,
    lateSubs: 3,
    lastActive: "6 days ago",
    shap: [
      { feature: "Rolling Engagement", impact: 0.22 },
      { feature: "Assessment Score Mean", impact: 0.16 },
      { feature: "VLE Click Volume", impact: 0.1 },
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
      { feature: "Late Submissions (1)", impact: 0.04 },
      { feature: "Assessment Score Mean", impact: -0.03 },
    ],
  },
];

const INITIAL_LOGS: InterventionLog[] = [
  {
    id: "LOG-1",
    studentId: "STD-8812",
    type: "email",
    note: "Sent Week 4 check-in regarding TMA1 deadline and lab attendance.",
    status: "completed",
    date: "Oct 12, 2026",
  },
  {
    id: "LOG-2",
    studentId: "STD-9023",
    type: "meeting",
    note: "Scheduled 1-on-1 advising session to review missed VLE modules.",
    status: "in_progress",
    date: "Nov 02, 2026",
  },
  {
    id: "LOG-3",
    studentId: "STD-5524",
    type: "tutoring",
    note: "Referred to peer tutoring lab for recursion & tree traversal.",
    status: "pending",
    date: "Nov 05, 2026",
  },
];

const NEXT_STATUS: Record<InterventionLog["status"], InterventionLog["status"]> = {
  pending: "in_progress",
  in_progress: "completed",
  completed: "pending",
};

const STATUS_STYLES: Record<InterventionLog["status"], string> = {
  pending: "bg-slate-800 text-slate-300 border-slate-700",
  in_progress: "bg-amber-500/10 text-amber-300 border-amber-500/25",
  completed: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
};

export default function TeacherPortal() {
  return (
    <PortalAuthGate
      requiredRole="teacher"
      portalTitle="Teacher & Advisor Portal"
      portalSubtitle="Sign in with an authorized instructor account to view cohort Support Priority rosters, SHAP attributions, and intervention logs."
    >
      <TeacherPortalContent />
    </PortalAuthGate>
  );
}

function TeacherPortalContent() {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    MOCK_COHORT[0].id
  );
  const [filterTier, setFilterTier] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"risk" | "engagement" | "name">("risk");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [interventionNote, setInterventionNote] = useState<string>("");
  const [interventionType, setInterventionType] =
    useState<InterventionLog["type"]>("meeting");
  const [savedLogs, setSavedLogs] = useState<InterventionLog[]>(INITIAL_LOGS);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    if (modalOpen) {
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }
  }, [modalOpen]);

  const filteredCohort = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const list = MOCK_COHORT.filter((s) => {
      const matchesTier =
        filterTier === "all" || s.tier.toLowerCase() === filterTier.toLowerCase();
      const matchesSearch =
        !query ||
        s.name.toLowerCase().includes(query) ||
        s.id.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query);
      return matchesTier && matchesSearch;
    });

    return [...list].sort((a, b) => {
      if (sortBy === "risk") return b.riskProb - a.riskProb;
      if (sortBy === "engagement") return a.engagement - b.engagement;
      return a.name.localeCompare(b.name);
    });
  }, [filterTier, searchQuery, sortBy]);

  const selectedStudent = useMemo(
    () =>
      MOCK_COHORT.find((s) => s.id === selectedStudentId) ?? MOCK_COHORT[0],
    [selectedStudentId]
  );

  const studentLogs = useMemo(
    () => savedLogs.filter((log) => log.studentId === selectedStudent.id),
    [savedLogs, selectedStudent.id]
  );

  const handleSaveIntervention = (e: React.FormEvent) => {
    e.preventDefault();
    if (!interventionNote.trim()) return;
    setSavedLogs((prev) => [
      {
        id: `LOG-${Date.now()}`,
        studentId: selectedStudent.id,
        type: interventionType,
        note: interventionNote.trim(),
        status: "pending",
        date: "Just now",
      },
      ...prev,
    ]);
    setInterventionNote("");
    setModalOpen(false);
  };

  const toggleLogStatus = (logId: string) => {
    setSavedLogs((prev) =>
      prev.map((log) =>
        log.id === logId ? { ...log, status: NEXT_STATUS[log.status] } : log
      )
    );
  };

  const highCount = MOCK_COHORT.filter((s) => s.tier === "High").length;
  const modCount = MOCK_COHORT.filter((s) => s.tier === "Moderate").length;
  const safeCount = MOCK_COHORT.filter((s) => s.tier === "Safe").length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-8">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>Teacher &amp; Advisor Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            CS302 Cohort Support Roster
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Data Structures &amp; Algorithms • Active Checkpoint: Week 8
          </p>
        </div>

        {/* Top Cohort Stats Summary */}
        <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
          <div className="px-3.5 py-2.5 bg-[#0f172a] border border-slate-800 rounded-xl text-center">
            <span className="text-[11px] text-slate-400 block font-medium">
              Cohort
            </span>
            <span className="text-base font-bold text-white font-mono tabular-nums">
              {MOCK_COHORT.length}
            </span>
          </div>
          <div className="px-3.5 py-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center">
            <span className="text-[11px] text-rose-300 block font-medium">
              Priority
            </span>
            <span className="text-base font-bold text-rose-400 font-mono tabular-nums">
              {highCount}
            </span>
          </div>
          <div className="px-3.5 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
            <span className="text-[11px] text-amber-300 block font-medium">
              Moderate
            </span>
            <span className="text-base font-bold text-amber-400 font-mono tabular-nums">
              {modCount}
            </span>
          </div>
          <div className="px-3.5 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
            <span className="text-[11px] text-emerald-300 block font-medium">
              Safe
            </span>
            <span className="text-base font-bold text-emerald-400 font-mono tabular-nums">
              {safeCount}
            </span>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Student Roster (7 Cols) */}
        <section className="lg:col-span-7 space-y-4">
          {/* Controls: Search, Filter, Sort */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                aria-label="Search students by name, ID, or email"
                placeholder="Search student by name, ID, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0f172a] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div
                role="group"
                aria-label="Filter by support priority"
                className="flex items-center gap-1 bg-[#0f172a] border border-slate-800 rounded-xl p-1 text-xs"
              >
                {[
                  { key: "all", label: "All" },
                  { key: "high", label: "Priority" },
                  { key: "moderate", label: "Moderate" },
                  { key: "safe", label: "Safe" },
                ].map((tier) => (
                  <button
                    key={tier.key}
                    type="button"
                    onClick={() => setFilterTier(tier.key)}
                    className={cn(
                      "px-2.5 py-1.5 rounded-lg font-semibold transition-colors",
                      filterTier === tier.key
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:text-slate-200"
                    )}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>

              <div className="relative flex items-center">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                <select
                  aria-label="Sort student roster"
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as "risk" | "engagement" | "name")
                  }
                  className="bg-[#0f172a] border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="risk">Highest Priority</option>
                  <option value="engagement">Lowest Engagement</option>
                  <option value="name">Name (A–Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Roster Cards or Empty State */}
          {filteredCohort.length === 0 ? (
            <div className="bg-[#0f172a] border border-slate-800/80 rounded-2xl p-10 text-center space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto">
                <SearchX className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-white">
                No matching students found
              </h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Try adjusting your search query or clearing the Support Priority
                filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setFilterTier("all");
                }}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-xl border border-slate-700 transition-colors"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredCohort.map((student) => {
                const isSelected = selectedStudent.id === student.id;
                return (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => setSelectedStudentId(student.id)}
                    className={cn(
                      "w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                      isSelected
                        ? "bg-[#131d31] border-blue-500/70 shadow-lg shadow-blue-500/5"
                        : "bg-[#0f172a] border-slate-800/80 hover:bg-[#131d31]/70 hover:border-slate-700"
                    )}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700/70 flex items-center justify-center font-bold text-xs text-slate-200 font-mono shrink-0">
                        {student.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-white truncate">
                            {student.name}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            {student.id}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 flex-wrap">
                          <span className="text-slate-300 font-medium">
                            {student.persona}
                          </span>
                          <span className="text-slate-600">•</span>
                          <span className="tabular-nums">
                            Eng: {(student.engagement * 100).toFixed(0)}%
                          </span>
                          <span className="text-slate-600">•</span>
                          <span className="tabular-nums">
                            Mean: {student.scoreMean}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right space-y-1">
                        <span className="text-sm font-bold font-mono tabular-nums text-white block">
                          {(student.riskProb * 100).toFixed(0)}%
                        </span>
                        <StatusBadge
                          tier={student.tier}
                          size="sm"
                          showIcon={false}
                        />
                      </div>
                      <ChevronRight
                        className={cn(
                          "w-4 h-4 transition-transform",
                          isSelected
                            ? "text-blue-400 translate-x-0.5"
                            : "text-slate-600"
                        )}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Right Column: Diagnostic Inspection & SHAP Waterfall (5 Cols) */}
        <section className="lg:col-span-5">
          <div className="bg-[#0f172a] border border-slate-800/80 rounded-2xl p-6 lg:sticky lg:top-24 space-y-6">
            {/* Student Header */}
            <div className="flex items-start justify-between gap-3 pb-5 border-b border-slate-800">
              <div>
                <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">
                  Diagnostic Inspection
                </span>
                <h2 className="text-lg font-bold text-white mt-0.5">
                  {selectedStudent.name}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedStudent.email} • {selectedStudent.id}
                </p>
                <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                  <Clock className="w-3 h-3" />
                  <span>Last active: {selectedStudent.lastActive}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm shrink-0"
              >
                <FileText className="w-3.5 h-3.5" /> Log Action
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 bg-[#0b1120] rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">
                  Support Priority
                </span>
                <span className="text-lg font-bold text-white font-mono tabular-nums mt-0.5 block">
                  {(selectedStudent.riskProb * 100).toFixed(0)}%
                </span>
              </div>
              <div className="p-3.5 bg-[#0b1120] rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">
                  Engagement
                </span>
                <span className="text-lg font-bold text-white font-mono tabular-nums mt-0.5 block">
                  {(selectedStudent.engagement * 100).toFixed(0)}%
                </span>
              </div>
              <div className="p-3.5 bg-[#0b1120] rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">
                  Late Tasks
                </span>
                <span className="text-lg font-bold text-white font-mono tabular-nums mt-0.5 block">
                  {selectedStudent.lateSubs}
                </span>
              </div>
            </div>

            {/* SHAP Attribution Chart */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> SHAP
                  Feature Attributions
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  Week 8 Checkpoint
                </span>
              </div>

              <div className="h-48 w-full bg-[#0b1120] border border-slate-800/80 rounded-xl p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={selectedStudent.shap}
                    margin={{ top: 6, right: 16, left: 10, bottom: 6 }}
                  >
                    <XAxis
                      type="number"
                      domain={[-0.25, 0.25]}
                      stroke="#64748b"
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      tickLine={false}
                    />
                    <YAxis
                      dataKey="feature"
                      type="category"
                      stroke="#94a3b8"
                      tick={{ fontSize: 11, fill: "#cbd5e1" }}
                      tickLine={false}
                      width={132}
                    />
                    <ReferenceLine x={0} stroke="#475569" strokeDasharray="3 3" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#131d31",
                        borderColor: "#1e293b",
                        borderRadius: "8px",
                        color: "#f8fafc",
                        fontSize: "12px",
                      }}
                      formatter={(val: number) => [
                        val > 0
                          ? `+${val.toFixed(2)} (Increases Priority)`
                          : `${val.toFixed(2)} (Fosters Success)`,
                        "SHAP Impact",
                      ]}
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

            {/* Per-Student Advisor Interventions */}
            <div className="pt-5 border-t border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Intervention History ({studentLogs.length})
                </h3>
                <span className="text-[11px] text-slate-400">
                  Click status to update
                </span>
              </div>

              {studentLogs.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#0b1120] border border-slate-800/80 text-center text-xs text-slate-400">
                  No interventions logged for {selectedStudent.name} yet.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {studentLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3.5 bg-[#0b1120] rounded-xl border border-slate-800/80 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-blue-400 capitalize">
                            {log.type}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleLogStatus(log.id)}
                            className={cn(
                              "px-2 py-0.5 rounded-full border text-[10px] font-semibold capitalize inline-flex items-center gap-1 transition-colors",
                              STATUS_STYLES[log.status]
                            )}
                          >
                            {log.status === "completed" && (
                              <CheckCircle2 className="w-2.5 h-2.5" />
                            )}
                            {log.status.replace("_", " ")}
                          </button>
                        </div>
                        <span className="font-mono text-[10px] text-slate-400">
                          {log.date}
                        </span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{log.note}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Intervention Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="intervention-modal-title"
          onClick={() => setModalOpen(false)}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3
                  id="intervention-modal-title"
                  className="text-base font-bold text-white"
                >
                  Log Academic Intervention
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  For {selectedStudent.name} ({selectedStudent.id})
                </p>
              </div>
              <button
                type="button"
                aria-label="Close modal"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIntervention} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="intervention-type"
                  className="text-xs font-medium text-slate-300 block mb-1.5"
                >
                  Action Type
                </label>
                <select
                  id="intervention-type"
                  value={interventionType}
                  onChange={(e) =>
                    setInterventionType(
                      e.target.value as InterventionLog["type"]
                    )
                  }
                  className="w-full bg-[#0b1120] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="meeting">1-on-1 Advising Meeting</option>
                  <option value="email">Direct Outreach Email</option>
                  <option value="tutoring">Peer Tutoring Referral</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="intervention-notes"
                  className="text-xs font-medium text-slate-300 block mb-1.5"
                >
                  Advising Notes
                </label>
                <textarea
                  id="intervention-notes"
                  rows={4}
                  placeholder="Detail discussion, agreed goals, or tutoring recommendations..."
                  value={interventionNote}
                  onChange={(e) => setInterventionNote(e.target.value)}
                  className="w-full bg-[#0b1120] border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
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
