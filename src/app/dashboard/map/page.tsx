"use client";

import dynamic from "next/dynamic";
import { useState, useMemo, useEffect } from "react";
import { DEMO_PROJECTS } from "@/lib/demo-data";
import { MapFilterPanel, type MapFilters } from "@/components/map/MapFilterPanel";
import { MapLayerControl, type MapLayers } from "@/components/map/MapLayerControl";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import {
  MapPin,
  Layers,
  Navigation,
  Activity,
  Camera,
  ExternalLink,
  CheckCircle,
  Shield,
  Clock,
  ChevronRight,
  Wifi,
  WifiOff,
  PanelRightClose,
  PanelRightOpen,
  X,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const MapPanel = dynamic(
  () => import("@/components/map/MapPanel").then((m) => ({ default: m.MapPanel })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--surface-bg)" }}>
        <div className="text-center">
          <div className="skeleton w-12 h-12 rounded-full mx-auto mb-3" />
          <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>Loading Map Intelligence GIS Engine…</p>
        </div>
      </div>
    ),
  }
);

const DEFAULT_FILTERS: MapFilters = {
  risk: [],
  inspection: [],
  cctv: [],
  organization: [],
  district: [],
  search: "",
};

const DEFAULT_LAYERS: MapLayers = {
  projects: true,
  risk: true,
  inspectors: true,
  cctv: true,
  geofence: false,
};

function getRiskTier(score: number): string {
  if (score >= 80) return "CRITICAL";
  if (score >= 60) return "HIGH";
  if (score >= 35) return "MEDIUM";
  return "LOW";
}

function getRiskTierColor(score: number): string {
  if (score >= 80) return "var(--red-600)";
  if (score >= 60) return "var(--orange-600)";
  if (score >= 35) return "var(--amber-600)";
  return "var(--green-600)";
}

function applyFilters(projects: typeof DEMO_PROJECTS, filters: MapFilters) {
  return projects.filter((p) => {
    if (filters.risk.length > 0) {
      const tier = getRiskTier(p.ai_risk_score).toLowerCase();
      if (!filters.risk.includes(tier)) return false;
    }

    if (filters.cctv.length > 0) {
      const online = p.cctv_online > 0;
      if (filters.cctv.includes("online") && !online) return false;
      if (filters.cctv.includes("offline") && online) return false;
    }

    if (filters.organization.length > 0) {
      const orgType = p.organization_name ?? "";
      const matches = filters.organization.some((t) => orgType.toLowerCase().includes(t.replace("_", " ")));
      if (!matches) return false;
    }

    if (filters.district.length > 0) {
      if (!filters.district.includes(p.district_name)) return false;
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      const match =
        p.name.toLowerCase().includes(q) ||
        p.district_name.toLowerCase().includes(q) ||
        p.state.toLowerCase().includes(q) ||
        p.organization_name.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });
}

export default function MapIntelligencePage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [filters, setFilters] = useState<MapFilters>(DEFAULT_FILTERS);
  const [layers, setLayers] = useState<MapLayers>(DEFAULT_LAYERS);
  const [projects, setProjects] = useState<typeof DEMO_PROJECTS>(DEMO_PROJECTS);
  const [dataSource, setDataSource] = useState<"demo" | "api">("demo");

  // Fetch from API once on mount, fall back to demo data
  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/map")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success && data.data?.facilities?.length > 0) {
          const mapped = data.data.facilities.map((f: Record<string, unknown>) => {
            const proj = f.project as Record<string, unknown> | undefined;
            return {
              id: f.id as string,
              name: (f.name as string) ?? "Unknown",
              organization_id: "",
              organization_name: (proj?.organization as Record<string, unknown>)?.name as string ?? "",
              district_id: "",
              district_name: (proj?.district as string) ?? "",
              state: (proj?.state as string) ?? "",
              scheme_id: "",
              scheme_name: "",
              status: (proj?.status as string) ?? "active",
              location: {
                latitude: f.latitude as number,
                longitude: f.longitude as number,
                address: (f.address as string) ?? "",
                geofence_radius_meters: (f.geofence_radius as number) ?? 200,
              },
              health: { overall: 0, compliance: 0, attendance: 0, inspection: 0, evidence: 0, reporting: 0, cctv: 0 },
              ai_risk_score: (proj?.ai_risk_score as number) ?? 0,
              registered_beneficiaries: 0,
              expected_attendance: 0,
              cctv_total: 0,
              cctv_online: 0,
              last_inspection_date: undefined,
              last_inspection_id: undefined,
              next_inspection_due: undefined,
              incharge_name: "",
              incharge_phone: "",
              created_at: "",
              updated_at: "",
            };
          });
          setProjects(mapped);
          setDataSource("api");
        }
      })
      .catch(() => {
        // Keep demo data on failure
      });
    return () => { cancelled = true; };
  }, []);

  const filteredProjects = useMemo(() => applyFilters(projects, filters), [projects, filters]);
  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  // Summary stats
  const stats = useMemo(() => {
    const critical = projects.filter((p) => p.ai_risk_score >= 80).length;
    const high = projects.filter((p) => p.ai_risk_score >= 60 && p.ai_risk_score < 80).length;
    const cctvOffline = projects.filter((p) => p.cctv_online < p.cctv_total).length;
    return { critical, high, cctvOffline };
  }, [projects]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      setIsSidebarOpen(true);
    }
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: "var(--surface-bg)" }}>
      {/* Top Bar */}
      <header
        className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 flex-shrink-0 z-20"
        style={{ background: "var(--surface-card)", borderBottom: "1px solid var(--border-light)" }}
      >
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Layers size={16} style={{ color: "var(--blue-600)" }} />
            <h1 className="font-bold text-xs sm:text-sm" style={{ color: "var(--text-primary)" }}>
              <span className="sm:inline hidden">Map Intelligence &amp; </span>GIS Command
            </h1>
          </div>
          <span
            className="px-2 py-0.5 rounded-full font-semibold text-[10px]"
            style={{ background: "var(--blue-50)", color: "var(--blue-600)", border: "1px solid var(--blue-200)" }}
          >
            {filteredProjects.length} SITES
          </span>
          {dataSource === "api" && (
            <span
              className="px-2 py-0.5 rounded-full font-semibold text-[10px]"
              style={{ background: "var(--green-50)", color: "var(--green-600)", border: "1px solid var(--green-200)" }}
            >
              LIVE
            </span>
          )}
          {stats.critical > 0 && (
            <span
              className="px-1.5 py-0.5 rounded-full font-bold text-[9px] sm:text-[10px]"
              style={{ background: "var(--red-50)", color: "var(--red-600)", border: "1px solid var(--red-200)" }}
            >
              {stats.critical} CRITICAL
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Stats (Desktop) */}
          <div className="hidden lg:flex items-center gap-3 mr-3">
            <div className="flex items-center gap-1" style={{ fontSize: "10px", color: "var(--text-muted)" }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--green-600)" }} />
              {projects.length - stats.critical - stats.high} OK
            </div>
            <div className="flex items-center gap-1" style={{ fontSize: "10px", color: "var(--text-muted)" }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--orange-600)" }} />
              {stats.high} High
            </div>
            <div className="flex items-center gap-1" style={{ fontSize: "10px", color: "var(--text-muted)" }}>
              <WifiOff size={10} style={{ color: "var(--red-600)" }} />
              {stats.cctvOffline} CCTV Off
            </div>
          </div>

          {/* Mobile Segmented Switcher */}
          <div className="flex items-center rounded-xl p-0.5 lg:hidden bg-secondary border border-base">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                !isSidebarOpen ? "bg-blue-600 text-white shadow-sm" : "text-secondary hover:text-primary"
              )}
            >
              Map
            </button>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                isSidebarOpen ? "bg-blue-600 text-white shadow-sm" : "text-secondary hover:text-primary"
              )}
            >
              Sites ({filteredProjects.length})
            </button>
          </div>

          {/* Desktop Drawer Toggle */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            style={{
              background: "var(--surface-secondary)",
              border: "1px solid var(--border-light)",
              color: "var(--text-secondary)",
            }}
            title={isSidebarOpen ? "Collapse Facility Drawer (Expand Map)" : "Show Facility Drawer"}
          >
            {isSidebarOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
            <span>{isSidebarOpen ? "Hide Facilities" : "Show Facilities"}</span>
          </button>
        </div>
      </header>

      {/* Main Map + Sidebar */}
      <div className="flex-1 relative overflow-hidden flex">
        {/* Map Area */}
        <div className="flex-1 h-full relative">
          <ErrorBoundary componentName="Map Intelligence GIS">
            <MapPanel
            onProjectClick={(id) => {
              setSelectedProjectId(id);
              if (typeof window !== "undefined" && window.innerWidth >= 1024) {
                setIsSidebarOpen(true);
              }
            }}
            projects={projects}
            filteredProjectIds={filteredProjects.map((p) => p.id)}
            layers={layers}
            onLayersChange={setLayers}
            filters={filters}
            onFiltersChange={setFilters}
            totalCount={projects.length}
            filteredCount={filteredProjects.length}
          />
          </ErrorBoundary>
        </div>

        {/* Mobile Backdrop when drawer is open on mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Right Drawer (Desktop side panel, Mobile slide-over sheet) */}
        <div
          className={cn(
            "flex flex-col h-full z-40 shadow-2xl transition-all duration-300 overflow-hidden",
            "fixed inset-y-0 right-0 w-[85vw] max-w-[360px] lg:static lg:w-[340px] lg:border-l",
            isSidebarOpen ? "translate-x-0 opacity-100" : "translate-x-full lg:translate-x-0 opacity-0 lg:w-0"
          )}
          style={{
            background: "var(--surface-card)",
            borderColor: isSidebarOpen ? "var(--border-light)" : "transparent",
            pointerEvents: isSidebarOpen ? "auto" : "none",
          }}
        >
          {selectedProject ? (
            /* Selected Facility Detail */
            <div className="flex flex-col h-full overflow-y-auto w-[340px]">
              {/* Header */}
              <div className="p-4 border-b flex items-start justify-between" style={{ borderColor: "var(--border-light)" }}>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold" style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.05em" }}>
                    FACILITY DETAILS
                  </span>
                  <h2 className="font-bold mt-0.5 truncate" style={{ fontSize: "var(--text-base)", color: "var(--text-primary)" }}>
                    {selectedProject.name}
                  </h2>
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                    {selectedProject.district_name}, {selectedProject.state}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProjectId(null);
                    if (typeof window !== "undefined" && window.innerWidth < 1024) {
                      setIsSidebarOpen(false);
                    }
                  }}
                  className="p-1.5 rounded-lg cursor-pointer transition-colors hover:bg-secondary"
                  style={{ color: "var(--text-muted)" }}
                  aria-label="Close facility details"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-4 space-y-4 flex-1">
                {/* Status + Risk Cards */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl" style={{ background: "var(--surface-secondary)", border: "1px solid var(--border-light)" }}>
                    <p style={{ fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.05em", marginBottom: 4 }}>STATUS</p>
                    <span className="font-bold uppercase" style={{ fontSize: "var(--text-xs)", color: getRiskTierColor(selectedProject.ai_risk_score) }}>
                      {selectedProject.status}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: "var(--surface-secondary)", border: "1px solid var(--border-light)" }}>
                    <p style={{ fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.05em", marginBottom: 4 }}>AI RISK</p>
                    <div className="flex items-center gap-2">
                      <span className="font-bold tabular" style={{ fontSize: "var(--text-base)", color: getRiskTierColor(selectedProject.ai_risk_score) }}>
                        {selectedProject.ai_risk_score}
                      </span>
                      <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>/100</span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border-light)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${selectedProject.ai_risk_score}%`,
                          background: getRiskTierColor(selectedProject.ai_risk_score),
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* GPS Coordinates */}
                <div className="p-3 rounded-xl" style={{ background: "var(--surface-secondary)", border: "1px solid var(--border-light)" }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Navigation size={13} style={{ color: "var(--blue-600)" }} />
                    <span className="font-semibold" style={{ fontSize: "var(--text-xs)", color: "var(--text-primary)" }}>
                      GPS Coordinates
                    </span>
                  </div>
                  <p className="font-mono" style={{ fontSize: "10px", color: "var(--text-muted)", background: "var(--surface-bg)", padding: "6px 8px", borderRadius: 6 }}>
                    {selectedProject.location.latitude.toFixed(4)}° N, {selectedProject.location.longitude.toFixed(4)}° E
                  </p>
                  <div className="flex items-center gap-1.5 mt-2" style={{ fontSize: "10px", color: "var(--green-600)" }}>
                    <CheckCircle size={11} />
                    Geofence: {selectedProject.location.geofence_radius_meters}m radius
                  </div>
                </div>

                {/* Metrics */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: "var(--surface-secondary)" }}>
                    <div className="flex items-center gap-1.5">
                      <Camera size={12} style={{ color: selectedProject.cctv_online === selectedProject.cctv_total ? "var(--green-600)" : "var(--red-600)" }} />
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>CCTV Feeds</span>
                    </div>
                    <span className="font-bold tabular" style={{ fontSize: "var(--text-xs)", color: "var(--text-primary)" }}>
                      {selectedProject.cctv_online}/{selectedProject.cctv_total}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: "var(--surface-secondary)" }}>
                    <div className="flex items-center gap-1.5">
                      <Activity size={12} style={{ color: "var(--blue-600)" }} />
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>Beneficiaries</span>
                    </div>
                    <span className="font-bold tabular" style={{ fontSize: "var(--text-xs)", color: "var(--text-primary)" }}>
                      {selectedProject.registered_beneficiaries}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: "var(--surface-secondary)" }}>
                    <div className="flex items-center gap-1.5">
                      <Shield size={12} style={{ color: "var(--green-600)" }} />
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>Health Index</span>
                    </div>
                    <span className="font-bold tabular" style={{ fontSize: "var(--text-xs)", color: "var(--text-primary)" }}>
                      {selectedProject.health.overall}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: "var(--surface-secondary)" }}>
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} style={{ color: "var(--text-muted)" }} />
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>Last Inspection</span>
                    </div>
                    <span className="font-semibold" style={{ fontSize: "10px", color: "var(--text-primary)" }}>
                      {selectedProject.last_inspection_date
                        ? new Date(selectedProject.last_inspection_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                        : "Never"}
                    </span>
                  </div>
                </div>

                {/* Risk Breakdown */}
                <div className="p-3 rounded-xl" style={{ background: "var(--surface-secondary)", border: "1px solid var(--border-light)" }}>
                  <p style={{ fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.05em", marginBottom: 8 }}>RISK BREAKDOWN</p>
                  <div className="space-y-2">
                    {[
                      { label: "Compliance", value: selectedProject.health.compliance },
                      { label: "Attendance", value: selectedProject.health.attendance },
                      { label: "Inspection", value: selectedProject.health.inspection },
                      { label: "CCTV", value: selectedProject.health.cctv },
                      { label: "Evidence", value: selectedProject.health.evidence },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center gap-2">
                        <span style={{ fontSize: "10px", color: "var(--text-muted)", width: 70 }}>{label}</span>
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border-light)" }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${value}%`,
                              background: value >= 80 ? "var(--green-600)" : value >= 60 ? "var(--amber-600)" : "var(--red-600)",
                            }}
                          />
                        </div>
                        <span className="font-mono tabular" style={{ fontSize: "9px", color: "var(--text-muted)", width: 24, textAlign: "right" }}>
                          {value}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2">
                  <Link
                    href={`/dashboard/projects/${selectedProject.id}`}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold transition-opacity hover:opacity-90"
                    style={{ background: "var(--blue-600)", color: "#fff", fontSize: "var(--text-xs)" }}
                  >
                    Open Project Dashboard
                    <ExternalLink size={12} />
                  </Link>
                  <Link
                    href={`/dashboard/inspections/assign?project=${selectedProject.id}`}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium transition-colors"
                    style={{ border: "1px solid var(--border-light)", color: "var(--text-secondary)", fontSize: "var(--text-xs)" }}
                  >
                    Dispatch Surprise Inspection
                    <ChevronRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            /* Facility List */
            <div className="flex flex-col h-full w-[340px]">
              <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: "var(--border-light)" }}>
                <span className="font-semibold" style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.05em" }}>
                  FACILITIES ({filteredProjects.length})
                </span>
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-secondary cursor-pointer"
                  aria-label="Close facilities drawer"
                >
                  <X size={15} />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 p-2 space-y-1">
                {filteredProjects.length === 0 && (
                  <div className="text-center py-8">
                    <MapPin size={24} className="mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
                    <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                      No facilities match the current filters
                    </p>
                  </div>
                )}
                {filteredProjects.map((p) => {
                  const risk = getRiskTier(p.ai_risk_score);
                  const riskColor = getRiskTierColor(p.ai_risk_score);
                  const camsOnline = p.cctv_online;
                  const camsTotal = p.cctv_total;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedProjectId(p.id)}
                      className="w-full text-left p-3 rounded-xl transition-all cursor-pointer"
                      style={{
                        border: "1px solid transparent",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--surface-secondary)";
                        e.currentTarget.style.borderColor = "var(--border-light)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.borderColor = "transparent";
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate" style={{ fontSize: "var(--text-xs)", color: "var(--text-primary)" }}>
                            {p.name}
                          </p>
                          <p style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                            {p.district_name}, {p.state}
                          </p>
                        </div>
                        <span
                          className="px-1.5 py-0.5 rounded font-bold tabular flex-shrink-0"
                          style={{ fontSize: "9px", background: `${riskColor}15`, color: riskColor, border: `1px solid ${riskColor}30` }}
                        >
                          {risk}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>
                          Risk: {p.ai_risk_score}/100
                        </span>
                        <span className="flex items-center gap-0.5" style={{ fontSize: "9px", color: camsOnline === camsTotal ? "var(--green-600)" : "var(--red-600)" }}>
                          {camsOnline === camsTotal ? <Wifi size={8} /> : <WifiOff size={8} />}
                          {camsOnline}/{camsTotal}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Floating Facility Quick Card (when a pin is tapped on mobile and drawer is not open) */}
      {selectedProject && !isSidebarOpen && (
        <div className="lg:hidden fixed bottom-20 inset-x-3 z-45 animate-in slide-in-from-bottom duration-200">
          <div
            className="rounded-2xl p-3.5 shadow-2xl border flex flex-col gap-2 backdrop-blur-md"
            style={{
              background: "var(--surface-card)",
              borderColor: "var(--border-light)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <span
                    className="px-2 py-0.5 rounded-md font-bold text-[10px] tabular uppercase"
                    style={{
                      background: `${getRiskTierColor(selectedProject.ai_risk_score)}18`,
                      color: getRiskTierColor(selectedProject.ai_risk_score),
                      border: `1px solid ${getRiskTierColor(selectedProject.ai_risk_score)}40`,
                    }}
                  >
                    {getRiskTier(selectedProject.ai_risk_score)} RISK ({selectedProject.ai_risk_score}/100)
                  </span>
                  <span className="text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>
                    {selectedProject.cctv_online}/{selectedProject.cctv_total} CCTV Online
                  </span>
                </div>
                <h3 className="font-bold text-sm truncate" style={{ color: "var(--text-primary)" }}>
                  {selectedProject.name}
                </h3>
                <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                  {selectedProject.district_name}, {selectedProject.state}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProjectId(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-secondary cursor-pointer"
                aria-label="Close facility card"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="flex-1 py-2 px-3 rounded-xl font-bold text-xs bg-blue-600 text-white text-center hover:bg-blue-700 transition cursor-pointer shadow-md"
              >
                Full Facility Dossier
              </button>
              <Link
                href={`/dashboard/projects/${selectedProject.id}`}
                className="py-2 px-3 rounded-xl font-semibold text-xs border border-base text-secondary hover:text-primary text-center transition bg-secondary"
              >
                Open Project
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
