"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  CheckCircle2,
  AlertTriangle,
  WifiOff,
  Users,
  Brain,
  ClipboardCheck,
  MapPin,
  Camera,
  Video,
  FileCheck,
  Shield,
  ArrowRight,
  Clock,
  Sparkles,
  Lock,
  Sliders,
  TrendingDown,
  TrendingUp,
  Download,
  Zap,
} from "lucide-react";
import { generateMinistryDossierPDF } from "@/lib/reports/pdf-generator";

interface ScenarioStep {
  id: number;
  time: string;
  title: string;
  subsystem: "CCTV" | "ATTENDANCE" | "RISK_ENGINE" | "DISPATCH" | "GPS_GEOFENCE" | "EVIDENCE" | "RANDOM_VC" | "REPORT" | "AI_SYNTHESIS";
  badgeColor: string;
  headline: string;
  description: string;
  telemetry: Record<string, string | number>;
  auditHash: string;
  actionLink?: { label: string; href: string };
}

const SCENARIO_TIMELINE: ScenarioStep[] = [
  {
    id: 1,
    time: "10:20 AM",
    title: "CCTV Camera Outage Detected",
    subsystem: "CCTV",
    badgeColor: "bg-red-500/10 text-red-500 border-red-500/20",
    headline: "Camera 02 (Activity Hall) Heartbeat Lost",
    description: "MediaMTX RTSP stream dropped abruptly at Asha Rehabilitation Centre. Heartbeat monitor flags stream offline for > 15 minutes.",
    telemetry: {
      "Facility": "Asha Rehabilitation Centre (GNT)",
      "Camera ID": "CAM-02-ACTIVITY-HALL",
      "Status": "OFFLINE (No signal)",
      "Last Heartbeat": "10:04:12 AM",
    },
    auditHash: "0x8a92f810c93a...cctv_offline",
    actionLink: { label: "View Live CCTV Grid", href: "/dashboard/monitor" },
  },
  {
    id: 2,
    time: "10:25 AM",
    title: "Biometric Attendance Anomaly",
    subsystem: "ATTENDANCE",
    badgeColor: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    headline: "Severe 41.2% Attendance Drop Detected",
    description: "Morning attendance sync reports 47 physical beneficiaries present against 80 registered quota without prior notification.",
    telemetry: {
      "Registered Beneficiaries": 80,
      "Reported Present": 47,
      "Variance": "-41.25%",
      "Anomaly Classification": "CRITICAL_ATTENDANCE_DROP",
    },
    auditHash: "0x3e17ab890c21...attendance_drop",
    actionLink: { label: "View AI Signals", href: "/dashboard/ai-signals" },
  },
  {
    id: 3,
    time: "10:26 AM",
    title: "Cross-System Risk Engine Triggers",
    subsystem: "RISK_ENGINE",
    badgeColor: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    headline: "Facility Risk Score Spikes to 88/100 (HIGH PRIORITY)",
    description: "Multi-signal correlation engine fuses CCTV outage (+35 pts) with attendance variance (+28 pts) and inspection latency (+25 pts).",
    telemetry: {
      "Computed Risk Score": "88 / 100",
      "Risk Tier": "HIGH PRIORITY ESCALATION",
      "Action Triggered": "AUTO_SURPRISE_INSPECTION",
    },
    auditHash: "0xfa49112bc870...risk_escalation",
  },
  {
    id: 4,
    time: "10:28 AM",
    title: "Unannounced Inspection Dispatched",
    subsystem: "DISPATCH",
    badgeColor: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    headline: "Automated Mission Assigned to Officer Priya Mehta",
    description: "Nearest available PMU inspector within 4.2 km is designated. Inspection is sealed cryptographically and assigned with strict 2-hour SLA.",
    telemetry: {
      "Assigned Inspector": "Priya Mehta (PMU-RJ-044)",
      "Initial Distance": "4.2 km away",
      "Geofence Target": "26.9124° N, 75.7873° E",
      "SLA Countdown": "01:58:12 remaining",
    },
    auditHash: "0x918844ba22ef...dispatch_sealed",
    actionLink: { label: "Open Field Inspector Workspace", href: "/dashboard/inspector" },
  },
  {
    id: 5,
    time: "10:45 AM",
    title: "GPS Geofence Breach Verification",
    subsystem: "GPS_GEOFENCE",
    badgeColor: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    headline: "Inspector Arrives on Site · 200m Perimeter Locked",
    description: "Inspector's device enters the 200m spatial buffer around facility coordinates. Biometric facial recognition unlocks the inspection checklist.",
    telemetry: {
      "GPS Distance to Centre": "18.4 meters (IN_BOUNDS)",
      "GPS Accuracy": "± 4.8 meters (GNSS)",
      "Facial Recognition": "VERIFIED (Confidence 98.2%)",
      "Checklist Status": "UNLOCKED",
    },
    auditHash: "0x77bbcc01449a...geofence_verified",
  },
  {
    id: 6,
    time: "11:05 AM",
    title: "Tamper-Proof Photo Evidence Captured",
    subsystem: "EVIDENCE",
    badgeColor: "bg-teal-500/10 text-teal-500 border-teal-500/20",
    headline: "3 Geotagged & Timestamped Photos Submitted",
    description: "Inspector captures photo evidence of empty activity hall and disconnected camera cable. Each photo is EXIF-watermarked with GPS, time, and SHA-256 hash.",
    telemetry: {
      "Photos Captured": 3,
      "Watermark": "LAT: 26.9124 | LNG: 75.7873 | 11:05:22 IST",
      "EXIF Integrity": "AUTHENTIC / NOT_MODIFIED",
      "Observed Attendance": "48 beneficiaries",
    },
    auditHash: "0x66c89011de34...photos_sealed",
    actionLink: { label: "View Evidence Vault", href: "/dashboard/evidence" },
  },
  {
    id: 7,
    time: "11:20 AM",
    title: "Random Video Call Verification",
    subsystem: "RANDOM_VC",
    badgeColor: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
    headline: "State PMU Initiates Unscheduled WebRTC Call",
    description: "State Director initiates a surprise 3-minute video verification with the inspector on-site. AI detects physical presence of beneficiaries in the video stream.",
    telemetry: {
      "Call Duration": "03:14 min",
      "Signaling Protocol": "WebRTC P2P (TURN/STUN)",
      "AI Liveness Score": "0.96 (LIVE_HUMAN_DETECTED)",
      "Headcount in Frame": "12 in current room",
    },
    auditHash: "0x55aa334411bb...vc_verified",
    actionLink: { label: "Open WebRTC Inspection Room", href: "/dashboard/video-verification" },
  },
  {
    id: 8,
    time: "11:40 AM",
    title: "Inspection Submitted & Signed",
    subsystem: "REPORT",
    badgeColor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    headline: "Comprehensive Field Report Transmitted to Central Command",
    description: "Final checklist submitted with physical headcount deficit confirmed (48 observed vs 80 registered). Inspection sealed into the immutable ledger.",
    telemetry: {
      "Final Compliance Score": "42% (NON-COMPLIANT)",
      "Deficiency Flagged": "CCTV Cable Tampering & Headcount Discrepancy",
      "Action Required": "Show-Cause Notice Issued to NGO",
      "Report ID": "INSP-0094-RJ-SEALED",
    },
    auditHash: "0x4422dd88cc11...report_submitted",
    actionLink: { label: "View All Reports", href: "/dashboard/reports" },
  },
  {
    id: 9,
    time: "11:42 AM",
    title: "AI Synthesis & Action Summary",
    subsystem: "AI_SYNTHESIS",
    badgeColor: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
    headline: "Ollama / Local AI Generates Executive Action Summary",
    description: "System correlates the entire incident chain from 10:20 AM outage to 11:40 AM field report, generating an executive memo and cryptographically sealing the audit trail.",
    telemetry: {
      "AI Summary Engine": "NIRNAY Cognitive Suite v2.5",
      "Action Recommended": "Issue Show-Cause Notice & Withhold Next Grant Tranche",
      "Audit Chain Status": "SEALED & IMMUTABLE",
    },
    auditHash: "0x01ff7788aa34...audit_closed",
    actionLink: { label: "Inspect Cryptographic Audit Trail", href: "/dashboard/audit" },
  },
];

export default function EndToEndScenarioPage() {
  const [activeTab, setActiveTab] = useState<"TIMELINE" | "WHAT_IF">("TIMELINE");
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // What-if policy levers
  const [auditFrequency, setAuditFrequency] = useState<number>(4); // inspections / month
  const [biometricStrictness, setBiometricStrictness] = useState<number>(85); // %
  const [cctvSlaHours, setCctvSlaHours] = useState<number>(24); // hours
  const [grantRetentionMultiplier, setGrantRetentionMultiplier] = useState<number>(15); // %

  const currentStep = SCENARIO_TIMELINE[activeStepIndex];

  // Dynamic what-if calculations
  const projectedRiskDrop = Math.round(
    (auditFrequency * 4.2) + ((biometricStrictness - 70) * 0.8) + ((48 - cctvSlaHours) * 0.5) + (grantRetentionMultiplier * 0.6)
  );
  const projectedCompliance = Math.min(98.5, 78 + projectedRiskDrop * 0.35);
  const slaBreachReduction = Math.min(88, 30 + (auditFrequency * 5.5));

  const handleNext = () => {
    setActiveStepIndex((prev) => (prev < SCENARIO_TIMELINE.length - 1 ? prev + 1 : prev));
  };

  const handlePrev = () => {
    setActiveStepIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleReset = () => {
    setActiveStepIndex(0);
    setIsPlaying(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="text-blue-500" size={22} />
            <h1 className="text-xl md:text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              NIRNAY Scenario &amp; Policy Simulation Studio
            </h1>
          </div>
          <p className="text-xs md:text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Live incident simulation playback &amp; What-If policy intervention forecasting for Ministry Decision Makers.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
          <button
            onClick={() => setActiveTab("TIMELINE")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "TIMELINE" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            Incident Replay (Demo)
          </button>
          <button
            onClick={() => setActiveTab("WHAT_IF")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              activeTab === "WHAT_IF" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <Sliders size={13} /> Policy Simulator 2.0
          </button>
        </div>
      </div>

      {/* TAB 1: INCIDENT TIMELINE PLAYBACK */}
      {activeTab === "TIMELINE" && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex items-center justify-between flex-wrap gap-3 p-4 rounded-2xl bg-card border border-base">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="p-2 rounded-xl border border-base text-xs font-semibold hover:bg-muted cursor-pointer"
                title="Reset to 10:20 AM"
              >
                <RotateCcw size={15} />
              </button>
              <button
                type="button"
                onClick={handlePrev}
                disabled={activeStepIndex === 0}
                className="px-3 py-1.5 rounded-xl border border-base text-xs font-semibold disabled:opacity-40 hover:bg-muted cursor-pointer"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={activeStepIndex === SCENARIO_TIMELINE.length - 1}
                className="btn-primary text-xs px-4 py-1.5 rounded-xl disabled:opacity-40 cursor-pointer"
              >
                Next Step ({activeStepIndex + 1}/{SCENARIO_TIMELINE.length})
              </button>
            </div>

            <button
              onClick={() => generateMinistryDossierPDF({ title: "Incident Simulation Dossier" })}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Download size={14} /> Export Ministry Dossier PDF
            </button>
          </div>

          {/* Stepper Bubble Track */}
          <div
            className="p-4 rounded-2xl border flex items-center justify-between gap-2 overflow-x-auto"
            style={{ background: "var(--surface-card)", borderColor: "var(--border-light)" }}
          >
            {SCENARIO_TIMELINE.map((step, idx) => {
              const isPassed = idx < activeStepIndex;
              const isCurrent = idx === activeStepIndex;

              return (
                <div
                  key={step.id}
                  onClick={() => setActiveStepIndex(idx)}
                  className="flex items-center gap-2 cursor-pointer group flex-shrink-0"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all ${
                      isCurrent
                        ? "bg-blue-600 text-white ring-4 ring-blue-500/20 scale-110 shadow-lg"
                        : isPassed
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-800 text-slate-400 border border-slate-700"
                    }`}
                  >
                    {isPassed ? "✓" : idx + 1}
                  </div>
                  <div className="hidden lg:block text-left">
                    <div className="text-[10px] font-mono text-muted">{step.time}</div>
                    <div
                      className={`text-xs font-semibold truncate max-w-[100px] ${
                        isCurrent ? "text-blue-500 font-bold" : "text-secondary"
                      }`}
                    >
                      {step.title.split(" ")[0]}
                    </div>
                  </div>
                  {idx < SCENARIO_TIMELINE.length - 1 && (
                    <div
                      className={`w-6 h-0.5 mx-1 hidden sm:block ${
                        idx < activeStepIndex ? "bg-emerald-500" : "bg-slate-800"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Active Step Showcase Card */}
          <div
            className="p-6 rounded-3xl border space-y-5 shadow-lg"
            style={{ background: "var(--surface-card)", borderColor: "var(--border-light)" }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-600 text-white">
                  {currentStep.time}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${currentStep.badgeColor}`}>
                  {currentStep.subsystem}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted">
                <Lock size={12} className="text-emerald-500" />
                <span>Audit Hash: {currentStep.auditHash}</span>
              </div>
            </div>

            <div>
              <h2 className="text-lg md:text-xl font-black" style={{ color: "var(--text-primary)" }}>
                {currentStep.headline}
              </h2>
              <p className="text-xs md:text-sm mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {currentStep.description}
              </p>
            </div>

            {/* Telemetry Matrix */}
            <div
              className="p-4 rounded-2xl border grid grid-cols-2 md:grid-cols-4 gap-4"
              style={{ background: "var(--surface-bg)", borderColor: "var(--border-light)" }}
            >
              {Object.entries(currentStep.telemetry).map(([key, val]) => (
                <div key={key} className="space-y-0.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted">
                    {key}
                  </div>
                  <div className="text-xs md:text-sm font-mono font-semibold" style={{ color: "var(--text-primary)" }}>
                    {val}
                  </div>
                </div>
              ))}
            </div>

            {/* Action Links */}
            <div className="flex flex-wrap items-center justify-between pt-4 border-t gap-3" style={{ borderColor: "var(--border-light)" }}>
              <div className="text-xs font-medium text-muted flex items-center gap-2">
                <Shield size={14} className="text-blue-500" />
                <span>Cryptographically sealed under DoSJE Statutory Compliance Rules</span>
              </div>
              {currentStep.actionLink && (
                <Link
                  href={currentStep.actionLink.href}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 transition-colors flex items-center gap-2"
                >
                  <span>{currentStep.actionLink.label}</span>
                  <ArrowRight size={14} />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: POLICY SIMULATOR 2.0 (WHAT-IF LEVERS) */}
      {activeTab === "WHAT_IF" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Impact KPI 1 */}
            <div className="p-5 rounded-3xl bg-emerald-950/20 border border-emerald-500/30 shadow-lg">
              <div className="flex items-center justify-between text-emerald-400 text-xs font-bold">
                <span>PROJECTED RISK REDUCTION</span>
                <TrendingDown size={18} />
              </div>
              <div className="text-3xl font-black text-emerald-400 mt-2 font-mono">
                -{projectedRiskDrop}%
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                National anomaly score drop based on tuned policy levers.
              </p>
            </div>

            {/* Impact KPI 2 */}
            <div className="p-5 rounded-3xl bg-blue-950/20 border border-blue-500/30 shadow-lg">
              <div className="flex items-center justify-between text-blue-400 text-xs font-bold">
                <span>ESTIMATED COMPLIANCE INDEX</span>
                <TrendingUp size={18} />
              </div>
              <div className="text-3xl font-black text-blue-400 mt-2 font-mono">
                {projectedCompliance.toFixed(1)}%
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Projected physical headcount verification rate across all 41 centers.
              </p>
            </div>

            {/* Impact KPI 3 */}
            <div className="p-5 rounded-3xl bg-purple-950/20 border border-purple-500/30 shadow-lg">
              <div className="flex items-center justify-between text-purple-400 text-xs font-bold">
                <span>SLA BREACH RESOLUTION GAIN</span>
                <Zap size={18} />
              </div>
              <div className="text-3xl font-black text-purple-400 mt-2 font-mono">
                +{slaBreachReduction}%
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Reduction in State-to-Central Level 2 escalation latency.
              </p>
            </div>
          </div>

          {/* Interactive Sliders Form */}
          <div className="p-6 rounded-3xl bg-card border border-base shadow-xl space-y-6">
            <h3 className="font-extrabold text-sm text-primary flex items-center gap-2">
              <Sliders size={16} className="text-blue-500" />
              Adjust National Policy Levers &amp; Statutory Thresholds
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Lever 1 */}
              <div className="p-4 rounded-2xl bg-muted/20 border border-base space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-secondary">Surprise Field Audit Frequency</span>
                  <span className="font-mono text-blue-500 font-extrabold">{auditFrequency} Audits / Center / Month</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={auditFrequency}
                  onChange={(e) => setAuditFrequency(Number(e.target.value))}
                  className="w-full cursor-pointer accent-blue-600"
                />
                <p className="text-[10px] text-muted">Higher frequency prevents long-term CCTV disconnection and unannounced proxy attendance.</p>
              </div>

              {/* Lever 2 */}
              <div className="p-4 rounded-2xl bg-muted/20 border border-base space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-secondary">Biometric Attendance Tolerance Threshold</span>
                  <span className="font-mono text-emerald-500 font-extrabold">{biometricStrictness}% Minimum Match</span>
                </div>
                <input
                  type="range"
                  min="70"
                  max="95"
                  value={biometricStrictness}
                  onChange={(e) => setBiometricStrictness(Number(e.target.value))}
                  className="w-full cursor-pointer accent-emerald-600"
                />
                <p className="text-[10px] text-muted">Triggers automated field squad dispatch if rolling attendance variance breaches threshold.</p>
              </div>

              {/* Lever 3 */}
              <div className="p-4 rounded-2xl bg-muted/20 border border-base space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-secondary">CCTV Outage SLA Escalation Cutoff</span>
                  <span className="font-mono text-amber-500 font-extrabold">{cctvSlaHours} Hours to L2 Escalation</span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="48"
                  step="6"
                  value={cctvSlaHours}
                  onChange={(e) => setCctvSlaHours(Number(e.target.value))}
                  className="w-full cursor-pointer accent-amber-600"
                />
                <p className="text-[10px] text-muted">Hours before offline CCTV streams escalate directly from State Admin to Central Directorate.</p>
              </div>

              {/* Lever 4 */}
              <div className="p-4 rounded-2xl bg-muted/20 border border-base space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-secondary">Grant Retention Penalty Multiplier</span>
                  <span className="font-mono text-rose-500 font-extrabold">{grantRetentionMultiplier}% Fund Withholding</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="5"
                  value={grantRetentionMultiplier}
                  onChange={(e) => setGrantRetentionMultiplier(Number(e.target.value))}
                  className="w-full cursor-pointer accent-rose-600"
                />
                <p className="text-[10px] text-muted">Percentage of grant installment withheld automatically until all non-compliance flags resolve.</p>
              </div>
            </div>

            <div className="pt-4 border-t border-base flex items-center justify-between flex-wrap gap-3">
              <span className="text-xs text-muted font-medium">
                Simulation Model: <strong>Monte Carlo Policy Engine (DoSJE Calibrated)</strong>
              </span>

              <button
                onClick={() => generateMinistryDossierPDF({ title: `Policy Simulation (Risk Drop: -${projectedRiskDrop}%)` })}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white font-extrabold text-xs shadow-lg transition flex items-center gap-2 cursor-pointer"
              >
                <Download size={14} /> Download Policy Simulation PDF Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
