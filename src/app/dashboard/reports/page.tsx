"use client";

import { useState } from "react";
import { BarChart3, Download, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import { generateMinistryDossierPDF } from "@/lib/reports/pdf-generator";

export default function ReportsPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  async function triggerExport(format: "pdf" | "csv") {
    setIsExporting(true);
    setExportSuccess(null);
    if (format === "pdf") {
      await generateMinistryDossierPDF({ title: "National Compliance & Intelligence Report" });
      setIsExporting(false);
      setExportSuccess(`DoSJE_Executive_Dossier_${new Date().toISOString().slice(0, 10)}.pdf`);
      setTimeout(() => setExportSuccess(null), 4000);
      return;
    }

    setTimeout(() => {
      setIsExporting(false);
      setExportSuccess(`DoSJE_Report_${new Date().toISOString().slice(0, 10)}.csv`);
      setTimeout(() => setExportSuccess(null), 4000);
    }, 800);
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 size={16} style={{ color: "var(--blue-500)" }} />
            <h1 className="text-lg md:text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              Reports & Analytics
            </h1>
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Intelligence reports for Ministry review and PMU audit
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => triggerExport("csv")}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors"
            style={{
              borderColor: "var(--border-light)",
              background: "var(--surface-card)",
              color: "var(--text-primary)",
            }}
          >
            <FileSpreadsheet size={13} style={{ color: "var(--green-500)" }} />
            CSV
          </button>
          <button
            type="button"
            onClick={() => triggerExport("pdf")}
            disabled={isExporting}
            className="btn-primary flex items-center gap-1.5 text-xs"
          >
            <Download size={13} />
            PDF
          </button>
        </div>
      </div>

      {exportSuccess && (
        <div
          className="flex items-center gap-2 p-3 rounded-xl text-xs font-medium animate-in"
          style={{
            background: "var(--color-success-bg)",
            color: "var(--green-600)",
            border: "1px solid var(--color-success-border)",
          }}
        >
          <CheckCircle2 size={14} />
          Generated {exportSuccess}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "INSPECTION RATE", value: "92.6%", delta: "+4.1%", deltaColor: "var(--green-500)", width: "92.6%", desc: "87 of 94 inspections closed" },
          { label: "ATTENDANCE INTEGRITY", value: "98.1%", delta: "AI Verified", deltaColor: "var(--blue-500)", width: "98.1%", desc: "1.9% avg deviation" },
          { label: "SURPRISE EFFICACY", value: "100%", delta: "Zero Leakage", deltaColor: "var(--green-500)", width: "100%", desc: "Zero advance notification" },
        ].map((s) => (
          <div key={s.label} className="card p-4 space-y-3">
            <span className="section-label">{s.label}</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                {s.value}
              </span>
              <span className="text-xs font-medium" style={{ color: s.deltaColor }}>{s.delta}</span>
            </div>
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-tertiary)" }}>
              <div className="h-full rounded-full" style={{ width: s.width, background: s.deltaColor }} />
            </div>
            <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{s.desc}</p>
          </div>
        ))}
      </div>

      {/* District Table */}
      <div className="card p-4 md:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            Jurisdiction Performance
          </h2>
          <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>Q3 FY2026-27</span>
        </div>
        <div className="overflow-x-auto -mx-4 md:-mx-5 px-4 md:px-5">
          <table className="w-full text-left text-xs min-w-[640px]">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                {["District", "State", "Projects", "CCTV Uptime", "Health", "Anomalies", "Grade"].map((h) => (
                  <th key={h} className="py-3 px-3 text-[11px] font-extrabold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { district: "Guntur", state: "Andhra Pradesh", projects: 8, cctv: "94.2%", health: "88/100", anomalies: 1, grade: "A+" },
                { district: "Warangal", state: "Telangana", projects: 6, cctv: "89.0%", health: "74/100", anomalies: 2, grade: "B+" },
                { district: "Pune", state: "Maharashtra", projects: 9, cctv: "97.5%", health: "92/100", anomalies: 0, grade: "A++" },
                { district: "Bengaluru", state: "Karnataka", projects: 7, cctv: "82.1%", health: "68/100", anomalies: 3, grade: "B" },
                { district: "Lucknow", state: "Uttar Pradesh", projects: 11, cctv: "91.4%", health: "84/100", anomalies: 1, grade: "A" },
              ].map((r) => (
                <tr key={r.district} style={{ borderBottom: "1px solid var(--border-light)" }}>
                  <td className="py-2.5 px-3 font-semibold" style={{ color: "var(--text-primary)" }}>{r.district}</td>
                  <td className="py-2.5 px-3 font-medium" style={{ color: "var(--text-secondary)" }}>{r.state}</td>
                  <td className="py-2.5 px-3 tabular-nums" style={{ color: "var(--text-primary)" }}>{r.projects}</td>
                  <td className="py-2.5 px-3 tabular-nums" style={{ color: "var(--text-primary)" }}>{r.cctv}</td>
                  <td className="py-2.5 px-3 tabular-nums font-semibold" style={{ color: "var(--text-primary)" }}>{r.health}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className="status-pill"
                      style={{
                        background: r.anomalies > 0 ? "var(--color-warning-bg)" : "var(--color-success-bg)",
                        color: r.anomalies > 0 ? "var(--amber-600)" : "var(--green-600)",
                      }}
                    >
                      {r.anomalies}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-bold" style={{ color: "var(--blue-500)" }}>{r.grade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
