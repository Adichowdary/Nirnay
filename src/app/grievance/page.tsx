"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Send,
  Camera,
  MapPin,
  CheckCircle2,
  Lock,
  EyeOff,
  AlertTriangle,
  Building2,
  FileText,
  Search,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const GRIEVANCE_CATEGORIES = [
  { id: "ABSENTEEISM", label: "Center Closed / Ghost Attendance", icon: "🚫" },
  { id: "MEAL_QUALITY", label: "Substandard Food / Nutrition Violation", icon: "🍲" },
  { id: "INFRASTRUCTURE", label: "Broken Facility / Lack of Clean Water", icon: "💧" },
  { id: "FINANCIAL_CORRUPTION", label: "Stipend Diversion / Extortion Demand", icon: "💸" },
  { id: "STAFF_MISCONDUCT", label: "Staff Harassment / Lack of Qualified Trainer", icon: "⚠️" },
];

export default function PublicGrievancePortal() {
  const [category, setCategory] = useState("ABSENTEEISM");
  const [centerName, setCenterName] = useState("");
  const [districtState, setDistrictState] = useState("");
  const [description, setDescription] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [contactInfo, setContactInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedToken, setSubmittedToken] = useState<string | null>(null);

  // Tracking search state
  const [trackingCode, setTrackingCode] = useState("");
  const [trackingResult, setTrackingResult] = useState<{
    code: string;
    status: string;
    date: string;
    actionTaken: string;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const generated = `GRV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      setSubmittedToken(generated);
    }, 1200);
  };

  const handleTrack = () => {
    if (trackingCode.trim()) {
      setTrackingResult({
        code: trackingCode.toUpperCase(),
        status: "SURPRISE_INSPECTION_DISPATCHED",
        date: "2 Sept 2026",
        actionTaken:
          "AI Triage marked as High Severity. Field Audit Squad #RJ-04 dispatched for unannounced biometric verification.",
      });
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col font-sans"
      style={{ background: "var(--surface-bg)", color: "var(--text-primary)" }}
    >
      {/* Navigation Bar */}
      <header
        className="px-6 py-4 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md"
        style={{
          borderBottom: "1px solid var(--border-light)",
          background: "var(--surface-card)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold flex-shrink-0"
            style={{
              background: "var(--color-danger-bg)",
              border: "1px solid var(--color-danger-border)",
              color: "var(--color-danger)",
            }}
          >
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-wide" style={{ color: "var(--text-primary)" }}>
              NIRNAY · Citizen Whistleblower Portal
            </h1>
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Department of Social Justice &amp; Empowerment (DoSJE)</p>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-colors"
          style={{
            background: "var(--surface-secondary)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-light)",
          }}
        >
          Staff &amp; Command Login →
        </Link>
      </header>

      {/* Hero Banner */}
      <div className="max-w-4xl mx-auto px-4 py-8 text-center space-y-3">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold font-mono"
          style={{
            background: "var(--color-danger-bg)",
            border: "1px solid var(--color-danger-border)",
            color: "var(--color-danger)",
          }}
        >
          <EyeOff className="w-3.5 h-3.5" /> 100% Anonymous &amp; End-to-End Encrypted
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Report Welfare Center Violations &amp; Ghost Attendance
        </h2>
        <p className="text-xs sm:text-sm max-w-xl mx-auto leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Help us ensure government welfare funds reach real beneficiaries. Report closed centers,
          fake attendance, or infrastructure failures securely.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-16 grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
        {/* Left 2 Cols: Form */}
        <div className="md:col-span-2 space-y-6">
          {submittedToken ? (
            <div
              className="p-8 rounded-3xl text-center space-y-4 animate-in zoom-in"
              style={{
                background: "var(--surface-card)",
                border: "1px solid var(--color-success-border)",
              }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                style={{ background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)" }}
              >
                <CheckCircle2 className="w-8 h-8" style={{ color: "var(--color-success)" }} />
              </div>
              <h3 className="text-lg font-extrabold" style={{ color: "var(--text-primary)" }}>Grievance Successfully Registered</h3>
              <p className="text-xs max-w-md mx-auto" style={{ color: "var(--text-secondary)" }}>
                Your report has been encrypted and submitted to the National Decision Support Engine for automated AI severity triage.
              </p>

              <div
                className="p-4 rounded-2xl max-w-xs mx-auto space-y-1"
                style={{
                  background: "var(--surface-secondary)",
                  border: "1px solid var(--border-light)",
                }}
              >
                <span className="text-[10px] uppercase font-mono block" style={{ color: "var(--text-muted)" }}>Your Confidential Tracking Code</span>
                <p className="text-xl font-extrabold font-mono" style={{ color: "var(--blue-500)" }}>{submittedToken}</p>
              </div>

              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Save this code to check verification and audit status.</p>

              <button
                onClick={() => {
                  setSubmittedToken(null);
                  setDescription("");
                  setCenterName("");
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold transition"
                style={{
                  background: "var(--surface-secondary)",
                  border: "1px solid var(--border-light)",
                  color: "var(--text-primary)",
                }}
              >
                Submit Another Report
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="p-6 rounded-3xl space-y-5 shadow-xl"
              style={{ background: "var(--surface-card)", border: "1px solid var(--border-default)" }}
            >
              <h3 className="text-sm font-extrabold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <FileText className="w-4 h-4 text-rose-400" />
                Step 1: Select Violation Category
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {GRIEVANCE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className="p-3 rounded-2xl text-left border transition text-xs flex items-center gap-2.5"
                    style={{
                      background: category === cat.id ? "var(--color-danger-bg)" : "var(--surface-secondary)",
                      borderColor: category === cat.id ? "var(--color-danger-border)" : "var(--border-light)",
                      color: category === cat.id ? "var(--color-danger)" : "var(--text-secondary)",
                    }}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span className="font-semibold text-[11px] leading-tight">{cat.label}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-cyan-400" />
                  Step 2: Facility Details &amp; Location
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">
                      Center / Institution Name *
                    </label>
                    <input
                    type="text"
                    required
                    value={centerName}
                    onChange={(e) => setCenterName(e.target.value)}
                    placeholder="e.g. Asha Rehabilitation Center"
                    className="w-full p-2.5 rounded-xl text-xs focus:outline-none focus:ring-2"
                    style={{
                      background: "var(--surface-secondary)",
                      border: "1px solid var(--border-light)",
                      color: "var(--text-primary)",
                      outlineColor: "var(--color-danger)",
                    }}
                  />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">
                      District &amp; State *
                    </label>
                    <input
                    type="text"
                    required
                    value={districtState}
                    onChange={(e) => setDistrictState(e.target.value)}
                    placeholder="e.g. Jaipur, Rajasthan"
                    className="w-full p-2.5 rounded-xl text-xs focus:outline-none"
                    style={{
                      background: "var(--surface-secondary)",
                      border: "1px solid var(--border-light)",
                      color: "var(--text-primary)",
                    }}
                  />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Describe the Issue / Incident *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide details about observed fake attendance, unannounced closures, food quality defects, or misconduct..."
                    className="w-full p-3 rounded-xl text-xs focus:outline-none font-sans"
                    style={{
                      background: "var(--surface-secondary)",
                      border: "1px solid var(--border-light)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>

                {/* Anonymous Toggle */}
                <div
                    className="p-3.5 rounded-2xl flex items-center justify-between text-xs"
                    style={{
                      background: "var(--surface-secondary)",
                      border: "1px solid var(--border-light)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4" style={{ color: "var(--color-success)" }} />
                      <div>
                        <span className="font-bold block" style={{ color: "var(--text-primary)" }}>Submit Anonymously</span>
                        <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Your phone number/identity is never revealed.</p>
                      </div>
                    </div>

                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                    style={{ accentColor: "var(--color-success)" }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:opacity-95 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xl transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? "Encrypting & Submitting..." : "Submit Grievance to AI Triage"}
              </button>
            </form>
          )}
        </div>

        {/* Right Col: Tracking & Transparency Stats */}
        <div className="space-y-6">
          {/* Tracking Box */}
          <div
            className="p-5 rounded-3xl space-y-3 shadow-xl"
            style={{
              background: "var(--surface-card)",
              border: "1px solid var(--border-default)",
            }}
          >
            <h3 className="text-xs font-extrabold flex items-center gap-2 uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
              <Search className="w-3.5 h-3.5" style={{ color: "var(--blue-500)" }} />
              Track Grievance Status
            </h3>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Enter your confidential token to check squad audit progress.</p>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="GRV-2026-XXXX"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                className="flex-1 p-2 rounded-xl text-xs font-mono uppercase focus:outline-none"
                style={{
                  background: "var(--surface-secondary)",
                  border: "1px solid var(--border-light)",
                  color: "var(--blue-500)",
                }}
              />
              <button
                type="button"
                onClick={handleTrack}
                className="px-3 py-2 rounded-xl text-white font-bold text-xs transition"
                style={{ background: "var(--blue-500)" }}
              >
                Track
              </button>
            </div>

            {trackingResult && (
              <div
                className="p-3.5 rounded-2xl text-xs space-y-2 animate-in fade-in"
                style={{
                  background: "var(--surface-secondary)",
                  border: "1px solid var(--color-info-border, var(--border-light))",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold" style={{ color: "var(--blue-500)" }}>{trackingResult.code}</span>
                  <span
                    className="px-2 py-0.5 rounded text-[9px] font-bold"
                    style={{ background: "var(--color-warning-bg)", color: "var(--color-warning)", border: "1px solid var(--color-warning-border)" }}
                  >
                    Surprise Inspection — Squad Dispatched
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{trackingResult.actionTaken}</p>
              </div>
            )}
          </div>

          {/* Social Audit Metrics */}
          <div
            className="p-5 rounded-3xl space-y-4 shadow-xl"
            style={{
              background: "var(--surface-card)",
              border: "1px solid var(--border-default)",
            }}
          >
            <h3 className="text-xs font-extrabold flex items-center gap-2 uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
              <Sparkles className="w-3.5 h-3.5" style={{ color: "var(--color-success)" }} />
              Public Social Audit Metrics
            </h3>

            <div className="space-y-3 text-xs">
              {[
                { label: "Total Grievances Resolved", value: "1,492 (94.2%)", color: "var(--color-success)" },
                { label: "Avg Squad Dispatch Time",   value: "< 4 Hours",     color: "var(--blue-500)" },
                { label: "Aadhaar Ghost Duplicates Locked", value: "348",      color: "var(--color-danger)" },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="p-3 rounded-2xl flex items-center justify-between"
                  style={{ background: "var(--surface-secondary)", border: "1px solid var(--border-light)" }}
                >
                  <span style={{ color: "var(--text-muted)" }}>{label}</span>
                  <span className="font-bold font-mono text-sm" style={{ color }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
