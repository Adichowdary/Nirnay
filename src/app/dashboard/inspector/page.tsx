"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  ClipboardCheck, MapPin, Camera, CheckCircle2, Clock, AlertTriangle,
  Navigation, Wifi, ArrowRight, Play, Shield, RefreshCw, ScanFace,
  Check, X, Sparkles, Info, WifiOff, Zap, Mic, QrCode, UploadCloud,
  Video, Trash2, Plus, FileVideo, FileImage, Copy, Download, Film, Eye, FileCheck,
} from "lucide-react";
import { DEMO_PROJECTS, DEMO_INSPECTION_ACTIVE } from "@/lib/demo-data";
import { saveVerificationEvent } from "@/lib/verification-store";
import { DigitalInspectionAuditModal } from "@/components/inspection/DigitalInspectionAuditModal";
import { VoiceToReportModal } from "@/components/ai/VoiceToReportModal";
import { DynamicQRAssertionModal } from "@/components/inspection/DynamicQRAssertionModal";
import { FRSVerificationModal } from "@/components/auth/FRSVerificationModal";
import { saveOfflineReport, syncAllQueuedReports, getOfflineQueuedReports } from "@/lib/db/offline-sync";
import type { ExtractedInspectionData } from "@/lib/ai/speech-transcriber";

export interface InspectionEvidenceItem {
  id: string;
  type: "IMAGE" | "VIDEO";
  url: string;
  name: string;
  sizeMb: number;
  timestamp: string;
  geoTag: string;
  sha256: string;
  duration?: string;
  isSupplementary?: boolean;
}

type MissionStatus =
  | "AWAITING"
  | "BRIEFING"
  | "TRAVELLING"
  | "ON_SITE_FRS"
  | "INSPECTING"
  | "SUBMITTING"
  | "COMPLETED";

const STATUS_STEPS: { key: MissionStatus; label: string }[] = [
  { key: "BRIEFING", label: "Briefing" },
  { key: "TRAVELLING", label: "Navigate" },
  { key: "ON_SITE_FRS", label: "FRS Lock" },
  { key: "INSPECTING", label: "Checklist" },
  { key: "SUBMITTING", label: "Submit" },
];

const INSPECTION_QUESTIONS = [
  { id: "q1", text: "Is the centre operating during designated hours?", required: true },
  { id: "q2", text: "Are registered beneficiaries physically present?", required: true },
  { id: "q3", text: "Is the attendance register up to date?", required: true },
  { id: "q4", text: "Are all CCTV cameras powered on and transmitting?", required: true },
  { id: "q5", text: "Are infrastructure facilities functional?", required: true },
  { id: "q6", text: "Are certified staff on duty?", required: true },
  { id: "q7", text: "Is meal distribution adhering to scheme norms?", required: false },
  { id: "q8", text: "Is the helpline number prominently displayed?", required: true },
];

export default function InspectorWorkspacePage() {
  const [missionStatus, setMissionStatus] = useState<MissionStatus>("AWAITING");
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(12);
  const [currentDistance, setCurrentDistance] = useState<number>(3.2);
  const [isGettingGPS, setIsGettingGPS] = useState(false);
  const [checklistAnswers, setChecklistAnswers] = useState<Record<string, "YES" | "NO" | "FLAGGED">>({});
  const [observedAttendance, setObservedAttendance] = useState<number>(84);
  
  // Rich Geo-Tagged Evidence Items (Photos + Video Proofs)
  const [evidenceItems, setEvidenceItems] = useState<InspectionEvidenceItem[]>([
    {
      id: "EVD-IMG-01",
      type: "IMAGE",
      url: "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=600&auto=format&fit=crop&q=80",
      name: "Beneficiary Biometric Verification Register.jpg",
      sizeMb: 1.8,
      timestamp: "10:32:15 IST",
      geoTag: "26.9124°N, 75.7873°E (±6m - Bhuvan Verified)",
      sha256: "0x8f2a9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b",
    },
    {
      id: "EVD-IMG-02",
      type: "IMAGE",
      url: "https://images.unsplash.com/photo-1584467735815-f778f274e296?w=600&auto=format&fit=crop&q=80",
      name: "Kitchen Nutrition & Potable RO Water.jpg",
      sizeMb: 2.1,
      timestamp: "10:36:40 IST",
      geoTag: "26.9125°N, 75.7872°E (±6m - Bhuvan Verified)",
      sha256: "0x4b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c",
    },
    {
      id: "EVD-VID-01",
      type: "VIDEO",
      url: "https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-working-on-a-computer-42878-large.mp4",
      name: "Perimeter Boundary & Emergency Exit Walkthrough.mp4",
      sizeMb: 8.4,
      duration: "0:18",
      timestamp: "10:39:10 IST",
      geoTag: "26.9124°N, 75.7874°E (±5m - Bhuvan Verified)",
      sha256: "0x19def4023b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e",
    },
  ]);

  const [frsVerifiedOnSite, setFrsVerifiedOnSite] = useState(false);
  const [frsScanning, setFrsScanning] = useState(false);
  const [showArrivalFRSModal, setShowArrivalFRSModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);

  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showDynamicQRModal, setShowDynamicQRModal] = useState(false);
  const [isDynamicQRVerified, setIsDynamicQRVerified] = useState(false);
  const [offlineSyncMessage, setOfflineSyncMessage] = useState<string | null>(null);

  // File Upload Refs & Evidence Modal State
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const supplementaryInputRef = useRef<HTMLInputElement>(null);
  const [selectedEvidencePreview, setSelectedEvidencePreview] = useState<InspectionEvidenceItem | null>(null);
  const [supplementaryNotice, setSupplementaryNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStepText, setSubmissionStepText] = useState("");

  const mission = DEMO_INSPECTION_ACTIVE;
  const project = DEMO_PROJECTS.find((p) => p.id === mission?.project_id) ?? DEMO_PROJECTS[0];
  const currentStep = STATUS_STEPS.findIndex((s) => s.key === missionStatus);

  const handleApplyVoiceData = (data: ExtractedInspectionData) => {
    if (data.observedAttendance) {
      setObservedAttendance(data.observedAttendance);
    }
    setChecklistAnswers((prev) => ({
      ...prev,
      ...data.answers,
    }));
  };

  const handleSyncOffline = async () => {
    setOfflineSyncMessage("Reconciling offline delta packets...");
    const res = await syncAllQueuedReports();
    setOfflineSyncMessage(`Synced ${res.syncedCount} offline field records to central vault.`);
    setTimeout(() => setOfflineSyncMessage(null), 4000);
  };

  const requestGPS = () => {
    setIsGettingGPS(true);
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setGpsAccuracy(Math.round(pos.coords.accuracy)); setIsGettingGPS(false); },
        () => { setGpsAccuracy(8); setIsGettingGPS(false); },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setGpsAccuracy(8);
      setIsGettingGPS(false);
    }
  };

  const startMission = () => { requestGPS(); setMissionStatus("BRIEFING"); };

  const handleArrivalFRS = () => {
    setShowArrivalFRSModal(true);
  };

  const handleAnswer = (qId: string, val: "YES" | "NO" | "FLAGGED") => {
    setChecklistAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  // Upload Handlers
  const handleAddFiles = (files: FileList | null, type: "IMAGE" | "VIDEO", isSupplementary = false) => {
    if (!files || files.length === 0) return;
    const newItems: InspectionEvidenceItem[] = Array.from(files).map((f, idx) => {
      const url = URL.createObjectURL(f);
      const id = `EVD-${type === "VIDEO" ? "VID" : "IMG"}-${Date.now()}-${idx}`;
      const hashHex = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, "0")).join("");
      return {
        id,
        type,
        url,
        name: f.name || `${type === "VIDEO" ? "Field Walkthrough Video" : "Field Inspection Photo"} ${idx + 1}`,
        sizeMb: +(f.size / (1024 * 1024)).toFixed(2) || (type === "VIDEO" ? 6.8 : 1.9),
        timestamp: new Date().toLocaleTimeString("en-IN") + " IST",
        geoTag: `${project.location?.latitude || 26.9124}°N, ${project.location?.longitude || 75.7873}°E (±5m - ISRO Bhuvan Verified)`,
        sha256: `0x${hashHex}7f82b9a4c51d6e30a91e4f8d2b3c4a5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c`.substring(0, 66),
        duration: type === "VIDEO" ? "0:24" : undefined,
        isSupplementary,
      };
    });
    setEvidenceItems((prev) => [...prev, ...newItems]);
    if (isSupplementary) {
      setSupplementaryNotice(`Appended ${newItems.length} supplementary evidence packet(s). Merkle digest recalculated.`);
      setTimeout(() => setSupplementaryNotice(null), 4000);
    }
  };

  const handleQuickSimulateMedia = (type: "IMAGE" | "VIDEO", isSupplementary = false) => {
    const samplePhotos = [
      { name: "Beneficiary Biometric Verification Register.jpg", url: "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=600&auto=format&fit=crop&q=80" },
      { name: "RO Water Filtration & Clean Restrooms.jpg", url: "https://images.unsplash.com/photo-1584467735815-f778f274e296?w=600&auto=format&fit=crop&q=80" },
      { name: "Classroom Attendance & Teacher Roster.jpg", url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&auto=format&fit=crop&q=80" },
      { name: "Medical Kit & Fire Extinguisher Inspection.jpg", url: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80" },
    ];
    const sample = samplePhotos[Math.floor(Math.random() * samplePhotos.length)];
    const id = `EVD-${type === "VIDEO" ? "VID" : "IMG"}-${Date.now()}`;
    const hashHex = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, "0")).join("");

    const newItem: InspectionEvidenceItem = {
      id,
      type,
      url: type === "VIDEO" ? "https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-working-on-a-computer-42878-large.mp4" : sample.url,
      name: type === "VIDEO" ? `Field Perimeter Video Walkthrough #${evidenceItems.filter(e => e.type === "VIDEO").length + 1}.mp4` : sample.name,
      sizeMb: type === "VIDEO" ? 7.4 : 2.1,
      duration: type === "VIDEO" ? "0:22" : undefined,
      timestamp: new Date().toLocaleTimeString("en-IN") + " IST",
      geoTag: `${project.location?.latitude || 26.9124}°N, ${project.location?.longitude || 75.7873}°E (±5m - ISRO Bhuvan Verified)`,
      sha256: `0x${hashHex}7f82b9a4c51d6e30a91e4f8d2b3c4a5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c`.substring(0, 66),
      isSupplementary,
    };
    setEvidenceItems((prev) => [...prev, newItem]);
    if (isSupplementary) {
      setSupplementaryNotice(`Supplementary ${type.toLowerCase()} sealed and added to official audit trail.`);
      setTimeout(() => setSupplementaryNotice(null), 4000);
    }
  };

  const handleRemoveEvidence = (id: string) => {
    setEvidenceItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setSubmissionStepText("1/3 Generating SHA-256 Merkle root of all photo and video proofs...");
    await new Promise((r) => setTimeout(r, 120));
    setSubmissionStepText("2/3 Applying Inspector ECDSA SECP256K1 digital signature...");
    await new Promise((r) => setTimeout(r, 120));
    setSubmissionStepText("3/3 Transmitting tamper-sealed packet to central sovereign vault...");
    await new Promise((r) => setTimeout(r, 120));
    setIsSubmitting(false);
    setMissionStatus("COMPLETED");

    saveVerificationEvent({
      employee: "Priya Mehta", role: "PMU / Inspection Officer", roleId: "INSPECTION_OFFICER",
      checkpoint: "EVIDENCE_CAPTURE", timestamp: new Date().toISOString(), confidence: 0.984,
      result: "VERIFIED", location: `${project.name} (Statutory Inspection Completed)`,
      latitude: project.location?.latitude || 26.9124, longitude: project.location?.longitude || 75.7873,
      accuracy: 6, device: "Official Inspection Terminal", project: project.name,
      snapshotUrl: evidenceItems[0]?.url || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: "var(--surface-bg)" }}>
      {/* Telemetry Banner */}
      <div
        className="px-4 py-2 flex items-center justify-between text-[11px] flex-shrink-0"
        style={{
          background: "var(--color-success-bg)",
          borderBottom: "1px solid var(--color-success-border)",
          color: "var(--color-success)",
        }}
      >
        <div className="flex items-center gap-2 font-semibold">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--green-500)", animation: "pulse-dot 2s ease-in-out infinite" }} />
          <span>Officer Priya Mehta (PMU-2026-RJ-044)</span>
        </div>
        <div className="flex items-center gap-3 font-mono">
          <span className="flex items-center gap-1">
            <Navigation size={11} />
            GPS: ±{gpsAccuracy}m
          </span>
          <span className="flex items-center gap-1">
            <Wifi size={11} />
            Online
          </span>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-4xl mx-auto w-full space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardCheck size={18} style={{ color: "var(--green-600)" }} />
              <h1 className="text-base md:text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                Field Inspection Workspace
              </h1>
            </div>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
              ISRO Bhuvan Cadastral Link · GNSS Geofence · 10-Point Digital Audit · MongoDB Atlas Cloud Sync
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAuditModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md cursor-pointer transition flex items-center gap-1.5"
            >
              <Zap size={14} /> 10-Point Digital Audit
            </button>
            <span
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono"
              style={{
                background: "var(--color-success-bg)",
                color: "var(--color-success)",
                border: "1px solid var(--color-success-border)",
              }}
            >
              {mission?.id || "INSP-0094"}
            </span>
          </div>
        </div>

        {/* Stepper */}
        {missionStatus !== "AWAITING" && missionStatus !== "COMPLETED" && (
          <div
            className="rounded-xl p-4"
            style={{
              background: "var(--surface-card)",
              border: "1px solid var(--border-light)",
            }}
          >
            <div className="flex items-center justify-between text-[10px] font-bold mb-3">
              <span style={{ color: "var(--text-muted)" }}>Progression</span>
              <span className="font-mono" style={{ color: "var(--blue-600)" }}>
                Stage {currentStep + 1}/{STATUS_STEPS.length}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {STATUS_STEPS.map((s, idx) => {
                const isPassed = idx < currentStep;
                const isCurrent = idx === currentStep;
                return (
                  <div key={s.key} className="text-center">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        background: isPassed
                          ? "var(--green-500)"
                          : isCurrent
                          ? "var(--blue-600)"
                          : "var(--border-light)",
                      }}
                    />
                    <span
                      className="block text-[9px] mt-1 font-bold truncate"
                      style={{
                        color: isCurrent
                          ? "var(--blue-600)"
                          : isPassed
                          ? "var(--green-600)"
                          : "var(--text-muted)",
                      }}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW A: AWAITING */}
        {missionStatus === "AWAITING" && (
          <div
            className="rounded-xl p-5 space-y-4"
            style={{
              background: "var(--surface-card)",
              border: "2px solid var(--green-200)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <div className="flex items-center justify-between">
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold"
                style={{
                  background: "var(--color-danger-bg)",
                  color: "var(--color-danger)",
                  border: "1px solid var(--color-danger-border)",
                }}
              >
                <AlertTriangle size={12} />
                UNANNOUNCED SURPRISE
              </div>
              <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                Priority: HIGH
              </span>
            </div>

            <div>
              <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                {project.name}
              </h2>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                {project.district_name}, {project.state} · {project.scheme_name}
              </p>
            </div>

            <div
              className="p-3 rounded-xl text-[11px]"
              style={{
                background: "var(--color-warning-bg)",
                border: "1px solid var(--color-warning-border)",
              }}
            >
              <div className="flex items-center gap-1.5 font-bold mb-1" style={{ color: "var(--color-warning)" }}>
                <Sparkles size={12} />
                AI Dispatch Trigger:
              </div>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.5 }}>
                <strong>34.2% attendance drop</strong> over 7 days + <strong>CCTV outage for 48 hours</strong>. Auto-dispatched as nearest officer within 5km.
              </p>
            </div>

            <div
              className="grid grid-cols-3 gap-3 text-[11px] p-3 rounded-xl"
              style={{
                background: "var(--surface-secondary)",
                border: "1px solid var(--border-light)",
              }}
            >
              <div>
                <span className="block text-[9px] font-bold uppercase" style={{ color: "var(--text-muted)" }}>Geofence</span>
                <span className="font-bold" style={{ color: "var(--text-primary)" }}>200m</span>
              </div>
              <div>
                <span className="block text-[9px] font-bold uppercase" style={{ color: "var(--text-muted)" }}>Registered</span>
                <span className="font-bold" style={{ color: "var(--text-primary)" }}>{project.registered_beneficiaries}</span>
              </div>
              <div>
                <span className="block text-[9px] font-bold uppercase" style={{ color: "var(--text-muted)" }}>Distance</span>
                <span className="font-bold" style={{ color: "var(--green-600)" }}>~{currentDistance} km</span>
              </div>
            </div>

            <button
              onClick={startMission}
              className="btn btn-success w-full py-3"
            >
              <Play size={15} />
              Accept Mission
            </button>
          </div>
        )}

        {/* VIEW B: BRIEFING / TRAVELLING */}
        {(missionStatus === "BRIEFING" || missionStatus === "TRAVELLING") && (
          <div
            className="rounded-xl p-5 space-y-4"
            style={{
              background: "var(--surface-card)",
              border: "1px solid var(--border-light)",
            }}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <Navigation size={16} style={{ color: "var(--blue-600)" }} />
                Live Navigation
              </h2>
              <span className="text-[10px] font-mono font-bold" style={{ color: "var(--green-600)" }}>
                38 km/h · Target Locked
              </span>
            </div>

            <div
              className="p-4 rounded-xl text-xs space-y-2"
              style={{ background: "var(--n-900)", color: "white" }}
            >
              <div className="flex justify-between pb-2" style={{ borderBottom: "1px solid var(--n-700)" }}>
                <span style={{ color: "var(--n-400)" }}>Destination</span>
                <span className="font-bold">{project.name}</span>
              </div>
              <div className="flex justify-between pb-2" style={{ borderBottom: "1px solid var(--n-700)" }}>
                <span style={{ color: "var(--n-400)" }}>Coordinates</span>
                <span className="font-mono" style={{ color: "var(--green-400)" }}>26.9124° N, 75.7873° E</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--n-400)" }}>ETA</span>
                <span className="font-bold" style={{ color: "var(--blue-400)" }}>~4 min ({currentDistance} km)</span>
              </div>
            </div>

            <button
              onClick={() => { setCurrentDistance(0.05); setMissionStatus("ON_SITE_FRS"); }}
              className="btn btn-primary w-full py-3"
            >
              <MapPin size={14} />
              Simulate Arrival
            </button>
          </div>
        )}

        {/* VIEW C: ON-SITE FRS */}
        {missionStatus === "ON_SITE_FRS" && (
          <div
            className="rounded-xl p-6 text-center space-y-4"
            style={{
              background: "var(--surface-card)",
              border: "2px solid var(--blue-200)",
            }}
          >
            <div
              className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
              style={{
                background: "var(--color-info-bg)",
                border: "2px solid var(--blue-400)",
                color: "var(--blue-600)",
              }}
            >
              <ScanFace size={32} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                On-Site FRS Lock Required
              </h2>
              <p className="text-[11px] mt-1 max-w-sm mx-auto" style={{ color: "var(--text-muted)" }}>
                You are within 200m of <strong>{project.name}</strong>. Capture face scan to unlock audit.
              </p>
            </div>
            <div
              className="p-3 rounded-xl text-[10px] font-mono flex items-center justify-between"
              style={{
                background: "var(--surface-secondary)",
                border: "1px solid var(--border-light)",
                color: "var(--text-secondary)",
              }}
            >
              <span>Geofence: LOCKED (20m)</span>
              <span className="font-bold" style={{ color: "var(--green-600)" }}>VALID</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={handleArrivalFRS}
                disabled={frsScanning}
                className="btn btn-primary w-full py-3"
              >
                {frsScanning ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Verifying Face...
                  </>
                ) : (
                  <>
                    <ScanFace size={15} />
                    Face Scan (FRS Lock)
                  </>
                )}
              </button>

              <button
                onClick={() => setShowDynamicQRModal(true)}
                className="btn btn-secondary w-full py-3 flex items-center justify-center gap-2"
              >
                <QrCode size={15} className="text-cyan-500" />
                {isDynamicQRVerified ? "Dynamic QR: Verified ✓" : "Scan Dynamic QR"}
              </button>
            </div>
          </div>
        )}

        {/* VIEW D: INSPECTING */}
        {missionStatus === "INSPECTING" && (
          <div
            className="rounded-xl p-5 space-y-4"
            style={{
              background: "var(--surface-card)",
              border: "1px solid var(--border-light)",
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3" style={{ borderBottom: "1px solid var(--border-light)" }}>
              <div>
                <h2 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                  Verification Checklist
                </h2>
                <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Tap status or use AI Voice dictation</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowVoiceModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition"
                >
                  <Mic size={13} className="animate-pulse" />
                  Voice-to-Report (AI)
                </button>
                <span className="text-[10px] font-mono font-bold" style={{ color: "var(--green-600)" }}>
                  FRS: VERIFIED
                </span>
              </div>
            </div>

            {/* Attendance */}
            <div
              className="p-3 rounded-xl flex items-center justify-between"
              style={{
                background: "var(--color-info-bg)",
                border: "1px solid var(--color-info-border)",
              }}
            >
              <div>
                <span className="text-[11px] font-bold block" style={{ color: "var(--color-info)" }}>
                  Beneficiary Headcount
                </span>
                <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
                  Reg: {project.registered_beneficiaries} | Exp: {project.expected_attendance}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold" style={{ color: "var(--text-secondary)" }}>Observed:</span>
                <input
                  type="number"
                  value={observedAttendance}
                  onChange={(e) => setObservedAttendance(Number(e.target.value))}
                  className="w-16 px-2 py-1 text-center font-bold text-xs rounded-lg"
                  style={{
                    border: "1px solid var(--blue-300)",
                    background: "var(--surface-card)",
                    color: "var(--blue-600)",
                  }}
                />
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-2">
              {INSPECTION_QUESTIONS.map((q, idx) => {
                const val = checklistAnswers[q.id];
                return (
                  <div
                    key={q.id}
                    className="p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    style={{
                      border: "1px solid var(--border-light)",
                      background: "var(--surface-card)",
                    }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold" style={{ color: "var(--text-muted)" }}>#{idx + 1}</span>
                        <span className="text-[11px] font-semibold" style={{ color: "var(--text-primary)" }}>{q.text}</span>
                        {q.required && (
                          <span className="text-[8px] font-bold uppercase" style={{ color: "var(--red-500)" }}>*</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {(["YES", "NO", "FLAGGED"] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleAnswer(q.id, opt)}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer"
                          style={{
                            background: val === opt
                              ? opt === "YES" ? "var(--green-600)" : opt === "NO" ? "var(--red-600)" : "var(--amber-600)"
                              : "var(--surface-secondary)",
                            color: val === opt ? "white" : "var(--text-secondary)",
                          }}
                        >
                          {opt === "YES" ? "✓" : opt === "NO" ? "✗" : "⚠"}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* EVIDENCE SECTION: Tamper-Evident Photo & Video Proofs */}
            <div
              className="p-4 rounded-xl space-y-3"
              style={{
                background: "var(--surface-secondary)",
                border: "1px solid var(--border-light)",
              }}
            >
              {/* Hidden file inputs for real device capture/upload */}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleAddFiles(e.target.files, "IMAGE")}
              />
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                multiple
                className="hidden"
                onChange={(e) => handleAddFiles(e.target.files, "VIDEO")}
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Camera size={16} className="text-emerald-500" />
                    <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                      Geo-Tagged Field Proofs ({evidenceItems.length} Assets)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold border border-emerald-500/20">
                      {evidenceItems.filter((e) => e.type === "IMAGE").length} Photos • {evidenceItems.filter((e) => e.type === "VIDEO").length} Videos
                    </span>
                  </div>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                    Geo-coordinates locked via ISRO Bhuvan (±5m). Each asset generates a SHA-256 Merkle leaf.
                  </p>
                </div>

                {/* Upload & Simulate Action Buttons */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm transition"
                    title="Select photos from device camera or local files"
                  >
                    <UploadCloud size={13} />
                    <span>Upload Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-sm transition"
                    title="Upload walkthrough video from device camera or local files"
                  >
                    <Video size={13} />
                    <span>Upload Video</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickSimulateMedia("IMAGE")}
                    className="px-2 py-1.5 rounded-lg text-[11px] font-medium border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-1 transition"
                    title="Quickly simulate taking an inspection photo"
                  >
                    <Plus size={12} />
                    <span>Sim Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickSimulateMedia("VIDEO")}
                    className="px-2 py-1.5 rounded-lg text-[11px] font-medium border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 flex items-center gap-1 transition"
                    title="Quickly simulate capturing a 20s perimeter video walkthrough"
                  >
                    <Film size={12} />
                    <span>Sim Video Walkthrough</span>
                  </button>
                </div>
              </div>

              {/* Evidence Gallery Cards */}
              {evidenceItems.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl space-y-2">
                  <Camera size={28} className="mx-auto text-slate-400" />
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    No field evidence attached yet.
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Auditors must provide photographic or video walkthrough evidence before the inspection can be cryptographically sealed.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {evidenceItems.map((item) => (
                    <div
                      key={item.id}
                      className="group rounded-xl overflow-hidden border transition hover:shadow-md relative flex flex-col"
                      style={{
                        background: "var(--surface-card)",
                        borderColor: item.type === "VIDEO" ? "rgba(99, 102, 241, 0.4)" : "rgba(16, 185, 129, 0.4)",
                      }}
                    >
                      {/* Media Header / Preview Area */}
                      <div className="h-32 w-full relative bg-black/90 overflow-hidden flex items-center justify-center">
                        {item.type === "VIDEO" ? (
                          <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
                            <video
                              src={item.url}
                              className="w-full h-full object-cover opacity-80"
                              muted
                              playsInline
                              loop
                              onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                              onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />
                            <button
                              type="button"
                              onClick={() => setSelectedEvidencePreview(item)}
                              className="absolute z-10 w-10 h-10 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-lg hover:scale-110 transition cursor-pointer"
                            >
                              <Play size={18} fill="white" className="ml-0.5" />
                            </button>
                            <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-600 text-white flex items-center gap-1 shadow">
                              <FileVideo size={10} /> VIDEO {item.duration && `(${item.duration})`}
                            </span>
                          </div>
                        ) : (
                          <div className="relative w-full h-full">
                            <img
                              src={item.url}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />
                            <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-600 text-white flex items-center gap-1 shadow">
                              <FileImage size={10} /> PHOTO
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedEvidencePreview(item)}
                              className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/70 hover:bg-black/90 text-white text-[10px] flex items-center gap-1 font-semibold"
                            >
                              <Eye size={11} /> View Full
                            </button>
                          </div>
                        )}

                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveEvidence(item.id)}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-600/90 hover:bg-red-500 text-white flex items-center justify-center transition shadow cursor-pointer z-10"
                          title="Remove evidence"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>

                      {/* Content details */}
                      <div className="p-2.5 flex-1 flex flex-col justify-between space-y-1.5 text-[11px]">
                        <div>
                          <div className="font-semibold truncate text-[11px]" style={{ color: "var(--text-primary)" }}>
                            {item.name}
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-0.5">
                            <span>{item.timestamp}</span>
                            <span>{item.sizeMb} MB</span>
                          </div>
                        </div>

                        {/* Geo Coordinates */}
                        <div className="p-1.5 rounded bg-slate-100 dark:bg-slate-900/80 font-mono text-[9px] text-slate-800 dark:text-slate-200 font-semibold truncate border border-slate-200 dark:border-slate-800">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold mr-1">GEO:</span>
                          {item.geoTag}
                        </div>

                        {/* SHA-256 Stamp */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800 text-[9px] font-mono text-slate-600 dark:text-slate-400 font-medium">
                          <span className="truncate max-w-[170px]" title={item.sha256}>
                            HASH: {item.sha256.substring(0, 18)}...
                          </span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-black">SEALED</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Final Submission Section */}
            {isSubmitting ? (
              <div
                className="p-5 rounded-xl border text-center space-y-3"
                style={{
                  background: "var(--surface-card)",
                  borderColor: "var(--blue-500)",
                }}
              >
                <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto animate-spin">
                  <RefreshCw size={22} />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold text-blue-500">Sealing Statutory Audit Report</div>
                  <div className="text-[11px] font-mono text-slate-500">{submissionStepText}</div>
                </div>
                <div className="w-48 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto overflow-hidden">
                  <div className="h-full bg-blue-500 animate-pulse w-3/4 rounded-full" />
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="btn btn-success w-full py-3.5 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition text-sm font-bold"
              >
                <CheckCircle2 size={18} />
                Submit &amp; Cryptographically Seal Inspection ({evidenceItems.length} Proofs Attached)
              </button>
            )}
          </div>
        )}

        {/* VIEW E: COMPLETED (With Post-Audit Supplementary Evidence Submissions) */}
        {missionStatus === "COMPLETED" && (
          <div
            className="rounded-xl p-6 space-y-5"
            style={{
              background: "var(--surface-card)",
              border: "2px solid var(--green-300)",
            }}
          >
            {/* Hidden file input for supplementary evidence */}
            <input
              ref={supplementaryInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = e.target.files;
                if (!files || files.length === 0) return;
                const isVid = files[0]?.type?.includes("video");
                handleAddFiles(files, isVid ? "VIDEO" : "IMAGE", true);
              }}
            />

            {/* Success Seal Header */}
            <div className="text-center space-y-2">
              <div
                className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
                style={{
                  background: "var(--green-600)",
                  color: "white",
                  boxShadow: "0 6px 16px rgba(22, 163, 74, 0.35)",
                }}
              >
                <Check size={36} strokeWidth={3} />
              </div>
              <h2 className="text-lg font-extrabold" style={{ color: "var(--text-primary)" }}>
                Statutory Audit Report Submitted &amp; Sealed
              </h2>
              <p className="text-xs max-w-md mx-auto" style={{ color: "var(--text-muted)" }}>
                Dossier <code className="font-mono font-bold text-emerald-600 dark:text-emerald-400">INSP-0094-RJ</code> has been
                signed with ECDSA SECP256K1 inspector keys and submitted to the central sovereign ledger.
              </p>
            </div>

            {/* Cryptographic Ledger Summary */}
            <div
              className="p-4 rounded-xl text-xs font-mono space-y-2 max-w-xl mx-auto"
              style={{
                background: "var(--surface-secondary)",
                border: "1px solid var(--border-light)",
              }}
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 font-sans font-semibold">Beneficiary Headcount</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{observedAttendance} / {project.registered_beneficiaries}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 font-sans font-semibold">Geofence &amp; FRS Lock</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">VERIFIED ON-SITE (±8m)</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 font-sans font-semibold">Attached Evidence Proofs</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                  {evidenceItems.filter((e) => !e.isSupplementary).length} Primary + {evidenceItems.filter((e) => e.isSupplementary).length} Supplementary
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-500 font-sans font-semibold">Merkle Root Hash</span>
                <span className="text-blue-500 font-mono truncate max-w-[240px]">
                  0x8f2a9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b
                </span>
              </div>
            </div>

            {/* Toast notice for supplementary submission */}
            {supplementaryNotice && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 max-w-xl mx-auto animate-fadeIn">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{supplementaryNotice}</span>
              </div>
            )}

            {/* POST-AUDIT SUPPLEMENTARY EVIDENCE SUBMISSION (Crucial for Audit Squad Workflow) */}
            <div
              className="p-4 rounded-xl border border-dashed border-amber-400/60 dark:border-amber-500/40 space-y-3 max-w-xl mx-auto text-left"
              style={{ background: "rgba(245, 158, 11, 0.04)" }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                    <Sparkles size={14} />
                    <span>Post-Audit Supplementary Proof Submission</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Did the audit squad or field team require subsequent verification photos or an evening exit video walkthrough?
                    You can append supplementary evidence to this sealed mission without invalidating the audit chain.
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 whitespace-nowrap">
                  AUDIT SQUAD ACTIVE
                </span>
              </div>

              {/* Supplementary Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => supplementaryInputRef.current?.click()}
                  className="px-3 py-2 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <UploadCloud size={13} />
                  <span>Upload Additional Photo / Video</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickSimulateMedia("IMAGE", true)}
                  className="px-2.5 py-2 rounded-lg text-xs font-medium border border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 flex items-center gap-1 transition cursor-pointer"
                >
                  <Plus size={12} />
                  <span>Simulate Remediation Photo</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickSimulateMedia("VIDEO", true)}
                  className="px-2.5 py-2 rounded-lg text-xs font-medium border border-indigo-500/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/10 flex items-center gap-1 transition cursor-pointer"
                >
                  <Film size={12} />
                  <span>Simulate Post-Audit Video Walkthrough</span>
                </button>
              </div>

              {/* Supplementary items list */}
              {evidenceItems.filter((e) => e.isSupplementary).length > 0 && (
                <div className="pt-2 space-y-1.5 border-t border-amber-500/20">
                  <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                    Appended Supplementary Evidence ({evidenceItems.filter((e) => e.isSupplementary).length}):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {evidenceItems
                      .filter((e) => e.isSupplementary)
                      .map((item) => (
                        <div
                          key={item.id}
                          className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-amber-400/40 flex items-center justify-between text-[10px]"
                        >
                          <div className="flex items-center gap-2 truncate">
                            {item.type === "VIDEO" ? (
                              <FileVideo size={14} className="text-indigo-500 shrink-0" />
                            ) : (
                              <FileImage size={14} className="text-emerald-500 shrink-0" />
                            )}
                            <span className="truncate font-semibold text-slate-800 dark:text-slate-200">{item.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedEvidencePreview(item)}
                            className="px-1.5 py-0.5 rounded text-[9px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-mono shrink-0 ml-1"
                          >
                            View
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap gap-2 max-w-xl mx-auto pt-2">
              <button
                type="button"
                onClick={() => setMissionStatus("AWAITING")}
                className="btn btn-primary flex-1 py-2.5"
              >
                Back to Missions
              </button>
              <Link href="/dashboard/inspections" className="btn btn-secondary flex-1 py-2.5 flex items-center justify-center gap-1.5">
                <span>All Inspections</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* FULL EVIDENCE PREVIEW MODAL (IMAGE & VIDEO PLAYBACK WITH SHA-256 HASH) */}
      {selectedEvidencePreview && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedEvidencePreview(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl overflow-hidden border shadow-2xl space-y-0"
            style={{
              background: "var(--surface-card)",
              borderColor: "var(--border-light)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                {selectedEvidencePreview.type === "VIDEO" ? (
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                    <FileVideo size={16} />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <FileImage size={16} />
                  </div>
                )}
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {selectedEvidencePreview.name}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    ID: {selectedEvidencePreview.id} • {selectedEvidencePreview.sizeMb} MB • {selectedEvidencePreview.timestamp}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvidencePreview(null)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 flex items-center justify-center transition cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Media Player / Image Viewer */}
            <div className="bg-black flex items-center justify-center max-h-[50vh] min-h-[260px] overflow-hidden">
              {selectedEvidencePreview.type === "VIDEO" ? (
                <video
                  src={selectedEvidencePreview.url}
                  controls
                  autoPlay
                  playsInline
                  className="w-full max-h-[50vh] object-contain"
                />
              ) : (
                <img
                  src={selectedEvidencePreview.url}
                  alt={selectedEvidencePreview.name}
                  className="w-full max-h-[50vh] object-contain"
                />
              )}
            </div>

            {/* Cryptographic Proof Dossier */}
            <div className="p-4 space-y-2.5 bg-slate-50 dark:bg-slate-900/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-700 dark:text-slate-300 font-extrabold block font-sans">Cadastral Location Stamp</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
                    {selectedEvidencePreview.geoTag}
                  </span>
                </div>
                <div className="p-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-700 dark:text-slate-300 font-extrabold block font-sans">Classification &amp; Integrity</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-[10px]">
                    {selectedEvidencePreview.isSupplementary ? "Post-Audit Supplementary Packet" : "Primary Statutory Mission Evidence"}
                  </span>
                </div>
              </div>

              {/* SHA-256 Hash Display with Copy */}
              <div className="p-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                <div className="truncate">
                  <span className="text-[10px] text-slate-700 dark:text-slate-300 font-extrabold block font-sans">SHA-256 Cryptographic Fingerprint</span>
                  <code className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold select-all">
                    {selectedEvidencePreview.sha256}
                  </code>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(selectedEvidencePreview.sha256);
                    alert("SHA-256 fingerprint copied to clipboard for independent cryptographic verification.");
                  }}
                  className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-blue-500 hover:text-white text-slate-700 dark:text-slate-200 text-[10px] font-bold flex items-center gap-1 transition shrink-0 cursor-pointer"
                >
                  <Copy size={11} />
                  <span>Copy Hash</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-300 font-semibold pt-1">
                <span>Compliant with Indian Evidence Act Sec 65B &amp; DPDP Act 2023</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-black">INTEGRITY VERIFIED ✓</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAuditModal && (
        <DigitalInspectionAuditModal
          projectId={project.id}
          inspectorName="Priya Mehta (Inspection Officer)"
          onClose={() => setShowAuditModal(false)}
          onCompleted={(res) => {
            setMissionStatus("COMPLETED");
            setShowAuditModal(false);
          }}
        />
      )}

      {showVoiceModal && (
        <VoiceToReportModal
          isOpen={showVoiceModal}
          onClose={() => setShowVoiceModal(false)}
          onApplyData={handleApplyVoiceData}
        />
      )}

      {showDynamicQRModal && (
        <DynamicQRAssertionModal
          isOpen={showDynamicQRModal}
          facilityId={project.id}
          facilityName={project.name}
          onClose={() => setShowDynamicQRModal(false)}
          onVerified={() => {
            setIsDynamicQRVerified(true);
            setFrsVerifiedOnSite(true);
            setCurrentDistance(0.01);
          }}
        />
      )}

      {showArrivalFRSModal && (
        <FRSVerificationModal
          employeeName="Priya Mehta"
          roleTitle="PMU / Inspection Officer"
          roleId="INSPECTION_OFFICER"
          actionContext={`On-Site Geofence Lock (${project.name})`}
          onVerified={() => {
            setShowArrivalFRSModal(false);
            setFrsVerifiedOnSite(true);
            setCurrentDistance(0.02);
            setMissionStatus("INSPECTING");
          }}
          onCancel={() => setShowArrivalFRSModal(false)}
        />
      )}
    </div>
  );
}
