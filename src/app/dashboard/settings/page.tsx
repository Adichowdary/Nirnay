"use client";

import { useState } from "react";
import { Settings, Shield, Brain, Navigation, Sliders, Save, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const [riskThreshold, setRiskThreshold] = useState(65);
  const [geofenceRadius, setGeofenceRadius] = useState(100);
  const [surpriseRiskWeight, setSurpriseRiskWeight] = useState(35);
  const [surpriseAgeWeight, setSurpriseAgeWeight] = useState(40);
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  const [changeRequestId, setChangeRequestId] = useState<string | null>(null);

  function handleSave() {
    const id = `CR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setChangeRequestId(id);
    setIsPendingApproval(true);
  }

  function handleWithdraw() {
    setIsPendingApproval(false);
    setChangeRequestId(null);
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Settings size={16} style={{ color: "var(--blue-500)" }} />
            <h1 className="text-lg md:text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              System Governance & Parameters
            </h1>
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Algorithm weights, geofencing radii, and automated anomaly thresholds (Rule 144 GFR Compliant)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isPendingApproval && (
            <button
              type="button"
              onClick={handleWithdraw}
              className="text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors"
              style={{
                borderColor: "var(--border-primary)",
                color: "var(--text-secondary)",
                background: "var(--surface-secondary)",
              }}
            >
              Withdraw Request
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={isPendingApproval}
            className="btn-primary flex items-center gap-1.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={14} />
            {isPendingApproval ? "Pending Approval" : "Submit for Approval"}
          </button>
        </div>
      </div>

      {isPendingApproval && (
        <div
          className="flex items-start gap-3 p-3.5 rounded-xl text-xs font-medium border animate-in"
          style={{
            background: "rgba(245, 158, 11, 0.08)",
            color: "var(--amber-600, #d97706)",
            borderColor: "rgba(245, 158, 11, 0.3)",
          }}
        >
          <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-xs">
              Change Request {changeRequestId} Submitted for Competent Authority Approval
            </div>
            <p className="text-[11px] opacity-90 leading-relaxed font-normal" style={{ color: "var(--text-secondary)" }}>
              Under DoSJE e-Governance Protocol v3.2, parameter recalibrations require dual-sign-off by the Joint Secretary (Monitoring) before deploying to edge inspection tablets. Audit log entry recorded with SHA-256 integrity digest.
            </p>
          </div>
        </div>
      )}

      {/* AI Anomaly */}
      <div className="card p-4 md:p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Brain size={15} style={{ color: "var(--purple-500)" }} />
          <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            AI Anomaly Detection
          </h2>
        </div>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Controls the threshold at which automated anomaly signals are generated
        </p>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium">
            <label htmlFor="risk-threshold" style={{ color: "var(--text-primary)" }}>
              Sensitivity ({riskThreshold}/100)
            </label>
            <span className="tabular-nums" style={{ color: "var(--purple-500)" }}>{riskThreshold} pts</span>
          </div>
          <input
            id="risk-threshold"
            type="range"
            min="30"
            max="90"
            value={riskThreshold}
            onChange={(e) => setRiskThreshold(Number(e.target.value))}
            className="w-full accent-purple-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px]" style={{ color: "var(--text-muted)" }}>
            <span>High sensitivity</span>
            <span>Conservative</span>
          </div>
        </div>
      </div>

      {/* Surprise Inspection Weights */}
      <div className="card p-4 md:p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Sliders size={15} style={{ color: "var(--blue-500)" }} />
          <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            Surprise Inspection Weights
          </h2>
        </div>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Weighted formula for target priority calculation
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="risk-weight" className="text-xs font-semibold block" style={{ color: "var(--text-primary)" }}>
              Risk Factor ({surpriseRiskWeight}%)
            </label>
            <input
              id="risk-weight"
              type="range"
              min="10"
              max="60"
              value={surpriseRiskWeight}
              onChange={(e) => setSurpriseRiskWeight(Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              Prioritizes facilities with high anomaly scores
            </p>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="age-weight" className="text-xs font-semibold block" style={{ color: "var(--text-primary)" }}>
              Age Factor ({surpriseAgeWeight}%)
            </label>
            <input
              id="age-weight"
              type="range"
              min="10"
              max="60"
              value={surpriseAgeWeight}
              onChange={(e) => setSurpriseAgeWeight(Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              Prioritizes long-overdue inspections
            </p>
          </div>
        </div>
      </div>

      {/* Geofencing */}
      <div className="card p-4 md:p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Navigation size={15} style={{ color: "var(--green-500)" }} />
          <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            GPS Geofencing
          </h2>
        </div>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Tolerance radius for field inspector verification
        </p>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium">
            <label htmlFor="geofence" style={{ color: "var(--text-primary)" }}>
              Verification Radius
            </label>
            <span className="tabular-nums" style={{ color: "var(--green-500)" }}>
              ±{geofenceRadius}m
            </span>
          </div>
          <input
            id="geofence"
            type="range"
            min="50"
            max="300"
            step="25"
            value={geofenceRadius}
            onChange={(e) => setGeofenceRadius(Number(e.target.value))}
            className="w-full accent-green-500 cursor-pointer"
          />
        </div>
      </div>

      {/* System Status */}
      <div className="card p-4 md:p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Shield size={15} style={{ color: "var(--blue-500)" }} />
          <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            System Status
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "HASHING", value: "SHA-256" },
            { label: "PROJECTION", value: "WGS 84" },
            { label: "STREAMING", value: "WebRTC" },
            { label: "STORAGE", value: "PostgreSQL" },
          ].map((s) => (
            <div
              key={s.label}
              className="p-2.5 rounded-lg"
              style={{ background: "var(--surface-secondary)" }}
            >
              <span className="text-[9px] font-semibold uppercase tracking-wider block" style={{ color: "var(--text-muted)" }}>
                {s.label}
              </span>
              <span className="text-xs font-mono font-semibold" style={{ color: "var(--text-primary)" }}>
                {s.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
