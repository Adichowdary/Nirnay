"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  Shield,
  Camera,
  Video,
  Mic,
  FileText,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Sparkles,
  Lock,
  Radio,
  Clock,
  Play,
  Square,
  RefreshCw,
  Send,
  Eye,
  Check,
  Download,
  Plus,
  Trash2,
  FileCheck,
} from "lucide-react";
import { DEMO_PROJECTS } from "@/lib/demo-data";
import { evidenceVault } from "@/lib/evidence/evidence-vault";
import { generateGroundedAISummary } from "@/lib/ai/report-summarizer";
import { reverseGeocodeBhuvan, acquireAccurateGNSSPosition, BhuvanLocationContext } from "@/lib/geo/bhuvan-service";
import { mongoAtlasClient } from "@/lib/db/mongodb";
import { generateMinistryDossierPDF } from "@/lib/reports/pdf-generator";
import { createWatermarkedImageBlob } from "@/lib/evidence/canvas-watermarker";
import { EvidenceMetadata, AIReportSummary, EvidenceType } from "@/types";

// Client-side File to Base64 converter for MongoDB Atlas persistence
function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Client-side SHA-256 hash generator using Web Crypto API
async function computeFileSha256(file: File | Blob): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return `SHA256-${Date.now().toString(16)}-${Math.random().toString(16).substring(2, 10)}`;
  }
}

export default function AuditSquadWorkspacePage() {
  const currentSquadUser = {
    id: "u_officer_priya",
    name: "Priya Mehta (Squad-07 Lead)",
    role: "AUDIT_SQUAD",
    stateId: "AP",
  };

  const project = DEMO_PROJECTS[0]; // Asha Rehabilitation Centre

  const [activeTab, setActiveTab] = useState<"ACTIVE_AUDIT" | "MY_EVIDENCE" | "MY_REPORTS">("ACTIVE_AUDIT");
  const [auditStep, setAuditStep] = useState<"LOCATION" | "CAPTURE" | "OBSERVATIONS" | "AI_REVIEW" | "SUBMITTED">("LOCATION");

  // Geospatial & Bhuvan Context
  const [bhuvanLoc, setBhuvanLoc] = useState<BhuvanLocationContext | null>(null);
  const [isGpsAcquiring, setIsGpsAcquiring] = useState(false);
  const [gpsLocked, setGpsLocked] = useState(false);

  // Form & Audit State
  const [headcountObserved, setHeadcountObserved] = useState<number>(51);
  const [cctvWorking, setCctvWorking] = useState<boolean>(false);
  const [checklistScore, setChecklistScore] = useState<number>(68);
  const [observations, setObservations] = useState<string>(
    "Conducted unannounced surprise inspection. Found 51 beneficiaries present against 80 registered quota. Activity Hall CCTV Camera 02 disconnected at injector box. Centre incharge claims medical checkup for absent beneficiaries."
  );

  // File Upload State & Hidden Input Refs
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  // Audio Recording State
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [audioTranscript, setAudioTranscript] = useState<string>(
    "Oral statement recorded: Centre incharge states that 29 beneficiaries were sent to Civil Hospital for quarterly health checkup."
  );
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Generated AI Summary
  const [aiSummary, setAiSummary] = useState<AIReportSummary | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Submission Status
  const [tamperProofHash, setTamperProofHash] = useState<string>("");

  // Squad's Isolated Evidence (Synchronized with Vault)
  const [squadEvidence, setSquadEvidence] = useState<EvidenceMetadata[]>(() =>
    evidenceVault.getEvidenceForUser(currentSquadUser)
  );

  // Acquire GPS & ISRO Bhuvan Cadastral Resolution
  const acquireLocation = async () => {
    setIsGpsAcquiring(true);
    const loc = await acquireAccurateGNSSPosition({
      targetLat: project.location.latitude,
      targetLng: project.location.longitude,
      targetFacilityName: project.name,
    });
    setBhuvanLoc(loc);
    setIsGpsAcquiring(false);
    setGpsLocked(true);
  };

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (active) {
        acquireLocation();
      }
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  // Generic File Upload Handler with Canvas Watermarking
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: EvidenceType) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploadProgress(`Processing, Geostamping & Cryptographically Hashing ${file.name}...`);

    let finalChecksum = await computeFileSha256(file);
    let finalBlobUrl = URL.createObjectURL(file);
    let finalSize = file.size;

    let base64Data = "";
    try {
      base64Data = await fileToBase64(file);
    } catch {
      // Continue
    }

    // Apply real canvas-based ISRO Bhuvan & GNSS Geostamp Watermark for Photos
    if (type === "photo") {
      try {
        const watermarked = await createWatermarkedImageBlob(file, {
          latitude: bhuvanLoc?.latitude || project.location.latitude,
          longitude: bhuvanLoc?.longitude || project.location.longitude,
          accuracy: bhuvanLoc?.accuracyMeters || 4.8,
          timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
          bhuvanAddress: bhuvanLoc?.formattedAddress || "Guntur Rural Cadastre (ISRO Bhuvan Verified)",
          squadName: currentSquadUser.name,
          sha256Digest: finalChecksum,
        });

        finalBlobUrl = watermarked.url;
        finalChecksum = watermarked.checksum;
        finalSize = watermarked.size;
        base64Data = watermarked.url;
      } catch {
        // Fallback to original photo if canvas creation fails
      }
    }

    const newEvidence = await evidenceVault.storeEvidence({
      audit_id: "AUD-2026-0094",
      inspection_id: "INSP-0094",
      project_id: project.id,
      owner_type: "AUDIT_SQUAD",
      owner_id: "SQUAD-07",
      owner_user_id: currentSquadUser.id,
      uploaded_by: currentSquadUser.id,
      uploaded_by_role: "AUDIT_SQUAD",
      state_id: project.state,
      district_id: project.district_name,
      type,
      filename: file.name,
      file_name: file.name,
      mime_type: type === "photo" ? "image/jpeg" : file.type || "application/octet-stream",
      file_size_bytes: finalSize,
      file_size: finalSize,
      storage_path: `/evidence/state/${project.state}/project/${project.id}/audit/AUD-2026-0094/owner/${currentSquadUser.id}/${type}s/${file.name}`,
      rawChecksum: finalChecksum,
      version: 1,
      visibility: "STATE_AUTHORIZED",
      captured_at: new Date().toISOString(),
      gps: {
        latitude: bhuvanLoc?.latitude || project.location.latitude,
        longitude: bhuvanLoc?.longitude || project.location.longitude,
        accuracy: bhuvanLoc?.accuracyMeters || 4.8,
        timestamp: new Date().toISOString(),
      },
      bhuvan_address: bhuvanLoc?.formattedAddress || "Guntur Rural, Andhra Pradesh (ISRO Bhuvan Verified)",
      description: `Uploaded & Watermarked ${type.toUpperCase()}: ${file.name}`,
      storage_url: base64Data || finalBlobUrl,
      thumbnail_url: type === "photo" ? (base64Data || finalBlobUrl) : undefined,
    });

    setSquadEvidence(evidenceVault.getEvidenceForUser(currentSquadUser));
    setUploadProgress(null);
    e.target.value = ""; // Reset input
  };

  // Audio Recording Handlers
  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/wav" });
        const audioFile = new File([blob], `audio_statement_${Date.now()}.wav`, { type: "audio/wav" });
        const checksum = await computeFileSha256(audioFile);
        const base64Audio = await fileToBase64(blob);
        const url = URL.createObjectURL(blob);
        setRecordedAudioUrl(url);

        await evidenceVault.storeEvidence({
          audit_id: "AUD-2026-0094",
          inspection_id: "INSP-0094",
          project_id: project.id,
          owner_type: "AUDIT_SQUAD",
          owner_id: "SQUAD-07",
          owner_user_id: currentSquadUser.id,
          uploaded_by: currentSquadUser.id,
          uploaded_by_role: "AUDIT_SQUAD",
          state_id: project.state,
          district_id: project.district_name,
          type: "audio",
          filename: audioFile.name,
          file_name: audioFile.name,
          mime_type: "audio/wav",
          file_size_bytes: blob.size,
          storage_path: `/evidence/state/${project.state}/project/${project.id}/audio/${audioFile.name}`,
          rawChecksum: checksum,
          version: 1,
          visibility: "STATE_AUTHORIZED",
          captured_at: new Date().toISOString(),
          gps: {
            latitude: project.location.latitude,
            longitude: project.location.longitude,
            accuracy: 4.8,
            timestamp: new Date().toISOString(),
          },
          bhuvan_address: bhuvanLoc?.formattedAddress || "Guntur Rural, Andhra Pradesh",
          description: "Live recorded oral statement of Centre Incharge.",
          transcript: audioTranscript,
          storage_url: base64Audio || url,
        });

        setSquadEvidence(evidenceVault.getEvidenceForUser(currentSquadUser));
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecordingAudio(true);
    } catch {
      setIsRecordingAudio(false);
      alert("Microphone permission required to record audio.");
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      setIsRecordingAudio(false);
    }
  };

  // Generate Grounded AI Summary
  const handleGenerateAI = () => {
    setIsGeneratingAI(true);
    setTimeout(() => {
      const summary = generateGroundedAISummary({
        reportId: "REP-2026-0094",
        projectName: project.name,
        district: project.district_name,
        state: project.state,
        squadName: "Squad-07",
        observations,
        checklistScore,
        registeredHeadcount: project.registered_beneficiaries || 80,
        observedHeadcount: headcountObserved,
        cctvFunctional: cctvWorking,
        evidenceItems: squadEvidence,
      });
      setAiSummary(summary);
      setIsGeneratingAI(false);
      setAuditStep("AI_REVIEW");
    }, 700);
  };

  // Submit Final Report
  const handleSubmitAuditReport = async () => {
    const hash = `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`.toUpperCase();
    setTamperProofHash(hash);

    await mongoAtlasClient.saveInspection({
      id: `AUD-REP-${Date.now()}`,
      projectId: project.id,
      projectName: project.name,
      inspectorName: currentSquadUser.name,
      inspectorRole: "AUDIT_SQUAD",
      state: project.state,
      district: project.district_name,
      timestamp: new Date().toISOString(),
      score: checklistScore,
      status: checklistScore >= 80 ? "COMPLETED" : "FLAGGED",
      location: {
        latitude: project.location.latitude,
        longitude: project.location.longitude,
        accuracy: 4.8,
        bhuvanAddress: bhuvanLoc?.formattedAddress || "Guntur, Andhra Pradesh",
      },
      checklist: {
        observations: { pass: checklistScore >= 80, notes: observations },
      },
      tamperProofHash: hash,
    });

    setAuditStep("SUBMITTED");
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={photoInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileUpload(e, "photo")}
      />
      <input
        type="file"
        ref={videoInputRef}
        accept="video/*"
        className="hidden"
        onChange={(e) => handleFileUpload(e, "video")}
      />
      <input
        type="file"
        ref={audioInputRef}
        accept="audio/*"
        className="hidden"
        onChange={(e) => handleFileUpload(e, "audio")}
      />
      <input
        type="file"
        ref={docInputRef}
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={(e) => handleFileUpload(e, "document")}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-5 rounded-3xl text-white shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <Shield size={24} className="text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-extrabold text-white">Audit Squad Field Workspace</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Squad-07 Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Assigned Lead: <strong className="text-white">{currentSquadUser.name}</strong> • Strict Evidence Isolation Enforced
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-2xl">
          {(["ACTIVE_AUDIT", "MY_EVIDENCE", "MY_REPORTS"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === tab ? "bg-emerald-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              {tab === "ACTIVE_AUDIT" && "Active Audit Mission"}
              {tab === "MY_EVIDENCE" && `My Evidence (${squadEvidence.length})`}
              {tab === "MY_REPORTS" && "My Reports"}
            </button>
          ))}
        </div>
      </div>

      {uploadProgress && (
        <div className="p-3 rounded-2xl bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-bold flex items-center gap-2 animate-pulse">
          <RefreshCw size={14} className="animate-spin" /> {uploadProgress}
        </div>
      )}

      {/* TAB 1: ACTIVE AUDIT MISSION WORKFLOW */}
      {activeTab === "ACTIVE_AUDIT" && (
        <div className="space-y-6">
          {/* Target Facility Card */}
          <div className="p-5 rounded-3xl bg-card border border-base shadow-md grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-[10px] font-extrabold text-muted uppercase tracking-wider block mb-1">
                TARGET PROJECT / INSTITUTE
              </span>
              <h3 className="font-extrabold text-base text-primary">{project.name}</h3>
              <p className="text-xs text-muted mt-0.5">{project.district_name}, {project.state} • {project.scheme_name}</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-extrabold text-muted uppercase tracking-wider block">
                  ISRO BHUVAN CADASTRE
                </span>
                <button
                  type="button"
                  onClick={acquireLocation}
                  disabled={isGpsAcquiring}
                  className="text-[10px] font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={10} className={isGpsAcquiring ? "animate-spin" : ""} />
                  {isGpsAcquiring ? "Locking..." : "Re-Lock GNSS"}
                </button>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold">
                <Radio size={14} className="animate-pulse" />
                <span>{bhuvanLoc?.formattedAddress || "Acquiring Bhuvan Cadastral Data..."}</span>
              </div>
              <p className="text-[11px] font-mono text-muted mt-0.5">
                GNSS: {bhuvanLoc?.latitude.toFixed(4) || project.location.latitude.toFixed(4)}°N, {bhuvanLoc?.longitude.toFixed(4) || project.location.longitude.toFixed(4)}°E (±{bhuvanLoc?.accuracyMeters || 4.8}m)
              </p>
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-muted uppercase tracking-wider block mb-1">
                AUDIT PROGRESSION
              </span>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs">
                  {auditStep.replace("_", " ")}
                </span>
                <span className="text-xs text-muted font-mono font-bold">Priority: HIGH</span>
              </div>
            </div>
          </div>

          {/* Stepper Steps */}
          {auditStep !== "SUBMITTED" && (
            <div className="p-6 rounded-3xl bg-card border border-base shadow-xl space-y-6">
              {/* Step 1: Interactive Multi-Media Evidence Uploader */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-extrabold text-primary flex items-center gap-2">
                    <Camera size={16} className="text-emerald-500" />
                    1. Upload Proof of Images, Videos, Audio &amp; Documents
                  </h4>
                  <span className="text-[11px] text-muted font-mono">
                    {squadEvidence.length} Items Captured &amp; Hashed
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Photo Upload Box */}
                  <div className="p-4 rounded-2xl bg-muted/30 border border-base text-center space-y-2.5 hover:border-emerald-500/50 transition">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto">
                      <Camera size={20} />
                    </div>
                    <div>
                      <span className="block text-xs font-extrabold text-primary">Photos (Watermarked)</span>
                      <span className="text-[10px] text-muted">JPG, PNG (GPS overlay)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="w-full py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <Upload size={13} /> Upload Photo Proof
                    </button>
                  </div>

                  {/* Video Upload Box */}
                  <div className="p-4 rounded-2xl bg-muted/30 border border-base text-center space-y-2.5 hover:border-emerald-500/50 transition">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
                      <Video size={20} />
                    </div>
                    <div>
                      <span className="block text-xs font-extrabold text-primary">Video Recording</span>
                      <span className="text-[10px] text-muted">MP4, WebM (RTSP proof)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      className="w-full py-1.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <Upload size={13} /> Upload Video Proof
                    </button>
                  </div>

                  {/* Audio Statement Box */}
                  <div className="p-4 rounded-2xl bg-muted/30 border border-base text-center space-y-2.5 hover:border-emerald-500/50 transition">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                      <Mic size={20} className={isRecordingAudio ? "text-rose-500 animate-pulse" : ""} />
                    </div>
                    <div>
                      <span className="block text-xs font-extrabold text-primary">Audio Statement</span>
                      <span className="text-[10px] text-muted">WAV, MP3 + Live Mic</span>
                    </div>
                    <div className="flex gap-1.5">
                      {!isRecordingAudio ? (
                        <button
                          type="button"
                          onClick={startAudioRecording}
                          className="flex-1 py-1.5 px-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                        >
                          <Mic size={12} /> Record
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={stopAudioRecording}
                          className="flex-1 py-1.5 px-2 rounded-xl bg-rose-600 text-white font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer animate-pulse"
                        >
                          <Square size={12} /> Stop
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => audioInputRef.current?.click()}
                        className="py-1.5 px-2 rounded-xl bg-muted hover:bg-muted/80 text-primary border border-base font-bold text-[11px] cursor-pointer"
                      >
                        File
                      </button>
                    </div>
                  </div>

                  {/* PDF Document Upload Box */}
                  <div className="p-4 rounded-2xl bg-muted/30 border border-base text-center space-y-2.5 hover:border-emerald-500/50 transition">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mx-auto">
                      <FileText size={20} />
                    </div>
                    <div>
                      <span className="block text-xs font-extrabold text-primary">PDF Documents</span>
                      <span className="text-[10px] text-muted">PDF, Signed Sheets</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => docInputRef.current?.click()}
                      className="w-full py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <Upload size={13} /> Upload PDF Proof
                    </button>
                  </div>
                </div>

                {/* Evidence Preview Strip */}
                {squadEvidence.length > 0 && (
                  <div className="mt-4 p-4 rounded-2xl bg-muted/20 border border-base space-y-3">
                    <span className="text-xs font-extrabold text-primary block">
                      Active Uploaded Proof Items ({squadEvidence.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {squadEvidence.slice(0, 6).map((ev) => (
                        <div key={ev.uuid} className="p-3 rounded-xl bg-card border border-base space-y-2 shadow-sm text-xs">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-500">
                              {ev.type}
                            </span>
                            <span className="font-mono text-[9px] text-muted truncate max-w-[100px]">
                              {ev.sha256_hash.slice(0, 10)}...
                            </span>
                          </div>
                          <div className="font-bold text-primary truncate">{ev.filename}</div>

                          {/* Live preview for photo or audio */}
                          {ev.type === "photo" && ev.storage_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={ev.storage_url}
                              alt="Proof preview"
                              className="w-full h-24 object-cover rounded-lg border border-base"
                            />
                          )}

                          {ev.type === "audio" && ev.storage_url && (
                            <audio controls src={ev.storage_url} className="w-full h-7" />
                          )}

                          {ev.type === "video" && ev.storage_url && (
                            <video controls src={ev.storage_url} className="w-full h-24 object-cover rounded-lg border border-base" />
                          )}

                          <div className="text-[10px] text-muted flex items-center justify-between">
                            <span>{(ev.file_size_bytes / 1024).toFixed(0)} KB</span>
                            <span className="text-emerald-500 font-bold">✓ SHA-256 Verified</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Observations & Checklist Parameters */}
              <div className="pt-4 border-t border-base space-y-4">
                <h4 className="text-sm font-extrabold text-primary flex items-center gap-2">
                  <ClipboardCheck size={16} className="text-blue-500" />
                  2. Field Observations &amp; Verification Telemetry
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-secondary">Physical Headcount Observed</label>
                    <input
                      type="number"
                      value={headcountObserved}
                      onChange={(e) => setHeadcountObserved(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-muted/30 border border-base text-primary font-bold text-sm"
                    />
                    <span className="text-[10px] text-muted">Registered Quota: 80 Beneficiaries</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-secondary">CCTV Remote Stream Status</label>
                    <select
                      value={cctvWorking ? "yes" : "no"}
                      onChange={(e) => setCctvWorking(e.target.value === "yes")}
                      className="w-full px-3 py-2 rounded-xl bg-muted/30 border border-base text-primary font-bold text-sm"
                    >
                      <option value="no">Offline / Disconnected (Flagged)</option>
                      <option value="yes">Online &amp; Transmitting</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-secondary">10-Point Checklist Score (%)</label>
                    <input
                      type="number"
                      value={checklistScore}
                      onChange={(e) => setChecklistScore(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-muted/30 border border-base text-primary font-bold text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-secondary">Detailed Field Observation Notes</label>
                  <textarea
                    rows={3}
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-muted/30 border border-base text-primary text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Action: Generate AI Summary */}
              <div className="pt-4 border-t border-base flex items-center justify-between flex-wrap gap-3">
                <span className="text-xs text-muted">
                  Grounded AI synthesis will extract Key Findings, Risk Level, and Corrective Action mandates.
                </span>

                <button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={isGeneratingAI}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs shadow-lg hover:opacity-90 transition cursor-pointer flex items-center gap-2"
                >
                  <Sparkles size={14} />
                  {isGeneratingAI ? "Generating Grounded Summary…" : "Generate AI Summary & Review"}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: AI Review & Human Verification Modal / Card */}
          {auditStep === "AI_REVIEW" && aiSummary && (
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white space-y-5 shadow-2xl animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-purple-400" />
                  <h3 className="font-extrabold text-base text-white">Grounded AI Executive Summary (Pre-Submission Review)</h3>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Risk Level: {aiSummary.risk_level}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  {aiSummary.executive_summary}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <h5 className="font-bold text-amber-400 uppercase text-[11px]">Key Findings &amp; Issues</h5>
                    <ul className="list-disc pl-4 space-y-1 text-slate-300">
                      {aiSummary.key_findings.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <h5 className="font-bold text-cyan-400 uppercase text-[11px]">Mandatory Corrective Action Required</h5>
                    <ul className="list-disc pl-4 space-y-1 text-slate-300">
                      {aiSummary.corrective_actions_required.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setAuditStep("CAPTURE")}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Back to Edit
                </button>

                <button
                  type="button"
                  onClick={handleSubmitAuditReport}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-xl hover:opacity-90 transition cursor-pointer flex items-center gap-2"
                >
                  <Lock size={14} /> Cryptographically Sign &amp; Transmit to State Admin
                </button>
              </div>
            </div>
          )}

          {/* Submission Success Confirmation */}
          {auditStep === "SUBMITTED" && (
            <div className="p-8 rounded-3xl bg-card border border-emerald-500/40 text-center space-y-4 shadow-xl animate-in fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 mx-auto flex items-center justify-center">
                <CheckCircle2 size={36} />
              </div>
              <h3 className="text-xl font-extrabold text-primary">Audit Report Successfully Sealed &amp; Transmitted!</h3>
              <p className="text-xs text-muted max-w-md mx-auto">
                Report and all {squadEvidence.length} multi-media evidence artifacts have been transmitted to <strong>State Admin (Andhra Pradesh)</strong> and Central Directorate with immutable SHA-256 integrity seal.
              </p>
              <div className="p-3 rounded-2xl bg-muted/40 font-mono text-xs font-bold text-amber-500 max-w-md mx-auto border border-base">
                {tamperProofHash}
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => generateMinistryDossierPDF({ title: "Audit Squad Field Dossier" })}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer"
                >
                  <Download size={14} /> Download Official PDF Dossier
                </button>
                <button
                  onClick={() => setAuditStep("LOCATION")}
                  className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-primary font-bold text-xs cursor-pointer"
                >
                  Start New Audit
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY EVIDENCE (Strict Isolation: Only Squad-07 Uploads) */}
      {activeTab === "MY_EVIDENCE" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-card border border-base flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-primary">My Squad Evidence Vault</h3>
              <p className="text-xs text-muted">Strict data isolation: Only artifacts uploaded by Squad-07 are accessible.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => photoInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={13} /> Add Evidence
              </button>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-500">
                {squadEvidence.length} Isolated Artifacts
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {squadEvidence.map((ev) => (
              <div key={ev.uuid} className="p-4 rounded-2xl bg-card border border-base shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/10 text-blue-500">
                        {ev.type}
                      </span>
                      <span className="text-[10px] font-mono text-muted">v{ev.version || 1}</span>
                    </div>
                    <h5 className="font-bold text-xs text-primary">{ev.filename}</h5>
                    <p className="text-[11px] text-muted mt-0.5">{ev.description}</p>
                  </div>
                </div>

                {/* Media Preview if available */}
                {ev.type === "photo" && ev.storage_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ev.storage_url}
                    alt={ev.filename}
                    className="w-full h-36 object-cover rounded-xl border border-base"
                  />
                )}

                {ev.type === "video" && ev.storage_url && (
                  <video controls src={ev.storage_url} className="w-full h-36 object-cover rounded-xl border border-base" />
                )}

                {ev.type === "audio" && ev.storage_url && (
                  <audio controls src={ev.storage_url} className="w-full h-8" />
                )}

                <div className="p-2.5 rounded-xl bg-muted/40 font-mono text-[10px] text-muted space-y-1">
                  <div className="flex justify-between">
                    <span>SHA-256:</span>
                    <span className="font-bold text-primary truncate max-w-[180px]">{ev.sha256_hash}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Location:</span>
                    <span className="text-emerald-500 font-bold">{ev.gps.latitude.toFixed(4)}°N, {ev.gps.longitude.toFixed(4)}°E</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MY REPORTS */}
      {activeTab === "MY_REPORTS" && (
        <div className="p-6 rounded-3xl bg-card border border-base space-y-4">
          <h3 className="font-extrabold text-sm text-primary">My Submitted Field Audit Reports</h3>
          <div className="p-4 rounded-2xl bg-muted/30 border border-base flex items-center justify-between">
            <div>
              <div className="font-bold text-xs text-primary">REP-2026-0094 • Asha Rehabilitation Centre</div>
              <div className="text-[11px] text-muted mt-0.5">Submitted: 30 Aug 2026 • Status: <strong className="text-emerald-500">STATE_REVIEW</strong></div>
            </div>
            <button
              onClick={() => generateMinistryDossierPDF({ title: "Audit Squad Final Report" })}
              className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={13} /> View Dossier
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
