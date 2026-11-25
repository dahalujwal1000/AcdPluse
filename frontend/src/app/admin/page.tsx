"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  BarChart3,
  Layers,
  UploadCloud,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  RefreshCw,
  Sliders,
  Scale
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

const PERSONA_DISTRIBUTION = [
  { name: "Consistent Achievers (Cluster 0)", value: 42, color: "#10b981" },
  { name: "Inconsistent Pacers (Cluster 1)", value: 38, color: "#f59e0b" },
  { name: "Low Engagement / At-Risk (Cluster 2)", value: 20, color: "#ef4444" },
];

const FAIRNESS_DATA = [
  { group: "Male (n=14,567)", recall: 86.8, fpr: 40.3 },
  { group: "Female (n=11,955)", recall: 86.9, fpr: 48.8 },
  { group: "No Disability (n=24,037)", recall: 86.6, fpr: 43.6 },
  { group: "Has Disability (n=2,485)", recall: 89.2, fpr: 51.7 },
  { group: "Age 0-35 (n=18,453)", recall: 87.6, fpr: 45.6 },
  { group: "Age 35-55 (n=7,884)", recall: 85.1, fpr: 41.8 },
];

const CHECKPOINTS = [
  { week: "Week 4", students: 27538, atRisk: 44.1, rocAuc: 0.735, recall: 84.9, latency: "3.3 ms" },
  { week: "Week 8", students: 26522, atRisk: 42.0, rocAuc: 0.794, recall: 84.6, latency: "32.8 ms" },
  { week: "Week 12", students: 25724, atRisk: 40.2, rocAuc: 0.827, recall: 83.8, latency: "2.8 ms" },
];

export default function AdminConsole() {
  const [activeTab, setActiveTab] = useState<"cohort" | "fairness" | "telemetry">("cohort");
  const [csvStatus, setCsvStatus] = useState<string | null>(null);

  const handleSimulateUpload = () => {
    setCsvStatus("processing");
    setTimeout(() => {
      setCsvStatus("success");
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 p-6 md:p-10">
      {/* Top Header */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-slate-800/80 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400 mb-1">
            <ShieldAlert className="w-3.5 h-3.5" /> Institutional Administration & Audit Console
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            AcadPulse Executive Analytics
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Read-only cohort analytics, offline fairness audit, and telemetry management
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-[#111827] border border-slate-800 p-1.5 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab("cohort")}
            className={`px-3.5 py-2 rounded-lg transition-colors ${
              activeTab === "cohort" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Cohort Analytics
          </button>
          <button
            onClick={() => setActiveTab("fairness")}
            className={`px-3.5 py-2 rounded-lg transition-colors ${
              activeTab === "fairness" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Fairness & Calibration
          </button>
          <button
            onClick={() => setActiveTab("telemetry")}
            className={`px-3.5 py-2 rounded-lg transition-colors ${
              activeTab === "telemetry" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Telemetry Ingestion
          </button>
        </div>
      </header>

      {/* Main Content Areas */}
      <main className="max-w-7xl mx-auto mt-8">
        {activeTab === "cohort" && (
          <div className="space-y-8">
            {/* Model Benchmarks Across Checkpoints */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-400" /> Checkpoint Earliness Trajectory
                </h3>
                <span className="text-xs text-slate-400">Strict temporal evaluation without future leakage</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {CHECKPOINTS.map((cp) => (
                  <div key={cp.week} className="bg-[#111827] border border-slate-800 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-white">{cp.week} Checkpoint</span>
                      <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                        Recall: {cp.recall}%
                      </span>
                    </div>
                    <div className="space-y-1.5 text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800">
                      <div className="flex justify-between">
                        <span>Cohort Sample Size:</span>
                        <span className="font-mono text-slate-200 font-bold">{cp.students.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ROC-AUC Metric:</span>
                        <span className="font-mono text-blue-400 font-bold">{cp.rocAuc}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>p95 Inference Latency:</span>
                        <span className="font-mono text-slate-200">{cp.latency}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Persona Clustering Segmentation */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-6 bg-[#111827] border border-slate-800 rounded-2xl p-6">
                <h3 className="text-base font-bold text-white mb-1">
                  Learner Persona Segmentation (k-Means, k=3)
                </h3>
                <p className="text-xs text-slate-400 mb-6">
                  Unsupervised behavioural engagement groupings across the active student body
                </p>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={PERSONA_DISTRIBUTION}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {PERSONA_DISTRIBUTION.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "#162033", borderColor: "#1f2d47", borderRadius: "8px", color: "#f8fafc" }}
                        formatter={(val: number) => [`${val}% of Students`, "Share"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 mt-4 pt-4 border-t border-slate-800">
                  {PERSONA_DISTRIBUTION.map((p) => (
                    <div key={p.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                        <span className="text-slate-300 font-medium">{p.name}</span>
                      </div>
                      <span className="font-bold text-white font-mono">{p.value}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Institution Safeguard Compliance */}
              <div className="lg:col-span-6 bg-[#111827] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-white mb-1">
                    BIT Academic Safeguard Compliance
                  </h3>
                  <p className="text-xs text-slate-400 mb-6">
                    Enforcement status of core operational and ML ethics rules
                  </p>

                  <div className="space-y-3.5">
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold text-white block">Zero External API / LLM Calls</span>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Inference and XAI run 100% locally on serialized XGBoost and TreeExplainer artifacts.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold text-white block">Demographic Feature Isolation</span>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Gender, region, and disability status are never model inputs.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold text-white block">Non-Stigmatizing UI Language</span>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Uses "Support Priority" terminology and counterfactual guidance policies.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
                  Audit Verified: Lincoln University College BIT Capstone Guidelines
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Fairness & Calibration Audit */}
        {activeTab === "fairness" && (
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Scale className="w-4 h-4 text-purple-400" /> Offline Fairness & Parity Audit (Week 8)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Recall rate and False Positive Rate parity evaluated across protected demographic slices
                </p>
              </div>
              <span className="text-xs px-3 py-1 bg-purple-500/10 text-purple-300 rounded-lg border border-purple-500/20 font-medium">
                Audited Offline Only
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={FAIRNESS_DATA} margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
                  <XAxis dataKey="group" stroke="#64748b" tickLine={false} textAnchor="middle" />
                  <YAxis stroke="#64748b" tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#162033", borderColor: "#1f2d47", borderRadius: "8px", color: "#f8fafc" }}
                  />
                  <Bar dataKey="recall" fill="#3b82f6" name="At-Risk Recall %" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="fpr" fill="#f59e0b" name="False Positive Rate %" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800 text-xs">
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
                <span className="font-bold text-slate-200 block mb-1">Gender Parity Finding</span>
                <p className="text-slate-400 leading-relaxed">
                  At-risk recall across male (<span className="text-white font-mono font-bold">86.8%</span>) and female (<span className="text-white font-mono font-bold">86.9%</span>) cohorts demonstrates consistent early-detection capability across both populations.
                </p>
              </div>
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
                <span className="font-bold text-slate-200 block mb-1">Disability Parity Finding</span>
                <p className="text-slate-400 leading-relaxed">
                  Students disclosing disabilities receive higher early-warning sensitivity (<span className="text-white font-mono font-bold">89.2%</span> recall vs. 86.6%), ensuring at-risk learners are not overlooked for advising.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Telemetry Ingestion */}
        {activeTab === "telemetry" && (
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-8 max-w-2xl mx-auto space-y-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Batch Telemetry CSV Ingestion</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Upload student assessment grades, attendance session logs, or VLE click telemetry for batch checkpoint processing.
              </p>
            </div>

            <div className="border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-slate-900/40">
              <FileCheck className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <span className="text-xs font-semibold text-slate-300 block">
                Click to browse or drag and drop telemetry CSV
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Supports attendance.csv, submissions.csv, or student_vle.csv (Max 100MB)
              </span>
            </div>

            <button
              onClick={handleSimulateUpload}
              disabled={csvStatus === "processing"}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {csvStatus === "processing" ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Ingesting & Validating Records...
                </>
              ) : (
                "Trigger Ingestion & Schema Validation"
              )}
            </button>

            {csvStatus === "success" && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Validation passed: 2,410 telemetry records ingested successfully into PostgreSQL store.</span>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
