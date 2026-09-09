"use client";

import Link from "next/link";
import { DEMO_PROJECTS } from "@/lib/demo-data";
import { getStatusStyle, getRiskColor } from "@/lib/utils";
import { Search, MapPin, Camera, Activity, ArrowRight, ClipboardCheck } from "lucide-react";
import { useState } from "react";

export default function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = DEMO_PROJECTS.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.district_name.toLowerCase().includes(search.toLowerCase()) ||
      p.organization_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1
            className="text-lg md:text-xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Projects
          </h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {DEMO_PROJECTS.length} projects across 8 districts
          </p>
        </div>
        <Link
          href="/dashboard/inspections/assign"
          className="btn btn-primary btn-sm"
        >
          <ClipboardCheck size={13} />
          <span className="hidden sm:inline">Assign Inspection</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="input-field flex items-center gap-2 flex-1 min-w-0 sm:max-w-xs">
          <Search size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects…"
            className="flex-1 bg-transparent focus-visible:outline-none"
            style={{ fontSize: "0.8rem", color: "var(--text-primary)" }}
            aria-label="Search projects"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {["all", "operational", "at-risk", "critical"].map((status) => (
            <button
              type="button"
              key={status}
              onClick={() => setFilterStatus(status)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap"
              style={{
                background: filterStatus === status ? "var(--blue-600)" : "var(--surface-card)",
                color: filterStatus === status ? "white" : "var(--text-secondary)",
                border: `1px solid ${filterStatus === status ? "var(--blue-600)" : "var(--border-light)"}`,
              }}
            >
              {status === "all" ? "All" : status.replace("-", " ")}
            </button>
          ))}
        </div>

        <span className="text-[10px] ml-auto" style={{ color: "var(--text-muted)" }}>
          {filtered.length} results
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((project) => {
          const statusStyle = getStatusStyle(project.status);
          const riskColor = getRiskColor(project.ai_risk_score);

          return (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="block rounded-xl p-4 transition-all hover:-translate-y-0.5"
              style={{
                background: "var(--surface-card)",
                border: "1px solid var(--border-light)",
                boxShadow: "var(--shadow-sm)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "var(--shadow-lg)";
                e.currentTarget.style.borderColor = "var(--border-default)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                e.currentTarget.style.borderColor = "var(--border-light)";
              }}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: statusStyle.dotColor }}
                    />
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {project.status.replace("-", " ")}
                    </span>
                  </div>
                  <h2
                    className="text-sm font-bold leading-tight"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {project.name}
                  </h2>
                </div>
                <div
                  className="px-2 py-1 rounded-lg text-[10px] font-bold tabular flex-shrink-0"
                  style={{
                    background: project.ai_risk_score >= 60
                      ? "var(--color-danger-bg)"
                      : project.ai_risk_score >= 30
                      ? "var(--color-warning-bg)"
                      : "var(--color-success-bg)",
                    color: project.ai_risk_score >= 60
                      ? "var(--color-danger)"
                      : project.ai_risk_score >= 30
                      ? "var(--color-warning)"
                      : "var(--color-success)",
                  }}
                >
                  {project.ai_risk_score}
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-1.5 mb-3">
                <MapPin size={11} style={{ color: "var(--text-muted)" }} />
                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  {project.district_name}, {project.state}
                </span>
              </div>

              {/* Stats */}
              <div
                className="grid grid-cols-3 gap-2 pt-3"
                style={{ borderTop: "1px solid var(--border-light)" }}
              >
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    Health
                  </p>
                  <p className="text-sm font-bold tabular" style={{ color: "var(--text-primary)" }}>
                    {project.health.overall}%
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    CCTV
                  </p>
                  <p
                    className="text-sm font-bold tabular"
                    style={{
                      color: project.cctv_online < project.cctv_total
                        ? "var(--color-warning)"
                        : "var(--text-primary)",
                    }}
                  >
                    {project.cctv_online}/{project.cctv_total}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    People
                  </p>
                  <p className="text-sm font-bold tabular" style={{ color: "var(--text-primary)" }}>
                    {project.registered_beneficiaries}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div
                className="flex items-center justify-between mt-3 pt-3"
                style={{ borderTop: "1px solid var(--border-light)" }}
              >
                <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                  {project.id}
                </span>
                <ArrowRight size={12} style={{ color: "var(--text-muted)" }} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
