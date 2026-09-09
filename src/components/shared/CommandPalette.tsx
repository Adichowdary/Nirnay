"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, X, LayoutDashboard, Activity, FolderOpen, Map,
  ClipboardCheck, Brain, FileImage, Building2, Users, BarChart3,
  BookOpen, ArrowRight, Clock
} from "lucide-react";

const COMMANDS = [
  { id: "cmd-cc", label: "Open Command Center", icon: LayoutDashboard, href: "/dashboard", category: "Navigation" },
  { id: "cmd-scenario", label: "End-to-End System Simulation", icon: Activity, href: "/dashboard/scenario", category: "Navigation" },
  { id: "cmd-monitor", label: "Open Live CCTV Monitor", icon: Activity, href: "/dashboard/monitor", category: "Navigation" },
  { id: "cmd-vc", label: "Random Video Verification (VC)", icon: Activity, href: "/dashboard/video-verification", category: "Navigation" },
  { id: "cmd-projects", label: "View All Projects", icon: FolderOpen, href: "/dashboard/projects", category: "Navigation" },
  { id: "cmd-map", label: "Open Map Intelligence", icon: Map, href: "/dashboard/map", category: "Navigation" },
  { id: "cmd-inspections", label: "View Inspections", icon: ClipboardCheck, href: "/dashboard/inspections", category: "Navigation" },
  { id: "cmd-ai", label: "View AI Signals", icon: Brain, href: "/dashboard/ai-signals", category: "Navigation" },
  { id: "cmd-evidence", label: "View Evidence", icon: FileImage, href: "/dashboard/evidence", category: "Navigation" },
  { id: "cmd-orgs", label: "View Organizations", icon: Building2, href: "/dashboard/organizations", category: "Navigation" },
  { id: "cmd-bene", label: "View Beneficiaries", icon: Users, href: "/dashboard/beneficiaries", category: "Navigation" },
  { id: "cmd-reports", label: "View Reports", icon: BarChart3, href: "/dashboard/reports", category: "Navigation" },
  { id: "cmd-audit", label: "Open Audit Trail", icon: BookOpen, href: "/dashboard/audit", category: "Navigation" },
  { id: "cmd-assign", label: "Assign Inspection", icon: ClipboardCheck, href: "/dashboard/inspections/assign", category: "Actions" },
  { id: "cmd-anomalies", label: "View Critical Anomalies", icon: Brain, href: "/dashboard/ai-signals?severity=critical", category: "Actions" },
  { id: "proj-ins2041", label: "Project: Asha Rehabilitation Centre", icon: FolderOpen, href: "/dashboard/projects/INS-2041", category: "Projects" },
  { id: "proj-ins2042", label: "Project: Pragati Skill Centre", icon: FolderOpen, href: "/dashboard/projects/INS-2042", category: "Projects" },
  { id: "proj-ins2044", label: "Project: Umang Welfare Centre", icon: FolderOpen, href: "/dashboard/projects/INS-2044", category: "Projects" },
];

const RECENT = ["Open Command Center", "View AI Signals", "Project: Umang Welfare Centre"];

interface CommandPaletteProps {
  onClose: () => void;
}

export function CommandPalette({ onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.trim()
    ? COMMANDS.filter(
        (c) =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.category.toLowerCase().includes(query.toLowerCase())
      )
    : COMMANDS;

  const prevQueryRef = useRef(query);

  useEffect(() => {
    if (prevQueryRef.current !== query) {
      prevQueryRef.current = query;
      setSelected(0);
    }
  }, [query]);

  useEffect(() => {
    inputRef.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") setSelected((s) => Math.min(s + 1, filtered.length - 1));
      if (e.key === "ArrowUp") setSelected((s) => Math.max(s - 1, 0));
      if (e.key === "Enter") {
        const item = filtered[selected];
        if (item) {
          router.push(item.href);
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [filtered, selected, onClose, router]);

  const grouped = filtered.reduce<Record<string, typeof COMMANDS>>(
    (acc, cmd) => {
      (acc[cmd.category] = acc[cmd.category] || []).push(cmd);
      return acc;
    },
    {}
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="card w-full max-w-xl animate-in"
        style={{ maxHeight: "60vh", display: "flex", flexDirection: "column" }}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-base">
          <Search size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, inspections, commands…"
            className="flex-1 bg-transparent text-primary placeholder:text-muted focus-visible:outline-none"
            style={{ fontSize: "0.875rem" }}
            aria-label="Search projects, inspections, and commands"
            name="search-query"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-secondary focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Close command palette"
          >
            <X size={14} style={{ color: "var(--text-muted)" }} aria-hidden="true" />
          </button>
        </div>

        {/* Results */}
        <div className="overflow-y-auto flex-1 py-2" aria-live="polite">
          {!query && (
            <div className="px-3 pb-2">
              <p className="section-label px-2 mb-1">Recent</p>
              {RECENT.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setQuery(r)}
                  className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-secondary text-left cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <Clock size={13} style={{ color: "var(--text-muted)" }} aria-hidden="true" />
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{r}</span>
                </button>
              ))}
              <div className="border-t border-base mt-2 pt-2" />
            </div>
          )}

          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="px-3 mb-2">
              <p className="section-label px-2 mb-1">{category}</p>
              {items.map((item) => {
                const globalIndex = filtered.indexOf(item);
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
                    style={{
                      background: globalIndex === selected ? "var(--surface-secondary)" : "transparent",
                      color: "var(--text-primary)",
                    }}
                    onClick={() => {
                      router.push(item.href);
                      onClose();
                    }}
                    onMouseEnter={() => setSelected(globalIndex)}
                  >
                    <Icon size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} aria-hidden="true" />
                    <span style={{ fontSize: "0.8rem", flex: 1 }}>{item.label}</span>
                    {globalIndex === selected && (
                      <ArrowRight size={13} style={{ color: "var(--text-muted)" }} aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="px-5 py-8 text-center">
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                No results for &ldquo;{query}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center gap-3 px-4 py-2 border-t border-base"
          style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}
        >
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  );
}
