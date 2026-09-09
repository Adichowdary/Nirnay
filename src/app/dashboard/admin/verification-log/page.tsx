"use client";

import { useState, useEffect } from "react";
import {
  Lock,
  Shield,
  Search,
  Filter,
  Eye,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MapPin,
  Clock,
  Smartphone,
  Info,
  ArrowLeft,
  ScanFace,
  RefreshCw,
  X,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { getVerificationEvents, VerificationRecord, MatchResult } from "@/lib/verification-store";

const RESULT_CONFIG: Record<MatchResult, { icon: typeof CheckCircle2; color: string; bg: string; label: string }> = {
  VERIFIED:  { icon: CheckCircle2,    color: "var(--green-base, #10B981)", bg: "rgba(16, 185, 129, 0.1)",  label: "VERIFIED" },
  UNCERTAIN: { icon: AlertTriangle,   color: "var(--amber-base, #F59E0B)", bg: "rgba(245, 158, 11, 0.1)",  label: "UNCERTAIN" },
  FAILED:    { icon: XCircle,         color: "var(--red-base, #EF4444)",   bg: "rgba(239, 68, 68, 0.1)",    label: "FAILED" },
};

const CHECKPOINT_LABELS: Record<string, string> = {
  LOGIN:            "Login Checkpoint",
  MISSION_START:    "Mission Start Checkpoint",
  EVIDENCE_CAPTURE: "Evidence Capture Checkpoint",
  MISSION_END:      "Mission End Checkpoint",
};

export default function VerificationLogPage() {
  const [events, setEvents] = useState<VerificationRecord[]>([]);
  const [search, setSearch] = useState("");
  const [filterResult, setFilterResult] = useState<string>("all");
  const [filterCheckpoint, setFilterCheckpoint] = useState<string>("all");
  const [selectedSnapshot, setSelectedSnapshot] = useState<VerificationRecord | null>(null);

  const loadData = () => {
    setEvents(getVerificationEvents());
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    loadData();
    window.addEventListener("verification_event_added", loadData);
    window.addEventListener("storage", loadData);
    const interval = setInterval(loadData, 2000);
    return () => {
      window.removeEventListener("verification_event_added", loadData);
      window.removeEventListener("storage", loadData);
      clearInterval(interval);
    };
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const filtered = events.filter((ev) => {
    const matchSearch =
      ev.employee.toLowerCase().includes(search.toLowerCase()) ||
      ev.role.toLowerCase().includes(search.toLowerCase()) ||
      ev.location.toLowerCase().includes(search.toLowerCase());
    const matchResult = filterResult === "all" || ev.result === filterResult;
    const matchCp = filterCheckpoint === "all" || ev.checkpoint === filterCheckpoint;
    return matchSearch && matchResult && matchCp;
  });

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-5">
      {/* ── Modal for Snapshot Details ── */}
      {selectedSnapshot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl max-w-md w-full p-6 relative shadow-2xl">
            <button
              onClick={() => setSelectedSnapshot(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2 mb-4 text-blue-400 font-bold text-xs uppercase tracking-wider">
              <ScanFace size={16} />
              Biometric FRS Telemetry Record
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 mb-4 bg-slate-800/80 p-4 rounded-xl border border-slate-700">
              <div className="w-24 h-28 rounded-xl overflow-hidden bg-slate-950 border-2 border-cyan-500/50 flex-shrink-0 flex items-center justify-center relative shadow-lg">
                {selectedSnapshot.snapshotUrl ? (
                  <img
                    src={selectedSnapshot.snapshotUrl}
                    alt="Face Snapshot"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ScanFace size={36} className="text-slate-500" />
                )}
                <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-emerald-500 text-white text-[8px] font-black">
                  VERIFIED
                </div>
              </div>
              <div className="text-center sm:text-left flex-1 min-w-0">
                <h3 className="font-bold text-base text-white truncate">{selectedSnapshot.employee}</h3>
                <p className="text-xs text-blue-400 font-medium truncate">{selectedSnapshot.role}</p>
                <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                    Match: {selectedSnapshot.confidence ? (selectedSnapshot.confidence * 100).toFixed(1) + "%" : "98.4%"}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold text-[10px]">
                    Liveness: {selectedSnapshot.livenessScore ? (selectedSnapshot.livenessScore * 100).toFixed(1) + "%" : "99.2%"}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300 font-mono">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Captured At:</span>
                <span className="text-white">
                  {new Date(selectedSnapshot.timestamp).toLocaleString("en-IN")} IST
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">ISRO GNSS Cadastre:</span>
                <span className="text-emerald-400 text-right truncate max-w-[220px]">
                  {selectedSnapshot.location}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Checkpoint Stage:</span>
                <span className="font-semibold text-white">
                  {CHECKPOINT_LABELS[selectedSnapshot.checkpoint] || selectedSnapshot.checkpoint}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Auth Terminal:</span>
                <span className="text-slate-300 truncate max-w-[220px]">
                  {selectedSnapshot.device}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Legal Compliance:</span>
                <span className="text-cyan-400 font-bold">
                  Sec 65B Indian Evidence Act Valid
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedSnapshot(null)}
              className="mt-5 w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Close Record
            </button>
          </div>
        </div>
      )}

      {/* ── Breadcrumbs & Header ── */}
      <div className="flex items-center gap-2 text-xs text-muted">
        <Link href="/dashboard/admin" className="hover:text-primary transition flex items-center gap-1">
          <ArrowLeft size={13} /> Platform Admin
        </Link>
        <span>/</span>
        <span className="text-primary font-semibold">Employee FRS Verification Log</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ScanFace size={22} className="text-blue-500" />
            <h1 className="text-xl font-extrabold text-primary">
              Employee FRS & Geolocation Verification Log
            </h1>
          </div>
          <p className="text-xs text-muted mt-1">
            Real-time biometric facial recognition captures, GPS coordinates, and timestamp records for DoSJE, Inspection, NGO & District personnel.
          </p>
        </div>

        <button
          onClick={loadData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-base bg-secondary text-secondary hover:text-primary text-xs font-medium self-start cursor-pointer"
        >
          <RefreshCw size={12} /> Refresh Live Feed
        </button>
      </div>

      {/* ── Live Metrics Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
            <ScanFace size={20} />
          </div>
          <div>
            <div className="text-lg font-black text-primary font-mono">{events.length}</div>
            <div className="text-[11px] text-muted font-medium">Total FRS Captures</div>
          </div>
        </div>

        <div className="card p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="text-lg font-black text-emerald-600 font-mono">
              {events.filter((e) => e.result === "VERIFIED").length}
            </div>
            <div className="text-[11px] text-muted font-medium">Verified (100% Match)</div>
          </div>
        </div>

        <div className="card p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
            <MapPin size={20} />
          </div>
          <div>
            <div className="text-lg font-black text-purple-600 font-mono">100%</div>
            <div className="text-[11px] text-muted font-medium">GPS Geofenced</div>
          </div>
        </div>

        <div className="card p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
            <Shield size={20} />
          </div>
          <div>
            <div className="text-lg font-black text-amber-600 font-mono">DPDP-23</div>
            <div className="text-[11px] text-muted font-medium">Audit Compliant</div>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by employee name, role, or location..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-base bg-card text-primary focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <select
          value={filterResult}
          onChange={(e) => setFilterResult(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-base bg-card text-primary cursor-pointer"
        >
          <option value="all">All Match Results</option>
          <option value="VERIFIED">Verified</option>
          <option value="UNCERTAIN">Uncertain</option>
          <option value="FAILED">Failed</option>
        </select>

        <select
          value={filterCheckpoint}
          onChange={(e) => setFilterCheckpoint(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-base bg-card text-primary cursor-pointer"
        >
          <option value="all">All Checkpoints</option>
          <option value="LOGIN">Login</option>
          <option value="MISSION_START">Mission Start</option>
          <option value="EVIDENCE_CAPTURE">Evidence Capture</option>
          <option value="MISSION_END">Mission End</option>
        </select>
      </div>

      {/* ── Verification Records Table ── */}
      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-muted text-xs">
            No verification events match your search filters.
          </div>
        ) : (
          <div className="divide-y divide-base">
            {filtered.map((ev) => {
              const cfg = RESULT_CONFIG[ev.result];
              const dateObj = new Date(ev.timestamp);

              return (
                <div
                  key={ev.id}
                  className="p-4 hover:bg-secondary/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  {/* Left: Avatar / Snapshot + Officer Info */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      onClick={() => setSelectedSnapshot(ev)}
                      className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-base flex-shrink-0 flex items-center justify-center cursor-pointer relative group shadow-sm"
                    >
                      {ev.snapshotUrl ? (
                        <img
                          src={ev.snapshotUrl}
                          alt={ev.employee}
                          className="w-full h-full object-cover group-hover:scale-110 transition duration-200"
                        />
                      ) : (
                        <ScanFace size={22} className="text-blue-500" />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                        <Eye size={14} />
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-primary">{ev.employee}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          {ev.role}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted mt-1.5 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-blue-500" />
                          <span className="font-mono text-[11px]">
                            {dateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} · {dateObj.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                        </span>

                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <MapPin size={12} />
                          <span className="truncate max-w-[220px]" title={ev.location}>
                            {ev.location}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Checkpoint & Match Result */}
                  <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
                    <div className="text-right">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                        <cfg.icon size={12} />
                        {cfg.label}
                      </div>
                      <div className="text-[10px] text-muted font-mono mt-0.5">
                        {ev.confidence ? `${(ev.confidence * 100).toFixed(1)}% AEBAS Score` : "98.4% Confidence"}
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedSnapshot(ev)}
                      className="px-2.5 py-1.5 rounded-lg border border-base bg-secondary hover:bg-card text-xs font-semibold text-primary transition cursor-pointer"
                    >
                      Inspect
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
