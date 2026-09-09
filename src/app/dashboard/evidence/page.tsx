"use client";

import { useState } from "react";
import { DEMO_PROJECTS } from "@/lib/demo-data";
import { formatRelativeTime } from "@/lib/utils";
import {
  FileImage,
  Shield,
  CheckCircle,
  Clock,
  MapPin,
  Camera,
  Search,
  Filter,
  FileCheck,
  Download,
  Eye,
  Hash,
  Scale,
  Award,
  X,
  Printer,
} from "lucide-react";

interface EvidenceRecord {
  id: string;
  projectId: string;
  projectName: string;
  state: string;
  district: string;
  type: "photo" | "video" | "audio" | "document";
  title: string;
  timestamp: string;
  sha256Hash: string;
  gpsCoordinates: string;
  locationName: string;
  accuracy: string;
  verifiedBy: string;
  officerDesignation: string;
  deviceId: string;
  thumbnailUrl: string;
  bsaSection63bValid: boolean;
}

const DEMO_EVIDENCE: EvidenceRecord[] = [
  {
    id: "EVD-2026-AP-0891",
    projectId: "p1",
    projectName: "Asha Rehabilitation Centre",
    state: "Andhra Pradesh",
    district: "Guntur",
    type: "photo",
    title: "Physical Attendance Register Audit & Beneficiary Count",
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    sha256Hash: "8f4b52c79a9e3d81b24e6501a2d718b560195e26c6d231940989fba7541b2c45",
    gpsCoordinates: "16.3067° N, 80.4365° E",
    locationName: "Brodipet, Guntur, Andhra Pradesh",
    accuracy: "±4.2m",
    verifiedBy: "Priya Mehta",
    officerDesignation: "PMU Field Inspection Officer (Class I)",
    deviceId: "NIC-TAB-AP-4402",
    thumbnailUrl: "https://images.unsplash.com/photo-1584467735815-f778f274e296?w=700&auto=format&fit=crop&q=80",
    bsaSection63bValid: true,
  },
  {
    id: "EVD-2026-RJ-0892",
    projectId: "p6",
    projectName: "Jaipur Special Welfare Institute",
    state: "Rajasthan",
    district: "Jaipur",
    type: "photo",
    title: "Classroom Biometric Punch Terminal & Infrastructure Verification",
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    sha256Hash: "3a7c91e4f2081d59ba2e6501a2d718b560195e26c6d231940989fba7541e98d1",
    gpsCoordinates: "26.9124° N, 75.7873° E",
    locationName: "Civil Lines, Jaipur, Rajasthan",
    accuracy: "±3.8m",
    verifiedBy: "Rajesh Kumar Sharma",
    officerDesignation: "Central Command Inspector",
    deviceId: "NIC-TAB-RJ-9912",
    thumbnailUrl: "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=700&auto=format&fit=crop&q=80",
    bsaSection63bValid: true,
  },
  {
    id: "EVD-2026-MH-0893",
    projectId: "p3",
    projectName: "Sahyog Institute of Inclusion",
    state: "Maharashtra",
    district: "Pune",
    type: "video",
    title: "Surprise CCTV Angle Alignment & DVR Tamper Feed Lock",
    timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
    sha256Hash: "5b1c82d4e7019f22ac3e6501a2d718b560195e26c6d231940989fba7541a1209",
    gpsCoordinates: "18.5204° N, 73.8567° E",
    locationName: "Kothrud, Pune, Maharashtra",
    accuracy: "±5.1m",
    verifiedBy: "K. Ramesh Babu",
    officerDesignation: "State Administration Officer",
    deviceId: "NIC-CAM-MH-1120",
    thumbnailUrl: "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=700&auto=format&fit=crop&q=80",
    bsaSection63bValid: true,
  },
  {
    id: "EVD-2026-TG-0894",
    projectId: "p2",
    projectName: "Pragati Skill Foundation",
    state: "Telangana",
    district: "Warangal",
    type: "document",
    title: "DoSJE Scheme Grant Utilization Certificate & Stamp Duty Seal",
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    sha256Hash: "9e2d31f4a5018b77cc4e6501a2d718b560195e26c6d231940989fba7541f5581",
    gpsCoordinates: "17.9784° N, 79.5941° E",
    locationName: "Hanamkonda, Warangal, Telangana",
    accuracy: "±2.9m",
    verifiedBy: "Anjali Verma",
    officerDesignation: "State Audit Officer",
    deviceId: "NIC-DOC-TG-7731",
    thumbnailUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=700&auto=format&fit=crop&q=80",
    bsaSection63bValid: true,
  },
];

export default function EvidencePage() {
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceRecord | null>(DEMO_EVIDENCE[0]);
  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  const filtered = DEMO_EVIDENCE.filter((e) => {
    const matchType = filterType === "all" || e.type === filterType;
    const matchSearch =
      !search ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.projectName.toLowerCase().includes(search.toLowerCase()) ||
      e.id.toLowerCase().includes(search.toLowerCase()) ||
      e.state.toLowerCase().includes(search.toLowerCase()) ||
      e.district.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header with BSA 2023 Legal Compliance Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Scale size={24} className="text-blue-600" />
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Legal Evidence Vault &amp; Chain-of-Custody (BSA 2023)
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Compliant with Bharatiya Sakshya Adhiniyam 2023 (Section 63B / 65B) • Encrypted SHA-256 Geotagged Records
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1.5 shadow-sm">
            <Shield size={14} /> BSA 2023 §63B COURT ADMISSIBLE
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-1 max-w-xs focus-within:ring-2 focus-within:ring-blue-500 shadow-sm">
          <Search size={14} className="text-slate-400" />
          <input
            type="search"
            name="evidence-search"
            placeholder="Search by Evidence ID, project, state, district..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
            autoComplete="off"
          />
        </div>

        {["all", "photo", "video", "document"].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setFilterType(t)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
              filterType === t
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
            }`}
          >
            {t === "all" ? "All Legal Evidence" : t.toUpperCase()}
          </button>
        ))}

        <span className="text-xs font-mono font-bold text-slate-500 ml-auto">
          {filtered.length} Section 63B Certified Records
        </span>
      </div>

      {/* Main Grid: Gallery + Forensic Verification Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedEvidence(item)}
              className={`rounded-2xl text-left overflow-hidden bg-white dark:bg-slate-900 border transition-all hover:-translate-y-1 shadow-sm ${
                selectedEvidence?.id === item.id
                  ? "border-blue-600 ring-2 ring-blue-600/30"
                  : "border-slate-200 dark:border-slate-800"
              }`}
            >
              {/* Thumbnail */}
              <div className="relative h-44 bg-slate-950 overflow-hidden">
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  className="w-full h-full object-cover opacity-90 transition-transform duration-500 hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-[10px] font-mono text-white border border-white/20">
                  <Camera size={11} />
                  {item.type.toUpperCase()}
                </div>
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[9px] font-mono font-bold shadow-md">
                  BSA §63B VALID
                </div>
                <div className="absolute bottom-2 left-2 right-2 p-2 rounded-xl bg-slate-950/85 backdrop-blur-md text-[10px] text-white font-mono leading-tight border border-white/10">
                  <div className="text-slate-300 truncate">SHA-256: {item.sha256Hash.slice(0, 20)}…</div>
                  <div className="text-emerald-400 font-bold">{item.locationName}</div>
                </div>
              </div>

              {/* Card Meta */}
              <div className="p-4 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span className="font-bold text-blue-600">{item.id}</span>
                  <span suppressHydrationWarning>{formatRelativeTime(item.timestamp)}</span>
                </div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white line-clamp-1">{item.title}</h3>
                <p className="text-[11px] text-slate-500 truncate">{item.projectName} • {item.district}, {item.state}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Forensic Verification Drawer */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 h-fit">
          {selectedEvidence ? (
            <>
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20 uppercase tracking-wider block w-fit mb-1.5">
                  INDIAN LAW ADMISSIBILITY AUDIT
                </span>
                <h2 className="text-sm font-black text-slate-900 dark:text-white">{selectedEvidence.title}</h2>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">{selectedEvidence.id}</p>
              </div>

              {/* Cryptographic SHA-256 Hash */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Hash size={14} className="text-blue-600" /> SHA-256 Digital Seal
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/20">
                    VERIFIED MATCH
                  </span>
                </div>
                <p className="text-[10px] font-mono text-slate-600 dark:text-slate-400 break-all bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                  {selectedEvidence.sha256Hash}
                </p>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Calculated at capture time via hardware security enclave. Prevents post-inspection alteration under BSA 2023.
                </p>
              </div>

              {/* Telemetry Breakdown */}
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">GPS Location Geotag</span>
                  <p className="text-xs font-mono text-slate-900 dark:text-white font-bold mt-0.5 flex items-center gap-1">
                    <MapPin size={13} className="text-rose-500" /> {selectedEvidence.locationName} ({selectedEvidence.accuracy})
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Authorized Officer</span>
                  <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">{selectedEvidence.verifiedBy}</p>
                  <p className="text-[10px] text-slate-500">{selectedEvidence.officerDesignation}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Capture Timestamp (IST)</span>
                  <p className="text-xs font-mono text-slate-900 dark:text-white font-bold mt-0.5">
                    {new Date(selectedEvidence.timestamp).toLocaleString("en-IN")} IST
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <button
                  onClick={() => setShowCertificateModal(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold hover:opacity-95 transition shadow-md"
                >
                  <Award size={14} /> Generate §63B Certificate (BSA 2023)
                </button>

                <a
                  href={selectedEvidence.thumbnailUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <Eye size={14} /> Inspect High-Res Evidence Image
                </a>
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-500 text-center py-10">Select an evidence item to view legal forensics.</p>
          )}
        </div>
      </div>

      {/* Section 63B BSA 2023 Certificate Modal */}
      {showCertificateModal && selectedEvidence && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-3xl max-w-xl w-full p-6 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCertificateModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X size={18} />
            </button>

            {/* Certificate Header */}
            <div className="text-center border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex justify-center mb-2">
                <Scale size={32} className="text-blue-600" />
              </div>
              <h2 className="text-base font-black uppercase tracking-wider">
                GOVERNMENT OF INDIA • MINISTRY OF SOCIAL JUSTICE &amp; EMPOWERMENT
              </h2>
              <p className="text-xs font-mono text-blue-600 font-bold mt-1">
                Admissibility Certificate under Section 63B of Bharatiya Sakshya Adhiniyam, 2023
              </p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                (Corresponding to Section 65B of Indian Evidence Act, 1872)
              </p>
            </div>

            {/* Body Text */}
            <div className="space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
              <p>
                I, <strong className="text-slate-900 dark:text-white">{selectedEvidence.verifiedBy}</strong>, holding designation of{" "}
                <strong className="text-slate-900 dark:text-white">{selectedEvidence.officerDesignation}</strong>, hereby certify under Section 63B of Bharatiya Sakshya Adhiniyam, 2023 that:
              </p>

              <ol className="list-decimal pl-4 space-y-1.5 text-[11px]">
                <li>
                  The electronic record identified as <strong>{selectedEvidence.id}</strong> (SHA-256: <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">{selectedEvidence.sha256Hash.slice(0, 16)}...</code>) was captured on device <strong>{selectedEvidence.deviceId}</strong>.
                </li>
                <li>
                  The electronic device was operating under lawful command during regular inspection duties at <strong>{selectedEvidence.locationName}</strong>.
                </li>
                <li>
                  The hardware geotag accuracy was recorded at <strong>{selectedEvidence.accuracy}</strong> at timestamp <strong>{new Date(selectedEvidence.timestamp).toLocaleString("en-IN")} IST</strong>.
                </li>
                <li>
                  No unauthorized modification, tampering, or digital alteration has occurred to the stored evidence.
                </li>
              </ol>
            </div>

            {/* Seal & Signature Box */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Digital Seal &amp; Authority</div>
                <div className="text-xs font-black text-emerald-600 flex items-center gap-1 mt-0.5">
                  <Award size={14} /> NIC Digital Certificate Signed
                </div>
                <div className="text-[10px] font-mono text-slate-500">Hash ID: {selectedEvidence.sha256Hash.slice(0, 24)}</div>
              </div>

              <button
                onClick={() => {
                  alert(`Official BSA Section 63B Certificate PDF generated for ${selectedEvidence.id}.`);
                  setShowCertificateModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition shadow-md flex items-center gap-1.5"
              >
                <Printer size={14} /> Print / Export PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
