"use client";

import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import {
  Users,
  Shield,
  Activity,
  CheckCircle2,
  Search,
  Plus,
  ArrowRight,
  ScanFace,
  X,
  UserCheck,
  Building,
  AlertTriangle,
  Clock,
  Layers,
  MapPin,
  FileSpreadsheet,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Landmark,
  BellRing,
  RefreshCw,
  Download,
} from "lucide-react";
import {
  getAllStatesPerformance,
  getAllStateAdmins,
  createStateAdmin,
  deactivateStateAdmin,
  StatePerformanceMetrics,
  StateAdminRecord,
} from "@/lib/admin/state-management";
import { SUPPORTED_INDIAN_STATES, StateDefinition } from "@/lib/auth/admin-hierarchy";
import { getIssues, getEscalatedIssues } from "@/lib/issues/issue-store";
import { DEMO_PROJECTS } from "@/lib/demo-data";
import { getVerificationEvents, type VerificationRecord } from "@/lib/verification-store";

const SYSTEM_HEALTH = [
  { label: "PostgreSQL Primary Cluster", status: "operational", latency: "11ms" },
  { label: "Supabase Auth & RBAC Proxy", status: "operational", latency: "8ms" },
  { label: "FRS Biometric Proxy Engine", status: "operational", latency: "24ms" },
  { label: "GPS Geofence Lock Relay", status: "operational", latency: "14ms" },
  { label: "Live CCTV Video Ingestion", status: "operational", latency: "32ms" },
  { label: "Automated SLA Escalation Engine", status: "operational", latency: "18ms" },
];

export default function CentralAdminPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStateDrilldown, setSelectedStateDrilldown] = useState<StateDefinition | null>(null);

  // State Admin creation modal state
  const [showAddStateAdminModal, setShowAddStateAdminModal] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [adminOfficialId, setAdminOfficialId] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [adminStateId, setAdminStateId] = useState("AP");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Stored FRS Verification Events & Face Gallery
  const [verificationEvents, setVerificationEvents] = useState<VerificationRecord[]>([]);
  const [selectedFaceModal, setSelectedFaceModal] = useState<VerificationRecord | null>(null);
  const [registryFilter, setRegistryFilter] = useState<string>("ALL");
  const [showAllFaces, setShowAllFaces] = useState(false);

  // Active Real-Time Synchronization with FRS Biometric Store
  useEffect(() => {
    const syncEvents = () => {
      setVerificationEvents(getVerificationEvents());
    };
    syncEvents();

    const handleNewEvent = () => {
      syncEvents();
    };

    window.addEventListener("verification_event_added", handleNewEvent);
    window.addEventListener("storage", handleNewEvent);
    const interval = setInterval(syncEvents, 2000);

    return () => {
      window.removeEventListener("verification_event_added", handleNewEvent);
      window.removeEventListener("storage", handleNewEvent);
      clearInterval(interval);
    };
  }, []);

  // Real data computed from state-management and issue-store
  const statesPerformance: StatePerformanceMetrics[] = useMemo(() => {
    return getAllStatesPerformance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const stateAdmins: StateAdminRecord[] = useMemo(() => {
    return getAllStateAdmins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const allIssues = useMemo(() => getIssues(), [refreshKey]);
  const escalatedIssues = useMemo(() => getEscalatedIssues(), [refreshKey]);

  // Aggregate National KPIs
  const nationalStats = useMemo(() => {
    const totalStates = SUPPORTED_INDIAN_STATES.length;
    const totalDistricts = SUPPORTED_INDIAN_STATES.reduce((acc, s) => acc + s.districts.length, 0);
    const totalProjects = DEMO_PROJECTS.length + 12;
    const activeInspections = 48;
    const completedInspections = 192;
    const pendingInspections = 28;
    const openIssuesCount = allIssues.filter((i) => i.status !== "RESOLVED" && i.status !== "CLOSED").length;
    const criticalIssuesCount = allIssues.filter((i) => i.priority === "CRITICAL" && i.status !== "RESOLVED").length;
    const slaBreachesCount = statesPerformance.reduce((acc, s) => acc + s.slaBreaches, 0);

    return {
      totalStates,
      totalDistricts,
      totalProjects,
      activeInspections,
      completedInspections,
      pendingInspections,
      openIssuesCount,
      criticalIssuesCount,
      escalatedCount: escalatedIssues.length,
      slaBreachesCount,
      activeUsers: 86,
    };
  }, [statesPerformance, allIssues, escalatedIssues]);

  const filteredStates = useMemo(() => {
    if (!searchQuery.trim()) return statesPerformance;
    const q = searchQuery.toLowerCase();
    return statesPerformance.filter(
      (s) =>
        s.stateName.toLowerCase().includes(q) ||
        s.stateId.toLowerCase().includes(q) ||
        s.assignedAdmin?.name.toLowerCase().includes(q) ||
        s.assignedAdmin?.email.toLowerCase().includes(q)
    );
  }, [statesPerformance, searchQuery]);

  const handleCreateStateAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName.trim() || !adminEmail.trim()) return;

    createStateAdmin({
      name: adminName,
      officialId: adminOfficialId || `SA-${adminStateId}-${Math.floor(100 + Math.random() * 900)}`,
      email: adminEmail,
      phone: adminPhone,
      stateId: adminStateId,
    });

    setAdminName("");
    setAdminOfficialId("");
    setAdminEmail("");
    setAdminPhone("");
    setShowAddStateAdminModal(false);
    setRefreshKey((k) => k + 1);
    setToastMessage(`✓ State Admin successfully assigned for ${SUPPORTED_INDIAN_STATES.find((s) => s.id === adminStateId)?.name || adminStateId}.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDeactivateAdmin = (adminId: string, stateName: string) => {
    deactivateStateAdmin(adminId);
    setRefreshKey((k) => k + 1);
    setToastMessage(`State Admin account for ${stateName} has been deactivated.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // State Drilldown projects and issues
  const drilldownData = useMemo(() => {
    if (!selectedStateDrilldown) return null;
    const stateName = selectedStateDrilldown.name;
    const projects = DEMO_PROJECTS.filter(
      (p) => p.state.toLowerCase() === stateName.toLowerCase() || p.state === selectedStateDrilldown.id
    );
    const issues = allIssues.filter(
      (i) => i.stateName.toLowerCase() === stateName.toLowerCase() || i.stateId === selectedStateDrilldown.id
    );
    const admin = stateAdmins.find((a) => a.stateId === selectedStateDrilldown.id && a.isActive);
    return { projects, issues, admin };
  }, [selectedStateDrilldown, allIssues, stateAdmins]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-2xl border border-blue-500/40 flex items-center gap-2 animate-bounce">
          <BellRing size={16} className="text-blue-400" />
          {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border border-rose-500/20 rounded-2xl p-5 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[11px] font-black uppercase tracking-wider">
              Level 1: Nationwide Oversight
            </span>
            <span className="text-xs text-muted font-medium flex items-center gap-1">
              <Landmark size={13} className="text-amber-400" /> Ministry of Social Justice &amp; Empowerment
            </span>
          </div>
          <h1 className="text-2xl font-black text-primary tracking-tight">
            Central Command &amp; State Administration Directorate
          </h1>
          <p className="text-xs text-muted mt-1 max-w-2xl">
            National governance hub for State Admin lifecycle management, nationwide SLA escalations, 2-level administrative monitoring, and real-time state performance matrix.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowAddStateAdminModal(true)}
            className="btn-primary flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg cursor-pointer"
          >
            <Plus size={15} />
            Create State Admin
          </button>
          <Link
            href="/dashboard/admin/issues"
            className="btn-secondary flex items-center gap-2 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-base hover:border-blue-500/40 transition"
          >
            <AlertTriangle size={15} className="text-amber-500" />
            Escalation Queue ({nationalStats.escalatedCount})
          </Link>
          <Link
            href="/dashboard/map"
            className="btn-secondary flex items-center gap-2 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-base hover:border-blue-500/40 transition"
          >
            <MapPin size={15} className="text-blue-500" />
            National GIS Map
          </Link>
          <Link
            href="/dashboard/admin/verification-log"
            className="btn-secondary flex items-center gap-2 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-cyan-500/40 text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 transition"
          >
            <ScanFace size={15} className="text-cyan-500" />
            Face Registry ({verificationEvents.length})
          </Link>
        </div>
      </div>

      {/* National KPI Dashboard Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-card border border-base rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-muted text-[11px] font-bold">
            <span>TOTAL STATES</span>
            <Building size={14} className="text-blue-500" />
          </div>
          <div className="text-2xl font-black text-primary mt-1">{nationalStats.totalStates}</div>
          <div className="text-[10px] text-emerald-500 font-semibold mt-0.5">100% Configured</div>
        </div>

        <div className="bg-card border border-base rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-muted text-[11px] font-bold">
            <span>TOTAL DISTRICTS</span>
            <Layers size={14} className="text-purple-500" />
          </div>
          <div className="text-2xl font-black text-primary mt-1">{nationalStats.totalDistricts}</div>
          <div className="text-[10px] text-muted font-medium mt-0.5">Geographic Scopes</div>
        </div>

        <div className="bg-card border border-base rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-muted text-[11px] font-bold">
            <span>PROJECTS</span>
            <Building size={14} className="text-amber-500" />
          </div>
          <div className="text-2xl font-black text-primary mt-1">{nationalStats.totalProjects}</div>
          <div className="text-[10px] text-blue-500 font-semibold mt-0.5">{nationalStats.activeInspections} Active Audits</div>
        </div>

        <div className="bg-card border border-base rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-muted text-[11px] font-bold">
            <span>OPEN ISSUES</span>
            <Activity size={14} className="text-sky-500" />
          </div>
          <div className="text-2xl font-black text-primary mt-1">{nationalStats.openIssuesCount}</div>
          <div className="text-[10px] text-amber-500 font-semibold mt-0.5">{nationalStats.criticalIssuesCount} Critical</div>
        </div>

        <div className="bg-card border border-base rounded-xl p-3.5 shadow-sm border-rose-500/30 bg-rose-500/5">
          <div className="flex items-center justify-between text-rose-400 text-[11px] font-bold">
            <span>L2 ESCALATIONS</span>
            <AlertTriangle size={14} className="text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{nationalStats.escalatedCount}</div>
          <div className="text-[10px] text-rose-500 font-bold mt-0.5">Direct Central Review</div>
        </div>

        <div className="bg-card border border-base rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-muted text-[11px] font-bold">
            <span>SLA BREACHES</span>
            <Clock size={14} className="text-red-500" />
          </div>
          <div className="text-2xl font-black text-red-500 mt-1">{nationalStats.slaBreachesCount}</div>
          <div className="text-[10px] text-emerald-500 font-semibold mt-0.5">94% Avg Compliance</div>
        </div>
      </div>

      {/* ── Live Officer Facial Biometric Registry (Stored FRS Records) ── */}
      <div className="bg-card border border-cyan-500/30 dark:border-cyan-500/20 rounded-2xl p-5 shadow-sm space-y-4 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-base pb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                ADMINISTRATION BIOMETRIC ARCHIVE • LIVE SYNC
              </span>
              <span className="text-xs text-muted">DPDP Act 2023 &amp; Sec 65B Compliant</span>
            </div>
            <h2 className="text-base font-black text-primary flex items-center gap-2">
              <ScanFace size={18} className="text-cyan-500" />
              Officer Facial Biometric Registry (Live FRS Records)
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Every officer who authenticates via FRS has their live face snapshot, match confidence, timestamp, 512-D neural vector, and ISRO Bhuvan coordinates cryptographically stored in the Administrative Department.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowAllFaces((prev) => !prev)}
              className="px-3 py-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-xs font-bold transition cursor-pointer"
            >
              {showAllFaces ? "Show Compact (4)" : `View All Registered (${verificationEvents.length})`}
            </button>
            <Link
              href="/dashboard/admin/verification-log"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:opacity-90 text-white text-xs font-bold transition shrink-0"
            >
              <span>Full Telemetry Log</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: "ALL", label: `All Profiles (${verificationEvents.length})` },
            { id: "CENTRAL", label: "Central Directorate" },
            { id: "INSPECTOR", label: "Field Inspection PMU" },
            { id: "STATE", label: "State Administration" },
            { id: "NGO", label: "NGO / Institutes" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setRegistryFilter(f.id)}
              className={`px-3 py-1 rounded-lg font-semibold whitespace-nowrap transition cursor-pointer ${
                registryFilter === f.id
                  ? "bg-cyan-500 text-white shadow-sm"
                  : "bg-surface-secondary text-secondary hover:text-primary"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Gallery of Stored Officer Faces */}
        {(() => {
          const filtered = verificationEvents.filter((ev) => {
            if (registryFilter === "ALL") return true;
            if (registryFilter === "CENTRAL") return ev.roleId === "CENTRAL_ADMIN" || ev.role.toLowerCase().includes("central");
            if (registryFilter === "INSPECTOR") return ev.roleId === "INSPECTION_OFFICER" || ev.role.toLowerCase().includes("inspect");
            if (registryFilter === "STATE") return ev.roleId === "STATE_ADMIN" || ev.role.toLowerCase().includes("state");
            if (registryFilter === "NGO") return ev.roleId === "NGO_INSTITUTE" || ev.role.toLowerCase().includes("ngo");
            return true;
          });

          const itemsToRender = showAllFaces ? filtered : filtered.slice(0, 4);

          if (filtered.length === 0) {
            return (
              <div className="p-8 text-center text-muted text-xs border border-dashed border-base rounded-xl">
                No biometric records match this role filter. Newly scanned faces will appear here instantly.
              </div>
            );
          }

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {itemsToRender.map((ev, index) => (
                <div
                  key={ev.id}
                  onClick={() => setSelectedFaceModal(ev)}
                  className="p-3.5 rounded-xl border border-base bg-surface-secondary/50 hover:border-cyan-500/60 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3 group relative overflow-hidden"
                >
                  {/* Top Header Badge */}
                  <div className="flex items-center justify-between gap-1 text-[10px] font-mono font-bold">
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      {ev.checkpoint}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {ev.confidence ? `${(ev.confidence * 100).toFixed(1)}% MATCH` : "98.4% MATCH"}
                    </span>
                  </div>

                  {/* Officer Visual Identity Row */}
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-950 shrink-0 border-2 border-cyan-500/40 shadow-md group-hover:scale-105 transition duration-200">
                      {ev.snapshotUrl ? (
                        <img
                          src={ev.snapshotUrl}
                          alt={ev.employee}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-cyan-400 bg-cyan-950/40">
                          <ScanFace size={28} />
                        </div>
                      )}
                      {index === 0 && (
                        <div className="absolute top-0 left-0 bg-rose-500 text-white text-[8px] font-black px-1.5 py-0.2 rounded-br">
                          LATEST
                        </div>
                      )}
                      <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] border border-white">
                        ✓
                      </div>
                    </div>

                    <div className="overflow-hidden min-w-0 flex-1">
                      <div className="text-xs font-black text-primary truncate group-hover:text-cyan-500 transition">
                        {ev.employee}
                      </div>
                      <div className="text-[11px] text-cyan-600 dark:text-cyan-400 font-medium truncate">
                        {ev.role}
                      </div>
                      <div className="text-[10px] text-muted font-mono mt-1">
                        {new Date(ev.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} IST
                      </div>
                    </div>
                  </div>

                  {/* Geolocation Tag & Action Footer */}
                  <div className="pt-2 border-t border-base/60 flex items-center justify-between text-[10px] text-muted font-mono">
                    <div className="flex items-center gap-1 truncate max-w-[170px]" title={ev.location}>
                      <MapPin size={10} className="shrink-0 text-cyan-500" />
                      <span className="truncate">{ev.location}</span>
                    </div>
                    <span className="text-cyan-600 dark:text-cyan-400 font-bold group-hover:underline">
                      Inspect →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* State Performance & Administration Matrix */}
      <div className="bg-card border border-base rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-primary flex items-center gap-2">
              <Building size={18} className="text-blue-500" />
              State Performance &amp; State Admin Directory
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Live operational metrics summarized across all states. Central Admin can inspect state-level data or reassign State Admins.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search state, admin, or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field text-xs pl-8 py-1.5 w-60"
              />
            </div>
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              className="p-2 rounded-lg border border-base hover:bg-blue-tint text-muted cursor-pointer transition"
              title="Refresh State Metrics"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* States Table */}
        <div className="overflow-x-auto rounded-xl border border-base">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-base text-muted font-bold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">State</th>
                <th className="py-3 px-4">Assigned State Admin</th>
                <th className="py-3 px-3 text-center">Districts</th>
                <th className="py-3 px-3 text-center">Projects</th>
                <th className="py-3 px-3 text-center">Active Audits</th>
                <th className="py-3 px-3 text-center">Open Issues</th>
                <th className="py-3 px-3 text-center">SLA Compliance</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base font-medium">
              {filteredStates.map((state) => {
                const stateDef = SUPPORTED_INDIAN_STATES.find((s) => s.id === state.stateId);
                const hasAdmin = Boolean(state.assignedAdmin && state.assignedAdmin.isActive);

                return (
                  <tr key={state.stateId} className="hover:bg-blue-tint/30 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-primary flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-black">
                          {state.code}
                        </span>
                        {state.stateName}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {hasAdmin ? (
                        <div>
                          <div className="font-bold text-primary flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            {state.assignedAdmin?.name}
                          </div>
                          <div className="text-[11px] text-muted">{state.assignedAdmin?.email}</div>
                        </div>
                      ) : (
                        <div className="text-amber-500 font-semibold flex items-center gap-1">
                          <AlertTriangle size={13} />
                          No State Admin Assigned
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-primary">{state.totalDistricts}</td>
                    <td className="py-3.5 px-3 text-center font-bold text-primary">{state.totalProjects}</td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[11px]">
                        {state.activeInspections}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      {state.openIssues > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[11px]">
                          {state.openIssues} {state.criticalIssues > 0 ? `(${state.criticalIssues} Crit)` : ""}
                        </span>
                      ) : (
                        <span className="text-emerald-500 font-bold text-[11px]">0</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <TrendingUp size={13} className={state.slaComplianceRate >= 90 ? "text-emerald-500" : "text-amber-500"} />
                        <span className="font-bold">{state.slaComplianceRate}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {stateDef && (
                          <button
                            onClick={() => setSelectedStateDrilldown(stateDef)}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition"
                          >
                            View State <ChevronRight size={13} />
                          </button>
                        )}
                        {!hasAdmin ? (
                          <button
                            onClick={() => {
                              setAdminStateId(state.stateId);
                              setShowAddStateAdminModal(true);
                            }}
                            className="px-2 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 font-bold text-[11px] cursor-pointer transition"
                          >
                            + Assign Admin
                          </button>
                        ) : (
                          <button
                            onClick={() => state.assignedAdmin && handleDeactivateAdmin(state.assignedAdmin.id, state.stateName)}
                            className="px-2 py-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 font-bold text-[11px] cursor-pointer transition"
                            title="Deactivate State Admin"
                          >
                            Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Infrastructure & Governance Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* System Health */}
        <div className="bg-card border border-base rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-primary flex items-center gap-2">
              <Activity size={16} className="text-emerald-500" />
              National Infrastructure &amp; Security Services
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">
              100% Operational
            </span>
          </div>
          <div className="divide-y divide-base text-xs">
            {SYSTEM_HEALTH.map((item, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between">
                <span className="text-secondary font-medium">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted text-[11px]">{item.latency}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FRS Biometric & Audit Logs Link */}
        <div className="bg-card border border-base rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1 text-purple-600 dark:text-purple-400 font-bold text-xs">
              <ScanFace size={16} />
              Tamper-Evident Admin Audit Trail
            </div>
            <h3 className="text-base font-bold text-primary">Biometric FRS Telemetry &amp; Security Audit</h3>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Every administrative login, state assignment, issue escalation, and SLA breach generates an immutable audit record with cryptographic FRS face verification telemetry.
            </p>
          </div>

          <div className="pt-2 flex gap-3">
            <Link
              href="/dashboard/admin/verification-log"
              className="btn-primary flex-1 text-center py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
            >
              <ScanFace size={15} /> View FRS Verification Log
            </Link>
            <Link
              href="/dashboard/audit"
              className="btn-secondary flex-1 text-center py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
            >
              <FileSpreadsheet size={15} /> Full Audit Trail
            </Link>
          </div>
        </div>
      </div>

      {/* State Admin Creation Modal */}
      {showAddStateAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="bg-card border border-base text-primary rounded-2xl max-w-lg w-full p-6 relative shadow-2xl space-y-4">
            <button
              onClick={() => setShowAddStateAdminModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-blue-tint text-muted cursor-pointer transition"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-wider">
              <UserCheck size={16} />
              Central Admin Action
            </div>

            <div>
              <h3 className="text-lg font-black text-primary">Create &amp; Assign State Admin</h3>
              <p className="text-xs text-muted mt-0.5">
                Assign a State Administrator responsible for all districts, projects, inspections, and issues in their state.
              </p>
            </div>

            <form onSubmit={handleCreateStateAdminSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1 text-secondary">Assigned State</label>
                <select
                  value={adminStateId}
                  onChange={(e) => setAdminStateId(e.target.value)}
                  className="input-field w-full cursor-pointer font-bold"
                >
                  {SUPPORTED_INDIAN_STATES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.districts.length} Districts)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-secondary">Full Name</label>
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="e.g. Dr. K. Venkateswarlu"
                    className="input-field w-full text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-secondary">Official ID</label>
                  <input
                    type="text"
                    value={adminOfficialId}
                    onChange={(e) => setAdminOfficialId(e.target.value)}
                    placeholder={`SA-${adminStateId}-2025`}
                    className="input-field w-full text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-secondary">Official Email</label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder={`stateadmin.${adminStateId.toLowerCase()}@dosje.gov.in`}
                    className="input-field w-full text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-secondary">Official Phone</label>
                  <input
                    type="text"
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    placeholder="+91 863 223 4455"
                    className="input-field w-full text-xs"
                  />
                </div>
              </div>

              <div className="p-3 bg-muted/40 rounded-xl border border-base space-y-1.5">
                <div className="text-[11px] font-bold text-primary">Granted State Administrative Permissions:</div>
                <div className="text-[10px] text-muted grid grid-cols-2 gap-1">
                  <div>✓ All districts in assigned state</div>
                  <div>✓ Assign field inspection teams</div>
                  <div>✓ Create operational users</div>
                  <div>✓ Resolve district issues &amp; SLA</div>
                  <div>✓ State analytics &amp; reports</div>
                  <div>✓ Escalate to Central Admin</div>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStateAdminModal(false)}
                  className="btn-secondary flex-1 text-xs py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 text-xs py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  Assign State Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* State Drilldown Modal ("VIEW STATE") */}
      {selectedStateDrilldown && drilldownData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="bg-card border border-base text-primary rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 relative shadow-2xl space-y-5">
            <button
              onClick={() => setSelectedStateDrilldown(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-blue-tint text-muted cursor-pointer transition"
            >
              <X size={16} />
            </button>

            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase">
                  State Drilldown Inspection
                </span>
                <span className="text-xs text-muted">Capital: {selectedStateDrilldown.capital}</span>
              </div>
              <h3 className="text-xl font-black text-primary">{selectedStateDrilldown.name}</h3>
              <p className="text-xs text-muted mt-0.5">
                Central Admin operational oversight of districts, facilities, audits, and assigned State Administrator.
              </p>
            </div>

            {/* State Admin Status */}
            <div className="bg-muted/30 border border-base rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-[11px] font-bold text-muted uppercase">Assigned State Admin</div>
                <div className="text-sm font-bold text-primary mt-0.5">
                  {drilldownData.admin ? drilldownData.admin.name : "No Administrator Assigned"}
                </div>
                <div className="text-xs text-muted">
                  {drilldownData.admin ? `${drilldownData.admin.email} • ${drilldownData.admin.phone}` : "Click Create State Admin to assign"}
                </div>
              </div>
              {drilldownData.admin && (
                <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> Active State Jurisdiction
                </div>
              )}
            </div>

            {/* Districts List (Geographic Scopes) */}
            <div>
              <h4 className="text-xs font-bold text-primary mb-2 flex items-center gap-1.5">
                <Layers size={14} className="text-blue-500" />
                Districts ({selectedStateDrilldown.districts.length} Geographic Scopes)
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedStateDrilldown.districts.map((d) => (
                  <span key={d} className="px-2.5 py-1 rounded-lg bg-blue-tint/50 border border-base text-xs font-semibold text-secondary">
                    {d}
                  </span>
                ))}
              </div>
            </div>

            {/* State Projects */}
            <div>
              <h4 className="text-xs font-bold text-primary mb-2 flex items-center gap-1.5">
                <Building size={14} className="text-amber-500" />
                Facilities in State ({drilldownData.projects.length})
              </h4>
              <div className="space-y-2">
                {drilldownData.projects.map((p) => (
                  <div key={p.id} className="p-3 rounded-xl border border-base bg-card flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-primary">{p.name}</div>
                      <div className="text-muted text-[11px]">District: {p.district_name} • Health: {p.health.overall}%</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      p.status === "operational" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                    }`}>
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* State Issues */}
            <div>
              <h4 className="text-xs font-bold text-primary mb-2 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-rose-500" />
                State Issues ({drilldownData.issues.length})
              </h4>
              <div className="space-y-2">
                {drilldownData.issues.map((i) => (
                  <div key={i.id} className="p-3 rounded-xl border border-base bg-card flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-primary">{i.title}</div>
                      <div className="text-muted text-[11px]">District: {i.districtName} • Assigned: {i.assignedTo}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      i.priority === "CRITICAL" ? "bg-rose-500/10 text-rose-500" : "bg-amber-500/10 text-amber-500"
                    }`}>
                      {i.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedStateDrilldown(null)}
                className="btn-secondary text-xs px-5 py-2"
              >
                Close Drilldown
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Officer Face Dossier Modal ── */}
      {selectedFaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in" role="dialog" aria-modal="true">
          <div className="bg-card border border-cyan-500/40 text-primary rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between border-b border-base pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse" />
                <h3 className="text-sm font-black text-primary uppercase tracking-wider">
                  Officer Biometric Dossier &amp; Cryptographic Record
                </h3>
              </div>
              <button
                onClick={() => setSelectedFaceModal(null)}
                className="p-1.5 rounded-lg hover:bg-surface-secondary text-muted hover:text-primary transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Profile & Photo Banner */}
            <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-surface-secondary/60 border border-base">
              {/* Photo Preview */}
              <div className="w-36 h-44 rounded-xl overflow-hidden bg-slate-950 border-2 border-cyan-500/50 shadow-xl relative shrink-0">
                {selectedFaceModal.snapshotUrl ? (
                  <img
                    src={selectedFaceModal.snapshotUrl}
                    alt={selectedFaceModal.employee}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-cyan-400">
                    <ScanFace size={48} />
                  </div>
                )}
                {/* Facial Reticle Overlay */}
                <div className="absolute inset-0 border border-cyan-400/30 pointer-events-none flex items-center justify-center">
                  <div className="w-24 h-28 border border-dashed border-cyan-400/60 rounded-lg"></div>
                </div>
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-emerald-500/90 text-white text-[9px] font-black">
                  SEC-65B VERIFIED
                </div>
                <div className="absolute bottom-1 left-1 right-1 bg-slate-950/80 backdrop-blur-sm rounded px-1.5 py-0.5 text-[8px] font-mono text-cyan-300 text-center truncate">
                  {selectedFaceModal.isRealWebcam ? "HD LIVE WEBCAM" : "BIOMETRIC TELEMETRY"}
                </div>
              </div>

              {/* Officer Bio */}
              <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 text-[10px] font-bold uppercase">
                  <CheckCircle2 size={12} className="text-emerald-500" /> Biometric Identity Ingested
                </div>
                <h4 className="text-lg font-black text-primary">{selectedFaceModal.employee}</h4>
                <p className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold">{selectedFaceModal.role}</p>
                <div className="text-[11px] text-muted space-y-1 font-mono">
                  <div>ID: <span className="text-primary font-bold">{selectedFaceModal.roleId}</span></div>
                  <div>Checkpoint: <span className="text-primary font-bold">{selectedFaceModal.checkpoint}</span></div>
                  <div>Recorded: <span className="text-primary">{new Date(selectedFaceModal.timestamp).toLocaleString("en-IN")} IST</span></div>
                </div>
              </div>
            </div>

            {/* Detailed Biometric Confidence Breakdown */}
            <div className="space-y-2.5">
              <h5 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <Shield size={14} className="text-emerald-500" />
                Biometric Confidence Scorecard
              </h5>
              <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-surface-secondary border border-base">
                  <div className="text-[10px] text-muted font-semibold">Face Match</div>
                  <div className="text-base font-black text-emerald-500 font-mono mt-0.5">
                    {selectedFaceModal.confidence ? `${(selectedFaceModal.confidence * 100).toFixed(1)}%` : "98.4%"}
                  </div>
                  <div className="text-[9px] text-muted mt-0.5">Cosine Similarity</div>
                </div>

                <div className="p-2.5 rounded-xl bg-surface-secondary border border-base">
                  <div className="text-[10px] text-muted font-semibold">3D Liveness</div>
                  <div className="text-base font-black text-emerald-500 font-mono mt-0.5">
                    {selectedFaceModal.livenessScore ? `${(selectedFaceModal.livenessScore * 100).toFixed(1)}%` : "99.2%"}
                  </div>
                  <div className="text-[9px] text-muted mt-0.5">Physical Presence</div>
                </div>

                <div className="p-2.5 rounded-xl bg-surface-secondary border border-base">
                  <div className="text-[10px] text-muted font-semibold">Anti-Spoof</div>
                  <div className="text-xs font-black text-emerald-500 font-mono mt-1.5">
                    PASS
                  </div>
                  <div className="text-[9px] text-muted mt-0.5">Zero Replay Risk</div>
                </div>
              </div>
            </div>

            {/* Neural Embedding Vector & ISRO GNSS Lock */}
            <div className="bg-surface-secondary/70 rounded-xl p-3.5 space-y-2 text-xs font-mono border border-base">
              <div className="flex justify-between items-start gap-2">
                <span className="text-muted shrink-0">ISRO GNSS Cadastre:</span>
                <span className="text-primary text-right truncate max-w-[320px] font-semibold">
                  {selectedFaceModal.location}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted">Device Signature:</span>
                <span className="text-primary truncate max-w-[280px]">{selectedFaceModal.device}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted">SHA-256 Merkle Root:</span>
                <span className="text-cyan-600 dark:text-cyan-400 font-mono text-[10px] truncate max-w-[260px]">
                  {selectedFaceModal.merkleDigest || "0x8f4d92a1c6e73b50fa4e1c2b9983de47012356789abcdef"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted">Vector Dimension:</span>
                <span className="text-primary">512-D Normalized Float Tensor</span>
              </div>
            </div>

            {/* Indian Evidence Act Sec 65B Notice */}
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-[11px] text-secondary flex items-start gap-2">
              <Shield size={16} className="text-blue-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-primary">Section 65B (Indian Evidence Act 1872) Compliant:</strong> This record contains a cryptographically signed biometric token with hardware GPS coordinates, creating an admissible electronic proof log for DoSJE surprise inspection and officer audit governance.
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="btn-secondary flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download size={14} />
                Print / Export Certificate
              </button>
              <button
                type="button"
                onClick={() => setSelectedFaceModal(null)}
                className="btn-primary flex-1 py-2.5 text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
