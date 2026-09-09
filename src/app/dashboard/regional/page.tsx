"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  MapPin,
  ClipboardCheck,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Building2,
  Filter,
  Shield,
  Send,
  BellRing,
  UserCheck,
  Users,
  Plus,
  Clock,
  MessageSquare,
  Activity,
  Layers,
  ChevronRight,
  X,
  RefreshCw,
} from "lucide-react";
import { DEMO_PROJECTS } from "@/lib/demo-data";
import { SUPPORTED_INDIAN_STATES, StateDefinition } from "@/lib/auth/admin-hierarchy";
import {
  getIssues,
  createIssue,
  assignIssue,
  resolveIssue,
  escalateIssue,
  Issue,
  IssuePriority,
  IssueCategory,
} from "@/lib/issues/issue-store";
import {
  getStateOperationalUsers,
  createStateOperationalUser,
  StateOperationalUser,
} from "@/lib/admin/state-management";
import dynamic from "next/dynamic";

const MapPanel = dynamic(
  () => import("@/components/map/MapPanel").then((m) => ({ default: m.MapPanel })),
  { ssr: false, loading: () => <div className="h-full bg-slate-900 rounded-xl flex items-center justify-center text-muted text-xs">Loading State GIS Map...</div> }
);

export default function StateAdminPortalPage() {
  const [selectedState, setSelectedState] = useState<string>("Andhra Pradesh");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("ALL");
  const [refreshKey, setRefreshKey] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    setCurrentTime(Date.now());
  }, []);

  // Modals
  const [assignModalIssue, setAssignModalIssue] = useState<Issue | null>(null);
  const [assigneeName, setAssigneeName] = useState("Priya Mehta");
  const [assigneeRole, setAssigneeRole] = useState("INSPECTION_OFFICER");

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserRole, setNewUserRole] = useState<"INSPECTION_OFFICER" | "PMU_USER" | "STAFF" | "PROJECT_ADMIN">("INSPECTION_OFFICER");
  const [newUserDistrict, setNewUserDistrict] = useState("Guntur");

  const [showCreateIssueModal, setShowCreateIssueModal] = useState(false);
  const [issueTitle, setIssueTitle] = useState("");
  const [issueCategory, setIssueCategory] = useState<IssueCategory>("CCTV_OFFLINE");
  const [issuePriority, setIssuePriority] = useState<IssuePriority>("HIGH");
  const [issueDesc, setIssueDesc] = useState("");

  const currentStateDef = useMemo(() => {
    return SUPPORTED_INDIAN_STATES.find(
      (s) => s.name.toLowerCase() === selectedState.toLowerCase() || s.id.toLowerCase() === selectedState.toLowerCase()
    ) || SUPPORTED_INDIAN_STATES[0];
  }, [selectedState]);

  const availableDistricts = useMemo(() => {
    return currentStateDef.districts;
  }, [currentStateDef]);

  // Operational users in state
  const stateUsers = useMemo(() => {
    return getStateOperationalUsers(currentStateDef.id, selectedDistrict);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStateDef, selectedDistrict, refreshKey]);

  // Projects filtered by state and district
  const filteredProjects = useMemo(() => {
    return DEMO_PROJECTS.filter((p) => {
      const stateMatches = p.state.toLowerCase() === currentStateDef.name.toLowerCase() || p.state === currentStateDef.id;
      if (!stateMatches) return false;
      if (selectedDistrict !== "ALL" && p.district_name.toLowerCase() !== selectedDistrict.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [currentStateDef, selectedDistrict]);

  const filteredProjectIds = useMemo(() => filteredProjects.map((p) => p.id), [filteredProjects]);

  // Issues in state and filtered district
  const stateIssues = useMemo(() => {
    return getIssues(currentStateDef.name, selectedDistrict);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStateDef, selectedDistrict, refreshKey]);

  // State metrics
  const stats = useMemo(() => {
    const totalProjects = filteredProjects.length;
    const criticalProjects = filteredProjects.filter((p) => p.status === "critical" || p.ai_risk_score >= 80).length;
    const activeAudits = Math.max(1, Math.floor(totalProjects * 0.5));
    const openIssuesCount = stateIssues.filter((i) => i.status !== "RESOLVED" && i.status !== "CLOSED").length;
    const escalatedIssuesCount = stateIssues.filter((i) => i.escalationLevel === 2).length;
    const avgHealth = totalProjects > 0 ? Math.round(filteredProjects.reduce((acc, p) => acc + p.health.overall, 0) / totalProjects) : 88;

    return {
      totalDistricts: currentStateDef.districts.length,
      totalProjects,
      activeAudits,
      criticalProjects,
      openIssuesCount,
      escalatedIssuesCount,
      avgHealth,
      fieldSquads: stateUsers.filter((u) => u.role === "INSPECTION_OFFICER").length || 2,
    };
  }, [filteredProjects, stateIssues, currentStateDef, stateUsers]);

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalIssue) return;

    assignIssue(
      assignModalIssue.id,
      assigneeName,
      assigneeRole === "INSPECTION_OFFICER" ? "Inspection Officer" : "PMU Staff",
      "Dr. K. Venkateswarlu (State Admin)"
    );

    setAssignModalIssue(null);
    setRefreshKey((k) => k + 1);
    setToastMessage(`✓ Issue assigned to ${assigneeName}. Field squad notified.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleResolve = (issueId: string) => {
    resolveIssue(issueId, "State Admin (AP Directorate)", "Verified by State Admin. Compliance confirmed.");
    setRefreshKey((k) => k + 1);
    setToastMessage("✓ Issue marked as RESOLVED by State Admin.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleEscalateToCentral = (issueId: string) => {
    escalateIssue(issueId, "State Admin requested Central Directorate ministerial review & intervention.");
    setRefreshKey((k) => k + 1);
    setToastMessage("⚡ Issue escalated to Level 2 (Central Admin Directorate).");
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    createStateOperationalUser({
      name: newUserName,
      email: newUserEmail,
      phone: newUserPhone,
      role: newUserRole,
      stateId: currentStateDef.id,
      districtId: newUserDistrict,
    });

    setNewUserName("");
    setNewUserEmail("");
    setNewUserPhone("");
    setShowAddUserModal(false);
    setRefreshKey((k) => k + 1);
    setToastMessage(`✓ Operational field user added for ${newUserDistrict} district.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCreateIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueTitle.trim()) return;

    createIssue({
      title: issueTitle,
      description: issueDesc,
      category: issueCategory,
      priority: issuePriority,
      createdBy: "State Admin Directorate",
      stateId: currentStateDef.id,
      stateName: currentStateDef.name,
      districtId: selectedDistrict !== "ALL" ? selectedDistrict : "Guntur",
      districtName: selectedDistrict !== "ALL" ? selectedDistrict : "Guntur",
      assignedTo: "State Admin Queue",
    });

    setIssueTitle("");
    setIssueDesc("");
    setShowCreateIssueModal(false);
    setRefreshKey((k) => k + 1);
    setToastMessage("✓ Issue registered in State Administration resolution queue.");
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-2xl border border-blue-500/40 flex items-center gap-2 animate-bounce">
          <BellRing size={16} className="text-blue-400" />
          {toastMessage}
        </div>
      )}

      {/* Header with State Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-blue-500/20 rounded-2xl p-5 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[11px] font-black uppercase tracking-wider">
              Level 2: State Operations &amp; Administration
            </span>
            <span className="text-xs text-muted font-medium">
              Jurisdiction: <strong className="text-primary">{currentStateDef.name}</strong>
            </span>
          </div>
          <h1 className="text-2xl font-black text-primary tracking-tight">
            State Administrative Command Portal
          </h1>
          <p className="text-xs text-muted mt-1 max-w-2xl">
            State Admin operational hub for all districts in {currentStateDef.name}. Manage facilities, assign field inspection squads, track SLA countdowns, and resolve operational issues.
          </p>
        </div>

        {/* State Selector & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedState}
            onChange={(e) => {
              setSelectedState(e.target.value);
              setSelectedDistrict("ALL");
            }}
            className="input-field text-xs py-2 px-3 bg-card font-bold text-blue-500 border-blue-500/30 cursor-pointer"
          >
            {SUPPORTED_INDIAN_STATES.map((s) => (
              <option key={s.id} value={s.name}>
                State: {s.name} ({s.districts.length} Districts)
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowCreateIssueModal(true)}
            className="btn-primary flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 cursor-pointer"
          >
            <Plus size={15} /> Log State Issue
          </button>

          <button
            onClick={() => setShowAddUserModal(true)}
            className="btn-secondary flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl cursor-pointer"
          >
            <UserCheck size={15} className="text-emerald-500" /> + Add Field Officer
          </button>
        </div>
      </div>

      {/* DISTRICT GEOGRAPHIC FILTER BAR (CRITICAL REQUIREMENT: District is purely a filter, NOT an admin role) */}
      <div className="bg-card border border-base rounded-2xl p-4 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-blue-500" />
            <span className="text-xs font-black text-primary uppercase tracking-wider">
              Geographical District Filter
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
              Filter Only (No District Admin)
            </span>
          </div>
          <span className="text-[11px] text-muted font-medium">
            Filtering operational scope for <strong>{currentStateDef.name}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setSelectedDistrict("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition shrink-0 ${
              selectedDistrict === "ALL"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "bg-muted/40 hover:bg-muted text-secondary border border-base"
            }`}
          >
            All Districts ({currentStateDef.districts.length})
          </button>

          {availableDistricts.map((district) => {
            const isSelected = selectedDistrict.toLowerCase() === district.toLowerCase();
            return (
              <button
                key={district}
                onClick={() => setSelectedDistrict(district)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition shrink-0 ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "bg-muted/40 hover:bg-muted text-secondary border border-base"
                }`}
              >
                {district}
              </button>
            );
          })}
        </div>
      </div>

      {/* State Operational KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-card border border-base rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-muted text-[11px] font-bold">
            <span>DISTRICTS IN STATE</span>
            <Layers size={14} className="text-blue-500" />
          </div>
          <div className="text-2xl font-black text-primary mt-1">{stats.totalDistricts}</div>
          <div className="text-[10px] text-muted font-medium mt-0.5">
            {selectedDistrict === "ALL" ? "All Scope" : selectedDistrict}
          </div>
        </div>

        <div className="bg-card border border-base rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-muted text-[11px] font-bold">
            <span>FACILITIES</span>
            <Building2 size={14} className="text-amber-500" />
          </div>
          <div className="text-2xl font-black text-primary mt-1">{stats.totalProjects}</div>
          <div className="text-[10px] text-emerald-500 font-semibold mt-0.5">
            {stats.criticalProjects > 0 ? `${stats.criticalProjects} At Risk` : "All Healthy"}
          </div>
        </div>

        <div className="bg-card border border-base rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-muted text-[11px] font-bold">
            <span>ACTIVE AUDITS</span>
            <ClipboardCheck size={14} className="text-purple-500" />
          </div>
          <div className="text-2xl font-black text-primary mt-1">{stats.activeAudits}</div>
          <div className="text-[10px] text-purple-500 font-semibold mt-0.5">Field Inspections</div>
        </div>

        <div className="bg-card border border-base rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-muted text-[11px] font-bold">
            <span>OPEN ISSUES</span>
            <AlertTriangle size={14} className="text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-500 mt-1">{stats.openIssuesCount}</div>
          <div className="text-[10px] text-muted font-medium mt-0.5">State Queue</div>
        </div>

        <div className="bg-card border border-base rounded-xl p-3.5 shadow-sm border-rose-500/20">
          <div className="flex items-center justify-between text-rose-400 text-[11px] font-bold">
            <span>L2 ESCALATED</span>
            <Clock size={14} className="text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-500 mt-1">{stats.escalatedIssuesCount}</div>
          <div className="text-[10px] text-rose-500 font-bold mt-0.5">Central Directorate</div>
        </div>

        <div className="bg-card border border-base rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-muted text-[11px] font-bold">
            <span>FIELD SQUADS</span>
            <Users size={14} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-500 mt-1">{stats.fieldSquads}</div>
          <div className="text-[10px] text-emerald-500 font-semibold mt-0.5">Active Officers</div>
        </div>
      </div>

      {/* Main Two-Column Grid: Left (Issues & Assignment), Right (Map & Field Squads) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: State Audit Report Inbox & Issue Management */}
        <div className="lg:col-span-7 space-y-6">
          {/* SECTION: NEW AUDIT REPORT INBOX (Prompt Specification #10) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="font-extrabold text-sm text-white">NEW AUDIT REPORT &amp; EVIDENCE INBOX</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                STATUS: SUBMITTED
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 font-bold uppercase text-[10px] block">Project:</span>
                <span className="font-bold text-white">Asha Rehabilitation Centre</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold uppercase text-[10px] block">District:</span>
                <span className="font-bold text-amber-400">Guntur</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold uppercase text-[10px] block">Audit Squad:</span>
                <span className="font-bold text-emerald-400">Squad-07 (Priya Mehta)</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold uppercase text-[10px] block">Date:</span>
                <span className="font-mono text-slate-300">30 Aug 2026</span>
              </div>
            </div>

            {/* AI Summary Box */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                <Shield size={12} /> Grounded AI Summary:
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                Audit identified physical headcount discrepancy (51 present vs 80 registered quota) and CCTV Camera 02 disconnected at power injector junction box. 10-Point statutory compliance score: <strong>68%</strong>.
              </p>
            </div>

            {/* Evidence Counts */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="block font-black text-blue-400">PHOTO — 12</span>
                <span className="text-[10px] text-slate-500 font-mono">Geo-tagged</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="block font-black text-rose-400">VIDEO — 3</span>
                <span className="text-[10px] text-slate-500 font-mono">RTSP stream</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="block font-black text-amber-400">AUDIO — 2</span>
                <span className="text-[10px] text-slate-500 font-mono">Transcribed</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="block font-black text-purple-400">DOCUMENTS — 5</span>
                <span className="text-[10px] text-slate-500 font-mono">SHA-256</span>
              </div>
            </div>

            {/* State Admin Actions */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <Link
                href="/dashboard/inspections/INS-2041"
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer"
              >
                VIEW REPORT
              </Link>
              <Link
                href="/dashboard/evidence"
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 cursor-pointer"
              >
                VIEW EVIDENCE
              </Link>
              <button
                onClick={() => {
                  setToastMessage("Clarification notice dispatched to Squad-07.");
                  setTimeout(() => setToastMessage(null), 3000);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs border border-amber-500/30 cursor-pointer"
              >
                REQUEST CLARIFICATION
              </button>
              <button
                onClick={() => {
                  setToastMessage("Corrective Action notice issued to Asha Welfare Foundation.");
                  setTimeout(() => setToastMessage(null), 3000);
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer"
              >
                CREATE CORRECTIVE ACTION
              </button>
              <button
                onClick={() => {
                  setToastMessage("Report marked as reviewed by State Authority.");
                  setTimeout(() => setToastMessage(null), 3000);
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
              >
                MARK REVIEWED
              </button>
              <button
                onClick={() => {
                  setToastMessage("Report escalated to Central Command Directorate.");
                  setTimeout(() => setToastMessage(null), 3000);
                }}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs cursor-pointer"
              >
                ESCALATE TO CENTRAL
              </button>
            </div>
          </div>

          <div className="bg-card border border-base rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-primary flex items-center gap-2">
                  <AlertTriangle size={18} className="text-amber-500" />
                  State Issues &amp; Team Assignment
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  Direct district-level issues resolved by State Admin. Assign responsible squads or track SLA.
                </p>
              </div>
              <button
                onClick={() => setRefreshKey((k) => k + 1)}
                className="p-1.5 rounded-lg border border-base hover:bg-blue-tint text-muted cursor-pointer transition"
              >
                <RefreshCw size={14} />
              </button>
            </div>

            {/* Issues List */}
            <div className="space-y-3">
              {stateIssues.length === 0 ? (
                <div className="text-center py-10 text-muted text-xs border border-dashed border-base rounded-xl">
                  No issues reported for the selected district filter. All facilities operational.
                </div>
              ) : (
                stateIssues.map((issue) => {
                  const isResolved = issue.status === "RESOLVED" || issue.status === "CLOSED";
                  const isEscalated = issue.escalationLevel === 2;
                  const isOverdue = currentTime > 0 && new Date(issue.dueAt).getTime() < currentTime && !isResolved;

                  return (
                    <div
                      key={issue.id}
                      className={`p-4 rounded-xl border transition ${
                        isEscalated
                          ? "border-rose-500/40 bg-rose-500/5"
                          : isResolved
                          ? "border-emerald-500/30 bg-emerald-500/5 opacity-80"
                          : "border-base bg-card hover:border-blue-500/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-muted/60 text-secondary font-bold">
                              {issue.id}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                              District: {issue.districtName}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              issue.priority === "CRITICAL"
                                ? "bg-rose-500/20 text-rose-500 border border-rose-500/30"
                                : issue.priority === "HIGH"
                                ? "bg-amber-500/20 text-amber-500"
                                : "bg-blue-500/10 text-blue-500"
                            }`}>
                              {issue.priority}
                            </span>
                            {isEscalated && (
                              <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider animate-pulse">
                                Level 2 Escalated
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-sm text-primary mt-1.5">{issue.title}</h3>
                          <p className="text-xs text-muted mt-1 leading-relaxed">{issue.description}</p>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-base flex items-center justify-between flex-wrap gap-2 text-xs">
                        <div className="flex items-center gap-2 text-muted text-[11px]">
                          <span>Assigned To: <strong className="text-secondary">{issue.assignedTo}</strong></span>
                          <span>•</span>
                          <span className={isOverdue ? "text-rose-500 font-bold" : "text-secondary font-medium"}>
                            {isOverdue ? "⚠ SLA Breached" : `SLA: ${issue.slaHours}h`}
                          </span>
                        </div>

                        {/* State Admin Action Buttons */}
                        <div className="flex items-center gap-2">
                          {!isResolved && (
                            <>
                              <button
                                onClick={() => setAssignModalIssue(issue)}
                                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] cursor-pointer transition shadow-sm"
                              >
                                Assign Squad
                              </button>
                              <button
                                onClick={() => handleResolve(issue.id)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer transition shadow-sm"
                              >
                                ✓ Resolve
                              </button>
                              {!isEscalated && (
                                <button
                                  onClick={() => handleEscalateToCentral(issue.id)}
                                  className="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 font-bold text-[11px] cursor-pointer transition"
                                  title="Escalate to Central Admin"
                                >
                                  ⚡ Escalate
                                </button>
                              )}
                            </>
                          )}
                          {isResolved && (
                            <span className="text-emerald-500 font-bold text-xs flex items-center gap-1">
                              <CheckCircle2 size={14} /> Resolved
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* State Operational Users / Field Inspection Squads */}
          <div className="bg-card border border-base rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-primary flex items-center gap-2">
                  <Users size={16} className="text-emerald-500" />
                  State Operational Field Teams &amp; Squads
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Inspection officers &amp; PMU personnel authorized for districts in {currentStateDef.name}.
                </p>
              </div>
              <button
                onClick={() => setShowAddUserModal(true)}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 font-bold text-xs cursor-pointer transition flex items-center gap-1"
              >
                <Plus size={14} /> Add Officer
              </button>
            </div>

            <div className="divide-y divide-base">
              {stateUsers.map((user) => (
                <div key={user.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-primary flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {user.name}
                    </div>
                    <div className="text-muted text-[11px]">
                      {user.email} • Scoped to District: <strong>{user.districtName}</strong>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[10px]">
                    {user.role.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 5 Cols: GIS Map & Facilities Overview */}
        <div className="lg:col-span-5 space-y-6">
          {/* State GIS Map */}
          <div className="bg-card border border-base rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-primary flex items-center gap-2">
                <MapPin size={16} className="text-blue-500" />
                State GIS Geospatial Grid
              </h3>
              <span className="text-[11px] text-muted font-medium">
                {selectedDistrict === "ALL" ? currentStateDef.name : `${selectedDistrict} District`}
              </span>
            </div>
            <div className="h-72 rounded-xl overflow-hidden border border-base shadow-inner">
              <MapPanel
                filteredProjectIds={filteredProjectIds}
              />
            </div>
          </div>

          {/* Facilities in Scope */}
          <div className="bg-card border border-base rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-black text-primary flex items-center gap-2">
              <Building2 size={16} className="text-amber-500" />
              Facilities in Jurisdiction ({filteredProjects.length})
            </h3>
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {filteredProjects.map((p) => (
                <div key={p.id} className="p-3 rounded-xl border border-base bg-muted/20 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-primary">{p.name}</div>
                    <div className="text-muted text-[11px]">
                      {p.district_name} • Health Score: {p.health.overall}%
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/projects/${p.id}`}
                    className="p-1.5 rounded-lg hover:bg-blue-tint text-muted hover:text-blue-500 transition"
                  >
                    <ChevronRight size={16} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Assign Squad Modal */}
      {assignModalIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="bg-card border border-base text-primary rounded-2xl max-w-md w-full p-6 relative shadow-2xl space-y-4">
            <button
              onClick={() => setAssignModalIssue(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-blue-tint text-muted cursor-pointer transition"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2 text-blue-500 font-bold text-xs uppercase tracking-wider">
              <UserCheck size={16} />
              State Admin Assignment
            </div>

            <div>
              <h3 className="text-lg font-black text-primary">Assign Field Squad</h3>
              <p className="text-xs text-muted mt-0.5">
                Dispatch an Inspection Officer or PMU staff to verify {assignModalIssue.title} in {assignModalIssue.districtName}.
              </p>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1 text-secondary">Assignee Official</label>
                <select
                  value={assigneeName}
                  onChange={(e) => setAssigneeName(e.target.value)}
                  className="input-field w-full cursor-pointer font-bold text-xs"
                >
                  {stateUsers.map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.name} ({u.role.replace("_", " ")} - {u.districtName})
                    </option>
                  ))}
                  <option value="AP Special Taskforce Squad">AP Special Taskforce Squad</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-secondary">Assignment Role</label>
                <select
                  value={assigneeRole}
                  onChange={(e) => setAssigneeRole(e.target.value)}
                  className="input-field w-full cursor-pointer text-xs"
                >
                  <option value="INSPECTION_OFFICER">Inspection Officer (Field Audit Squad)</option>
                  <option value="PMU_USER">PMU Directorate Specialist</option>
                  <option value="STAFF">Facility Staff / Incharge</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setAssignModalIssue(null)}
                  className="btn-secondary flex-1 text-xs py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 text-xs py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Operational User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="bg-card border border-base text-primary rounded-2xl max-w-md w-full p-6 relative shadow-2xl space-y-4">
            <button
              onClick={() => setShowAddUserModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-blue-tint text-muted cursor-pointer transition"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-wider">
              <UserCheck size={16} />
              Register Operational Field Staff
            </div>

            <div>
              <h3 className="text-lg font-black text-primary">Add State Field Officer</h3>
              <p className="text-xs text-muted mt-0.5">
                Register an Inspection Officer or PMU user for a district in {currentStateDef.name}.
              </p>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1 text-secondary">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Priya Mehta"
                  className="input-field w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-secondary">Official Email</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="priya.mehta@field.dosje.gov.in"
                  className="input-field w-full text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-secondary">Assigned District</label>
                  <select
                    value={newUserDistrict}
                    onChange={(e) => setNewUserDistrict(e.target.value)}
                    className="input-field w-full cursor-pointer text-xs"
                  >
                    {currentStateDef.districts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-secondary">Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as "INSPECTION_OFFICER" | "PMU_USER" | "STAFF" | "PROJECT_ADMIN")}
                    className="input-field w-full cursor-pointer text-xs"
                  >
                    <option value="INSPECTION_OFFICER">Inspection Officer</option>
                    <option value="PMU_USER">PMU User</option>
                    <option value="STAFF">Field Staff</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="btn-secondary flex-1 text-xs py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 text-xs py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Issue Modal */}
      {showCreateIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="bg-card border border-base text-primary rounded-2xl max-w-md w-full p-6 relative shadow-2xl space-y-4">
            <button
              onClick={() => setShowCreateIssueModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-blue-tint text-muted cursor-pointer transition"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2 text-blue-500 font-bold text-xs uppercase tracking-wider">
              <AlertTriangle size={16} />
              Log State Issue
            </div>

            <div>
              <h3 className="text-lg font-black text-primary">Log Operational Issue</h3>
              <p className="text-xs text-muted mt-0.5">
                Register an anomaly, CCTV offline event, or compliance complaint for {currentStateDef.name}.
              </p>
            </div>

            <form onSubmit={handleCreateIssueSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1 text-secondary">Issue Title</label>
                <input
                  type="text"
                  required
                  value={issueTitle}
                  onChange={(e) => setIssueTitle(e.target.value)}
                  placeholder="e.g. CCTV Camera #02 Offline at Guntur Facility"
                  className="input-field w-full text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-secondary">Category</label>
                  <select
                    value={issueCategory}
                    onChange={(e) => setIssueCategory(e.target.value as IssueCategory)}
                    className="input-field w-full cursor-pointer text-xs"
                  >
                    <option value="CCTV_OFFLINE">CCTV Offline</option>
                    <option value="GPS_GEOFENCE_FAILURE">GPS Geofence Offset</option>
                    <option value="ATTENDANCE_ANOMALY">Attendance Anomaly</option>
                    <option value="INSPECTION_COMPLIANCE">Inspection Compliance</option>
                    <option value="INFRASTRUCTURE">Infrastructure</option>
                    <option value="USER_COMPLAINT">User Complaint</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-secondary">Priority</label>
                  <select
                    value={issuePriority}
                    onChange={(e) => setIssuePriority(e.target.value as IssuePriority)}
                    className="input-field w-full cursor-pointer text-xs"
                  >
                    <option value="CRITICAL">Critical (4h SLA)</option>
                    <option value="HIGH">High (24h SLA)</option>
                    <option value="MEDIUM">Medium (72h SLA)</option>
                    <option value="LOW">Low (168h SLA)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-secondary">Description</label>
                <textarea
                  value={issueDesc}
                  onChange={(e) => setIssueDesc(e.target.value)}
                  rows={3}
                  placeholder="Provide context and inspection details..."
                  className="input-field w-full text-xs"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateIssueModal(false)}
                  className="btn-secondary flex-1 text-xs py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 text-xs py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Log Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
