"use client";

import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";
import {
  ClipboardCheck, Plus, Search, User, ArrowRight,
} from "lucide-react";
import { useState } from "react";

const MOCK_INSPECTIONS = [
  {
    id: "INSP-0094",
    type: "surprise",
    status: "assigned",
    project_name: "Pragati Skill Centre — Warangal",
    project_id: "INS-2042",
    district: "Warangal, Telangana",
    inspector_name: "Officer S. Mehra",
    assigned_at: new Date(Date.now() - 3600000).toISOString(),
    risk: "HIGH",
  },
  {
    id: "INSP-0089",
    type: "surprise",
    status: "completed",
    project_name: "Asha Rehabilitation Centre — Guntur",
    project_id: "INS-2041",
    district: "Guntur, Andhra Pradesh",
    inspector_name: "Officer R. Kumar",
    assigned_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    risk: "LOW",
  },
  {
    id: "INSP-0091",
    type: "routine",
    status: "completed",
    project_name: "Sahyog Institute — Pune",
    project_id: "INS-2043",
    district: "Pune, Maharashtra",
    inspector_name: "Officer P. Joshi",
    assigned_at: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
    risk: "LOW",
  },
  {
    id: "INSP-0079",
    type: "follow_up",
    status: "in_progress",
    project_name: "Hope Foundation — Lucknow",
    project_id: "INS-2045",
    district: "Lucknow, Uttar Pradesh",
    inspector_name: "Officer M. Verma",
    assigned_at: new Date(Date.now() - 7200000).toISOString(),
    risk: "MEDIUM",
  },
];

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  assigned: { bg: "var(--color-info-bg)", text: "var(--color-info)", label: "ASSIGNED" },
  in_progress: { bg: "var(--color-warning-bg)", text: "var(--color-warning)", label: "IN PROGRESS" },
  completed: { bg: "var(--color-success-bg)", text: "var(--color-success)", label: "COMPLETED" },
  cancelled: { bg: "var(--surface-secondary)", text: "var(--text-muted)", label: "CANCELLED" },
};

export default function InspectionsPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = MOCK_INSPECTIONS.filter((i) => {
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      i.project_name.toLowerCase().includes(q) ||
      i.inspector_name.toLowerCase().includes(q) ||
      i.id.toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || i.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg md:text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Inspections
          </h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Track assignments and field operations
          </p>
        </div>
        <Link
          href="/dashboard/inspections/assign"
          className="btn btn-primary btn-sm"
        >
          <Plus size={13} />
          <span className="hidden sm:inline">Assign</span>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total", value: 94, color: "var(--text-primary)" },
          { label: "Completed", value: 87, color: "var(--green-500)" },
          { label: "In Progress", value: 4, color: "var(--amber-500)" },
          { label: "Assigned", value: 3, color: "var(--blue-500)" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-xl p-3"
            style={{
              background: "var(--surface-card)",
              border: "1px solid var(--border-light)",
            }}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
              {label}
            </p>
            <p className="text-xl font-bold tabular" style={{ color }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="input-field flex items-center gap-2 flex-1 min-w-0 sm:max-w-xs">
          <Search size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search inspections…"
            className="flex-1 bg-transparent focus-visible:outline-none"
            style={{ fontSize: "0.8rem", color: "var(--text-primary)" }}
            aria-label="Search inspections"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {["all", "assigned", "in_progress", "completed"].map((s) => (
          <button
            type="button"
            key={s}
            onClick={() => setFilterStatus(s)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap"
            style={{
              background: filterStatus === s ? "var(--blue-600)" : "var(--surface-card)",
              color: filterStatus === s ? "white" : "var(--text-secondary)",
              border: `1px solid ${filterStatus === s ? "var(--blue-600)" : "var(--border-light)"}`,
            }}
          >
            {s === "all" ? "All" : s === "in_progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        </div>
      </div>

      {/* Inspection List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 rounded-xl text-center"
            style={{ background: "var(--surface-card)", border: "1px solid var(--border-light)" }}
          >
            <ClipboardCheck size={36} style={{ color: "var(--text-muted)", marginBottom: 12 }} />
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>No inspections found</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              {search ? `No results for "${search}"` : "No inspections match this filter"}
            </p>
            {(search || filterStatus !== "all") && (
              <button
                type="button"
                onClick={() => { setSearch(""); setFilterStatus("all"); }}
                className="mt-4 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                style={{
                  background: "var(--surface-secondary)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-light)",
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          filtered.map((insp) => {
            const statusConfig = STATUS_CONFIG[insp.status] || STATUS_CONFIG.assigned;
            return (
              <Link
                key={insp.id}
                href={`/dashboard/inspections/${insp.id}`}
                className="block rounded-xl p-4 transition-all hover:-translate-y-0.5"
                style={{
                  background: "var(--surface-card)",
                  border: "1px solid var(--border-light)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "var(--shadow-md)";
                  e.currentTarget.style.borderColor = "var(--border-default)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = "var(--border-light)";
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="px-2 py-0.5 rounded text-[9px] font-bold"
                        style={{ background: statusConfig.bg, color: statusConfig.text }}
                      >
                        {statusConfig.label}
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                        style={{
                          background: insp.risk === "HIGH"
                            ? "var(--color-danger-bg)"
                            : insp.risk === "MEDIUM"
                            ? "var(--color-warning-bg)"
                            : "var(--color-success-bg)",
                          color: insp.risk === "HIGH"
                            ? "var(--color-danger)"
                            : insp.risk === "MEDIUM"
                            ? "var(--color-warning)"
                            : "var(--color-success)",
                        }}
                      >
                        {insp.risk}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                      {insp.project_name}
                    </h3>
                    <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {insp.district}
                    </p>
                  </div>
                  <ArrowRight size={14} style={{ color: "var(--text-muted)", flexShrink: 0, marginTop: 4 }} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <User size={11} style={{ color: "var(--text-muted)" }} />
                    <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                      {insp.inspector_name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                    {formatRelativeTime(insp.assigned_at)}
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
