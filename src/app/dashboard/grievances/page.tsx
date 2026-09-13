"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MessageSquareWarning,
  ShieldAlert,
  Search,
  CheckCircle2,
  AlertTriangle,
  Zap,
  MapPin,
  FileText,
  Sparkles,
  AlertCircle,
  X,
  Fingerprint,
  ShieldCheck,
} from "lucide-react";
import { FRSVerificationModal } from "@/components/auth/FRSVerificationModal";

interface CitizenGrievance {
  id: string;
  category: string;
  facilityName: string;
  location: string;
  description: string;
  aiSeverityScore: number;
  aiTriageTag: "CRITICAL_FRAUD" | "HIGH_ATTENDANCE_DEFICIT" | "INFRASTRUCTURE_DEFECT" | "ROUTINE";
  isAnonymous: boolean;
  submittedAt: string;
  status: "TRIAGED" | "SQUAD_DISPATCHED" | "RESOLVED" | "UNDER_REVIEW";
}

const STATUS_LABELS: Record<CitizenGrievance["status"], string> = {
  TRIAGED:          "AI Triaged",
  SQUAD_DISPATCHED: "Squad Dispatched",
  RESOLVED:         "Resolved",
  UNDER_REVIEW:     "Under Review",
};

const TRIAGE_LABELS: Record<CitizenGrievance["aiTriageTag"], string> = {
  CRITICAL_FRAUD:          "Critical Fraud",
  HIGH_ATTENDANCE_DEFICIT: "Attendance Deficit",
  INFRASTRUCTURE_DEFECT:   "Infrastructure Defect",
  ROUTINE:                 "Routine",
};

const DEMO_GRIEVANCES: CitizenGrievance[] = [
  {
    id: "GRV-2026-8849",
    category: "Center Closed / Ghost Attendance",
    facilityName: "Asha Rehabilitation Centre",
    location: "Jaipur, Rajasthan",
    description:
      "Facility has remained physically locked for 3 consecutive days during official hours. Registered beneficiaries are not receiving statutory midday meals.",
    aiSeverityScore: 92,
    aiTriageTag: "CRITICAL_FRAUD",
    isAnonymous: true,
    submittedAt: "Today, 08:30 AM",
    status: "TRIAGED",
  },
  {
    id: "GRV-2026-8842",
    category: "Stipend Diversion / Extortion Demand",
    facilityName: "Pragati Skill Training Institute",
    location: "Jodhpur, Rajasthan",
    description:
      "Trainer demanding cash kickback of ₹1,000 from monthly DBT stipend to mark biometric attendance.",
    aiSeverityScore: 88,
    aiTriageTag: "CRITICAL_FRAUD",
    isAnonymous: true,
    submittedAt: "Yesterday, 04:15 PM",
    status: "SQUAD_DISPATCHED",
  },
  {
    id: "GRV-2026-8835",
    category: "Broken Facility / Lack of Clean Water",
    facilityName: "Umang Welfare Special School",
    location: "Alwar, Rajasthan",
    description:
      "Drinking water RO unit has been non-functional for 2 weeks. Disabled student washrooms lack accessible handrails.",
    aiSeverityScore: 65,
    aiTriageTag: "INFRASTRUCTURE_DEFECT",
    isAnonymous: false,
    submittedAt: "2 days ago",
    status: "UNDER_REVIEW",
  },
  {
    id: "GRV-2026-8820",
    category: "Substandard Food / Nutrition Violation",
    facilityName: "Samarth Inclusive Hostel",
    location: "Noida, Uttar Pradesh",
    description:
      "Meal distribution missing required dietary protein quota prescribed under DoSJE scheme norms.",
    aiSeverityScore: 58,
    aiTriageTag: "ROUTINE",
    isAnonymous: true,
    submittedAt: "3 days ago",
    status: "RESOLVED",
  },
];

// ─── Dispatch Confirmation Modal ─────────────────────────────────────────────
function DispatchConfirmModal({
  grievance,
  onConfirm,
  onCancel,
}: {
  grievance: CitizenGrievance;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [acknowledging, setAcknowledging] = useState(false);
  const [showBiometricModal, setShowBiometricModal] = useState(false);

  function handleConfirm() {
    setAcknowledging(true);
    setTimeout(() => {
      setAcknowledging(false);
      onConfirm();
    }, 120);
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dispatch-modal-title"
      >
        <div
          className="w-full max-w-md rounded-2xl shadow-2xl animate-in"
          style={{
            background: "var(--surface-card)",
            border: "1px solid var(--border-default)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid var(--border-light)" }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "var(--color-danger-bg)" }}
              >
                <AlertCircle size={16} style={{ color: "var(--color-danger)" }} />
              </div>
              <h2
                id="dispatch-modal-title"
                className="text-sm font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                Confirm Surprise Audit Dispatch
              </h2>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="p-1.5 rounded-lg transition-colors cursor-pointer"
              style={{ color: "var(--text-muted)" }}
              aria-label="Cancel dispatch"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-4 space-y-4">
            {/* Warning notice */}
            <div
              className="p-3.5 rounded-xl text-xs leading-relaxed"
              style={{
                background: "var(--color-warning-bg)",
                border: "1px solid var(--color-warning-border)",
                color: "var(--color-warning)",
              }}
            >
              <strong>⚠️ Governance Notice:</strong> This action mobilizes an active field
              squad. Under DoSJE SOP Section 12-B, all mobilization orders are cryptographically
              signed and permanently logged.
            </div>

            {/* Grievance summary */}
            <div
              className="p-4 rounded-xl space-y-2 text-xs"
              style={{
                background: "var(--surface-secondary)",
                border: "1px solid var(--border-light)",
              }}
            >
              <div className="flex justify-between">
                <span style={{ color: "var(--text-muted)" }}>Grievance ID</span>
                <span className="font-mono font-bold" style={{ color: "var(--text-primary)" }}>
                  {grievance.id}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--text-muted)" }}>Facility</span>
                <span className="font-semibold text-right max-w-[55%]" style={{ color: "var(--text-primary)" }}>
                  {grievance.facilityName}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--text-muted)" }}>Location</span>
                <span style={{ color: "var(--text-secondary)" }}>{grievance.location}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--text-muted)" }}>AI Severity</span>
                <span
                  className="font-bold"
                  style={{ color: grievance.aiSeverityScore > 80 ? "var(--color-danger)" : "var(--color-warning)" }}
                >
                  {grievance.aiSeverityScore}/100
                </span>
              </div>
            </div>

            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              Recommended: Use Step-Up Biometric FRS for high-trust mobilization, or confirm directly.
            </p>
          </div>

          {/* Actions */}
          <div
            className="p-5 space-y-2.5"
            style={{ borderTop: "1px solid var(--border-light)" }}
          >
            {/* Step-Up Biometric FRS Button */}
            <button
              type="button"
              onClick={() => setShowBiometricModal(true)}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #0284c7, #0d9488)",
                border: "1px solid rgba(56, 189, 248, 0.4)",
              }}
            >
              <Fingerprint size={15} />
              Step-Up Biometric Authorization (FRS)
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                style={{
                  background: "var(--surface-secondary)",
                  border: "1px solid var(--border-light)",
                  color: "var(--text-secondary)",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={acknowledging}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, var(--amber-600), var(--red-600))",
                }}
              >
                {acknowledging ? (
                  <>Logging Action…</>
                ) : (
                  <>
                    <Zap size={14} />
                    Direct Confirm
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showBiometricModal && (
        <FRSVerificationModal
          employeeName="Dr. Sanjay Varma"
          roleTitle="Joint Secretary (Inspection & Monitoring)"
          roleId="CENTRAL_ADMIN"
          actionContext={`Field Squad Mobilization: ${grievance.facilityName}`}
          onVerified={() => {
            setShowBiometricModal(false);
            onConfirm();
          }}
          onCancel={() => setShowBiometricModal(false)}
        />
      )}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GrievanceTriagePage() {
  const [grievances, setGrievances] = useState<CitizenGrievance[]>(DEMO_GRIEVANCES);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGrievance, setSelectedGrievance] = useState<CitizenGrievance | null>(
    DEMO_GRIEVANCES[0]
  );
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [pendingDispatch, setPendingDispatch] = useState<CitizenGrievance | null>(null);
  const [isAnalyzingTip, setIsAnalyzingTip] = useState(false);
  const [squadsInFlight, setSquadsInFlight] = useState(3);

  const handleSimulateNewTip = () => {
    setIsAnalyzingTip(true);
    setTimeout(() => {
      const newId = `GRV-2026-${Math.floor(Math.random() * 9000) + 1000}`;
      const newGrievance: CitizenGrievance = {
        id: newId,
        category: "Proxy Biometrics & Center Lockout",
        facilityName: "Gwalior Inclusive Care Center",
        location: "Gwalior, Madhya Pradesh",
        description:
          "Whistleblower alert: Staff marking biometric attendance using silicone fingerprint molds while center premises remain locked.",
        aiSeverityScore: 94,
        aiTriageTag: "CRITICAL_FRAUD",
        isAnonymous: true,
        submittedAt: "Just now",
        status: "TRIAGED",
      };

      setGrievances((prev) => [newGrievance, ...prev]);
      setSelectedGrievance(newGrievance);
      setIsAnalyzingTip(false);
      setActionNotice(
        `🚨 NEW CITIZEN WHISTLEBLOWER ALERT: ${newGrievance.facilityName} triaged with severity 94/100 (CRITICAL FRAUD).`
      );
      setTimeout(() => setActionNotice(null), 6000);
    }, 250);
  };

  const handleRequestDispatch = (g: CitizenGrievance) => {
    if (g.status === "SQUAD_DISPATCHED" || g.status === "RESOLVED") return;
    setPendingDispatch(g);
  };

  const handleConfirmDispatch = () => {
    if (!pendingDispatch) return;
    setGrievances((prev) =>
      prev.map((g) => (g.id === pendingDispatch.id ? { ...g, status: "SQUAD_DISPATCHED" } : g))
    );
    if (selectedGrievance?.id === pendingDispatch.id) {
      setSelectedGrievance((prev) => prev ? { ...prev, status: "SQUAD_DISPATCHED" } : prev);
    }
    setSquadsInFlight((prev) => prev + 1);
    setActionNotice(
      `Surprise Audit Squad dispatched to ${pendingDispatch.facilityName}. Action logged in cryptographic audit trail.`
    );
    setPendingDispatch(null);
    setTimeout(() => setActionNotice(null), 5000);
  };

  const filtered = grievances.filter(
    (g) =>
      g.facilityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Confirmation Modal */}
      {pendingDispatch && (
        <DispatchConfirmModal
          grievance={pendingDispatch}
          onConfirm={handleConfirmDispatch}
          onCancel={() => setPendingDispatch(null)}
        />
      )}

      {/* Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl"
        style={{
          background: "var(--surface-card)",
          border: "1px solid var(--border-default)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "var(--color-warning-bg)",
              border: "1px solid var(--color-warning-border)",
            }}
          >
            <MessageSquareWarning size={24} style={{ color: "var(--color-warning)" }} />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
                Citizen Whistleblower Triage &amp; Social Audit
              </h1>
              <span
                className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5"
                style={{
                  background: "var(--color-warning-bg)",
                  color: "var(--color-warning)",
                  border: "1px solid var(--color-warning-border)",
                }}
              >
                <Sparkles className="w-3 h-3" />
                AI TRIAGE ACTIVE
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                {squadsInFlight} SQUADS EN ROUTE
              </span>
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Real-time citizen alerts · NLP severity scoring · Autonomous surprise audit dispatch
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSimulateNewTip}
            disabled={isAnalyzingTip}
            className="px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white shadow hover:scale-105 transition cursor-pointer disabled:opacity-50"
            title="Simulate citizen filing a whistleblower tip"
          >
            <Zap size={13} className="text-amber-300" />
            <span>{isAnalyzingTip ? "AI Analyzing Tip..." : "Simulate Live Tip"}</span>
          </button>

          <Link
            href="/grievance"
            target="_blank"
            className="px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors flex-shrink-0"
            style={{
              background: "var(--surface-secondary)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-light)",
            }}
          >
            Open Public Portal ↗
          </Link>
        </div>
      </div>

      {/* Action Notice */}
      {actionNotice && (
        <div
          className="p-4 rounded-xl text-xs flex items-center gap-2.5 animate-in"
          style={{
            background: "var(--color-success-bg)",
            border: "1px solid var(--color-success-border)",
            color: "var(--color-success)",
          }}
        >
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span className="font-semibold">{actionNotice}</span>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Triage List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <div
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
            style={{
              background: "var(--surface-card)",
              border: "1px solid var(--border-light)",
            }}
          >
            <Search className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search by centre, location or grievance ID…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent text-xs focus:outline-none"
              style={{ color: "var(--text-primary)" }}
            />
          </div>

          {/* Grievance Cards */}
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div
                className="p-10 rounded-xl text-center"
                style={{ background: "var(--surface-card)", border: "1px solid var(--border-light)" }}
              >
                <Search size={28} className="mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  No grievances found
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  Try adjusting your search
                </p>
              </div>
            ) : (
              filtered.map((g) => {
                const isSelected = selectedGrievance?.id === g.id;
                const isCritical = g.aiSeverityScore > 80;
                return (
                  <div
                    key={g.id}
                    onClick={() => setSelectedGrievance(g)}
                    className="p-4 rounded-2xl cursor-pointer space-y-2.5 transition-all"
                    style={{
                      background: isSelected ? "var(--surface-elevated)" : "var(--surface-card)",
                      border: isSelected
                        ? "1px solid var(--color-warning-border)"
                        : "1px solid var(--border-light)",
                      boxShadow: isSelected ? "var(--shadow-md)" : "none",
                    }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="font-mono text-xs font-bold flex-shrink-0"
                          style={{ color: "var(--color-warning)" }}
                        >
                          {g.id}
                        </span>
                        <h3 className="font-bold text-sm truncate" style={{ color: "var(--text-primary)" }}>
                          {g.facilityName}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                          style={{
                            background: isCritical ? "var(--color-danger-bg)" : "var(--color-warning-bg)",
                            color: isCritical ? "var(--color-danger)" : "var(--color-warning)",
                            border: `1px solid ${isCritical ? "var(--color-danger-border)" : "var(--color-warning-border)"}`,
                          }}
                        >
                          Risk: {g.aiSeverityScore}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold"
                          style={{
                            background:
                              g.status === "SQUAD_DISPATCHED"
                                ? "var(--color-info-bg)"
                                : g.status === "RESOLVED"
                                ? "var(--color-success-bg)"
                                : "var(--color-warning-bg)",
                            color:
                              g.status === "SQUAD_DISPATCHED"
                                ? "var(--color-info)"
                                : g.status === "RESOLVED"
                                ? "var(--color-success)"
                                : "var(--color-warning)",
                          }}
                        >
                          {STATUS_LABELS[g.status]}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                      {g.description}
                    </p>

                    <div className="flex items-center justify-between text-[11px]" style={{ color: "var(--text-muted)" }}>
                      <span className="flex items-center gap-1">
                        <MapPin size={11} style={{ color: "var(--blue-500)" }} />
                        {g.location}
                      </span>
                      <span>{g.submittedAt}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: AI Diagnostic Panel */}
        <div className="space-y-4">
          {selectedGrievance && (
            <div
              className="rounded-2xl space-y-4 overflow-hidden"
              style={{
                background: "var(--surface-card)",
                border: "1px solid var(--border-default)",
                boxShadow: "var(--shadow-md)",
              }}
            >
              {/* Panel Header */}
              <div
                className="px-5 py-4 flex items-center justify-between"
                style={{ borderBottom: "1px solid var(--border-light)" }}
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" style={{ color: "var(--color-warning)" }} />
                  <h3 className="font-extrabold text-sm" style={{ color: "var(--text-primary)" }}>
                    AI Grievance Diagnostic
                  </h3>
                </div>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded"
                  style={{ background: "var(--surface-secondary)", color: "var(--text-muted)" }}
                >
                  {selectedGrievance.id}
                </span>
              </div>

              <div className="px-5 pb-5 space-y-3">
                {/* Fields */}
                {[
                  { label: "Violation Category", value: selectedGrievance.category },
                  { label: "AI Triage Classification", value: TRIAGE_LABELS[selectedGrievance.aiTriageTag] },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="p-3.5 rounded-xl space-y-1"
                    style={{ background: "var(--surface-secondary)", border: "1px solid var(--border-light)" }}
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wider block" style={{ color: "var(--text-muted)" }}>
                      {label}
                    </span>
                    <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{value}</p>
                  </div>
                ))}

                <div
                  className="p-3.5 rounded-xl space-y-1"
                  style={{ background: "var(--surface-secondary)", border: "1px solid var(--border-light)" }}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider block" style={{ color: "var(--text-muted)" }}>
                    Full Incident Statement
                  </span>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {selectedGrievance.description}
                  </p>
                </div>

                {/* AI Assessment */}
                <div
                  className="p-3.5 rounded-xl space-y-1"
                  style={{
                    background: "var(--color-danger-bg)",
                    border: "1px solid var(--color-danger-border)",
                  }}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider block" style={{ color: "var(--color-danger)" }}>
                    Automated Assessment
                  </span>
                  <p className="text-xs font-medium leading-relaxed" style={{ color: "var(--color-danger)" }}>
                    Immediate unannounced surprise physical inspection recommended. Discrepancy matches CCTV downtime pattern.
                  </p>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleRequestDispatch(selectedGrievance)}
                    disabled={
                      selectedGrievance.status === "SQUAD_DISPATCHED" ||
                      selectedGrievance.status === "RESOLVED"
                    }
                    className="w-full py-2.5 rounded-xl text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-opacity cursor-pointer"
                    style={{
                      background:
                        selectedGrievance.status === "SQUAD_DISPATCHED" || selectedGrievance.status === "RESOLVED"
                          ? "var(--surface-secondary)"
                          : "linear-gradient(135deg, var(--amber-600), var(--red-600))",
                      color:
                        selectedGrievance.status === "SQUAD_DISPATCHED" || selectedGrievance.status === "RESOLVED"
                          ? "var(--text-muted)"
                          : "white",
                      cursor:
                        selectedGrievance.status === "SQUAD_DISPATCHED" || selectedGrievance.status === "RESOLVED"
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    <Zap size={14} />
                    {selectedGrievance.status === "SQUAD_DISPATCHED"
                      ? "Squad Already Dispatched"
                      : selectedGrievance.status === "RESOLVED"
                      ? "Grievance Resolved"
                      : "Dispatch Surprise Audit Squad"}
                  </button>

                  <Link
                    href="/dashboard/inspections"
                    className="w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-colors"
                    style={{
                      background: "var(--surface-secondary)",
                      color: "var(--text-secondary)",
                      border: "1px solid var(--border-light)",
                    }}
                  >
                    View Active Inspection Squads →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {pendingDispatch && (
        <DispatchConfirmModal
          grievance={pendingDispatch}
          onConfirm={handleConfirmDispatch}
          onCancel={() => setPendingDispatch(null)}
        />
      )}
    </div>
  );
}
