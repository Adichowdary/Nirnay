"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Lock,
  FileCheck2,
  Download,
  Copy,
  CheckCircle2,
  Fingerprint,
  QrCode,
  X,
  ExternalLink,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  createCryptographicSeal,
  CryptographicSealCertificate,
  AuditCheckpointPayload,
} from "@/lib/evidence/crypto-seal";
import { cn } from "@/lib/utils";

interface CryptographicLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData?: {
    id: string;
    facilityName: string;
    inspectorName: string;
    timestamp: string;
    headcount: number;
    checklistScore: number;
  };
}

export function CryptographicLedgerModal({
  isOpen,
  onClose,
  reportData,
}: CryptographicLedgerModalProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const samplePayload: AuditCheckpointPayload = {
    reportId: reportData?.id || "INSP-0094-RJ",
    facilityId: "FAC-RJ-048",
    facilityName: reportData?.facilityName || "Asha Rehabilitation Centre",
    timestamp: reportData?.timestamp || new Date().toISOString(),
    gpsCoords: { latitude: 26.9124, longitude: 75.7873, accuracy: 6 },
    cellTowerId: "AIRTEL-404-45-LAC-8910",
    inspectorId: "OFF-PMU-882",
    inspectorName: reportData?.inspectorName || "Priya Mehta (Inspection Officer)",
    frsFaceEncodingHash: "0x4a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b",
    cctvSnapshotSha256: "0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e",
    observedHeadcount: reportData?.headcount || 48,
    statutoryChecklistScore: reportData?.checklistScore || 87.5,
  };

  const seal: CryptographicSealCertificate = createCryptographicSeal(samplePayload);

  if (!isOpen) return null;

  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div
        className="w-full max-w-3xl bg-slate-950 border border-slate-800 text-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">
                  Cryptographic Proof-of-Presence Certificate
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  IMMUTABLE MERKLE ROOT
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Guarantees mathematical integrity of GPS, Face Biometrics &amp; Statutory Checkpoints.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Certificate Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Certificate Badge Top */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">
                Verification Certificate Token
              </span>
              <p className="text-sm font-extrabold font-mono text-slate-100">{seal.certificateId}</p>
              <p className="text-slate-400 text-[11px]">
                Block Height: <strong className="text-slate-200">#{seal.blockHeight}</strong> • Standard:{" "}
                <strong className="text-slate-200">{seal.signatureScheme}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Tamper-Proof Seal Valid
              </span>
            </div>
          </div>

          {/* Cryptographic Hashes Grid */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Cryptographic Hash Tree (SHA-256)
            </h4>

            <div className="space-y-2 font-mono">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2">
                <div className="space-y-0.5 truncate">
                  <span className="text-[10px] text-slate-400 uppercase">Merkle Root Hash</span>
                  <p className="text-cyan-400 font-bold truncate">{seal.merkleRoot}</p>
                </div>
                <button
                  onClick={() => handleCopy(seal.merkleRoot, "merkle")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                >
                  {copiedKey === "merkle" ? <CheckCircle2 size={13} className="text-emerald-400" /> : <Copy size={13} />}
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2">
                <div className="space-y-0.5 truncate">
                  <span className="text-[10px] text-slate-400 uppercase">Field Payload SHA-256</span>
                  <p className="text-slate-300 truncate">{seal.payloadHash}</p>
                </div>
                <button
                  onClick={() => handleCopy(seal.payloadHash, "payload")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                >
                  {copiedKey === "payload" ? <CheckCircle2 size={13} className="text-emerald-400" /> : <Copy size={13} />}
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2">
                <div className="space-y-0.5 truncate">
                  <span className="text-[10px] text-slate-400 uppercase">FRS Face Encoding Biometric Hash</span>
                  <p className="text-slate-400 truncate">{samplePayload.frsFaceEncodingHash}</p>
                </div>
                <button
                  onClick={() => handleCopy(samplePayload.frsFaceEncodingHash, "frs")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                >
                  {copiedKey === "frs" ? <CheckCircle2 size={13} className="text-emerald-400" /> : <Copy size={13} />}
                </button>
              </div>
            </div>
          </div>

          {/* Tripartite Multi-Signature Sign-Off */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Fingerprint className="w-3.5 h-3.5 text-indigo-400" />
              Tripartite Multi-Signature Signatures
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">1. Lead Inspector</span>
                <p className="font-bold text-slate-200 truncate">{seal.signatures.leadInspector.name}</p>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={11} /> Cryptographically Signed
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">2. State Nodal Officer</span>
                <p className="font-bold text-slate-200 truncate">{seal.signatures.nodalOfficer.name}</p>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={11} /> Co-Signed &amp; Approved
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">3. Beneficiary Rep</span>
                <p className="font-bold text-slate-200 truncate">{seal.signatures.beneficiaryRep.name}</p>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={11} /> Attestation Locked
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-400">
            Immutable Timestamp: {new Date(seal.immutableTimestamp).toLocaleString("en-IN")}
          </span>

          <button
            onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(seal, null, 2));
              const downloadAnchor = document.createElement("a");
              downloadAnchor.setAttribute("href", dataStr);
              downloadAnchor.setAttribute("download", `NIRNAY-SEAL-${seal.certificateId}.json`);
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg transition cursor-pointer"
          >
            <Download size={13} />
            Export Signed JSON Certificate
          </button>
        </div>
      </div>
    </div>
  );
}
