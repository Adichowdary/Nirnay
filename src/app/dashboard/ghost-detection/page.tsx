"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Ghost,
  ShieldAlert,
  Users,
  Search,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  TrendingDown,
  Building2,
  ArrowRight,
  Sparkles,
  Zap,
  Filter,
  FileCheck2,
  IndianRupee,
  Activity,
  Layers,
  Fingerprint,
  Radio,
  Clock,
  RefreshCw,
} from "lucide-react";
import {
  DEMO_BIOMETRIC_COLLISIONS,
  DEMO_GRANT_ANOMALIES,
  BiometricCollisionRecord,
} from "@/lib/ghost-detection/ghost-data";
import { cn } from "@/lib/utils";

export default function GhostDetectionPage() {
  const [collisions, setCollisions] = useState<BiometricCollisionRecord[]>(
    DEMO_BIOMETRIC_COLLISIONS
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedCluster, setSelectedCluster] = useState<BiometricCollisionRecord | null>(
    DEMO_BIOMETRIC_COLLISIONS[0]
  );
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [scannedVectorsCount, setScannedVectorsCount] = useState<number>(24180);
  const [isScanningActive, setIsScanningActive] = useState<boolean>(true);
  const [autoFreezeAlert, setAutoFreezeAlert] = useState<{ name: string; clusterId: string } | null>(null);

  // Live vector scanning tick
  useEffect(() => {
    if (!isScanningActive) return;
    const interval = setInterval(() => {
      setScannedVectorsCount((prev) => prev + Math.floor(Math.random() * 8) + 2);
    }, 2500);

    return () => clearInterval(interval);
  }, [isScanningActive]);

  const handleSimulateNewCollision = () => {
    const newId = `BIO-COL-${Date.now().toString().slice(-3)}`;
    const newRecord: BiometricCollisionRecord = {
      id: newId,
      clusterId: `CLUST-LIVE-${Math.floor(Math.random() * 90) + 10}`,
      beneficiaryName: "Manish Kumar Sen",
      primaryCenter: "Bhopal Special Vocational Center",
      primaryState: "Madhya Pradesh",
      conflictingCenter: "Gwalior Inclusive Care Center",
      conflictingState: "Madhya Pradesh",
      faceSimilarityScore: 0.982,
      aadhaarHashCollision: true,
      claimedMonthlyStipend: 4800,
      lastSimultaneousCheckIn: "Just now (Simultaneous FRS in 2 centers)",
      riskSeverity: "CRITICAL",
      status: "ACTIVE_FLAG",
      detectedAt: new Date().toISOString(),
    };

    setCollisions((prev) => [newRecord, ...prev]);
    setSelectedCluster(newRecord);
    setAutoFreezeAlert({ name: newRecord.beneficiaryName, clusterId: newRecord.clusterId });
    setActionSuccessMessage(`🚨 NEW BIOMETRIC COLLISION DETECTED: ${newRecord.beneficiaryName} (98.2% match across MP centers)`);
    setTimeout(() => setActionSuccessMessage(null), 5000);
  };

  const handleToggleFreeze = (id: string) => {
    setCollisions((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextStatus =
            c.status === "PAYMENT_FROZEN" ? "ACTIVE_FLAG" : "PAYMENT_FROZEN";
          const msg =
            nextStatus === "PAYMENT_FROZEN"
              ? `DBT Direct Benefit Transfer stipend frozen for ${c.beneficiaryName} pending biometric re-verification.`
              : `DBT Freeze lifted for ${c.beneficiaryName}.`;
          setActionSuccessMessage(msg);
          setTimeout(() => setActionSuccessMessage(null), 4000);
          return { ...c, status: nextStatus };
        }
        return c;
      })
    );
  };

  const filteredCollisions = collisions.filter((c) => {
    const matchesSearch =
      c.beneficiaryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.primaryCenter.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.conflictingCenter.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalLeakageExposureLakhs = collisions.reduce(
    (acc, curr) => acc + (curr.claimedMonthlyStipend * 12) / 100000,
    0
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-inner">
            <Ghost size={30} />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-extrabold text-white tracking-tight">
                Ghost Beneficiary &amp; Fund Anomaly Engine
              </h1>
              <span className="px-3 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1.5 shadow-sm">
                <ShieldAlert className="w-3.5 h-3.5" />
                {collisions.length} CROSS-CENTER IDENTITY COLLISIONS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Multi-center biometric clustering • Simultaneous attendance flags • Grant tranche vs physical milestone divergence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleSimulateNewCollision}
            className="px-3.5 py-2 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg hover:scale-105 transition cursor-pointer"
            title="Simulate live multi-state biometric collision"
          >
            <Sparkles size={13} className="text-amber-300" />
            <span>Simulate Anomaly Ping</span>
          </button>

          <div className="px-4 py-2 rounded-2xl bg-slate-800 border border-slate-700 text-right">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Estimated Leakage Prevented</span>
            <span className="text-sm font-extrabold text-emerald-400 font-mono">
              ₹{(totalLeakageExposureLakhs * 1.8).toFixed(1)} Lakhs / Yr
            </span>
          </div>
        </div>
      </div>

      {/* Live AI Neural Scanner Strip */}
      <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs flex flex-wrap items-center justify-between gap-3 text-slate-300 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-bold text-slate-100">DeepFace AI Biometric Clustering Engine:</span>
          <span className="font-mono text-emerald-400 font-extrabold">{scannedVectorsCount.toLocaleString("en-IN")} Facial Vectors Parsed</span>
          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">(Across 184 National DoSJE Facilities)</span>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="text-slate-400">Model Inference:</span>
          <span className="text-purple-400 font-bold">18ms / frame</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">Cosine Threshold:</span>
          <span className="text-amber-400 font-bold">&gt; 0.940</span>
        </div>
      </div>

      {/* Auto-Freeze Advisory Banner if triggered */}
      {autoFreezeAlert && (
        <div className="p-4 rounded-2xl bg-rose-950/90 border border-rose-500/60 text-rose-100 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xl animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
            <div>
              <p className="font-extrabold text-sm text-white">
                CRITICAL COLLISION: {autoFreezeAlert.name} [{autoFreezeAlert.clusterId}]
              </p>
              <p className="text-[11px] text-rose-300">
                Simultaneous biometric check-in verified across 2 centers. DBT Disbursement auto-lock recommended.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => {
                handleToggleFreeze(collisions[0]?.id);
                setAutoFreezeAlert(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1 shadow"
            >
              <Lock size={12} /> Lock PFMS Stipend
            </button>
            <button
              onClick={() => setAutoFreezeAlert(null)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Action Banner if triggered */}
      {actionSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2.5 shadow-xl animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{actionSuccessMessage}</span>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-base space-y-1">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Biometric Collisions</span>
            <Fingerprint className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-extrabold text-primary font-mono">{collisions.length}</p>
          <span className="text-[10px] text-rose-500 font-medium">4 Critical Multi-State Matches</span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-base space-y-1">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Frozen DBT Accounts</span>
            <Lock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-primary font-mono">
            {collisions.filter((c) => c.status === "PAYMENT_FROZEN").length}
          </p>
          <span className="text-[10px] text-amber-500 font-medium">Disbursements Auto-Halted</span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-base space-y-1">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Grant Divergence Exposure</span>
            <IndianRupee className="w-4 h-4 text-cyan-500" />
          </div>
          <p className="text-2xl font-extrabold text-primary font-mono">₹57.7 L</p>
          <span className="text-[10px] text-cyan-500 font-medium">Tranche vs Physical Progress</span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-base space-y-1">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Facial FRS Similarity Floor</span>
            <Sparkles className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-extrabold text-primary font-mono">&gt; 94.0%</p>
          <span className="text-[10px] text-indigo-500 font-medium">DeepFace Embeddings Model</span>
        </div>
      </div>

      {/* Main Grid: Collision List & Deep Cluster Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Collision List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-4 rounded-2xl bg-card border border-base flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search beneficiary name, center or state..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none"
              >
                <option value="ALL">All Collisions</option>
                <option value="ACTIVE_FLAG">Active Flag</option>
                <option value="PAYMENT_FROZEN">Payment Frozen</option>
                <option value="UNDER_REVIEW">Under Review</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredCollisions.map((record) => {
              const isSelected = selectedCluster?.id === record.id;
              return (
                <div
                  key={record.id}
                  onClick={() => setSelectedCluster(record)}
                  className={cn(
                    "p-4 rounded-2xl border transition-all cursor-pointer space-y-3",
                    isSelected
                      ? "bg-slate-900 border-rose-500/80 shadow-lg ring-1 ring-rose-500/40"
                      : "bg-card border-base hover:border-slate-700"
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                      <h3 className="font-extrabold text-sm text-primary">{record.beneficiaryName}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        {record.clusterId}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          record.status === "PAYMENT_FROZEN"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : record.status === "ACTIVE_FLAG"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                        )}
                      >
                        {record.status.replace("_", " ")}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFreeze(record.id);
                        }}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition",
                          record.status === "PAYMENT_FROZEN"
                            ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                            : "bg-rose-600 hover:bg-rose-500 text-white"
                        )}
                      >
                        {record.status === "PAYMENT_FROZEN" ? (
                          <>
                            <Unlock size={11} /> Unfreeze DBT
                          </>
                        ) : (
                          <>
                            <Lock size={11} /> Freeze DBT
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Dual Center Split Comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 block font-semibold">Center A (Registered):</span>
                      <p className="font-bold text-slate-200 truncate">{record.primaryCenter}</p>
                      <span className="text-[10px] text-slate-500">{record.primaryState}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-rose-400 block font-semibold">Center B (Simultaneous Match):</span>
                      <p className="font-bold text-slate-200 truncate">{record.conflictingCenter}</p>
                      <span className="text-[10px] text-slate-500">{record.conflictingState}</span>
                    </div>
                  </div>

                  {/* Similarity Metrics */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-muted font-mono">
                    <div className="flex items-center gap-3">
                      <span>
                        Facial Match: <strong className="text-rose-400">{(record.faceSimilarityScore * 100).toFixed(1)}%</strong>
                      </span>
                      <span>
                        Aadhaar Hash:{" "}
                        <strong className={record.aadhaarHashCollision ? "text-rose-400" : "text-slate-400"}>
                          {record.aadhaarHashCollision ? "COLLISION ⚠️" : "UNIQUE"}
                        </strong>
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">{record.lastSimultaneousCheckIn}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Deep Cluster Inspector & Grant Anomalies */}
        <div className="space-y-6">
          {selectedCluster && (
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 text-white space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-rose-400" />
                  <h3 className="font-extrabold text-sm text-white">Biometric Cluster Diagnostic</h3>
                </div>
                <span className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                  {selectedCluster.id}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[10px]">Beneficiary Name</span>
                  <p className="font-extrabold text-slate-100 text-sm">{selectedCluster.beneficiaryName}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[10px]">Monthly Claimed DBT Stipend</span>
                  <p className="font-extrabold text-emerald-400 text-sm font-mono">
                    ₹{selectedCluster.claimedMonthlyStipend.toLocaleString("en-IN")} / Month
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[10px]">Statutory AI Action Recommendation</span>
                  <p className="text-xs text-rose-300 leading-relaxed">
                    Initiate physical surprise summons &amp; lock Aadhaar DBT seeding until physical biometric nodal audit.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/dashboard/inspections"
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition"
                >
                  <ShieldAlert size={14} /> Dispatch Surprise Squad Audit
                </Link>
              </div>
            </div>
          )}

          {/* Scheme Grant Tranche vs Physical Progress */}
          <div className="p-5 rounded-3xl bg-card border border-base space-y-4 shadow-sm">
            <div className="flex items-center gap-2 pb-2 border-b border-base">
              <Building2 className="w-4 h-4 text-cyan-500" />
              <h3 className="font-bold text-sm text-primary">Grant Tranche vs Physical Progress</h3>
            </div>

            <div className="space-y-3">
              {DEMO_GRANT_ANOMALIES.map((grant) => (
                <div key={grant.projectId} className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-100 truncate">{grant.projectName}</h4>
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[9px] font-mono font-bold",
                        grant.riskStatus === "HIGH_EXPOSURE"
                          ? "bg-rose-500/20 text-rose-400"
                          : "bg-emerald-500/20 text-emerald-400"
                      )}
                    >
                      {grant.riskStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 font-mono">
                    <div>
                      <span>Claimed: </span>
                      <strong className="text-slate-200">{grant.claimedProgress}%</strong>
                    </div>
                    <div>
                      <span>Verified: </span>
                      <strong className="text-rose-400">{grant.verifiedPhysicalProgress}%</strong>
                    </div>
                  </div>

                  <div className="pt-1 text-[11px] flex justify-between text-slate-400">
                    <span>Tranche Divergence:</span>
                    <span className="font-bold text-amber-400 font-mono">₹{grant.financialDivergenceLakhs} Lakhs</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Algorithmic Threat Timeline */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 text-white space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
            <h3 className="font-extrabold text-sm text-white">Live Biometric Anomaly Stream & Audit Trail</h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
              REAL-TIME BROADCAST
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Connected to 184 Edge Biometric Nodes
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              time: "2 mins ago",
              badge: "SIMULTANEOUS FRS",
              color: "text-rose-400 bg-rose-500/20 border-rose-500/30",
              title: "Cross-District Face Match (98.4%)",
              desc: "Jaipur Center & Jodhpur Institute reported matching facial vector with 0s delta.",
              action: "Auto-summon dispatched",
            },
            {
              time: "8 mins ago",
              badge: "AADHAAR CLUSTER",
              color: "text-amber-400 bg-amber-500/20 border-amber-500/30",
              title: "Duplicate UIDAI Mask Hash",
              desc: "Same Aadhaar vault hash associated with 2 active stipend allocations in UP & Delhi.",
              action: "Stipend flagged in PFMS",
            },
            {
              time: "19 mins ago",
              badge: "GRANT RATIO ALERT",
              color: "text-sky-400 bg-sky-500/20 border-sky-500/30",
              title: "Tranche 2 Disbursed (₹37.4L Divergence)",
              desc: "Physical infrastructure milestone at 48% vs mandatory 70% threshold for tranche release.",
              action: "Under Financial Triage",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2 hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between gap-1 text-[10px]">
                <span className={`px-2 py-0.5 rounded font-mono font-bold border ${item.color}`}>
                  {item.badge}
                </span>
                <span className="text-slate-500 font-mono">{item.time}</span>
              </div>
              <p className="font-bold text-xs text-slate-200">{item.title}</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
              <div className="pt-1 flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                <CheckCircle2 size={12} className="text-emerald-400" />
                <span>Action: {item.action}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
