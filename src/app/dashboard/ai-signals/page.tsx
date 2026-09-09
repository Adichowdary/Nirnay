"use client";

import { useState } from "react";
import Link from "next/link";
import { DEMO_AI_SIGNALS } from "@/lib/demo-data";
import { createIssue } from "@/lib/issues/issue-store";
import {
  Brain, AlertCircle, AlertTriangle, CheckCircle, Eye,
  ChevronRight, Info, Shield, Zap, Sparkles, Check, BellRing,
} from "lucide-react";
import type { AISignalSeverity } from "@/types";

const SEVERITY_CONFIG: Record<AISignalSeverity, {
  bg: string; text: string; border: string; icon: React.FC<{ size: number }>;
}> = {
  critical: {
    bg: "var(--color-danger-bg)", text: "var(--color-danger)", border: "var(--red-500)",
    icon: ({ size }) => <AlertCircle size={size} style={{ color: "var(--color-danger)" }} />,
  },
  high: {
    bg: "var(--color-warning-bg)", text: "var(--color-warning)", border: "var(--amber-500)",
    icon: ({ size }) => <AlertTriangle size={size} style={{ color: "var(--color-warning)" }} />,
  },
  medium: {
    bg: "var(--amber-50)", text: "var(--amber-600)", border: "var(--amber-400)",
    icon: ({ size }) => <AlertTriangle size={size} style={{ color: "var(--amber-600)" }} />,
  },
  low: {
    bg: "var(--color-success-bg)", text: "var(--color-success)", border: "var(--green-500)",
    icon: ({ size }) => <CheckCircle size={size} style={{ color: "var(--color-success)" }} />,
  },
};

export default function AISignalsPage() {
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [resolvedSignalIds, setResolvedSignalIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filtered = DEMO_AI_SIGNALS.filter(
    (s) => filterSeverity === "all" || s.severity === filterSeverity
  );

  const handleApplyAIRecommendation = (signal: typeof DEMO_AI_SIGNALS[0]) => {
    // Create an escalation issue in the Issue Store
    createIssue({
      title: `AI Anomaly: ${signal.title}`,
      description: `${signal.explanation.what_happened} Recommended Action: ${signal.explanation.recommended_action}`,
      category: signal.type === "cctv_availability" ? "CCTV_OFFLINE" : signal.type === "attendance_anomaly" ? "ATTENDANCE_ANOMALY" : "INSPECTION_COMPLIANCE",
      priority: signal.severity === "critical" ? "CRITICAL" : "HIGH",
      createdBy: "AI Anomaly Detection Engine",
      assignedTo: "State Admin Directorate",
      assignedToRole: "State Admin",
      stateId: "AP",
      stateName: "Andhra Pradesh",
      districtId: signal.district_name || "Guntur",
      districtName: signal.district_name || "Guntur",
      projectId: signal.project_id,
      projectName: signal.project_name,
    });

    setResolvedSignalIds((prev) => [...prev, signal.id]);
    setToastMessage(`⚡ Applied AI Recommendation for ${signal.project_name}. Escalated issue logged.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto w-full">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-2xl border border-emerald-500/40 flex items-center gap-2 animate-bounce">
          <BellRing size={16} className="text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain size={22} className="text-purple-600" />
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              AI Intelligence Signals &amp; Anomaly Engine
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Automated Anomaly Detection • CCTV Stream Blackout, Biometric Mismatch &amp; Geofence Validation
          </p>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20 flex items-center gap-1.5">
          <Sparkles size={14} /> AI Model Accuracy 94.8%
        </span>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-2xl font-black text-purple-600 font-mono">14.2%</div>
          <div className="text-xs text-slate-500 font-medium mt-1">National Risk Index</div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-2xl font-black text-rose-600 font-mono">{DEMO_AI_SIGNALS.filter(s=>s.severity==='critical').length}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Critical Anomalies</div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-2xl font-black text-amber-600 font-mono">98.4%</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Face Recognition Conf.</div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-2xl font-black text-emerald-600 font-mono">{resolvedSignalIds.length}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Resolved Today</div>
        </div>
      </div>

      {/* AI Human Governance Notice */}
      <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-start gap-3">
        <Info size={18} className="text-purple-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-purple-700 dark:text-purple-300">
            Human-in-the-Loop AI Governance Protocol
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
            All AI signals combine computer vision, CCTV telemetry, and spatial geofencing algorithms. 
            Official actions require human officer validation or Magistrate sign-off.
          </p>
        </div>
      </div>

      {/* Severity Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {["all", "critical", "high", "medium", "low"].map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => setFilterSeverity(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterSeverity === s
                  ? "bg-purple-600 text-white shadow-md"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
              }`}
            >
              {s === "all" ? "All Signals" : s.toUpperCase()}
            </button>
          ))}
        </div>
        <span className="text-xs font-mono text-slate-500">
          Showing {filtered.length} Anomaly Signals
        </span>
      </div>

      {/* Signals List */}
      <div className="space-y-3">
        {filtered.map((signal) => {
          const config = SEVERITY_CONFIG[signal.severity];
          const SeverityIcon = config.icon;
          const isExpanded = expanded === signal.id;
          const isResolved = resolvedSignalIds.includes(signal.id);

          return (
            <div
              key={signal.id}
              className={`rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-all ${
                isResolved ? "opacity-60" : ""
              }`}
              style={{
                borderLeft: `4px solid ${config.border}`,
              }}
            >
              <button
                type="button"
                className="w-full text-left flex items-start gap-3 p-4 cursor-pointer"
                onClick={() => setExpanded(isExpanded ? null : signal.id)}
                aria-expanded={isExpanded}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: config.bg }}
                >
                  <SeverityIcon size={16} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold"
                      style={{ background: config.bg, color: config.text }}
                    >
                      {signal.severity.toUpperCase()}
                    </span>

                    {isResolved && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                        <Check size={10} /> RESOLVED &amp; ESCALATED
                      </span>
                    )}
                  </div>

                  <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {signal.title}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {signal.project_name} • {signal.district_name}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                    {signal.summary}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <div
                    className="text-base font-black font-mono"
                    style={{
                      color: signal.risk_score >= 60 ? "var(--color-danger)" : "var(--color-warning)",
                    }}
                  >
                    {signal.risk_score} <span className="text-[10px] font-normal text-slate-400">Risk</span>
                  </div>
                  <ChevronRight
                    size={16}
                    className={`text-slate-400 transition-transform duration-200 ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                  />
                </div>
              </button>

              {/* Expanded Card Details */}
              {isExpanded && (
                <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        What Happened
                      </p>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        {signal.explanation.what_happened}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Why Detected
                      </p>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        {signal.explanation.why_detected}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Data Sensors Evaluated
                      </p>
                      <ul className="space-y-1">
                        {signal.explanation.data_used.map((d, i) => (
                          <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Recommended Action
                      </p>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium mb-1">
                        {signal.explanation.recommended_action}
                      </p>
                      <p className="text-[10px] font-mono font-bold text-purple-600">
                        AI Model Confidence: {signal.explanation.confidence}%
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/projects/${signal.project_id}`}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-1 shadow-sm"
                      >
                        <Eye size={12} /> Investigate Center
                      </Link>

                      {!isResolved ? (
                        <button
                          onClick={() => handleApplyAIRecommendation(signal)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-90 transition flex items-center gap-1 shadow-md"
                        >
                          <Zap size={12} /> Apply AI Resolution &amp; Log Issue
                        </button>
                      ) : (
                        <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                          <Check size={12} /> Action Logged to Central Queue
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] font-mono text-slate-400">
                      DPDP Compliant • Human Officer Authorized
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
