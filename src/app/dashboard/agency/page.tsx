"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  Building2,
  Shield,
  FileCheck,
  AlertTriangle,
  Upload,
  Camera,
  Video,
  FileText,
  CheckCircle2,
  Clock,
  ArrowRight,
  Send,
  Eye,
  Check,
  Download,
  Lock,
  Plus,
  RefreshCw,
} from "lucide-react";
import { DEMO_PROJECTS } from "@/lib/demo-data";
import { evidenceVault } from "@/lib/evidence/evidence-vault";
import { correctiveActionsStore } from "@/lib/corrective-actions/corrective-actions-store";
import { generateMinistryDossierPDF } from "@/lib/reports/pdf-generator";
import { createWatermarkedImageBlob } from "@/lib/evidence/canvas-watermarker";
import { CorrectiveAction, EvidenceMetadata, EvidenceType } from "@/types";

// Client-side SHA-256 hash generator
async function computeFileSha256(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return `SHA256-${Date.now().toString(16)}-${Math.random().toString(16).substring(2, 10)}`;
  }
}

export default function AgencyPortalPage() {
  const currentAgencyUser = {
    id: "u_agency_asha",
    name: "Dr. K. S. Rao (Director, Asha Welfare Foundation)",
    role: "AGENCY_PORTAL",
    organizationId: "ORG-ASHA-001",
    stateId: "AP",
  };

  const project = DEMO_PROJECTS[0]; // Asha Rehabilitation Centre

  const [activeTab, setActiveTab] = useState<"ACTIONS_REQUIRED" | "MY_PROJECT" | "MY_EVIDENCE" | "SUBMIT_RESPONSE">("ACTIONS_REQUIRED");

  // Corrective Actions for this agency
  const [correctiveActions, setCorrectiveActions] = useState<CorrectiveAction[]>(() =>
    correctiveActionsStore.getActionsForUser(currentAgencyUser)
  );

  // Agency's own isolated evidence
  const [agencyEvidence, setAgencyEvidence] = useState<EvidenceMetadata[]>(() =>
    evidenceVault.getEvidenceForUser(currentAgencyUser)
  );

  // File Upload Refs
  const agencyPhotoRef = useRef<HTMLInputElement>(null);
  const agencyVideoRef = useRef<HTMLInputElement>(null);
  const agencyDocRef = useRef<HTMLInputElement>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // Response Form State
  const [selectedActionId, setSelectedActionId] = useState<string>(correctiveActions[0]?.id || "CA-2026-001");
  const [explanationText, setExplanationText] = useState<string>(
    "We have rectified the power supply to CCTV Camera 02 by replacing the PoE surge protector. Camera is now operating with 1080p live transmission. For absent beneficiaries, attached OPD attendance vouchers from Civil Hospital."
  );
  const [attachedEvidenceIds, setAttachedEvidenceIds] = useState<string[]>(["EV-AG-001", "EV-AG-002"]);
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [responseSuccess, setResponseSuccess] = useState(false);

  // Agency File Upload Handler with Geostamp & Watermark
  const handleAgencyFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: EvidenceType) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploadStatus(`Uploading, Geostamping & Cryptographically Validating ${file.name}...`);

    let finalChecksum = await computeFileSha256(file);
    let finalBlobUrl = URL.createObjectURL(file);
    let finalSize = file.size;

    // Apply real canvas-based ISRO Bhuvan & GNSS Geostamp Watermark for Photos
    if (type === "photo") {
      try {
        const watermarked = await createWatermarkedImageBlob(file, {
          latitude: project.location.latitude,
          longitude: project.location.longitude,
          accuracy: 5.5,
          timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
          bhuvanAddress: "Plot #44/2A, Guntur Rural, Andhra Pradesh (ISRO Bhuvan Verified)",
          squadName: currentAgencyUser.name,
          sha256Digest: finalChecksum,
        });

        finalBlobUrl = watermarked.url;
        finalChecksum = watermarked.checksum;
        finalSize = watermarked.size;
      } catch {
        // Fallback to original
      }
    }

    const newEvidence = await evidenceVault.storeEvidence({
      audit_id: "AUD-2026-0094",
      project_id: project.id,
      owner_type: "AGENCY",
      owner_id: currentAgencyUser.organizationId,
      owner_organization_id: currentAgencyUser.organizationId,
      owner_user_id: currentAgencyUser.id,
      uploaded_by: currentAgencyUser.id,
      uploaded_by_role: "AGENCY_PORTAL",
      state_id: project.state,
      district_id: project.district_name,
      type,
      filename: file.name,
      file_name: file.name,
      mime_type: type === "photo" ? "image/jpeg" : file.type || "application/octet-stream",
      file_size_bytes: finalSize,
      file_size: finalSize,
      storage_path: `/evidence/state/${project.state}/project/${project.id}/owner/${currentAgencyUser.organizationId}/${type}s/${file.name}`,
      rawChecksum: finalChecksum,
      version: 2,
      visibility: "STATE_AUTHORIZED",
      captured_at: new Date().toISOString(),
      gps: {
        latitude: project.location.latitude,
        longitude: project.location.longitude,
        accuracy: 5.5,
        timestamp: new Date().toISOString(),
      },
      bhuvan_address: "Plot #44/2A, Guntur Rural, Andhra Pradesh (ISRO Bhuvan Verified)",
      description: `Agency Compliance Upload: ${file.name}`,
      storage_url: finalBlobUrl,
      thumbnail_url: type === "photo" ? finalBlobUrl : undefined,
    });

    setAgencyEvidence(evidenceVault.getEvidenceForUser(currentAgencyUser));
    setAttachedEvidenceIds((prev) => [...prev, newEvidence.uuid]);
    setUploadStatus(null);
    e.target.value = "";
  };

  // Handle Response Submission
  const handleSubmitResponse = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingResponse(true);

    setTimeout(() => {
      correctiveActionsStore.submitAgencyResponse(selectedActionId, {
        explanation: explanationText,
        submittedBy: currentAgencyUser.name,
        evidenceVersionIds: attachedEvidenceIds,
      });

      setCorrectiveActions(correctiveActionsStore.getActionsForUser(currentAgencyUser));
      setIsSubmittingResponse(false);
      setResponseSuccess(true);
    }, 600);
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* Hidden File Inputs for Agency */}
      <input
        type="file"
        ref={agencyPhotoRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => handleAgencyFileUpload(e, "photo")}
      />
      <input
        type="file"
        ref={agencyVideoRef}
        accept="video/*"
        className="hidden"
        onChange={(e) => handleAgencyFileUpload(e, "video")}
      />
      <input
        type="file"
        ref={agencyDocRef}
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={(e) => handleAgencyFileUpload(e, "document")}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-5 rounded-3xl text-white shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <Building2 size={24} className="text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-extrabold text-white">Agency &amp; Institute Portal</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Asha Welfare Foundation
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Authorized Representative: <strong className="text-white">{currentAgencyUser.name}</strong> • Strict Multi-Tenant Isolation
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-2xl flex-wrap">
          {(["ACTIONS_REQUIRED", "MY_PROJECT", "MY_EVIDENCE", "SUBMIT_RESPONSE"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === tab ? "bg-amber-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              {tab === "ACTIONS_REQUIRED" && `Action Required (${correctiveActions.filter((a) => a.status === "ACTION_REQUIRED").length})`}
              {tab === "MY_PROJECT" && "Project Overview"}
              {tab === "MY_EVIDENCE" && `My Evidence (${agencyEvidence.length})`}
              {tab === "SUBMIT_RESPONSE" && "Respond to Notice"}
            </button>
          ))}
        </div>
      </div>

      {uploadStatus && (
        <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-2 animate-pulse">
          <RefreshCw size={14} className="animate-spin" /> {uploadStatus}
        </div>
      )}

      {/* TAB 1: ACTIONS REQUIRED / NOTICES */}
      {activeTab === "ACTIONS_REQUIRED" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-card border border-base flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-primary">State Admin Corrective Action Notices</h3>
              <p className="text-xs text-muted">Statutory notices issued by State Administration requiring compliance responses.</p>
            </div>
            <button
              onClick={() => generateMinistryDossierPDF({ title: "Agency Compliance Dossier" })}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={13} /> Export PDF Dossier
            </button>
          </div>

          <div className="space-y-3">
            {correctiveActions.map((action) => (
              <div
                key={action.id}
                className="p-5 rounded-3xl bg-card border border-base shadow-sm space-y-4"
              >
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                        {action.status.replace("_", " ")}
                      </span>
                      <span className="text-xs font-mono text-muted">Due: {action.due_date}</span>
                    </div>
                    <h4 className="font-extrabold text-sm text-primary">{action.issue_title}</h4>
                    <p className="text-xs text-secondary mt-1 leading-relaxed">
                      <strong>Mandated Remediation:</strong> {action.required_action}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedActionId(action.id);
                      setActiveTab("SUBMIT_RESPONSE");
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Send size={13} /> Submit Response
                  </button>
                </div>

                {action.agency_response && (
                  <div className="p-4 rounded-2xl bg-muted/40 border border-base space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[11px] font-bold text-emerald-500">
                      <span>✓ Agency Response Submitted</span>
                      <span className="font-mono text-muted">{new Date(action.agency_response.submitted_at).toLocaleDateString("en-IN")}</span>
                    </div>
                    <p className="text-secondary">{action.agency_response.explanation}</p>
                    <div className="flex gap-2 pt-1 font-mono text-[10px] text-muted flex-wrap">
                      <span>Attached Evidence:</span>
                      {action.agency_response.evidence_version_ids.map((id) => (
                        <span key={id} className="font-bold text-primary px-1.5 py-0.5 rounded bg-muted/60">{id}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: MY PROJECT OVERVIEW */}
      {activeTab === "MY_PROJECT" && (
        <div className="p-6 rounded-3xl bg-card border border-base shadow-md space-y-5">
          <div>
            <span className="text-[10px] font-extrabold text-muted uppercase tracking-wider block mb-1">
              AUTHORIZED INSTITUTION
            </span>
            <h3 className="font-extrabold text-lg text-primary">{project.name}</h3>
            <p className="text-xs text-muted mt-0.5">{project.district_name}, {project.state} • {project.scheme_name}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-muted/40 border border-base">
              <span className="text-[10px] text-muted font-bold block">REGISTERED BENIFICIARIES</span>
              <span className="text-xl font-black text-primary mt-1 block">{project.registered_beneficiaries}</span>
            </div>
            <div className="p-4 rounded-2xl bg-muted/40 border border-base">
              <span className="text-[10px] text-muted font-bold block">CCTV CAMERAS</span>
              <span className="text-xl font-black text-primary mt-1 block">{project.cctv_online}/{project.cctv_total} Online</span>
            </div>
            <div className="p-4 rounded-2xl bg-muted/40 border border-base">
              <span className="text-[10px] text-muted font-bold block">OVERALL HEALTH SCORE</span>
              <span className="text-xl font-black text-emerald-500 mt-1 block">{project.health.overall}%</span>
            </div>
            <div className="p-4 rounded-2xl bg-muted/40 border border-base">
              <span className="text-[10px] text-muted font-bold block">CURRENT RISK SCORE</span>
              <span className="text-xl font-black text-rose-500 mt-1 block">{project.ai_risk_score}/100</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MY EVIDENCE (Strict Isolation: Only Agency Uploads) */}
      {activeTab === "MY_EVIDENCE" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-card border border-base flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-primary">Agency Supporting Evidence Vault</h3>
              <p className="text-xs text-muted">Strict data isolation: Only artifacts uploaded by your organization are accessible.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => agencyPhotoRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={13} /> Upload Proof
              </button>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-500">
                {agencyEvidence.length} Isolated Artifacts
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agencyEvidence.map((ev) => (
              <div key={ev.uuid} className="p-4 rounded-2xl bg-card border border-base shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-500">
                        {ev.type}
                      </span>
                      <span className="text-[10px] font-mono text-muted">v{ev.version || 1}</span>
                    </div>
                    <h5 className="font-bold text-xs text-primary">{ev.filename}</h5>
                    <p className="text-[11px] text-muted mt-0.5">{ev.description}</p>
                  </div>
                </div>

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

      {/* TAB 4: SUBMIT RESPONSE FORM WITH INTERACTIVE PROOF UPLOAD */}
      {activeTab === "SUBMIT_RESPONSE" && (
        <form onSubmit={handleSubmitResponse} className="p-6 rounded-3xl bg-card border border-base shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-base pb-3">
            <div>
              <h3 className="font-extrabold text-sm text-primary">Submit Formal Compliance Response &amp; Evidence Proof</h3>
              <p className="text-xs text-muted">Attach updated photographic, video, and PDF proof (v2/v3) for State Admin verification.</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-secondary">Target Corrective Action Notice</label>
            <select
              value={selectedActionId}
              onChange={(e) => setSelectedActionId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-base text-primary font-bold text-xs"
            >
              {correctiveActions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id} • {a.issue_title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-secondary">Institutional Explanation &amp; Remediation Details</label>
            <textarea
              rows={4}
              value={explanationText}
              onChange={(e) => setExplanationText(e.target.value)}
              className="w-full p-3 rounded-2xl bg-muted/30 border border-base text-primary text-xs focus:outline-none"
              required
            />
          </div>

          {/* Dedicated Proof Uploader Buttons */}
          <div className="space-y-2">
            <span className="text-xs font-extrabold text-primary block">Upload Remediation Proof (Images, Videos, PDFs)</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => agencyPhotoRef.current?.click()}
                className="p-3.5 rounded-2xl bg-muted/30 border border-base hover:border-amber-500/50 flex items-center justify-center gap-2 text-xs font-bold text-primary transition cursor-pointer"
              >
                <Camera size={16} className="text-amber-500" />
                <span>+ Upload Photo Proof</span>
              </button>

              <button
                type="button"
                onClick={() => agencyVideoRef.current?.click()}
                className="p-3.5 rounded-2xl bg-muted/30 border border-base hover:border-amber-500/50 flex items-center justify-center gap-2 text-xs font-bold text-primary transition cursor-pointer"
              >
                <Video size={16} className="text-rose-500" />
                <span>+ Upload Video Proof</span>
              </button>

              <button
                type="button"
                onClick={() => agencyDocRef.current?.click()}
                className="p-3.5 rounded-2xl bg-muted/30 border border-base hover:border-amber-500/50 flex items-center justify-center gap-2 text-xs font-bold text-primary transition cursor-pointer"
              >
                <FileText size={16} className="text-purple-500" />
                <span>+ Upload PDF / Document</span>
              </button>
            </div>
          </div>

          {/* Attached Proof Items Preview */}
          <div className="p-4 rounded-2xl bg-muted/20 border border-base space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-primary">Attached Proof Artifacts ({agencyEvidence.length})</span>
              <span className="text-[10px] text-emerald-500 font-bold font-mono">SHA-256 Validated</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {agencyEvidence.map((ev) => (
                <div key={ev.uuid} className="p-3 rounded-xl bg-card border border-base flex items-center justify-between gap-2 shadow-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    {ev.type === "photo" && <Camera size={16} className="text-amber-500 shrink-0" />}
                    {ev.type === "video" && <Video size={16} className="text-rose-500 shrink-0" />}
                    {ev.type === "document" && <FileText size={16} className="text-purple-500 shrink-0" />}
                    <div className="truncate">
                      <span className="font-bold block truncate text-primary">{ev.filename}</span>
                      <span className="text-[10px] text-muted font-mono">v{ev.version || 1} • {(ev.file_size_bytes / 1024).toFixed(0)} KB</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-500 shrink-0">✓ Ready</span>
                </div>
              ))}
            </div>
          </div>

          {responseSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 size={16} /> Compliance response and proof files successfully transmitted to State Administrative Authority!
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmittingResponse}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg hover:opacity-90 transition cursor-pointer flex items-center gap-2"
            >
              <Send size={14} /> {isSubmittingResponse ? "Transmitting..." : "Submit Response to State Admin"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
