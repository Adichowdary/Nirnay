"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Printer,
  Shield,
  Video,
  MessageSquareWarning,
  Sparkles,
  Camera,
  Fingerprint,
  MapPin,
  Lock,
  Radio,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Globe,
  Database,
  Cpu,
  Server,
  Layers,
  Eye,
  ExternalLink,
} from "lucide-react";

export default function TechnicalApproachPage() {
  const [theme, setTheme] = useState<"LIGHT" | "DARK">("LIGHT");

  return (
    <div
      className={`min-h-screen transition-colors duration-300 p-4 sm:p-6 flex flex-col items-center justify-center ${
        theme === "DARK" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-900"
      }`}
    >
      {/* Top Controls */}
      <div className="max-w-7xl w-full flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/presentation"
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border ${
              theme === "DARK"
                ? "bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800"
                : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <ArrowLeft size={14} /> Back to Master Deck
          </Link>
          <span className="text-xs font-bold opacity-60 hidden sm:inline">
            SIH 2026 Presentation • Slide 3 Technical Approach
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setTheme(theme === "DARK" ? "LIGHT" : "DARK")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
              theme === "DARK"
                ? "bg-slate-900 border-slate-800 text-amber-300 hover:bg-slate-800"
                : "bg-white border-slate-300 text-slate-800 hover:bg-slate-50"
            }`}
          >
            {theme === "DARK" ? "☀️ Light Mode (PPT Style)" : "🌙 Dark Mode"}
          </button>

          <a
            href="/technical_approach_workflow.html"
            target="_blank"
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white transition flex items-center gap-1.5 shadow"
          >
            <ExternalLink size={13} /> Fullscreen Slide
          </a>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center gap-1.5 shadow"
          >
            <Printer size={13} /> Export PDF
          </button>
        </div>
      </div>

      {/* Main Slide Canvas (16:9 Aspect Ratio Container) */}
      <div
        className={`w-full max-w-7xl rounded-3xl border-2 transition-all p-6 sm:p-8 shadow-2xl flex flex-col justify-between overflow-hidden relative ${
          theme === "DARK"
            ? "bg-slate-900/90 border-slate-800"
            : "bg-white border-slate-200"
        }`}
        style={{ minHeight: "780px" }}
      >
        {/* Slide Header */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-dashed border-slate-300 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400 font-black text-xl shadow-inner">
              🏛️
            </div>
            <div>
              <div className="text-sm font-black tracking-wider text-sky-600 dark:text-sky-400">
                INSIGHT PLATFORM
              </div>
              <div className="text-[11px] font-bold opacity-60">
                DoSJE • Ministry of Social Justice &amp; Empowerment
              </div>
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-black tracking-widest uppercase">
              TECHNICAL APPROACH
            </h1>
            <p className="text-xs font-bold text-sky-600 dark:text-sky-400">
              End-to-End Decision Architecture &amp; Tri-Modal System Workflows
            </p>
          </div>

          <div className="text-right">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow">
              SIH 2026
            </span>
            <div className="text-xs font-black opacity-60 mt-1">SLIDE 03</div>
          </div>
        </div>

        {/* Top Decision Trigger */}
        <div className="flex items-center justify-center gap-3 my-4">
          <div className="px-4 py-1.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-black text-xs flex items-center gap-1.5 shadow">
            <span>🚀</span> START HERE
          </div>
          <span className="text-sm font-black opacity-40">➔</span>
          <div className="px-6 py-2 rounded-2xl border-2 border-slate-300 dark:border-slate-700 font-extrabold text-sm flex items-center gap-2 shadow-sm bg-slate-50 dark:bg-slate-950">
            <span>⚙️</span> Operational Monitoring Trigger?
          </div>
        </div>

        {/* 3 Main Workflow Branches */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 flex-1 my-2">
          {/* BRANCH 1: SURPRISE & OFFLINE MOBILE AUDIT */}
          <div
            className={`p-4 rounded-2xl border-2 border-dashed flex flex-col justify-between ${
              theme === "DARK"
                ? "bg-amber-950/10 border-amber-500/40"
                : "bg-amber-50/70 border-amber-400"
            }`}
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-amber-300 dark:border-amber-800 mb-3">
                <div className="flex items-center gap-2 font-black text-xs text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                  <Shield size={16} /> Surprise Audit Mode
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-400/40">
                  AI / Risk Triggered
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  {
                    num: "1",
                    title: "Automated Random Duty Dispatch",
                    desc: "Anti-collusion algorithm selects un-conflicted inspector",
                  },
                  {
                    num: "2",
                    title: "Mobile App FRS Login Verification",
                    desc: "MediaPipe facial scan authenticates field officer identity",
                  },
                  {
                    num: "3",
                    title: "Geofence Enforcement (200m Radius)",
                    desc: "App unlocks ONLY when physical GPS matches center coords",
                  },
                  {
                    num: "4",
                    title: "Random VC Call + Live Evidence",
                    desc: "WebRTC call with beneficiaries + EXIF tamper-proof photos",
                  },
                  {
                    num: "5",
                    title: "Offline Mode SHA-256 Storage",
                    desc: "Zero network fallback caches encrypted audit hash locally",
                  },
                  {
                    num: "6",
                    title: "Auto-Sync & PFMS DBT Action",
                    desc: "Syncs to Cloud Vault; auto-halts stipends if discrepancy",
                  },
                ].map((step, idx) => (
                  <React.Fragment key={idx}>
                    <div
                      className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition ${
                        theme === "DARK"
                          ? "bg-slate-900 border-amber-900/60"
                          : "bg-white border-amber-200 shadow-sm"
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-extrabold flex items-center justify-center text-[10px] shrink-0 border border-amber-400/40">
                        {step.num}
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-[11px] leading-tight">
                          {step.title}
                        </div>
                        <div className="text-[10px] opacity-70 leading-snug mt-0.5">
                          {step.desc}
                        </div>
                      </div>
                    </div>
                    {idx < 5 && (
                      <div className="text-center text-[9px] font-black opacity-30 my-0.5">
                        ▼
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="mt-4 py-2 rounded-xl bg-amber-600 text-white font-extrabold text-xs text-center uppercase tracking-wider shadow">
              ✔ Surprise Audit Completed
            </div>
          </div>

          {/* BRANCH 2: CONTINUOUS CCTV & BIOMETRIC STREAMING */}
          <div
            className={`p-4 rounded-2xl border-2 border-dashed flex flex-col justify-between ${
              theme === "DARK"
                ? "bg-sky-950/10 border-sky-500/40"
                : "bg-sky-50/70 border-sky-400"
            }`}
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-sky-300 dark:border-sky-800 mb-3">
                <div className="flex items-center gap-2 font-black text-xs text-sky-700 dark:text-sky-400 uppercase tracking-wider">
                  <Video size={16} /> CCTV Surveillance Mode
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-600 dark:text-sky-300 border border-sky-400/40">
                  24x7 Continuous Online
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  {
                    num: "1",
                    title: "Continuous Edge RTSP Stream Ingestion",
                    desc: "MediaMTX + WebRTC streaming from institute cameras",
                  },
                  {
                    num: "2",
                    title: "YOLOv10 Occupancy Headcount",
                    desc: "Real-time occupancy tracking in classroom, hall & dorms",
                  },
                  {
                    num: "3",
                    title: "DeepFace Ghost Beneficiary Clustering",
                    desc: "Vector cosine matching flags identical faces in 2 centers",
                  },
                  {
                    num: "4",
                    title: "Instant Stream Blackout Alert",
                    desc: "Heartbeat monitor catches intentional DVR tampering",
                  },
                  {
                    num: "5",
                    title: "Automated SLA Escalation",
                    desc: "Auto-routes unresolved issues: District ➔ State ➔ Central",
                  },
                  {
                    num: "6",
                    title: "National Command 2D/3D GIS Grid",
                    desc: "Real-time MapLibre telemetry grid for Central Directorate",
                  },
                ].map((step, idx) => (
                  <React.Fragment key={idx}>
                    <div
                      className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition ${
                        theme === "DARK"
                          ? "bg-slate-900 border-sky-900/60"
                          : "bg-white border-sky-200 shadow-sm"
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-700 dark:text-sky-300 font-extrabold flex items-center justify-center text-[10px] shrink-0 border border-sky-400/40">
                        {step.num}
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-[11px] leading-tight">
                          {step.title}
                        </div>
                        <div className="text-[10px] opacity-70 leading-snug mt-0.5">
                          {step.desc}
                        </div>
                      </div>
                    </div>
                    {idx < 5 && (
                      <div className="text-center text-[9px] font-black opacity-30 my-0.5">
                        ▼
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="mt-4 py-2 rounded-xl bg-sky-600 text-white font-extrabold text-xs text-center uppercase tracking-wider shadow">
              ✔ Surveillance Mode Continuous
            </div>
          </div>

          {/* BRANCH 3: CITIZEN WHISTLEBLOWER & SOCIAL AUDIT */}
          <div
            className={`p-4 rounded-2xl border-2 border-dashed flex flex-col justify-between ${
              theme === "DARK"
                ? "bg-emerald-950/10 border-emerald-500/40"
                : "bg-emerald-50/70 border-emerald-400"
            }`}
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-emerald-300 dark:border-emerald-800 mb-3">
                <div className="flex items-center gap-2 font-black text-xs text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  <MessageSquareWarning size={16} /> Whistleblower Mode
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-400/40">
                  Public Social Audit
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  {
                    num: "1",
                    title: "Public Citizen Grievance Lodged",
                    desc: "Beneficiary / citizen files tip with photo/audio evidence",
                  },
                  {
                    num: "2",
                    title: "Zero-Knowledge Whistleblower Mask",
                    desc: "Cryptographic identity shield guarantees anti-retaliation",
                  },
                  {
                    num: "3",
                    title: "Mistral-7B AI NLP Severity Scoring",
                    desc: "Evaluates tip urgency & correlates with NGO audit logs",
                  },
                  {
                    num: "4",
                    title: "Autonomous Squad Mobilization",
                    desc: "Critical fraud complaints trigger immediate surprise inspection",
                  },
                  {
                    num: "5",
                    title: "CCTV Archive Cross-Verification",
                    desc: "Inspectors cross-check tip claim against recorded RTSP feed",
                  },
                  {
                    num: "6",
                    title: "Transparent Resolution Proof",
                    desc: "Public ledger update closes ticket with tamper-proof log",
                  },
                ].map((step, idx) => (
                  <React.Fragment key={idx}>
                    <div
                      className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition ${
                        theme === "DARK"
                          ? "bg-slate-900 border-emerald-900/60"
                          : "bg-white border-emerald-200 shadow-sm"
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-extrabold flex items-center justify-center text-[10px] shrink-0 border border-emerald-400/40">
                        {step.num}
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-[11px] leading-tight">
                          {step.title}
                        </div>
                        <div className="text-[10px] opacity-70 leading-snug mt-0.5">
                          {step.desc}
                        </div>
                      </div>
                    </div>
                    {idx < 5 && (
                      <div className="text-center text-[9px] font-black opacity-30 my-0.5">
                        ▼
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="mt-4 py-2 rounded-xl bg-emerald-600 text-white font-extrabold text-xs text-center uppercase tracking-wider shadow">
              ✔ Social Audit Completed
            </div>
          </div>
        </div>

        {/* Footer: Tech Stack Badges & Watermark */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t-2 border-dashed border-slate-300 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-slate-900 text-white dark:bg-white dark:text-slate-950 text-[10px] font-black uppercase tracking-wider">
              TECH STACK
            </span>
            {[
              { icon: "⚛️", label: "Next.js 16 / React 19" },
              { icon: "🐍", label: "Python / FastAPI" },
              { icon: "👁️", label: "OpenCV & YOLOv10" },
              { icon: "👤", label: "MediaPipe / DeepFace" },
              { icon: "🌐", label: "WebRTC & MediaMTX" },
              { icon: "🗺️", label: "MapLibre GL 2D/3D" },
              { icon: "🐘", label: "PostgreSQL & Mongo" },
              { icon: "🐳", label: "Docker" },
            ].map((t, idx) => (
              <span
                key={idx}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                  theme === "DARK"
                    ? "bg-slate-950 border-slate-800 text-slate-300"
                    : "bg-slate-50 border-slate-300 text-slate-700"
                }`}
              >
                <span className="mr-1">{t.icon}</span>
                {t.label}
              </span>
            ))}
          </div>

          <div className="text-xs font-black opacity-60 font-mono">
            @INSIGHT - DoSJE &bull; Slide 3
          </div>
        </div>
      </div>
    </div>
  );
}
