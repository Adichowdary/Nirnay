"use client";

import { X, ShieldAlert, TrendingUp, AlertTriangle, CheckCircle, Info, Sparkles, Building2, MapPin } from "lucide-react";
import { DEMO_PROJECTS } from "@/lib/demo-data";

interface ExplainableRiskModalProps {
  projectId: string;
  onClose: () => void;
  onDispatchInspection?: (projectId: string) => void;
}

export function ExplainableRiskModal({
  projectId,
  onClose,
  onDispatchInspection,
}: ExplainableRiskModalProps) {
  const project = DEMO_PROJECTS.find((p) => p.id === projectId) || DEMO_PROJECTS[0];

  // Calculated SHAP-style explainable factors based on actual project metrics
  const score = project.ai_risk_score;
  const isHighRisk = score >= 70;

  const factors = [
    {
      name: "CCTV Operational Availability",
      impact: project.cctv_online === 0 ? +32 : project.cctv_online < project.cctv_total ? +18 : -12,
      category: "Surveillance",
      description: project.cctv_online === 0 ? "All cameras offline for >24 hours" : `${project.cctv_online}/${project.cctv_total} cameras operational`,
      isNegative: project.cctv_online < project.cctv_total,
    },
    {
      name: "Biometric Attendance Rolling Deviation",
      impact: score >= 70 ? +26 : score >= 40 ? +14 : -10,
      category: "Beneficiary Registry",
      description: score >= 70 ? "32% discrepancy between registered and physical headcount" : "Attendance pattern conforms to rolling historical baseline",
      isNegative: score >= 40,
    },
    {
      name: "Historical Field Audit Non-Compliance",
      impact: project.status === "at-risk" || project.status === "suspended" ? +24 : project.status === "pending" ? +12 : -15,
      category: "Audit Track Record",
      description: project.status === "at-risk" ? "2 severe non-compliance flags on record" : "Previous inspection verified clean compliance",
      isNegative: project.status !== "operational",
    },
    {
      name: "Fund Utilization & Grievance SLA Gap",
      impact: score >= 60 ? +18 : -8,
      category: "Administrative SLA",
      description: score >= 60 ? "Utilization certificate submission overdue by 18 days" : "Financial reporting up-to-date",
      isNegative: score >= 60,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 text-white rounded-3xl p-6 shadow-2xl space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
            isHighRisk ? "bg-rose-500/20 text-rose-400 border border-rose-500/40" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
          }`}>
            {score}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase">
                Explainable AI (XAI) Model
              </span>
              <span className="text-xs text-slate-400 font-mono">Confidence: 96.4%</span>
            </div>
            <h3 className="text-base font-extrabold text-white mt-1">{project.name}</h3>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <MapPin size={13} className="text-blue-400" /> {project.district_name}, {project.state} • ID: {project.id}
            </p>
          </div>
        </div>

        {/* Score Gauge Bar */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-400">Aggregated Predictive Risk Level</span>
            <span className={isHighRisk ? "text-rose-400 font-extrabold" : "text-emerald-400"}>
              {isHighRisk ? "CRITICAL RISK REQUIRING INTERVENTION" : "WITHIN TOLERANCE"} ({score}/100)
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${score}%`,
                background: score >= 70 ? "linear-gradient(90deg, #F59E0B, #E11D48)" : "linear-gradient(90deg, #10B981, #3B82F6)",
              }}
            />
          </div>
        </div>

        {/* SHAP Factor Breakdown List */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Key Contributing Drivers (SHAP Attribution Weights)
          </h4>

          {factors.map((factor, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/80 flex items-center justify-between text-xs gap-3"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl mt-0.5 ${
                  factor.isNegative ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"
                }`}>
                  {factor.isNegative ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white text-xs">{factor.name}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-[9px] font-bold text-slate-400">
                      {factor.category}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5">{factor.description}</p>
                </div>
              </div>

              <div className={`text-right font-mono font-black text-sm whitespace-nowrap ${
                factor.impact > 0 ? "text-rose-400" : "text-emerald-400"
              }`}>
                {factor.impact > 0 ? `+${factor.impact}` : factor.impact} pts
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="pt-2 flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-xs text-slate-300 cursor-pointer"
          >
            Close Breakdown
          </button>
          {onDispatchInspection && (
            <button
              onClick={() => {
                onClose();
                onDispatchInspection(project.id);
              }}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:opacity-90 font-bold text-xs text-white shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
            >
              ⚡ Dispatch Field Audit Squad
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
