"use client";

import { useState } from "react";
import { DEMO_AUDIT_EVENTS } from "@/lib/demo-data";
import {
  BookOpen,
  Shield,
  Camera,
  ClipboardCheck,
  Brain,
  CheckCircle,
  AlertTriangle,
  Download,
  ShieldCheck,
  Layers,
  Sparkles,
  Lock,
} from "lucide-react";
import { generateMinistryDossierPDF } from "@/lib/reports/pdf-generator";
import { CryptographicLedgerModal } from "@/components/audit/CryptographicLedgerModal";

const ACTION_CONFIG: Record<
  string,
  { label: string; icon: React.FC<{ size: number }>; color: string }
> = {
  inspection_started: {
    label: "Inspection Started",
    icon: ({ size }) => <ClipboardCheck size={size} />,
    color: "var(--blue-500)",
  },
  gps_verified: {
    label: "GPS Verified",
    icon: ({ size }) => <Shield size={size} />,
    color: "var(--green-500)",
  },
  evidence_captured: {
    label: "Evidence Captured",
    icon: ({ size }) => <Camera size={size} />,
    color: "var(--blue-500)",
  },
  attendance_submitted: {
    label: "Attendance Submitted",
    icon: ({ size }) => <CheckCircle size={size} />,
    color: "var(--green-500)",
  },
  report_submitted: {
    label: "Report Submitted",
    icon: ({ size }) => <CheckCircle size={size} />,
    color: "var(--green-500)",
  },
  ai_anomaly_generated: {
    label: "AI Anomaly Detected",
    icon: ({ size }) => <Brain size={size} />,
    color: "var(--purple-500)",
  },
  cctv_offline: {
    label: "CCTV Offline",
    icon: ({ size }) => <AlertTriangle size={size} />,
    color: "var(--red-500)",
  },
  cctv_online: {
    label: "CCTV Restored",
    icon: ({ size }) => <Camera size={size} />,
    color: "var(--green-500)",
  },
};

export default function AuditPage() {
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAction, setSelectedAction] = useState("all");
  const [selectedAuditReport, setSelectedAuditReport] = useState<{
    id: string;
    facilityName: string;
    inspectorName: string;
    timestamp: string;
    headcount: number;
    checklistScore: number;
  } | undefined>(undefined);

  const handleOpenCertificate = (reportId?: string, actorName?: string) => {
    setSelectedAuditReport({
      id: reportId || "INSP-0094-RJ",
      facilityName: "Asha Rehabilitation Centre",
      inspectorName: actorName || "Priya Mehta (Inspection Officer)",
      timestamp: new Date().toISOString(),
      headcount: 48,
      checklistScore: 92,
    });
    setShowLedgerModal(true);
  };

  const filteredEvents = DEMO_AUDIT_EVENTS.filter((event) => {
    const matchesAction = selectedAction === "all" || event.action === selectedAction;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      event.actor_name.toLowerCase().includes(q) ||
      event.id.toLowerCase().includes(q) ||
      (event.project_id && event.project_id.toLowerCase().includes(q)) ||
      (ACTION_CONFIG[event.action]?.label || "").toLowerCase().includes(q);
    return matchesAction && matchesSearch;
  });

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen size={18} className="text-primary" />
            <h1 className="text-xl md:text-2xl font-extrabold text-primary">
              Cryptographic Audit Trail &amp; Verification Chain
            </h1>
          </div>
          <p className="text-xs text-muted">
            Immutable chronological ledger with SHA-256 Merkle root verification under DPDP Act 2023 &amp; DoSJE Standards
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenCertificate()}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <ShieldCheck size={14} /> Verify Merkle Proof
          </button>

          <button
            onClick={() =>
              generateMinistryDossierPDF({ title: "Immutable Audit Trail Dossier" })
            }
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Download size={13} /> Export Certified Dossier
          </button>
        </div>
      </div>

      {/* Security Notice */}
      <div
        className="flex items-center justify-between gap-3 p-4 rounded-2xl"
        style={{
          background: "var(--color-success-bg)",
          border: "1px solid var(--color-success-border)",
        }}
      >
        <div className="flex items-center gap-3">
          <Shield size={16} style={{ color: "var(--green-600)", flexShrink: 0 }} />
          <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            All field actions are signed with ECDSA SHA-256 hashes. Geofence locks, cellular cell tower IDs, and biometric face hashes are tamper-sealed.
          </p>
        </div>
        <span className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-emerald-500/20 text-emerald-700 border border-emerald-500/30 whitespace-nowrap">
          MERKLE SEAL ACTIVE
        </span>
      </div>

      {/* Audit Filters Bar */}
      <div
        className="p-3.5 rounded-2xl border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm"
        style={{
          background: "var(--surface-card)",
          borderColor: "var(--border-light)",
        }}
      >
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <input
            type="text"
            placeholder="Search by Officer name, Event ID, or Project..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-xl border outline-none transition"
            style={{
              background: "var(--surface-secondary)",
              borderColor: "var(--border-light)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border outline-none transition cursor-pointer font-semibold"
            style={{
              background: "var(--surface-secondary)",
              borderColor: "var(--border-light)",
              color: "var(--text-primary)",
            }}
          >
            <option value="all">All Event Types ({DEMO_AUDIT_EVENTS.length})</option>
            {Object.entries(ACTION_CONFIG).map(([key, val]) => (
              <option key={key} value={key}>
                {val.label}
              </option>
            ))}
          </select>

          {(searchQuery || selectedAction !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedAction("all");
              }}
              className="text-xs px-2.5 py-1.5 rounded-lg border font-bold transition cursor-pointer"
              style={{
                borderColor: "var(--border-light)",
                color: "var(--text-secondary)",
                background: "var(--surface-secondary)",
              }}
            >
              Reset
            </button>
          )}

          <span className="text-[11px] font-mono font-bold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {filteredEvents.length} records
          </span>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {filteredEvents.length === 0 ? (
          <div
            className="p-8 text-center rounded-2xl border text-xs"
            style={{
              background: "var(--surface-primary)",
              borderColor: "var(--border-primary)",
              color: "var(--text-muted)",
            }}
          >
            No audit records match the selected filter criteria.
          </div>
        ) : (
          filteredEvents.map((event) => {
          const config =
            ACTION_CONFIG[event.action] || {
              label: "System Event",
              icon: BookOpen,
              color: "var(--text-muted)",
            };
          const Icon = config.icon;
          const time = new Date(event.timestamp).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          });

          return (
            <div
              key={event.id}
              className="p-4 rounded-2xl bg-card border border-base flex items-start justify-between gap-4 transition hover:border-blue-500/40"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: `${config.color}15`,
                    border: `1px solid ${config.color}30`,
                    color: config.color,
                  }}
                >
                  <Icon size={16} />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-bold text-primary">{config.label}</p>
                    <span className="text-[10px] font-mono text-muted bg-slate-800/20 px-1.5 py-0.5 rounded">
                      {event.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted flex-wrap">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{event.actor_name}</span>
                    {event.project_id && (
                      <span className="text-blue-600 dark:text-cyan-400 font-mono font-semibold">· Project #{event.project_id}</span>
                    )}
                  </div>
                  {Object.keys(event.metadata).length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {Object.entries(event.metadata).map(([k, v]) => (
                        <span
                          key={k}
                          className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                        >
                          {k}: {String(v)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <span suppressHydrationWarning className="text-[10px] font-mono text-muted">
                  {time}
                </span>
                <button
                  onClick={() => handleOpenCertificate(event.id, event.actor_name)}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-emerald-400 flex items-center gap-1 border border-slate-700 transition"
                >
                  <Lock size={10} /> View Seal
                </button>
              </div>
            </div>
          );
        })
      )}
      </div>

      <CryptographicLedgerModal
        isOpen={showLedgerModal}
        onClose={() => setShowLedgerModal(false)}
        reportData={selectedAuditReport}
      />
    </div>
  );
}
