"use client";

import React, { useState } from "react";
import {
  Shield,
  Lock,
  Cpu,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Radio,
  FileCheck,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Zap,
  Eye,
  Server,
  Key,
  Database,
  ArrowRight,
} from "lucide-react";
import {
  CCTVBlock,
  CCTVTrustMetrics,
  calculateCCTVTrustMetrics,
  SAMPLE_CCTV_BLOCKCHAIN,
  SAMPLE_EVIDENCE_PROVENANCE,
} from "@/lib/cctv/securevision-chain";

interface SecureVisionChainPanelProps {
  onClose: () => void;
  selectedCameraId?: string;
  facilityName?: string;
}

export function SecureVisionChainPanel({
  onClose,
  selectedCameraId = "CAM-01",
  facilityName = "Asha Rehabilitation Centre",
}: SecureVisionChainPanelProps) {
  const [activeTab, setActiveTab] = useState<"ARCHITECTURE" | "TRUST_SCORE" | "BLOCKCHAIN_LEDGER" | "EVIDENCE_CHAIN">("TRUST_SCORE");
  const [isDegraded, setIsDegraded] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const trustMetrics = calculateCCTVTrustMetrics(isDegraded);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-4xl h-[90vh] bg-slate-950 border border-slate-800 text-white rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        style={{
          boxShadow: isDegraded
            ? "0 0 50px rgba(239, 68, 68, 0.25)"
            : "0 0 50px rgba(16, 185, 129, 0.2)",
        }}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/95 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Shield size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                  SecureVision Chain
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  ONVIF Profile V &amp; NIST Blockchain Verified
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Blockchain-Backed CCTV Integrity, Transport Encryption &amp; Access Control • {facilityName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border ${
                isDegraded
                  ? "bg-rose-500/15 border-rose-500/40 text-rose-300"
                  : "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isDegraded ? "bg-rose-400 animate-ping" : "bg-emerald-400 animate-pulse"}`} />
              Trust Score: {trustMetrics.overallScore}/100 {isDegraded ? "(DEGRADED)" : "(OPTIMAL)"}
            </span>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer text-xs font-bold"
            >
              Close
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-4 pt-2 text-xs font-semibold text-slate-400 overflow-x-auto gap-2">
          {[
            { id: "TRUST_SCORE", label: "CCTV Trust Score (98/100)", icon: Shield },
            { id: "ARCHITECTURE", label: "4-Layer Security Architecture", icon: Layers },
            { id: "BLOCKCHAIN_LEDGER", label: "Immutable Blockchain Ledger", icon: Database },
            { id: "EVIDENCE_CHAIN", label: "Evidence Provenance Chain", icon: FileCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-1.5 pb-2.5 px-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  active
                    ? "border-cyan-400 text-cyan-300 font-bold"
                    : "border-transparent hover:text-slate-200"
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5 bg-slate-950">
          {/* TAB 1: TRUST SCORE */}
          {activeTab === "TRUST_SCORE" && (
            <div className="space-y-5 animate-in">
              {/* Degradation Warning Banner if active */}
              {isDegraded && (
                <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/50 flex items-start justify-between gap-3 text-rose-200 text-xs">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={20} className="text-rose-400 shrink-0 mt-0.5 animate-bounce" />
                    <div>
                      <strong className="block font-bold uppercase tracking-wider text-rose-300">
                        ⚠️ Security Alert: Camera Trust Score Degraded ({trustMetrics.overallScore}/100)
                      </strong>
                      <p className="mt-1 text-[11px] leading-relaxed opacity-90">
                        {trustMetrics.degradationReason}
                      </p>
                      <p className="mt-1 text-[10px] font-mono text-rose-400">
                        Auto-Action: WebRTC stream paused • Hardware port isolated • Incident Block #18292 logged to blockchain.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsDegraded(false)}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shrink-0 cursor-pointer shadow-sm transition"
                  >
                    Resolve &amp; Re-Authenticate
                  </button>
                </div>
              )}

              {/* Top Score Summary Banner */}
              <div
                className="p-5 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4"
                style={{
                  background: isDegraded ? "rgba(220, 38, 38, 0.08)" : "rgba(16, 185, 129, 0.06)",
                  borderColor: isDegraded ? "rgba(220, 38, 38, 0.3)" : "rgba(16, 185, 129, 0.25)",
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl font-mono border"
                    style={{
                      background: isDegraded ? "rgba(220, 38, 38, 0.2)" : "rgba(16, 185, 129, 0.15)",
                      borderColor: isDegraded ? "rgba(220, 38, 38, 0.5)" : "rgba(16, 185, 129, 0.4)",
                      color: isDegraded ? "#f87171" : "#34d399",
                    }}
                  >
                    {trustMetrics.overallScore}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                      Active CCTV Security Assurance Level
                    </span>
                    <h3 className="text-base font-extrabold text-white">
                      {isDegraded ? "Trust Compromised — Stream Restricted" : "Fully Certified Government Security Grade"}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Target Camera: <strong className="text-cyan-300">{selectedCameraId}</strong> (WebRTC + SRTP Media Pipeline)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsDegraded(!isDegraded)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border shadow-sm ${
                      isDegraded
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500"
                        : "bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/40"
                    }`}
                  >
                    {isDegraded ? (
                      <>
                        <RefreshCw size={13} /> Restore Trusted Security State
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={13} /> Simulate Security Degradation
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 8-Point Verification Checklist Matrix */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase font-mono font-bold text-slate-400 tracking-wider">
                  8-Point Real-Time Security Verification Matrix
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    {
                      label: "Camera Device Authentication",
                      desc: "ONVIF Profile T/V device TLS certificate verified against NIC PKI truststore",
                      valid: trustMetrics.cameraAuthenticated,
                      layer: "Layer 1",
                    },
                    {
                      label: "Edge Gateway Transport",
                      desc: "Mutual TLS (mTLS) session active with hardware TPM token validation",
                      valid: trustMetrics.tlsConnection,
                      layer: "Layer 1",
                    },
                    {
                      label: "Officer Biometric Authentication",
                      desc: "TrustLayer AI FRS biometric verification score 98.4% with active liveness",
                      valid: trustMetrics.officerAuthenticated,
                      layer: "Layer 3",
                    },
                    {
                      label: "Role-Based Access Permission",
                      desc: "Short-lived camera access token bounded by DoSJE role hierarchy",
                      valid: trustMetrics.accessAuthorized,
                      layer: "Layer 3",
                    },
                    {
                      label: "Live Stream Encryption",
                      desc: "WebRTC + SRTP media encryption (AEAD_AES_256_GCM cipher suite)",
                      valid: trustMetrics.streamEncrypted,
                      layer: "Layer 2",
                    },
                    {
                      label: "Evidence Storage Encryption",
                      desc: "AES-256-GCM envelope encryption at rest in sovereign S3/object storage",
                      valid: trustMetrics.recordingEncrypted,
                      layer: "Layer 2",
                    },
                    {
                      label: "Immutable Blockchain Audit",
                      desc: "SHA-256 access telemetry anchored to permissioned Hyperledger block",
                      valid: trustMetrics.blockchainAuditCreated,
                      layer: "Layer 4",
                    },
                    {
                      label: "NIST-Compliant Architecture",
                      desc: "Zero raw video payload on-chain; only cryptographic digests & access logs",
                      valid: true,
                      layer: "NIST SP 800",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-start gap-3 transition"
                    >
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          item.valid
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-rose-500/20 text-rose-400"
                        }`}
                      >
                        {item.valid ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                      </div>
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-white truncate">{item.label}</span>
                          <span className="text-[9px] font-mono text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-950/50 border border-cyan-500/30 shrink-0">
                            {item.layer}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 4-LAYER SECURITY ARCHITECTURE */}
          {activeTab === "ARCHITECTURE" && (
            <div className="space-y-5 animate-in">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold">
                  <Layers size={16} /> Architectural Principle: Video in Encrypted Channels • Hashes on Blockchain
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  A common misconception in hackathons is attempting to store live CCTV video directly on blockchain, which causes severe network choking. <strong>SecureVision Chain</strong> follows international standards (ONVIF Profile V + NIST Guidelines): live video flows over high-speed <strong>WebRTC + SRTP</strong> encrypted transport, while a <strong>permissioned blockchain</strong> stores immutable SHA-256 access logs, tamper-evident seals, and evidence provenance.
                </p>
              </div>

              {/* 4 Layers Grid */}
              <div className="space-y-3">
                {[
                  {
                    num: "1",
                    title: "Layer 1 — Camera & Edge Gateway Security",
                    tech: "ONVIF Profile T/V • Hardware mTLS • Device Identity Token",
                    details:
                      "Cameras are isolated in an encrypted VLAN. The Secure Edge Gateway authenticates each camera using hardware-backed certificates and short-lived device session tokens, rejecting rogue hardware.",
                    color: "border-cyan-500/40 bg-cyan-950/10 text-cyan-300",
                  },
                  {
                    num: "2",
                    title: "Layer 2 — Live Video Transport Encryption",
                    tech: "WebRTC • SRTP (AEAD_AES_256_GCM) • DTLS 1.3",
                    details:
                      "Zero unencrypted RTSP streams leave the gateway. Media frames are encrypted end-to-end via WebRTC Secure Real-Time Transport Protocol (SRTP) directly to the officer's browser.",
                    color: "border-blue-500/40 bg-blue-950/10 text-blue-300",
                  },
                  {
                    num: "3",
                    title: "Layer 3 — Strong Authentication & Access Control",
                    tech: "TrustLayer AI FRS Biometrics • RBAC • Short-Lived JWT Tokens",
                    details:
                      "Access is non-transferable. An officer must verify biometric presence via FRS before accessing any feed. Access tokens expire in 10 minutes and grant permission only to authorized facility cameras.",
                    color: "border-purple-500/40 bg-purple-950/10 text-purple-300",
                  },
                  {
                    num: "4",
                    title: "Layer 4 — Immutable Blockchain Audit & Evidence Provenance",
                    tech: "Permissioned Blockchain • SHA-256 Merkle DAG • ECDSA Signatures",
                    details:
                      "Every feed access, recording extraction, or camera disruption is signed and committed to an immutable blockchain block. Retroactive modification or cover-ups are cryptographically impossible.",
                    color: "border-emerald-500/40 bg-emerald-950/10 text-emerald-300",
                  },
                ].map((layer) => (
                  <div
                    key={layer.num}
                    className={`p-4 rounded-2xl border ${layer.color} space-y-1.5 transition`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-mono font-bold">
                          {layer.num}
                        </span>
                        {layer.title}
                      </h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900/80 border border-slate-800">
                        {layer.tech}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{layer.details}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: BLOCKCHAIN AUDIT LEDGER */}
          {activeTab === "BLOCKCHAIN_LEDGER" && (
            <div className="space-y-4 animate-in">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Displaying 3 Most Recent Cryptographic Blocks on Permissioned Chain</span>
                <span className="font-mono text-[11px] text-emerald-400 flex items-center gap-1">
                  <Radio size={12} className="animate-pulse" /> Consensus: RAFT / Quorum Verified
                </span>
              </div>

              <div className="space-y-3 font-mono text-[11px]">
                {SAMPLE_CCTV_BLOCKCHAIN.map((block) => (
                  <div
                    key={block.blockId}
                    className={`p-4 rounded-2xl border transition-all ${
                      block.status === "TAMPER_DETECTED"
                        ? "bg-rose-950/30 border-rose-500/40"
                        : "bg-slate-900/80 border-slate-800 hover:border-cyan-500/40"
                    }`}
                  >
                    {/* Block Title Bar */}
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-cyan-400 font-bold text-xs">{block.blockId}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-300">{block.timestamp}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          block.status === "TAMPER_DETECTED"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        {block.status === "TAMPER_DETECTED" ? "⚠️ TAMPER ALERT LOGGED" : "✓ IMMUTABLE PROOF VERIFIED"}
                      </span>
                    </div>

                    {/* Block Body */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300 text-[10px]">
                      <div>
                        <span className="text-slate-500 block">Officer / Actor:</span>
                        <span className="font-bold text-slate-200">{block.event.officer}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Action Event:</span>
                        <span className="text-cyan-300 font-bold">{block.event.action}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Camera Reference:</span>
                        <span className="text-slate-300 truncate block">{block.event.camera}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Reason / Context:</span>
                        <span className="text-slate-300">{block.event.reason}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">SRTP Transport Cipher:</span>
                        <span className="text-emerald-400 font-mono text-[9px]">{block.event.srtpCipherSuite}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Session ID:</span>
                        <span className="text-slate-400 font-mono text-[9px]">{block.event.sessionId}</span>
                      </div>
                    </div>

                    {/* Hash Provenance Bar */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1 text-[9px]">
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Previous Hash:</span>
                        <span className="font-mono text-slate-500 truncate max-w-[260px]">{block.previousHash}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Current Block Hash (SHA-256):</span>
                        <div className="flex items-center gap-1.5 font-mono text-cyan-400">
                          <span className="truncate max-w-[260px]">{block.currentHash}</span>
                          <button
                            onClick={() => handleCopy(block.currentHash, block.blockId)}
                            className="text-slate-400 hover:text-white cursor-pointer"
                            title="Copy SHA-256 Hash"
                          >
                            {copiedHash === block.blockId ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: EVIDENCE INTEGRITY CHAIN */}
          {activeTab === "EVIDENCE_CHAIN" && (
            <div className="space-y-4 animate-in">
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-cyan-400">
                      Tamper-Proof Court Admissibility Record
                    </span>
                    <h3 className="text-base font-extrabold text-white mt-0.5">
                      Evidence Dossier #{SAMPLE_EVIDENCE_PROVENANCE.evidenceId}
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle2 size={13} /> Integrity: {SAMPLE_EVIDENCE_PROVENANCE.integrityPercentage}% VERIFIED
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Surveillance Camera:</span>
                    <strong className="text-white">{SAMPLE_EVIDENCE_PROVENANCE.camera}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Facility Name:</span>
                    <strong className="text-white">{SAMPLE_EVIDENCE_PROVENANCE.facilityName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Captured Timestamp:</span>
                    <span className="text-slate-300">{SAMPLE_EVIDENCE_PROVENANCE.capturedTimestamp}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Geospatial Cadastre:</span>
                    <span className="text-emerald-400">{SAMPLE_EVIDENCE_PROVENANCE.locationCadastre}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Authorizing Officer:</span>
                    <span className="text-cyan-300">{SAMPLE_EVIDENCE_PROVENANCE.officer}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Anchored Blockchain Block:</span>
                    <span className="text-purple-300 font-bold">{SAMPLE_EVIDENCE_PROVENANCE.blockchainBlock}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Transport Media Security:</span>
                    <span className="text-slate-300 text-[11px]">{SAMPLE_EVIDENCE_PROVENANCE.transportEncryption}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Rest Storage Security:</span>
                    <span className="text-slate-300 text-[11px]">{SAMPLE_EVIDENCE_PROVENANCE.storageEncryption}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-[10px] font-mono">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Recording File SHA-256 Digest:</span>
                    <span className="text-cyan-400 truncate max-w-[280px]" title={SAMPLE_EVIDENCE_PROVENANCE.recordingHash}>
                      {SAMPLE_EVIDENCE_PROVENANCE.recordingHash}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Merkle Tree Root:</span>
                    <span className="text-emerald-400 truncate max-w-[280px]" title={SAMPLE_EVIDENCE_PROVENANCE.merkleRoot}>
                      {SAMPLE_EVIDENCE_PROVENANCE.merkleRoot}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Officer ECDSA Signature:</span>
                    <span className="text-purple-400 truncate max-w-[280px]" title={SAMPLE_EVIDENCE_PROVENANCE.signature}>
                      {SAMPLE_EVIDENCE_PROVENANCE.signature}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-slate-300 flex items-center gap-2.5">
                  <Shield size={16} className="text-emerald-400 shrink-0" />
                  <p className="text-[11px] leading-relaxed">
                    Under Indian Evidence Act Amendment &amp; DPDP Act 2023, this cryptographic evidence provenance record satisfies statutory legal admissibility requirements for disciplinary and judicial proceedings.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
