"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState, useEffect } from "react";
import { GlobalStatusBar } from "@/components/shared/GlobalStatusBar";
import { NationalPulseBar } from "@/components/shared/NationalPulseBar";
import { AISignalPanel } from "@/components/ai/AISignalPanel";
import { DEMO_PROJECTS, DEMO_AUDIT_EVENTS, DEMO_METRICS } from "@/lib/demo-data";
import { formatRelativeTime, getStatusStyle, cn } from "@/lib/utils";
import {
  ArrowRight,
  ExternalLink,
  Map as MapIcon,
  ClipboardCheck,
  Camera,
  TrendingUp,
  Activity,
  Brain,
  Video,
  Shuffle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wifi,
  WifiOff,
  Eye,
  Sparkles,
  Zap,
} from "lucide-react";
import { ExplainableRiskModal } from "@/components/ai/ExplainableRiskModal";
import { CCTVMatrixModal } from "@/components/cctv/CCTVMatrixModal";

const MapPanel = dynamic(
  () => import("@/components/map/MapPanel").then((m) => ({ default: m.MapPanel })),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full h-full flex items-center justify-center rounded-xl"
        style={{ background: "var(--surface-card)", border: "1px solid var(--border-light)" }}
      >
        <div className="text-center">
          <div className="skeleton" style={{ width: 40, height: 40, borderRadius: "50%", margin: "0 auto 10px" }} />
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Loading map…</p>
        </div>
      </div>
    ),
  }
);

function getRiskStyle(score: number): { bg: string; text: string } {
  if (score >= 80) return { bg: "var(--color-danger-bg)",  text: "var(--color-danger)"  };
  if (score >= 60) return { bg: "var(--color-danger-bg)",  text: "var(--color-danger)"  };
  if (score >= 35) return { bg: "var(--color-warning-bg)", text: "var(--color-warning)" };
  return               { bg: "var(--color-success-bg)", text: "var(--color-success)" };
}

function ProjectCard({
  project,
  onShowRisk,
}: {
  project: typeof DEMO_PROJECTS[0];
  onShowRisk?: (pId: string) => void;
}) {
  const statusStyle = getStatusStyle(project.status);
  const riskColors  = getRiskStyle(project.ai_risk_score);

  return (
    <div
      className="block transition-all rounded-xl p-3"
      style={{
        background: "var(--surface-card)",
        border: "1px solid var(--border-light)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--border-default)";
        e.currentTarget.style.boxShadow = "var(--shadow-md)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-light)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <Link href={`/dashboard/projects/${project.id}`} className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: statusStyle.dotColor }}
            />
            <span
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              {project.status.replace("-", " ")}
            </span>
          </div>
          <p
            className="text-xs font-bold truncate hover:underline text-primary"
          >
            {project.name}
          </p>
          <p
            className="text-[10px] truncate"
            style={{ color: "var(--text-muted)" }}
          >
            {project.district_name}, {project.state}
          </p>
        </Link>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onShowRisk?.(project.id);
          }}
          title="Click to view AI SHAP Explainability Breakdown"
          className="px-2 py-1 rounded-lg text-[10px] font-bold tabular cursor-pointer hover:scale-105 transition-transform flex-shrink-0"
          style={{
            background: riskColors.bg,
            color: riskColors.text,
          }}
        >
          {project.ai_risk_score}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Camera size={10} style={{ color: "var(--text-muted)" }} />
          <span className="text-[10px] tabular" style={{ color: "var(--text-muted)" }}>
            {project.cctv_online}/{project.cctv_total}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Activity size={10} style={{ color: "var(--text-muted)" }} />
          <span className="text-[10px] tabular" style={{ color: "var(--text-muted)" }}>
            {project.health.overall}%
          </span>
        </div>
        <ArrowRight
          size={10}
          className="ml-auto"
          style={{ color: "var(--text-muted)" }}
        />
      </div>
    </div>
  );
}

function AuditEventItem({ event }: { event: typeof DEMO_AUDIT_EVENTS[0] }) {
  const ACTION_LABELS: Record<string, string> = {
    inspection_started: "Inspection started",
    gps_verified: "GPS verified",
    evidence_captured: "Evidence captured",
    attendance_submitted: "Attendance submitted",
    report_submitted: "Report submitted",
    ai_anomaly_generated: "AI anomaly detected",
    cctv_offline: "CCTV offline",
    cctv_online: "CCTV restored",
    vc_initiated: "Video verification",
    anomaly_resolved: "Anomaly resolved",
  };

  const ACTION_ICONS: Record<string, typeof Activity> = {
    inspection_started: ClipboardCheck,
    gps_verified: MapIcon,
    evidence_captured: Camera,
    attendance_submitted: CheckCircle2,
    report_submitted: CheckCircle2,
    ai_anomaly_generated: Brain,
    cctv_offline: WifiOff,
    cctv_online: Wifi,
  };

  const ACTION_COLORS: Record<string, string> = {
    inspection_started: "var(--blue-500)",
    gps_verified: "var(--green-500)",
    evidence_captured: "var(--blue-500)",
    attendance_submitted: "var(--green-500)",
    report_submitted: "var(--green-500)",
    ai_anomaly_generated: "var(--purple-500)",
    cctv_offline: "var(--red-500)",
    cctv_online: "var(--green-500)",
  };

  const Icon = ACTION_ICONS[event.action] || Activity;
  const color = ACTION_COLORS[event.action] || "var(--text-muted)";
  const time = formatRelativeTime(event.timestamp);

  return (
    <div className="timeline-item">
      <div className="flex-shrink-0">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{
            background: `${color}12`,
            border: `1px solid ${color}25`,
          }}
        >
          <Icon size={14} style={{ color }} />
        </div>
      </div>
      <div className="flex-1 pb-3 min-w-0">
        <div className="flex items-baseline gap-2">
          <span
            className="text-xs font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {ACTION_LABELS[event.action] || event.action}
          </span>
        </div>
        <p
          className="text-[10px] mt-0.5"
          style={{ color: "var(--text-muted)" }}
        >
          {event.actor_name} · {time}
        </p>
      </div>
    </div>
  );
}

export default function CommandCenterPage() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedRiskProjectId, setSelectedRiskProjectId] = useState<string | null>(null);
  const [showCCTVModal, setShowCCTVModal] = useState(false);
  const [mobileTab, setMobileTab] = useState<"projects" | "map" | "signals">("map");
  const [auditEvents, setAuditEvents] = useState(DEMO_AUDIT_EVENTS);

  // Live Audit event simulator
  useEffect(() => {
    const actions: Array<typeof DEMO_AUDIT_EVENTS[0]["action"]> = [
      "gps_verified",
      "attendance_submitted",
      "ai_anomaly_generated",
      "cctv_online",
      "evidence_captured",
      "inspection_started",
    ];
    const actors = [
      "Officer Rajesh Verma",
      "Officer Priya Sharma",
      "System Anomaly AI",
      "Inspection Squad #3",
      "Officer S. Venkat",
    ];

    const timer = setInterval(() => {
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      const randomActor = actors[Math.floor(Math.random() * actors.length)];
      const newEvt = {
        id: `audit-live-${Date.now()}`,
        action: randomAction,
        actor_id: "u-live",
        actor_name: randomActor,
        actor_role: "inspector" as const,
        target_type: "project",
        target_id: "INS-2041",
        target_name: "Asha Rehabilitation Centre",
        details: { live: true },
        ip_address: "10.0.4.12",
        timestamp: new Date().toISOString(),
      };

      setAuditEvents((prev) => [newEvt, ...prev.slice(0, 9)]);
    }, 11000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <GlobalStatusBar />
      <div className="px-3 pt-2">
        <NationalPulseBar />
      </div>

      {/* Operational Loop */}
      <div
        className="flex items-center justify-between px-4 py-2.5 flex-shrink-0 overflow-x-auto"
        style={{
          background: "var(--surface-secondary)",
          borderBottom: "1px solid var(--border-light)",
        }}
      >
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="text-[9px] font-bold tracking-widest uppercase mr-1"
            style={{ color: "var(--text-muted)" }}
          >
            OPERATIONAL LOOP
          </span>
          {[
            { step: "Detect", color: "var(--purple-500)" },
            { step: "Verify", color: "var(--blue-500)" },
            { step: "Inspect", color: "var(--amber-500)" },
            { step: "Record", color: "var(--green-500)" },
            { step: "Act", color: "var(--text-primary)" },
          ].map((s, idx) => (
            <div key={s.step} className="flex items-center gap-1 text-[10px]">
              <span className="font-bold" style={{ color: s.color }}>{s.step}</span>
              {idx < 4 && <span style={{ color: "var(--text-muted)" }}>→</span>}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          <button
            type="button"
            onClick={() => setShowCCTVModal(true)}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Video size={13} />
            <span>CCTV Grid</span>
          </button>
          <Link
            href="/dashboard/video-verification"
            className="btn btn-primary btn-sm"
          >
            <Video size={12} />
            Video VC
          </Link>
          <Link
            href="/dashboard/inspections/assign"
            className="btn btn-secondary btn-sm"
          >
            <Shuffle size={12} />
            Dispatch
          </Link>
        </div>
      </div>

      {/* Mobile Tabs */}
      <div
        className="md:hidden flex items-center p-1 flex-shrink-0"
        role="tablist"
        aria-label="Dashboard view"
        style={{
          background: "var(--surface-secondary)",
          borderBottom: "1px solid var(--border-light)",
        }}
      >
        {(["projects", "map", "signals"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={mobileTab === tab}
            onClick={() => setMobileTab(tab)}
            className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            style={{
              background: mobileTab === tab ? "var(--surface-card)" : "transparent",
              color: mobileTab === tab ? "var(--text-primary)" : "var(--text-muted)",
              boxShadow: mobileTab === tab ? "var(--shadow-sm)" : "none",
            }}
          >
            {tab === "projects" && `Projects (${DEMO_PROJECTS.length})`}
            {tab === "map" && "Map"}
            {tab === "signals" && `AI Signals (${3})`}
          </button>
        ))}
      </div>

      {/* Main 3-Column */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* LEFT — Projects */}
        <div
          className={cn(
            "flex flex-col overflow-hidden w-full md:w-[280px] flex-shrink-0",
            mobileTab !== "projects" && "hidden md:flex"
          )}
          style={{ borderRight: "1px solid var(--border-light)" }}
        >
          <div
            className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{ borderBottom: "1px solid var(--border-light)" }}
          >
            <span
              className="text-xs font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Monitored Projects
            </span>
            <Link
              href="/dashboard/projects"
              className="flex items-center gap-1 text-[10px] font-semibold transition-colors"
              style={{ color: "var(--color-info)" }}
            >
              All <ArrowRight size={10} />
            </Link>
          </div>

          <div className="overflow-y-auto flex-1 p-2 space-y-1.5">
            {DEMO_PROJECTS.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onShowRisk={(pId) => setSelectedRiskProjectId(pId)}
              />
            ))}
          </div>

          {/* Activity Timeline */}
          <div style={{ borderTop: "1px solid var(--border-light)", maxHeight: 240, overflow: "hidden" }}>
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ borderBottom: "1px solid var(--border-light)" }}
            >
              <Activity size={13} style={{ color: "var(--text-muted)" }} />
              <span
                className="text-xs font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                Recent Activity
              </span>
            </div>
            <div className="overflow-y-auto px-4 py-3" style={{ maxHeight: 185 }}>
              {auditEvents.slice(0, 6).map((event) => (
                <AuditEventItem key={event.id} event={event} />
              ))}
            </div>
          </div>
        </div>

        {/* CENTER — Map */}
        <div
          className={cn(
            "flex-1 relative overflow-hidden min-w-0 h-full",
            mobileTab !== "map" && "hidden md:block"
          )}
        >
          <div className="absolute inset-3">
            <MapPanel onProjectClick={setSelectedProject} />
          </div>

          {/* Quick Actions Overlay */}
          <div className="absolute top-5 left-5 flex flex-col gap-2" style={{ zIndex: 5 }}>
            <Link
              href="/dashboard/inspections/assign"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold glass"
              style={{ color: "var(--text-primary)" }}
            >
              <ClipboardCheck size={13} style={{ color: "var(--blue-600)" }} />
              Assign Inspection
            </Link>
            <Link
              href="/dashboard/monitor"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold glass"
              style={{ color: "var(--text-primary)" }}
            >
              <Camera size={13} style={{ color: "var(--blue-600)" }} />
              Live Monitor
            </Link>
          </div>
        </div>

        {/* RIGHT — AI Signals */}
        <div
          className={cn(
            "overflow-hidden flex flex-col w-full md:w-[300px] flex-shrink-0",
            mobileTab !== "signals" && "hidden md:flex"
          )}
          style={{ borderLeft: "1px solid var(--border-light)" }}
        >
          <AISignalPanel />
        </div>
      </div>

      {/* Render Explainable Risk Modal */}
      {selectedRiskProjectId && (
        <ExplainableRiskModal
          projectId={selectedRiskProjectId}
          onClose={() => setSelectedRiskProjectId(null)}
          onDispatchInspection={() => setSelectedRiskProjectId(null)}
        />
      )}

      {/* Render CCTV Matrix Modal */}
      {showCCTVModal && (
        <CCTVMatrixModal
          onClose={() => setShowCCTVModal(false)}
        />
      )}
    </div>
  );
}
