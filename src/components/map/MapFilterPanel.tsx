"use client";

import { useState } from "react";
import {
  Filter, ChevronDown, ChevronUp, X, Search,
  Shield, Radio, Camera, Building2, MapPin, RotateCcw,
} from "lucide-react";

export interface MapFilters {
  risk: string[];
  inspection: string[];
  cctv: string[];
  organization: string[];
  district: string[];
  search: string;
}

const DEFAULT_FILTERS: MapFilters = {
  risk: [],
  inspection: [],
  cctv: [],
  organization: [],
  district: [],
  search: "",
};

const RISK_OPTIONS = [
  { value: "critical", label: "Critical (80+)", color: "var(--red-600)" },
  { value: "high", label: "High (60-79)", color: "var(--orange-600)" },
  { value: "medium", label: "Medium (35-59)", color: "var(--amber-600)" },
  { value: "low", label: "Low (<35)", color: "var(--green-600)" },
];

const INSPECTION_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "overdue", label: "Overdue" },
  { value: "completed", label: "Completed" },
];

const CCTV_OPTIONS = [
  { value: "online", label: "Online", color: "var(--green-600)" },
  { value: "offline", label: "Offline", color: "var(--red-600)" },
];

const ORG_OPTIONS = [
  { value: "ngo", label: "NGO" },
  { value: "institute", label: "Institute" },
  { value: "skill_centre", label: "Skill Centre" },
  { value: "welfare_centre", label: "Welfare Centre" },
  { value: "rehabilitation_centre", label: "Rehabilitation Centre" },
];

const DISTRICT_OPTIONS = [
  "Guntur", "Warangal", "Pune", "Bhopal", "Lucknow", "Jaipur", "Coimbatore", "Bhubaneswar",
];

interface MapFilterPanelProps {
  filters: MapFilters;
  onFiltersChange: (filters: MapFilters) => void;
  totalCount: number;
  filteredCount: number;
}

function FilterSection({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-base last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-secondary transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon size={13} style={{ color: "var(--blue-600)" }} />
          <span className="font-semibold" style={{ fontSize: "var(--text-xs)", color: "var(--text-primary)" }}>
            {title}
          </span>
        </div>
        {open ? <ChevronUp size={14} style={{ color: "var(--text-muted)" }} /> : <ChevronDown size={14} style={{ color: "var(--text-muted)" }} />}
      </button>
      {open && <div className="px-3 pb-3 space-y-1">{children}</div>}
    </div>
  );
}

function CheckboxItem({
  checked,
  onChange,
  label,
  color,
  count,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  color?: string;
  count?: number;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer py-1 group">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-3.5 h-3.5 rounded cursor-pointer"
        style={{ accentColor: color ?? "var(--blue-600)" }}
      />
      {color && (
        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
      )}
      <span
        className="flex-1 group-hover:text-primary transition-colors"
        style={{ fontSize: "var(--text-xs)", color: checked ? "var(--text-primary)" : "var(--text-secondary)" }}
      >
        {label}
      </span>
      {count !== undefined && (
        <span
          className="px-1.5 py-0.5 rounded-full font-mono"
          style={{ fontSize: "9px", background: "var(--surface-secondary)", color: "var(--text-muted)" }}
        >
          {count}
        </span>
      )}
    </label>
  );
}

export function MapFilterPanel({
  filters,
  onFiltersChange,
  totalCount,
  filteredCount,
}: MapFilterPanelProps) {
  const [collapsed, setCollapsed] = useState(true);
  const activeFilterCount =
    filters.risk.length +
    filters.inspection.length +
    filters.cctv.length +
    filters.organization.length +
    filters.district.length;

  const toggle = (key: keyof MapFilters, value: string) => {
    const current = filters[key];
    if (!Array.isArray(current)) return;
    onFiltersChange({
      ...filters,
      [key]: current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value],
    });
  };

  const resetAll = () => onFiltersChange(DEFAULT_FILTERS);

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl cursor-pointer transition-all shadow-md backdrop-blur-md"
        style={{
          background: activeFilterCount > 0 ? "var(--blue-600)" : "rgba(15, 23, 42, 0.85)",
          color: "#fff",
          border: `1px solid ${activeFilterCount > 0 ? "var(--blue-500)" : "rgba(255,255,255,0.2)"}`,
          fontSize: "var(--text-xs)",
          fontWeight: 700,
        }}
      >
        <Filter size={13} />
        <span>Filters</span>
        {activeFilterCount > 0 && (
          <span
            className="px-1.5 py-0.5 rounded-full"
            style={{ fontSize: "9px", background: "rgba(255,255,255,0.25)" }}
          >
            {activeFilterCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs sm:hidden z-40"
        onClick={() => setCollapsed(true)}
      />
      <div
        className="flex flex-col rounded-2xl overflow-hidden shadow-2xl z-50 fixed sm:static inset-x-3 top-16 sm:inset-x-auto sm:top-auto w-[calc(100vw-24px)] max-w-sm sm:w-[280px]"
        style={{
          background: "var(--surface-card)",
          border: "1px solid var(--border-light)",
          maxHeight: "calc(100dvh - 140px)",
        }}
      >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-base">
        <div className="flex items-center gap-2">
          <Filter size={14} style={{ color: "var(--blue-600)" }} />
          <span className="font-bold" style={{ fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>
            Map Filters
          </span>
          {activeFilterCount > 0 && (
            <span
              className="px-1.5 py-0.5 rounded-full font-bold"
              style={{ fontSize: "9px", background: "var(--blue-600)", color: "#fff" }}
            >
              {activeFilterCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={resetAll}
              className="p-1 rounded cursor-pointer hover:bg-secondary transition-colors"
              title="Reset all filters"
            >
              <RotateCcw size={12} style={{ color: "var(--text-muted)" }} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="p-1 rounded cursor-pointer hover:bg-secondary transition-colors"
          >
            <X size={14} style={{ color: "var(--text-muted)" }} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-base">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: "var(--surface-secondary)", border: "1px solid var(--border-light)" }}>
          <Search size={12} style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search facilities..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="bg-transparent flex-1 focus:outline-none"
            style={{ fontSize: "var(--text-xs)", color: "var(--text-primary)" }}
          />
          {filters.search && (
            <button type="button" onClick={() => onFiltersChange({ ...filters, search: "" })} className="cursor-pointer">
              <X size={10} style={{ color: "var(--text-muted)" }} />
            </button>
          )}
        </div>
      </div>

      {/* Filter sections */}
      <div className="flex-1 overflow-y-auto">
        <FilterSection title="Risk Level" icon={Shield}>
          {RISK_OPTIONS.map((opt) => (
            <CheckboxItem
              key={opt.value}
              checked={filters.risk.includes(opt.value)}
              onChange={() => toggle("risk", opt.value)}
              label={opt.label}
              color={opt.color}
            />
          ))}
        </FilterSection>

        <FilterSection title="Inspection Status" icon={Radio} defaultOpen={false}>
          {INSPECTION_OPTIONS.map((opt) => (
            <CheckboxItem
              key={opt.value}
              checked={filters.inspection.includes(opt.value)}
              onChange={() => toggle("inspection", opt.value)}
              label={opt.label}
            />
          ))}
        </FilterSection>

        <FilterSection title="CCTV Status" icon={Camera}>
          {CCTV_OPTIONS.map((opt) => (
            <CheckboxItem
              key={opt.value}
              checked={filters.cctv.includes(opt.value)}
              onChange={() => toggle("cctv", opt.value)}
              label={opt.label}
              color={opt.color}
            />
          ))}
        </FilterSection>

        <FilterSection title="Organization Type" icon={Building2} defaultOpen={false}>
          {ORG_OPTIONS.map((opt) => (
            <CheckboxItem
              key={opt.value}
              checked={filters.organization.includes(opt.value)}
              onChange={() => toggle("organization", opt.value)}
              label={opt.label}
            />
          ))}
        </FilterSection>

        <FilterSection title="District" icon={MapPin} defaultOpen={false}>
          {DISTRICT_OPTIONS.map((d) => (
            <CheckboxItem
              key={d}
              checked={filters.district.includes(d)}
              onChange={() => toggle("district", d)}
              label={d}
            />
          ))}
        </FilterSection>
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-base flex items-center justify-between">
        <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
          Showing {filteredCount} of {totalCount} sites
        </span>
        <button
          type="button"
          onClick={resetAll}
          className="font-semibold cursor-pointer"
          style={{ fontSize: "10px", color: "var(--blue-600)" }}
        >
          Reset
        </button>
      </div>
    </div>
  </>
  );
}
