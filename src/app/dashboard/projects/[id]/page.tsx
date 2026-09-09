"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { DEMO_PROJECTS, DEMO_CCTV_CAMERAS, DEMO_ATTENDANCE, DEMO_AI_SIGNALS } from "@/lib/demo-data";
import { formatDateTime, formatRelativeTime, getStatusStyle } from "@/lib/utils";
import { useState } from "react";
import {
  ArrowLeft, MapPin, Building2, Camera, Activity,
  FileImage, Brain, ClipboardCheck, Shield, TrendingUp,
  Users, AlertTriangle, CheckCircle, ExternalLink, Play, Pause,
} from "lucide-react";

const TABS = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "monitor", label: "Live Monitor", icon: Camera },
  { id: "inspections", label: "Inspections", icon: ClipboardCheck },
  { id: "attendance", label: "Attendance", icon: Users },
  { id: "ai-signals", label: "AI Signals", icon: Brain },
  { id: "compliance", label: "Compliance", icon: Shield },
];

function HealthArc({ value, label, color }: { value: number; label: string; color: string }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={54} height={54} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={27} cy={27} r={r} fill="none" stroke="var(--border)" strokeWidth={4} />
        <circle cx={27} cy={27} r={r} fill="none" stroke={color} strokeWidth={4} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 600ms cubic-bezier(0.16, 1, 0.3, 1)" }} />
        <text x={27} y={31} textAnchor="middle" style={{ transform: "rotate(90deg)", transformOrigin: "27px 27px", fontSize: "10px", fontWeight: 700, fill: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
          {value}
        </text>
      </svg>
      <span className="text-[10px] text-muted text-center">{label}</span>
    </div>
  );
}

function CameraFeed({ camera }: { camera: typeof DEMO_CCTV_CAMERAS[0] }) {
  const [playing, setPlaying] = useState(true);
  return (
    <div className="camera-tile group cursor-pointer relative" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
      {camera.status === "offline" ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-surface">
          <Camera size={20} style={{ color: "#5B6070", marginBottom: 6 }} />
          <p className="text-[10px] text-muted font-medium">OFFLINE</p>
          <p className="text-[9px] text-muted mt-0.5">{formatRelativeTime(camera.last_heartbeat)}</p>
        </div>
      ) : (
        <>
          <video src={camera.demo_stream_url} autoPlay={playing} muted loop playsInline className="w-full h-full object-cover" style={{ opacity: 0.9 }} />
          <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded" style={{ background: "rgba(224,161,0,0.9)", fontSize: "9px", fontWeight: 700, color: "white", letterSpacing: "0.04em" }}>DEMO</div>
          <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: camera.status === "demo" ? "#1FA957" : "#E0A100" }} />
            <span className="text-[9px] text-white font-semibold">LIVE</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5" style={{ background: "linear-gradient(to top, rgba(11,13,18,0.9), transparent)" }}>
            <p className="text-[10px] text-white font-semibold leading-tight">{camera.camera_id}</p>
            <p className="text-[9px] text-white/70 leading-tight">{camera.location_description}</p>
            <span className="text-[8px] text-white/50">{camera.fps} FPS · {camera.latency_ms}ms</span>
          </div>
          <button className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.3)" }}
            onClick={() => setPlaying(!playing)} aria-label={playing ? "Pause" : "Play"}>
            {playing ? <Pause size={20} className="text-white" /> : <Play size={20} className="text-white" />}
          </button>
        </>
      )}
    </div>
  );
}

function OverviewTab({ project }: { project: typeof DEMO_PROJECTS[0] }) {
  const HEALTH_METRICS = [
    { key: "compliance", label: "Compliance", color: "#2E6BFF" },
    { key: "attendance", label: "Attendance", color: "#1FA957" },
    { key: "inspection", label: "Inspection", color: "#E0A100" },
    { key: "evidence", label: "Evidence", color: "#2E6BFF" },
    { key: "reporting", label: "Reporting", color: "#7C4DE0" },
    { key: "cctv", label: "CCTV", color: "#1FA957" },
  ] as const;

  return (
    <div className="grid grid-cols-3 gap-4 p-4">
      {/* Health score */}
      <div className="col-span-2 card p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={14} className="text-muted" />
          <span className="text-xs font-semibold text-primary">Project Health Score</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <svg width={80} height={80} style={{ transform: "rotate(-90deg)" }}>
              <circle cx={40} cy={40} r={34} fill="none" stroke="var(--border)" strokeWidth={6} />
              <circle cx={40} cy={40} r={34} fill="none"
                stroke={project.health.overall >= 80 ? "#1FA957" : project.health.overall >= 60 ? "#E0A100" : "#E23B3B"}
                strokeWidth={6} strokeDasharray={2 * Math.PI * 34} strokeDashoffset={2 * Math.PI * 34 * (1 - project.health.overall / 100)} strokeLinecap="round" />
              <text x={40} y={45} textAnchor="middle" style={{ transform: "rotate(90deg)", transformOrigin: "40px 40px", fontSize: "16px", fontWeight: 700, fill: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                {project.health.overall}
              </text>
            </svg>
            <span className="text-[10px] text-muted">Overall</span>
          </div>
          <div className="flex flex-wrap gap-4">
            {HEALTH_METRICS.map(({ key, label, color }) => (
              <HealthArc key={key} value={project.health[key]} label={label} color={color} />
            ))}
          </div>
        </div>
      </div>

      {/* Key info */}
      <div className="card p-4 space-y-4">
        <div>
          <p className="section-label mb-1">AI Risk Score</p>
          <div className="flex items-baseline gap-2">
            <span className="tabular text-2xl font-bold" style={{
              color: project.ai_risk_score >= 80 ? "var(--red-base)" : project.ai_risk_score >= 60 ? "var(--amber-base)" : "var(--green-base)",
            }}>{project.ai_risk_score}</span>
            <span className="text-xs text-muted">/100</span>
            <span className="risk-badge" style={{
              background: project.ai_risk_score >= 60 ? "var(--red-tint)" : "var(--amber-tint)",
              color: project.ai_risk_score >= 60 ? "var(--red-strong)" : "var(--amber-strong)",
            }}>
              {project.ai_risk_score >= 80 ? "CRITICAL" : project.ai_risk_score >= 60 ? "HIGH" : project.ai_risk_score >= 30 ? "MEDIUM" : "LOW"}
            </span>
          </div>
          <p className="text-[10px] text-muted mt-0.5">Configurable prototype model</p>
        </div>
        <div className="border-t border-base pt-3 space-y-2">
          {[
            { label: "Beneficiaries", value: project.registered_beneficiaries },
            { label: "CCTV Online", value: `${project.cctv_online}/${project.cctv_total}` },
            { label: "Incharge", value: project.incharge_name },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="section-label">{label}</p>
              <p className="text-xs font-medium text-primary">{String(value)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Location */}
      <div className="col-span-3 card p-4">
        <div className="flex items-center gap-2 mb-2">
          <MapPin size={13} className="text-muted" />
          <span className="text-xs font-semibold text-primary">Location & Compliance</span>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Address", value: project.location.address },
            { label: "GPS", value: `${project.location.latitude}°N, ${project.location.longitude}°E` },
            { label: "Scheme", value: project.scheme_name },
            { label: "Last Inspection", value: project.last_inspection_date ? formatDateTime(project.last_inspection_date) : "None" },
          ].map((item) => (
            <div key={item.label}>
              <p className="section-label">{item.label}</p>
              <p className="text-xs text-primary tabular mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LiveMonitorTab({ projectId }: { projectId: string }) {
  const cameras = DEMO_CCTV_CAMERAS.filter((c) => c.project_id === projectId);
  const [activeCamera, setActiveCamera] = useState(cameras[0]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-tint border border-amber-base/30">
        <AlertTriangle size={12} className="text-amber-strong" />
        <p className="text-[11px] text-amber-strong"><strong>DEMO STREAMS</strong> — Sample feeds for prototype demonstration.</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {activeCamera && (
          <div className="col-span-2 space-y-2">
            <div className="camera-tile" style={{ aspectRatio: "16/9" }}>
              <video key={activeCamera.id} src={activeCamera.demo_stream_url} autoPlay muted loop playsInline className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex flex-col justify-between p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-strong" />
                    <span className="text-[11px] text-white font-semibold">DEMO STREAM</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold text-white" style={{ background: "rgba(224,161,0,0.85)" }}>DEMO</span>
                </div>
                <div className="evidence-overlay font-mono self-start">
                  <div className="text-[10px] opacity-80">{activeCamera.camera_id} · {activeCamera.location_description}</div>
                  <div>{activeCamera.fps} FPS · {activeCamera.latency_ms}ms</div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted">
              <CheckCircle size={12} className="text-green-strong" /> Location verified · Connection encrypted
            </div>
          </div>
        )}
        <div className="flex flex-col gap-2">
          {cameras.map((cam) => (
            <button key={cam.id} type="button" className="cursor-pointer rounded-lg overflow-hidden border transition focus-visible:ring-2 focus-visible:ring-blue-500 text-left"
              style={{ border: activeCamera?.id === cam.id ? "2px solid var(--blue-base)" : "1px solid var(--border)" }}
              onClick={() => setActiveCamera(cam)} aria-label={`Camera ${cam.camera_id}`}>
              <CameraFeed camera={cam} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("overview");
  const project = DEMO_PROJECTS.find((p) => p.id === params.id);

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-sm font-semibold text-primary">Project not found</p>
          <p className="text-xs text-muted mt-1">ID: {params.id}</p>
          <Link href="/dashboard/projects" className="text-sm mt-4 block text-blue-strong">← Back to Projects</Link>
        </div>
      </div>
    );
  }

  const statusStyle = getStatusStyle(project.status);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-base px-6 py-4 bg-card flex-shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link href="/dashboard/projects" className="flex items-center gap-1 mb-2 hover:opacity-70 transition-opacity text-[11px] text-muted">
              <ArrowLeft size={12} /> Projects
            </Link>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-lg font-bold text-primary leading-tight">{project.name}</h1>
              <span className="status-pill" style={{
                background: project.status === "operational" ? "var(--green-tint)" : project.status === "at-risk" ? "var(--amber-tint)" : project.status === "critical" ? "var(--red-tint)" : "var(--surface-secondary)",
                color: project.status === "operational" ? "var(--green-strong)" : project.status === "at-risk" ? "var(--amber-strong)" : project.status === "critical" ? "var(--red-strong)" : "var(--text-muted)",
              }}>
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: statusStyle.dotColor }} />
                {project.status.replace("-", " ").toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-muted">
              <span className="flex items-center gap-1"><Building2 size={12} /> {project.organization_name}</span>
              <span className="flex items-center gap-1"><MapPin size={12} /> {project.district_name}, {project.state}</span>
              <span>{project.scheme_name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href={`/dashboard/inspections/assign?project=${project.id}`} className="btn-secondary flex items-center gap-1.5 text-xs">
              <ClipboardCheck size={13} /> Inspect
            </Link>
            <Link href={`/dashboard/monitor?project=${project.id}`} className="btn-primary flex items-center gap-1.5 text-xs">
              <Camera size={13} /> Monitor
            </Link>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex gap-1 mt-4" role="tablist">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" role="tab" onClick={() => setActiveTab(id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition focus-visible:ring-2 focus-visible:ring-blue-500 text-xs"
              style={{
                background: activeTab === id ? "var(--surface-secondary)" : "transparent",
                color: activeTab === id ? "var(--text-primary)" : "var(--text-muted)",
                borderBottom: activeTab === id ? "2px solid var(--blue-base)" : "2px solid transparent",
              }} aria-selected={activeTab === id}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "overview" && <OverviewTab project={project} />}
        {activeTab === "monitor" && <LiveMonitorTab projectId={project.id} />}
        {activeTab === "ai-signals" && (
          <div className="p-4 space-y-3">
            {DEMO_AI_SIGNALS.filter((s) => s.project_id === project.id).length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle size={32} className="text-green-strong mx-auto mb-2.5" />
                <p className="text-sm font-semibold text-primary">No open AI signals</p>
                <p className="text-xs text-muted mt-1">No anomalies detected recently.</p>
              </div>
            ) : (
              DEMO_AI_SIGNALS.filter((s) => s.project_id === project.id).map((signal) => (
                <div key={signal.id} className="card p-4">
                  <div className="flex items-start gap-3">
                    <Brain size={16} className="text-purple-base flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-primary">{signal.title}</p>
                      <p className="text-xs text-muted mt-1">{signal.summary}</p>
                      <div className="mt-3 p-3 rounded-lg bg-purple-tint">
                        <p className="section-label mb-2">AI EXPLANATION</p>
                        <p className="text-xs text-secondary"><strong>What:</strong> {signal.explanation.what_happened}</p>
                        <p className="text-xs text-secondary mt-1.5"><strong>Why:</strong> {signal.explanation.why_detected}</p>
                        <p className="text-xs text-secondary mt-1.5"><strong>Action:</strong> {signal.explanation.recommended_action}</p>
                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-base">
                          <span className="text-[11px] text-purple-text">Confidence: <strong>{signal.explanation.confidence}%</strong></span>
                          <span className="text-[10px] text-muted">AI-assisted · Human review required</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        {activeTab === "attendance" && (
          <div className="p-4 space-y-4">
            <div className="card p-4 border-l-4 border-l-amber-base bg-secondary/50">
              <div className="flex items-center justify-between mb-3">
                <span className="section-label">ATTENDANCE VARIANCE AUDIT</span>
                <span className="status-pill bg-amber-tint text-amber-strong text-[10px] font-bold">31% VARIANCE</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                {[
                  { label: "Reported", value: "74", cls: "text-primary" },
                  { label: "Verified", value: "51", cls: "text-blue-base" },
                  { label: "Difference", value: "-23", cls: "text-red-strong" },
                  { label: "Variance Rate", value: "31.1%", cls: "text-amber-strong" },
                ].map((m) => (
                  <div key={m.label} className="p-2.5 bg-card rounded-lg border border-base">
                    <span className="text-muted text-[11px] uppercase">{m.label}</span>
                    <p className={`text-xl font-bold tabular ${m.cls}`}>{m.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-primary">Weekday Attendance Pattern</h3>
                  <p className="text-[11px] text-muted">Weekly rolling head count trends</p>
                </div>
                <span className="text-[10px] font-mono text-muted">Week 34 FY26</span>
              </div>
              <div className="space-y-2 pt-1 text-xs">
                {[
                  { day: "Mon", count: 82, anomaly: false },
                  { day: "Tue", count: 76, anomaly: false },
                  { day: "Wed", count: 68, anomaly: false },
                  { day: "Thu", count: 31, anomaly: true, reason: "54% drop without notice" },
                  { day: "Fri", count: 74, anomaly: false },
                ].map((item) => (
                  <div key={item.day} className="flex items-center gap-3">
                    <span className="font-mono font-semibold text-primary w-8">{item.day}</span>
                    <div className="flex-1 h-5 bg-secondary rounded-md overflow-hidden p-0.5">
                      <div className={`h-full rounded transition-all flex items-center justify-end pr-2 text-[10px] font-bold text-white tabular ${item.anomaly ? "bg-red-base" : "bg-blue-base"}`}
                        style={{ width: `${item.count}%` }}>{item.count}</div>
                    </div>
                    <span className="tabular font-bold w-10 text-right text-primary">{item.count}</span>
                    {item.anomaly ? (
                      <span className="text-[10px] font-bold text-red-strong bg-red-tint px-2 py-0.5 rounded flex items-center gap-1">
                        <AlertTriangle size={10} /> ANOMALY
                      </span>
                    ) : (
                      <span className="text-[10px] text-green-strong font-medium w-28 text-right">Normal</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-4">
              <p className="text-xs font-semibold text-primary mb-3">Verification Records</p>
              {DEMO_ATTENDANCE.filter((a) => a.project_id === project.id).map((rec) => (
                <div key={rec.id} className="flex items-center gap-4 py-2 border-b border-base last:border-0 text-xs">
                  <span className="font-mono text-muted min-w-[80px]">{rec.date}</span>
                  <span className="text-primary">Observed: <strong>{rec.observed}</strong></span>
                  <span className="text-primary">Reported: <strong>{rec.reported}</strong></span>
                  {rec.is_anomaly && (
                    <span className="status-pill ml-auto font-mono text-[10px] bg-red-tint text-red-strong">
                      <AlertTriangle size={10} /> +{rec.variance_percent.toFixed(1)}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {(activeTab === "inspections" || activeTab === "compliance") && (
          <div className="p-4">
            <div className="card p-8 text-center">
              <ClipboardCheck size={28} className="text-muted mx-auto mb-2.5" />
              <p className="text-sm font-semibold text-primary">{activeTab === "inspections" ? "Inspection History" : "Compliance Tracking"}</p>
              <p className="text-xs text-muted mt-1 mb-4">{activeTab === "inspections" ? "Full inspection history with evidence and reports." : "Scheme compliance requirements and status."}</p>
              <Link href="/dashboard/inspections" className="btn-primary inline-flex items-center gap-1.5 text-xs">
                <ExternalLink size={13} /> View Inspections
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
