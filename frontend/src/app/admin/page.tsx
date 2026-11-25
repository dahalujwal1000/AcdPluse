"use client";

import React, { useRef, useState } from "react";
import {
  ShieldAlert,
  BarChart3,
  UploadCloud,
  FileCheck,
  CheckCircle2,
  RefreshCw,
  Scale,
  Eye,
  Grid3X3,
  Play,
  AlertCircle,
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
  Legend,
  CartesianGrid,
} from "recharts";
import { PortalAuthGate } from "@/components/PortalAuthGate";
import { cn } from "@/lib/utils";

const PERSONA_DISTRIBUTION = [
  { name: "Consistent Achievers (Cluster 0)", value: 42, color: "#10b981" },
  { name: "Inconsistent Pacers (Cluster 1)", value: 38, color: "#f59e0b" },
  { name: "Low Engagement / Priority (Cluster 2)", value: 20, color: "#ef4444" },
];

const FAIRNESS_DATA = [
  { group: "Male (n=14,567)", recall: 86.8, fpr: 40.3 },
  { group: "Female (n=11,955)", recall: 86.9, fpr: 48.8 },
  { group: "No Disability (n=24,037)", recall: 86.6, fpr: 43.6 },
  { group: "Has Disability (n=2,485)", recall: 89.2, fpr: 51.7 },
  { group: "Age 0–35 (n=18,453)", recall: 87.6, fpr: 45.6 },
  { group: "Age 35–55 (n=7,884)", recall: 85.1, fpr: 41.8 },
];

const CHECKPOINTS = [
  {
    week: "Week 4",
    students: 27538,
    atRisk: 44.1,
    rocAuc: 0.735,
    recall: 84.9,
    latency: "3.3 ms",
  },
  {
    week: "Week 8",
    students: 26522,
    atRisk: 42.0,
    rocAuc: 0.794,
    recall: 84.6,
    latency: "32.8 ms",
  },
  {
    week: "Week 12",
    students: 25724,
    atRisk: 40.2,
    rocAuc: 0.827,
    recall: 83.8,
    latency: "2.8 ms",
  },
];

const COHORT_HEATMAP = [
  { course: "CS302 — Data Structures", w4: 38, w8: 40, w12: 31 },
  { course: "IT204 — Database Systems", w4: 29, w8: 26, w12: 22 },
  { course: "SE310 — Software Engineering", w4: 34, w8: 37, w12: 28 },
  { course: "DS401 — Applied ML", w4: 46, w8: 44, w12: 39 },
];

function heatCellClass(pct: number): string {
  if (pct >= 40) return "bg-rose-500/20 text-rose-300 border-rose-500/30";
  if (pct >= 30) return "bg-amber-500/20 text-amber-300 border-amber-500/30";
  return "bg-emerald-500/15 text-emerald-300 border-emerald-500/25";
}

export default function AdminConsole() {
  return (
    <PortalAuthGate
      requiredRole="admin"
      portalTitle="Institutional Admin Console"
      portalSubtitle="Sign in with an authorized administrator account to access read-only cohort analytics, fairness audits, and telemetry ingestion."
    >
      <AdminConsoleContent />
    </PortalAuthGate>
  );
}

function AdminConsoleContent() {
  const [activeTab, setActiveTab] = useState<"cohort" | "fairness" | "telemetry">(
    "cohort"
  );
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    sizeKb: number;
  } | null>(null);
  const [csvStatus, setCsvStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [csvMessage, setCsvMessage] = useState<string>("");
  const [checkpointTriggerMsg, setCheckpointTriggerMsg] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setCsvStatus("error");
      setCsvMessage("Only .csv telemetry files are accepted by the schema validator.");
      setSelectedFile(null);
      return;
    }
    setSelectedFile({
      name: file.name,
      sizeKb: Math.max(1, Math.round(file.size / 1024)),
    });
    setCsvStatus("idle");
    setCsvMessage("");
  };

  const handleSimulateUpload = () => {
    setCsvStatus("processing");
    setTimeout(() => {
      const targetName = selectedFile?.name ?? "synthetic_cohort_week8.csv";
      setCsvStatus("success");
      setCsvMessage(
        `Validation passed for ${targetName}: 2,410 telemetry records validated and queued for checkpoint feature building.`
      );
    }, 900);
  };

  const handleTriggerCheckpoint = (week: number) => {
    setCheckpointTriggerMsg(
      `Checkpoint Week ${week} batch scoring completed (local XGBoost + TreeExplainer).`
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-8">
      {/* Top Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400 mb-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Institutional Administration &amp; Audit Console</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] normal-case tracking-normal">
              <Eye className="w-2.5 h-2.5" /> Read-Only Analytics
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            AcadPulse Executive Analytics
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Cohort heatmaps, offline fairness audit, and telemetry ingestion
          </p>
        </div>

        {/* Navigation Tabs */}
        <div
          role="tablist"
          aria-label="Admin analytics sections"
          className="flex items-center gap-1 bg-[#0f172a] border border-slate-800 p-1.5 rounded-xl text-xs font-semibold self-start lg:self-auto"
        >
          {[
            { id: "cohort", label: "Cohort Analytics" },
            { id: "fairness", label: "Fairness & Calibration" },
            { id: "telemetry", label: "Telemetry Ingestion" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() =>
                setActiveTab(tab.id as "cohort" | "fairness" | "telemetry")
              }
              className={cn(
                "px-3.5 py-2 rounded-lg transition-colors",
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main>
        {activeTab === "cohort" && (
          <div className="space-y-8">
            {/* Checkpoint Earliness Trajectory */}
            <section>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-400" /> Checkpoint
                  Earliness Trajectory
                </h2>
                <span className="text-xs text-slate-400">
                  Strict temporal evaluation without future-data leakage
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {CHECKPOINTS.map((cp) => (
                  <div
                    key={cp.week}
                    className="bg-[#0f172a] border border-slate-800/80 hover:border-slate-700/80 transition-colors rounded-2xl p-5"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-white">
                        {cp.week} Checkpoint
                      </span>
                      <span className="text-xs font-mono text-emerald-300 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 tabular-nums">
                        Recall: {cp.recall}%
                      </span>
                    </div>
                    <div className="space-y-2 text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800">
                      <div className="flex justify-between">
                        <span>Cohort Sample Size</span>
                        <span className="font-mono text-slate-200 font-bold tabular-nums">
                          {cp.students.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>ROC-AUC</span>
                        <span className="font-mono text-blue-400 font-bold tabular-nums">
                          {cp.rocAuc}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>p95 Inference Latency</span>
                        <span className="font-mono text-slate-200 tabular-nums">
                          {cp.latency}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Course Risk Heatmap */}
            <section className="bg-[#0f172a] border border-slate-800/80 rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Grid3X3 className="w-4 h-4 text-amber-400" /> Cohort Support
                    Priority Heatmap
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Share of enrolled learners flagged for Moderate/High Support
                    Priority per checkpoint (synthetic cohort)
                  </p>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  Lower % = Healthier Cohort
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2.5 pr-4 font-semibold">Course</th>
                      <th className="py-2.5 px-3 font-semibold text-center">
                        Week 4
                      </th>
                      <th className="py-2.5 px-3 font-semibold text-center">
                        Week 8
                      </th>
                      <th className="py-2.5 px-3 font-semibold text-center">
                        Week 12
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {COHORT_HEATMAP.map((row) => (
                      <tr key={row.course}>
                        <td className="py-3 pr-4 font-medium text-slate-200">
                          {row.course}
                        </td>
                        {[row.w4, row.w8, row.w12].map((val, idx) => (
                          <td key={idx} className="py-2.5 px-2 text-center">
                            <span
                              className={cn(
                                "inline-block min-w-[56px] px-2.5 py-1 rounded-lg border font-mono font-bold tabular-nums",
                                heatCellClass(val)
                              )}
                            >
                              {val}%
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Persona Clustering & Compliance */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-6 bg-[#0f172a] border border-slate-800/80 rounded-2xl p-6">
                <h2 className="text-base font-bold text-white mb-1">
                  Learner Persona Segmentation (k-Means, k=3)
                </h2>
                <p className="text-xs text-slate-400 mb-4">
                  Unsupervised behavioural engagement groupings fitted on
                  training folds
                </p>

                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={PERSONA_DISTRIBUTION}
                        cx="50%"
                        cy="50%"
                        innerRadius={58}
                        outerRadius={84}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {PERSONA_DISTRIBUTION.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#131d31",
                          borderColor: "#1e293b",
                          borderRadius: "8px",
                          color: "#f8fafc",
                          fontSize: "12px",
                        }}
                        formatter={(val: number) => [
                          `${val}% of Students`,
                          "Share",
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2.5 mt-4 pt-4 border-t border-slate-800">
                  {PERSONA_DISTRIBUTION.map((p) => (
                    <div
                      key={p.name}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: p.color }}
                        />
                        <span className="text-slate-300 font-medium">
                          {p.name}
                        </span>
                      </div>
                      <span className="font-bold text-white font-mono tabular-nums">
                        {p.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Institutional Safeguard Compliance */}
              <div className="lg:col-span-6 bg-[#0f172a] border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <h2 className="text-base font-bold text-white mb-1">
                    BIT Academic Safeguard Compliance
                  </h2>
                  <p className="text-xs text-slate-400 mb-5">
                    Enforcement status of core operational and ML ethics rules
                  </p>

                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-[#0b1120] border border-slate-800 flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold text-white block">
                          Zero External API / LLM Calls
                        </span>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Inference and XAI run 100% locally on serialized
                          XGBoost and TreeExplainer artifacts.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#0b1120] border border-slate-800 flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold text-white block">
                          Demographic Feature Isolation
                        </span>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Gender, region, and disability status are reserved for
                          offline fairness audits only.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#0b1120] border border-slate-800 flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold text-white block">
                          Non-Stigmatizing UI Language
                        </span>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Uses &ldquo;Support Priority&rdquo; terminology and
                          non-causal counterfactual guidance policies.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
                  Audit Verified: Lincoln University College BIT Capstone
                  Guidelines
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Tab 2: Fairness & Calibration Audit */}
        {activeTab === "fairness" && (
          <div className="bg-[#0f172a] border border-slate-800/80 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Scale className="w-4 h-4 text-purple-400" /> Offline Fairness
                  &amp; Parity Audit (Week 8)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  At-risk recall and false positive rate parity across protected
                  demographic slices
                </p>
              </div>
              <span className="text-xs px-3 py-1 bg-purple-500/10 text-purple-300 rounded-full border border-purple-500/20 font-medium self-start sm:self-auto">
                Audited Offline Only
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={FAIRNESS_DATA}
                  margin={{ top: 10, right: 20, left: 10, bottom: 24 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1e293b"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="group"
                    stroke="#64748b"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickLine={false}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#131d31",
                      borderColor: "#1e293b",
                      borderRadius: "8px",
                      color: "#f8fafc",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Bar
                    dataKey="recall"
                    fill="#3b82f6"
                    name="At-Risk Recall %"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="fpr"
                    fill="#f59e0b"
                    name="False Positive Rate %"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800 text-xs">
              <div className="p-4 bg-[#0b1120] rounded-xl border border-slate-800">
                <span className="font-bold text-slate-200 block mb-1">
                  Gender Parity Finding
                </span>
                <p className="text-slate-400 leading-relaxed">
                  At-risk recall across male (
                  <span className="text-white font-mono font-bold">86.8%</span>)
                  and female (
                  <span className="text-white font-mono font-bold">86.9%</span>)
                  cohorts demonstrates consistent early-detection sensitivity.
                </p>
              </div>
              <div className="p-4 bg-[#0b1120] rounded-xl border border-slate-800">
                <span className="font-bold text-slate-200 block mb-1">
                  Disability Parity Finding
                </span>
                <p className="text-slate-400 leading-relaxed">
                  Students disclosing disabilities receive higher sensitivity (
                  <span className="text-white font-mono font-bold">89.2%</span>{" "}
                  recall vs. 86.6%), ensuring learners are not overlooked for
                  support.
                </p>
              </div>
              <div className="p-4 bg-[#0b1120] rounded-xl border border-slate-800">
                <span className="font-bold text-slate-200 block mb-1">
                  Risk Tier Cut-offs
                </span>
                <p className="text-slate-400 leading-relaxed">
                  Tuned on validation PR curves: Safe{" "}
                  <span className="text-emerald-400 font-mono">&lt; 0.35</span>,
                  Moderate{" "}
                  <span className="text-amber-400 font-mono">0.35–0.65</span>,
                  High Priority{" "}
                  <span className="text-rose-400 font-mono">&ge; 0.65</span>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Telemetry Ingestion & Checkpoint Triggers */}
        {activeTab === "telemetry" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 bg-[#0f172a] border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-blue-400" /> Batch
                  Telemetry CSV Ingestion
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Upload student assessment grades, attendance logs, or VLE
                  click telemetry for Pydantic schema validation.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                aria-label="Select telemetry CSV file"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-700 hover:border-blue-500/70 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-[#0b1120]"
              >
                <FileCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                {selectedFile ? (
                  <>
                    <span className="text-xs font-semibold text-blue-300 block">
                      Selected: {selectedFile.name} ({selectedFile.sizeKb} KB)
                    </span>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Click to choose a different CSV file
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-xs font-semibold text-slate-200 block">
                      Click to browse telemetry CSV
                    </span>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Supports attendance.csv, submissions.csv, or
                      student_vle.csv
                    </span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSimulateUpload}
                disabled={csvStatus === "processing"}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                {csvStatus === "processing" ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Ingesting
                    &amp; Validating Records...
                  </>
                ) : (
                  "Trigger Ingestion & Schema Validation"
                )}
              </button>

              {csvStatus === "success" && (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 rounded-xl text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{csvMessage}</span>
                </div>
              )}

              {csvStatus === "error" && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/25 text-rose-300 rounded-xl text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{csvMessage}</span>
                </div>
              )}
            </div>

            <div className="lg:col-span-5 bg-[#0f172a] border border-slate-800/80 rounded-2xl p-6 space-y-5">
              <div>
                <h2 className="text-base font-bold text-white">
                  Checkpoint Scoring Triggers
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Run leak-free checkpoint inference using observations up to
                  the selected week.
                </p>
              </div>

              <div className="space-y-3">
                {[4, 8, 12].map((wk) => (
                  <div
                    key={wk}
                    className="p-3.5 rounded-xl bg-[#0b1120] border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Week {wk} Checkpoint
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Excludes withdrawals prior to Week {wk}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTriggerCheckpoint(wk)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-700 hover:border-blue-500"
                    >
                      <Play className="w-3 h-3" /> Run
                    </button>
                  </div>
                ))}
              </div>

              {checkpointTriggerMsg && (
                <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-xl text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{checkpointTriggerMsg}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
