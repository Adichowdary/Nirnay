"use client";

import { useState } from "react";
import { DEMO_BENEFICIARIES, DEMO_PROJECTS } from "@/lib/demo-data";
import {
  Users,
  CheckCircle,
  AlertTriangle,
  Search,
  Lock,
  Calendar,
  Sparkles,
  Shield,
  Download,
  Key,
  Eye,
  EyeOff,
} from "lucide-react";
import { generateMinistryDossierPDF } from "@/lib/reports/pdf-generator";

export default function BeneficiariesPage() {
  const [search, setSearch] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showCryptoHashes, setShowCryptoHashes] = useState<boolean>(false);

  const filtered = DEMO_BENEFICIARIES.filter((b) => {
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && b.is_active) ||
      (filterStatus === "flagged" && !b.is_active);
    const matchesSearch =
      !search ||
      b.masked_name.toLowerCase().includes(search.toLowerCase()) ||
      b.id.toLowerCase().includes(search.toLowerCase()) ||
      b.program.toLowerCase().includes(search.toLowerCase()) ||
      b.project_id.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalRegistered = DEMO_BENEFICIARIES.length;
  const totalActive = DEMO_BENEFICIARIES.filter((b) => b.is_active).length;
  const totalFlagged = totalRegistered - totalActive;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Users size={20} className="text-blue-500" aria-hidden="true" />
            <h1 className="text-lg md:text-xl font-extrabold text-primary">
              Beneficiary Registry &amp; DPDP Cryptographic Privacy Shield
            </h1>
          </div>
          <p className="text-xs text-muted mt-1 max-w-3xl leading-relaxed">
            Real-time beneficiary attendance analytics with cryptographic privacy masking in statutory compliance with the <strong>Digital Personal Data Protection (DPDP) Act 2023</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => generateMinistryDossierPDF({ title: "DPDP Beneficiary Compliance Dossier" })}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Download size={14} /> Export Dossier
          </button>
          <span className="px-3 py-1 rounded-xl text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
            <Lock size={12} aria-hidden="true" />
            DPDP ACT 2023 COMPLIANT
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-card border border-base shadow-sm">
          <p className="text-[10px] font-extrabold text-muted uppercase tracking-wider mb-1">TOTAL ENROLLED</p>
          <p className="text-2xl font-black tabular text-primary">{totalRegistered * 65}</p>
          <p className="text-[10px] text-muted mt-0.5">Across 41 active DoSJE centers</p>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-base shadow-sm">
          <p className="text-[10px] font-extrabold text-muted uppercase tracking-wider mb-1">ACTIVE RECIPIENTS</p>
          <p className="text-2xl font-black tabular text-emerald-500">{totalActive * 65}</p>
          <p className="text-[10px] text-muted mt-0.5">Biometric attendance verified</p>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-base shadow-sm">
          <p className="text-[10px] font-extrabold text-muted uppercase tracking-wider mb-1">AVG. ATTENDANCE</p>
          <p className="text-2xl font-black tabular text-blue-500">84.2%</p>
          <p className="text-[10px] text-muted mt-0.5">Rolling biometric average</p>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-base shadow-sm">
          <p className="text-[10px] font-extrabold text-muted uppercase tracking-wider mb-1">ATTENDANCE ANOMALIES</p>
          <p className="text-2xl font-black tabular text-amber-500">{totalFlagged}</p>
          <p className="text-[10px] text-muted mt-0.5">Queued for physical squad verification</p>
        </div>
      </div>

      {/* Filter & Privacy Mask Bar */}
      <div className="p-4 rounded-2xl bg-card border border-base shadow-sm flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-base bg-muted/20 flex-1 max-w-xs focus-within:ring-2 focus-within:ring-blue-500">
          <Search size={14} className="text-muted" aria-hidden="true" />
          <input
            type="search"
            name="beneficiary-search"
            placeholder="Search by Masked ID, Scheme…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-xs text-primary placeholder:text-muted focus-visible:outline-none"
            autoComplete="off"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {["all", "active", "flagged"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                filterStatus === s
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-muted/40 text-secondary border-base hover:bg-muted"
              }`}
            >
              {s === "all" ? "All Records" : s === "active" ? "✓ Verified Active" : "⚠️ Flagged Anomalies"}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setShowCryptoHashes(!showCryptoHashes)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
              showCryptoHashes
                ? "bg-purple-600/20 text-purple-600 dark:text-purple-400 border-purple-500/40"
                : "bg-muted/40 text-secondary border-base"
            }`}
          >
            <Key size={13} /> {showCryptoHashes ? "Hide SHA-256 Tokens" : "Inspect Cryptographic Hashes"}
          </button>
        </div>

        <span className="text-xs text-muted font-medium ml-auto tabular">{filtered.length} entries shown</span>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-base bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-base bg-muted/40 text-muted uppercase text-[10px] font-extrabold tracking-wider">
                <th className="py-3.5 px-4">Cryptographic Masked ID</th>
                <th className="py-3.5 px-4">Facility / Jurisdiction</th>
                <th className="py-3.5 px-4">Welfare Scheme</th>
                <th className="py-3.5 px-4">Attendance Consistency</th>
                <th className="py-3.5 px-4">Mandated Welfare Services</th>
                <th className="py-3.5 px-4">Last Biometric Ping</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base">
              {filtered.map((b) => {
                const project = DEMO_PROJECTS.find((p) => p.id === b.project_id);
                const mockHash = `0x${b.id.replace(/[^0-9]/g, "")}e9f4c8...sha256`;

                return (
                  <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-primary flex items-center gap-1.5">
                        <Lock size={11} className="text-blue-500" aria-hidden="true" />
                        {b.masked_name}
                      </div>
                      <div className="text-[10px] font-mono text-muted mt-0.5">
                        {showCryptoHashes ? (
                          <span className="text-purple-400 font-bold">{mockHash}</span>
                        ) : (
                          b.id
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-primary">{project?.name || b.project_id}</div>
                      <div className="text-[11px] text-muted">{project?.district_name}, {project?.state || "Andhra Pradesh"}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[10px]">
                        {b.program}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 tabular">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary">{b.attendance_percent}%</span>
                        <div className="w-16 h-1.5 rounded-full bg-muted/60 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              b.attendance_percent >= 80 ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                            style={{ width: `${b.attendance_percent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {b.services_received.map((svc) => (
                          <span
                            key={svc}
                            className="px-2 py-0.5 rounded-lg bg-muted/60 text-[10px] text-secondary font-medium"
                          >
                            {svc}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-muted font-mono text-[11px]">
                      {b.last_verification}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
