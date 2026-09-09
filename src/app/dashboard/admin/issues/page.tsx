"use client";

import { useState, useMemo, useEffect } from "react";
import {
  getIssues,
  createIssue,
  resolveIssue,
  escalateIssue,
  returnIssueToState,
  addCommentToIssue,
  IssuePriority,
  IssueStatus,
  IssueCategory,
} from "@/lib/issues/issue-store";
import { SUPPORTED_INDIAN_STATES } from "@/lib/auth/admin-hierarchy";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Send,
  Plus,
  Filter,
  Shield,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  X,
  BellRing,
  RotateCcw,
  Landmark,
  Building,
  UserCheck,
} from "lucide-react";

export default function AdminIssuesPage() {
  const [selectedState, setSelectedState] = useState<string>("ALL");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("ALL");
  const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState<{ [issueId: string]: string }>({});

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState<IssueCategory>("CCTV_OFFLINE");
  const [newPriority, setNewPriority] = useState<IssuePriority>("HIGH");
  const [newState, setNewState] = useState("Andhra Pradesh");
  const [newDistrict, setNewDistrict] = useState("Guntur");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Return to state modal state
  const [returnModalIssueId, setReturnModalIssueId] = useState<string | null>(null);
  const [correctiveNotes, setCorrectiveNotes] = useState("");

  // Force re-render on mutation
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    setCurrentTime(Date.now());
  }, []);

  const issuesList = useMemo(() => {
    return getIssues(selectedState, selectedDistrict);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedState, selectedDistrict, refreshKey]);

  const availableDistricts = useMemo(() => {
    if (selectedState === "ALL") {
      const all: string[] = [];
      SUPPORTED_INDIAN_STATES.forEach((s) => all.push(...s.districts));
      return Array.from(new Set(all));
    }
    const stateObj = SUPPORTED_INDIAN_STATES.find((s) => s.name === selectedState || s.id === selectedState);
    return stateObj ? stateObj.districts : [];
  }, [selectedState]);

  const filteredIssues = useMemo(() => {
    return issuesList.filter((issue) => {
      if (selectedPriority !== "ALL" && issue.priority !== selectedPriority) return false;
      if (selectedStatus !== "ALL" && issue.status !== selectedStatus) return false;
      return true;
    });
  }, [issuesList, selectedPriority, selectedStatus]);

  const handleCreateIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const stateObj = SUPPORTED_INDIAN_STATES.find((s) => s.name === newState) || SUPPORTED_INDIAN_STATES[0];

    createIssue({
      title: newTitle,
      description: newDescription,
      category: newCategory,
      priority: newPriority,
      createdBy: "Central Command Directorate",
      stateId: stateObj.id,
      stateName: stateObj.name,
      districtId: newDistrict,
      districtName: newDistrict,
      assignedTo: `State Admin (${stateObj.name})`,
      assignedToRole: "State Admin",
    });

    setNewTitle("");
    setNewDescription("");
    setShowCreateModal(false);
    setRefreshKey((k) => k + 1);
    setToastMessage("✓ New Issue logged into Level 1 (State Admin) resolution queue.");
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleResolve = (issueId: string) => {
    resolveIssue(issueId, "Central Admin Official", "Issue resolved and closed by Central Directorate.");
    setRefreshKey((k) => k + 1);
    setToastMessage("✓ Issue marked as RESOLVED.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleEscalate = (issueId: string) => {
    escalateIssue(issueId, "Manual SLA escalation trigger by Administrator.");
    setRefreshKey((k) => k + 1);
    setToastMessage("⚡ Issue escalated to Level 2 (Central Admin Directorate).");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleReturnToState = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnModalIssueId) return;

    returnIssueToState(
      returnModalIssueId,
      correctiveNotes || "State Admin to re-verify facility compliance and upload proof",
      "Central Directorate Official"
    );

    setReturnModalIssueId(null);
    setCorrectiveNotes("");
    setRefreshKey((k) => k + 1);
    setToastMessage("✓ Escalated issue returned to State Admin with corrective instructions.");
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleAddComment = (issueId: string) => {
    const msg = commentInput[issueId];
    if (!msg || !msg.trim()) return;

    addCommentToIssue(issueId, "Central Directorate Official", "Central Admin", msg);
    setCommentInput((prev) => ({ ...prev, [issueId]: "" }));
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-2xl border border-blue-500/40 flex items-center gap-2 animate-bounce">
          <BellRing size={16} className="text-blue-400" />
          {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Shield size={24} className="text-rose-600" />
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Centralized Issue &amp; Escalation Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Two-Level Administrative Resolution Engine: Level 1 (State Admin) → Level 2 (Central Directorate)
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-lg cursor-pointer"
        >
          <Plus size={16} /> Log Issue
        </button>
      </div>

      {/* Hierarchy Info Alert */}
      <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-800 dark:text-blue-300 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Landmark size={16} className="text-blue-500 shrink-0" />
          <span>
            <strong>Two-Level SLA Model:</strong> State Admin resolves all district-level issues directly. Unresolved or SLA-breached issues auto-escalate to Level 2 (Central Admin).
          </span>
        </div>
        <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
          No District Admin Step
        </span>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-card border border-base shadow-sm space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="text-xs font-bold text-primary flex items-center gap-1.5">
            <Filter size={14} className="text-blue-500" />
            Filter Escalation Queue
          </div>
          <div className="text-[11px] text-muted font-medium">
            Showing {filteredIssues.length} of {issuesList.length} issues
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {/* State Filter */}
          <div>
            <label className="block text-[10px] font-bold text-muted uppercase mb-1">State</label>
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedDistrict("ALL");
              }}
              className="input-field w-full cursor-pointer font-bold text-xs"
            >
              <option value="ALL">All States ({SUPPORTED_INDIAN_STATES.length})</option>
              {SUPPORTED_INDIAN_STATES.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* District Geographic Filter */}
          <div>
            <label className="block text-[10px] font-bold text-muted uppercase mb-1">District (Geographic Filter)</label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="input-field w-full cursor-pointer text-xs"
            >
              <option value="ALL">All Districts</option>
              {availableDistricts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-[10px] font-bold text-muted uppercase mb-1">Priority</label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="input-field w-full cursor-pointer text-xs font-semibold"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical (4h SLA)</option>
              <option value="HIGH">High (24h SLA)</option>
              <option value="MEDIUM">Medium (72h SLA)</option>
              <option value="LOW">Low (168h SLA)</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[10px] font-bold text-muted uppercase mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input-field w-full cursor-pointer text-xs font-semibold"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="ESCALATED">Escalated (Level 2)</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Issues Queue List */}
      <div className="space-y-3">
        {filteredIssues.map((issue) => {
          const isExpanded = expandedIssueId === issue.id;
          const isResolved = issue.status === "RESOLVED" || issue.status === "CLOSED";
          const isLevel2 = issue.escalationLevel === 2 || issue.status === "ESCALATED";
          const isBreached = currentTime > 0 && new Date(issue.dueAt).getTime() < currentTime && !isResolved;

          return (
            <div
              key={issue.id}
              className={`rounded-2xl border transition shadow-sm overflow-hidden ${
                isLevel2
                  ? "border-rose-500/50 bg-rose-500/5"
                  : isResolved
                  ? "border-emerald-500/30 bg-emerald-500/5 opacity-85"
                  : "border-base bg-card"
              }`}
            >
              {/* Main Card Row */}
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap text-[10px]">
                    <span className="font-mono px-2 py-0.5 rounded bg-muted font-bold text-secondary">
                      {issue.id}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                      {issue.stateName} • {issue.districtName}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded font-bold uppercase ${
                        issue.priority === "CRITICAL"
                          ? "bg-rose-500/20 text-rose-500 border border-rose-500/30"
                          : issue.priority === "HIGH"
                          ? "bg-amber-500/20 text-amber-500"
                          : "bg-blue-500/10 text-blue-500"
                      }`}
                    >
                      {issue.priority}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded font-bold uppercase ${
                        isLevel2
                          ? "bg-rose-600 text-white animate-pulse"
                          : "bg-muted text-secondary"
                      }`}
                    >
                      {isLevel2 ? "Level 2: Central Escalation" : "Level 1: State Queue"}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm sm:text-base text-primary">{issue.title}</h3>
                  <p className="text-xs text-muted leading-relaxed line-clamp-2">{issue.description}</p>

                  <div className="flex items-center gap-3 pt-1 text-[11px] text-muted flex-wrap">
                    <span>Assigned: <strong className="text-secondary">{issue.assignedTo}</strong></span>
                    <span>•</span>
                    <span className={isBreached ? "text-rose-500 font-bold" : "text-secondary font-medium"}>
                      <Clock size={12} className="inline mr-1" />
                      {isBreached ? "⚠ SLA Breached" : `SLA: ${issue.slaHours}h`}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  {isLevel2 && !isResolved && (
                    <button
                      onClick={() => setReturnModalIssueId(issue.id)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 font-bold text-xs flex items-center gap-1 cursor-pointer transition"
                    >
                      <RotateCcw size={13} /> Return to State
                    </button>
                  )}

                  {!isResolved && (
                    <button
                      onClick={() => handleResolve(issue.id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition shadow-sm"
                    >
                      <CheckCircle2 size={13} /> Resolve
                    </button>
                  )}

                  {!isLevel2 && !isResolved && (
                    <button
                      onClick={() => handleEscalate(issue.id)}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 font-bold text-xs cursor-pointer transition"
                    >
                      ⚡ Escalate
                    </button>
                  )}

                  <button
                    onClick={() => setExpandedIssueId(isExpanded ? null : issue.id)}
                    className="p-2 rounded-xl border border-base hover:bg-blue-tint text-muted cursor-pointer transition"
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {/* Expanded Communication Thread */}
              {isExpanded && (
                <div className="p-4 sm:p-5 bg-muted/20 border-t border-base space-y-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1">
                      <MessageSquare size={13} /> Official Communication Thread ({issue.comments.length})
                    </p>

                    {issue.comments.map((c) => (
                      <div key={c.id} className="p-3 rounded-xl bg-card border border-base text-xs space-y-1 shadow-sm">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-blue-500">{c.authorName} ({c.authorRole})</span>
                          <span className="text-muted font-mono">{new Date(c.createdAt).toLocaleTimeString("en-IN")}</span>
                        </div>
                        <p className="text-primary font-medium">{c.message}</p>
                      </div>
                    ))}

                    {/* Add Comment Input */}
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="text"
                        placeholder="Type official directive or update..."
                        value={commentInput[issue.id] || ""}
                        onChange={(e) => setCommentInput({ ...commentInput, [issue.id]: e.target.value })}
                        className="input-field flex-1 text-xs py-2"
                      />
                      <button
                        onClick={() => handleAddComment(issue.id)}
                        className="btn-primary text-xs px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Return to State Modal */}
      {returnModalIssueId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="bg-card border border-base text-primary rounded-2xl max-w-md w-full p-6 relative shadow-2xl space-y-4">
            <button
              onClick={() => setReturnModalIssueId(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-blue-tint text-muted cursor-pointer transition"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-wider">
              <RotateCcw size={16} />
              Central Directorate Directive
            </div>

            <div>
              <h3 className="text-lg font-black text-primary">Return Issue to State Admin</h3>
              <p className="text-xs text-muted mt-0.5">
                Assign state-level corrective action and remand issue back to State Administration queue.
              </p>
            </div>

            <form onSubmit={handleReturnToState} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1 text-secondary">
                  Corrective Action Instructions for State Admin
                </label>
                <textarea
                  required
                  rows={3}
                  value={correctiveNotes}
                  onChange={(e) => setCorrectiveNotes(e.target.value)}
                  placeholder="e.g. State Admin to dispatch technical team within 24h and upload certified repair report..."
                  className="input-field w-full text-xs"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setReturnModalIssueId(null)}
                  className="btn-secondary flex-1 text-xs py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 text-xs py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  Send Directive &amp; Remand
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Issue Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="bg-card border border-base text-primary rounded-2xl max-w-md w-full p-6 relative shadow-2xl space-y-4">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-blue-tint text-muted cursor-pointer transition"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-wider">
              <Plus size={16} />
              Central Directorate Issue Registration
            </div>

            <div>
              <h3 className="text-lg font-black text-primary">Log Issue into State Queue</h3>
              <p className="text-xs text-muted mt-0.5">
                Issue will be routed directly to the designated State Admin for field assignment.
              </p>
            </div>

            <form onSubmit={handleCreateIssueSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1 text-secondary">Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. CCTV Camera Stream Blackout"
                  className="input-field w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-secondary">Description</label>
                <textarea
                  required
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Operational failure details..."
                  className="input-field w-full text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-secondary">State</label>
                  <select
                    value={newState}
                    onChange={(e) => setNewState(e.target.value)}
                    className="input-field w-full cursor-pointer text-xs font-semibold"
                  >
                    {SUPPORTED_INDIAN_STATES.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-secondary">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as IssuePriority)}
                    className="input-field w-full cursor-pointer text-xs font-semibold"
                  >
                    <option value="CRITICAL">Critical (4h SLA)</option>
                    <option value="HIGH">High (24h SLA)</option>
                    <option value="MEDIUM">Medium (72h SLA)</option>
                    <option value="LOW">Low (168h SLA)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary flex-1 text-xs py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 text-xs py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold"
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
