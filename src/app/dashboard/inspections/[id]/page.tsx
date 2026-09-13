"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Shield,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Camera,
  Download,
  Printer,
  ArrowLeft,
  Calendar,
  User,
  Hash,
  Activity,
  Brain,
  Clock,
  ExternalLink,
} from "lucide-react";
import { generateMinistryDossierPDF } from "@/lib/reports/pdf-generator";

export default function DigitalInspectionReportPage() {
  const params = useParams();
  const rawId = params?.id;
  const inspectionId = (Array.isArray(rawId) ? rawId[0] : rawId) || "INSP-0089";

  // Mock report data matching Pillar 10 specifications
  const report = {
    id: inspectionId,
    type: "Surprise Inspection",
    status: "Completed & Sealed",
    date: "2026-08-24",
    time: "14:31:00 to 14:46:12 IST",
    project: {
      id: "INS-2041",
      name: "Asha Rehabilitation Centre",
      organization: "Asha Welfare Foundation",
      address: "Survey No. 42, Guntur Rural, Andhra Pradesh — 522002",
      scheme: "DoSJE Scheme for Divyangjan Empowerment & Rehabilitation",
      incharge: "Dr. K. S. Rao",
      phone: "+91 94401 23456",
    },
    officer: {
      name: "Officer R. Kumar",
      employeeId: "PMU-AP-0014",
      designation: "Senior PMU Field Verification Officer",
      department: "DoSJE State PMU Cell, Andhra Pradesh",
    },
    gpsVerification: {
      latitude: 16.3067,
      longitude: 80.4365,
      geofenceRadius: "100 meters",
      recordedDistance: "38 meters from registered geofence centroid",
      accuracy: "±4.2m (Dual-band GNSS)",
      isVerified: true,
      timestamp: "2026-08-24T14:34:18 IST",
    },
    attendance: {
      registered: 95,
      expected: 80,
      reportedInRegister: 74,
      physicallyObserved: 51,
      difference: 23,
      variancePercent: 31.1,
      isAnomaly: true,
      anomalyNotes: "Reported 74 on register; only 51 beneficiaries present during head count. 23 unaccounted for.",
    },
    checklist: [
      { q: "Is the facility operational during prescribed scheme hours?", a: "Yes", compliant: true },
      { q: "Are all registered beneficiaries accounted for?", a: "Partial", compliant: false },
      { q: "Is physical attendance register maintained and signed daily?", a: "Yes", compliant: true },
      { q: "Are CCTV surveillance cameras online and recording to DVR?", a: "Yes", compliant: true },
      { q: "Are certified therapists and special educators present on duty?", a: "Yes", compliant: true },
      { q: "Is mandated assistive equipment in good functional condition?", a: "Yes", compliant: true },
      { q: "Are sanitation and wheelchair accessibility standards satisfied?", a: "Yes", compliant: true },
      { q: "Is grievance redressal registry and emergency poster displayed?", a: "Yes", compliant: true },
    ],
    evidence: [
      {
        id: "EV-20491",
        title: "Morning Attendance Register Physical Count",
        type: "Photo",
        hash: "8f4b52c79a9e3d81b24e6501a2d718b560195e26c6d231940989fba7541b2c45",
        timestamp: "14:37:12 IST",
        coords: "16.3067°N, 80.4365°E",
        url: "https://images.unsplash.com/photo-1584467735815-f778f274e296?w=500&auto=format&fit=crop&q=80",
      },
      {
        id: "EV-20492",
        title: "Classroom Beneficiary Head Count Verification",
        type: "Photo",
        hash: "3a7c91e4f2081d59ba2e6501a2d718b560195e26c6d231940989fba7541e98d1",
        timestamp: "14:39:45 IST",
        coords: "16.3067°N, 80.4365°E",
        url: "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=500&auto=format&fit=crop&q=80",
      },
      {
        id: "EV-20493",
        title: "Therapy Center Equipment & Ramps Assessment",
        type: "Photo",
        hash: "5b1c82d4e7019f22ac3e6501a2d718b560195e26c6d231940989fba7541a1209",
        timestamp: "14:41:02 IST",
        coords: "16.3067°N, 80.4365°E",
        url: "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=700&auto=format&fit=crop&q=80",
      },
    ],
    aiAssessment: {
      signal: "Attendance Discrepancy (31% Variance)",
      confidence: 89,
      recommendation: "Verification recommended: Issue formal clarification notice to NGO regarding absent beneficiaries.",
      ruleBasis: "Discrepancy exceeds permissible variance threshold of 20% under DoSJE Monitoring Framework §4.2.",
    },
    auditTrail: [
      { time: "14:31:00", event: "Surprise Inspection assigned via Random-Risk Engine" },
      { time: "14:34:02", event: "Inspector arrived at facility perimeter" },
      { time: "14:34:18", event: "GPS geofence cryptographically verified (drift: 38m)" },
      { time: "14:37:12", event: "Evidence #EV-20491 captured & SHA-256 hashed" },
      { time: "14:40:55", event: "Attendance counts submitted: 74 reported vs 51 observed" },
      { time: "14:41:30", event: "AI anomaly signal generated (Variance: 31%)" },
      { time: "14:45:10", event: "Officer digitally signed inspection declaration" },
      { time: "14:46:12", event: "Digital report sealed and committed to DoSJE master ledger" },
    ],
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between no-print">
        <Link
          href="/dashboard/inspections"
          className="flex items-center gap-1.5 text-xs text-muted hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-2 py-1"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Back to Inspections
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-base bg-card text-xs font-semibold hover:bg-secondary transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Printer size={13} aria-hidden="true" />
            Print Report
          </button>
          <button
            type="button"
            onClick={() => generateMinistryDossierPDF({ projectId: report.project.id, title: `Certified Inspection Dossier ${report.id}`, generatedBy: report.officer.name, role: report.officer.designation })}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-opacity focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer shadow-sm"
          >
            <Download size={13} aria-hidden="true" />
            Export Certified Dossier
          </button>
        </div>
      </div>

      {/* Main Digital Report Document */}
      <div className="card p-8 space-y-8 bg-card border-base shadow-sm">
        {/* Document Header with Government Emblem Style */}
        <div className="border-b border-base pb-6 flex items-start justify-between">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-muted uppercase block">
              Government of India · Department of Social Justice & Empowerment
            </span>
            <h1 className="text-xl font-bold text-primary mt-1">Official Digital Inspection Record</h1>
            <p className="text-xs text-muted mt-1 font-mono">
              Report Ref: <span className="font-semibold text-primary">{report.id}</span> · Type: {report.type}
            </p>
          </div>
          <div className="text-right">
            <span
              className="status-pill font-mono text-[11px] block"
              style={{
                background: "var(--color-success-bg)",
                color: "var(--color-success)",
                border: "1px solid var(--color-success-border)",
                display: "inline-flex",
              }}
            >
              ✓ {report.status.toUpperCase()}
            </span>
            <span className="text-[11px] text-muted font-mono block mt-1">
              Inspection Date: {report.date}
            </span>
          </div>
        </div>

        {/* Section 1 & 2: Facility & Officer Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-4 bg-secondary space-y-2">
            <span className="section-label">1. FACILITY INSPECTED</span>
            <div className="text-sm font-bold text-primary">{report.project.name}</div>
            <p className="text-xs text-muted">{report.project.address}</p>
            <div className="pt-2 text-xs space-y-1">
              <div><span className="text-muted">Scheme:</span> <span className="text-primary font-medium">{report.project.scheme}</span></div>
              <div><span className="text-muted">Incharge:</span> <span className="text-primary font-medium">{report.project.incharge} ({report.project.phone})</span></div>
            </div>
          </div>

          <div className="card p-4 bg-secondary space-y-2">
            <span className="section-label">2. VERIFYING OFFICER</span>
            <div className="text-sm font-bold text-primary">{report.officer.name}</div>
            <p className="text-xs text-muted font-mono">ID: {report.officer.employeeId}</p>
            <div className="pt-2 text-xs space-y-1">
              <div><span className="text-muted">Designation:</span> <span className="text-primary font-medium">{report.officer.designation}</span></div>
              <div><span className="text-muted">Jurisdiction:</span> <span className="text-primary font-medium">{report.officer.department}</span></div>
            </div>
          </div>
        </div>

        {/* Section 3: GPS Geofence Verification */}
        <div className="card p-4 space-y-2 border-l-4 border-l-green-base">
          <div className="flex items-center justify-between">
            <span className="section-label">3. GPS LOCATION & GEOFENCE TELEMETRY</span>
            <span className="status-pill bg-green-tint text-green-strong text-[10px]">
              <CheckCircle size={11} aria-hidden="true" />
              LOCATION CONFIRMED ON-SITE
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-1">
            <div>
              <span className="text-muted block text-[11px]">COORDINATES</span>
              <span className="font-mono font-semibold text-primary">{report.gpsVerification.latitude}°N, {report.gpsVerification.longitude}°E</span>
            </div>
            <div>
              <span className="text-muted block text-[11px]">GNSS ACCURACY</span>
              <span className="font-mono font-semibold text-primary">{report.gpsVerification.accuracy}</span>
            </div>
            <div>
              <span className="text-muted block text-[11px]">GEOFENCE OFFSET</span>
              <span className="font-mono font-semibold text-green-strong">{report.gpsVerification.recordedDistance}</span>
            </div>
            <div>
              <span className="text-muted block text-[11px]">VERIFIED AT</span>
              <span className="font-mono text-primary">{report.gpsVerification.timestamp}</span>
            </div>
          </div>
        </div>

        {/* Section 4: Attendance Discrepancy Analytics */}
        <div className="card p-4 space-y-3 border-l-4 border-l-amber-base">
          <div className="flex items-center justify-between">
            <span className="section-label">4. PHYSICAL VS. REPORTED ATTENDANCE ANALYTICS</span>
            <span className="status-pill bg-amber-tint text-amber-strong text-[10px]">
              <AlertTriangle size={11} aria-hidden="true" />
              31.1% VARIANCE FLAGGED
            </span>
          </div>

          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-secondary rounded-lg">
              <span className="text-muted text-[10px] uppercase font-semibold">Enrolled</span>
              <p className="text-xl font-bold tabular text-primary">{report.attendance.registered}</p>
            </div>
            <div className="p-3 bg-secondary rounded-lg">
              <span className="text-muted text-[10px] uppercase font-semibold">Reported</span>
              <p className="text-xl font-bold tabular text-primary">{report.attendance.reportedInRegister}</p>
            </div>
            <div className="p-3 bg-secondary rounded-lg">
              <span className="text-muted text-[10px] uppercase font-semibold">Observed Count</span>
              <p className="text-xl font-bold tabular text-blue-base">{report.attendance.physicallyObserved}</p>
            </div>
            <div className="p-3 bg-amber-tint rounded-lg">
              <span className="text-amber-strong text-[10px] uppercase font-semibold">Discrepancy</span>
              <p className="text-xl font-bold tabular text-amber-strong">-{report.attendance.difference}</p>
            </div>
          </div>

          <p className="text-xs text-amber-strong bg-amber-tint/50 p-2.5 rounded border border-amber-base/30 leading-tight">
            <strong>Inspector Note:</strong> {report.attendance.anomalyNotes}
          </p>
        </div>

        {/* Section 5: Standardized Checklist Breakdown */}
        <div className="space-y-3">
          <span className="section-label">5. STANDARDIZED INSPECTION CHECKLIST (10-POINT CRITERIA)</span>
          <div className="divide-y divide-base border border-base rounded-lg overflow-hidden text-xs">
            {report.checklist.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-card hover:bg-secondary/40">
                <span className="text-primary font-medium">{item.q}</span>
                <span
                  className={`status-pill font-mono text-[10px] ${
                    item.compliant ? "bg-green-tint text-green-strong" : "bg-amber-tint text-amber-strong"
                  }`}
                >
                  {item.a.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 6: Tamper-Evident Media Evidence */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="section-label">6. CRYPTOGRAPHICALLY HASHED EVIDENCE ({report.evidence.length})</span>
            <span className="text-[11px] text-muted font-mono">SHA-256 Verified at Capture</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {report.evidence.map((item) => (
              <div key={item.id} className="card overflow-hidden border-base">
                <div className="relative aspect-video bg-neutral-900">
                  <img src={item.url} alt={item.title} className="w-full h-full object-cover opacity-90" />
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/75 text-white font-mono text-[9px]">
                    {item.id}
                  </span>
                </div>
                <div className="p-2.5 space-y-1 text-xs">
                  <p className="font-semibold text-primary text-[11px] truncate">{item.title}</p>
                  <p className="text-[9px] font-mono text-muted break-all">Hash: {item.hash.slice(0, 24)}…</p>
                  <p className="text-[10px] text-muted flex items-center justify-between pt-1">
                    <span>{item.coords}</span>
                    <span>{item.timestamp}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 7: AI Signal & Administrative Decision Recommendation */}
        <div className="card p-4 space-y-2 bg-purple-tint/40 border-purple-base/30">
          <div className="flex items-center gap-2">
            <Brain size={16} className="text-purple-base" aria-hidden="true" />
            <span className="text-xs font-bold text-purple-text">7. AI ASSISTANCE & STATISTICAL ASSESSMENT</span>
            <span className="status-pill bg-purple-tint text-purple-strong text-[10px] ml-auto">
              Confidence: {report.aiAssessment.confidence}%
            </span>
          </div>
          <p className="text-xs text-primary leading-relaxed">
            <strong>Rule Trigger:</strong> {report.aiAssessment.ruleBasis}
          </p>
          <div className="p-2.5 bg-card rounded border border-purple-base/20 text-xs">
            <span className="text-muted block text-[10px] uppercase font-semibold">Administrative Recommendation:</span>
            <span className="text-purple-text font-semibold">{report.aiAssessment.recommendation}</span>
          </div>
          <p className="text-[10px] text-muted italic">
            Note: AI signal is advisory under DoSJE governance guidelines. Administrative decisions are made exclusively by authorized ministry officials.
          </p>
        </div>

        {/* Section 8: Audit Timeline */}
        <div className="space-y-3">
          <span className="section-label">8. COMPLETE AUDIT TIMELINE (&quot;WHO DID WHAT AND WHEN&quot;)</span>
          <div className="card p-4 space-y-2 bg-secondary text-xs">
            {report.auditTrail.map((event, idx) => (
              <div key={idx} className="flex items-center gap-3 py-1">
                <span className="font-mono text-muted text-[11px] w-20">{event.time}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-base" />
                <span className="text-primary">{event.event}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Official Digital Seal & Signatures */}
        <div className="pt-6 border-t border-base flex items-end justify-between">
          <div className="space-y-1">
            <div
              className="w-24 h-24 rounded-xl flex flex-col items-center justify-center text-center p-2 text-[10px] font-mono"
              style={{
                border: "2px solid var(--color-success-border)",
                background: "var(--color-success-bg)",
                color: "var(--color-success)",
              }}
            >
              <Shield size={24} className="mb-1" aria-hidden="true" style={{ color: "var(--color-success)" }} />
              <span>DIGITALLY SEALED</span>
              <span style={{ color: "var(--text-muted)" }}>DoSJE PMU</span>
            </div>
            <p className="text-[9px] font-mono text-muted mt-1">Certificate SHA: 9f81a7b8e40182c1...</p>
          </div>

          <div className="text-right space-y-1 text-xs">
            <p className="font-semibold text-primary">{report.officer.name}</p>
            <p className="text-muted text-[11px]">{report.officer.designation}</p>
            <p className="text-muted text-[10px] font-mono">Digitally Signed at {report.date} 14:45:10 IST</p>
          </div>
        </div>
      </div>
    </div>
  );
}
