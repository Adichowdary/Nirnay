"use client";

import { useState, useEffect } from "react";
import {
  Video,
  X,
  Maximize2,
  Minimize2,
  Camera,
  AlertTriangle,
  Radio,
  CheckCircle2,
  Users,
  Shield,
  Eye,
  RefreshCw,
  Database,
  Lock,
} from "lucide-react";
import { DEMO_PROJECTS } from "@/lib/demo-data";
import { SecureVisionChainPanel } from "./SecureVisionChainPanel";

interface CCTVMatrixModalProps {
  onClose: () => void;
  initialProjectId?: string;
}

export function CCTVMatrixModal({ onClose, initialProjectId }: CCTVMatrixModalProps) {
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId || DEMO_PROJECTS[0]?.id || "PRJ-001");
  const [activeCamIndex, setActiveCamIndex] = useState<number | null>(null); // null = 4-grid matrix, 0..3 = single cam
  const [tamperAlert, setTamperAlert] = useState<string | null>(null);
  const [headcount, setHeadcount] = useState(14);
  const [isAiOverlayActive, setIsAiOverlayActive] = useState(true);
  const [showSecureVisionChain, setShowSecureVisionChain] = useState(false);
  const [selectedCamForChain, setSelectedCamForChain] = useState("CAM-01");

  const selectedProject = DEMO_PROJECTS.find((p) => p.id === selectedProjectId) || DEMO_PROJECTS[0];

  // Headcount jitter simulation for live AI computer vision model
  useEffect(() => {
    const iv = setInterval(() => {
      setHeadcount((prev) => Math.max(8, Math.min(28, prev + Math.floor(Math.random() * 3) - 1)));
    }, 3000);
    return () => clearInterval(iv);
  }, []);

  const cameras = [
    {
      id: "CAM-01",
      name: "Main Entrance & FRS Turnstile",
      status: "ONLINE",
      fps: 25,
      codec: "H.265 / WebRTC",
      personCount: Math.floor(headcount * 0.4),
      color: "#10B981",
    },
    {
      id: "CAM-02",
      name: "Biometric Attendance & Class Hall",
      status: "ONLINE",
      fps: 25,
      codec: "H.265 / WebRTC",
      personCount: Math.floor(headcount * 0.6),
      color: "#10B981",
    },
    {
      id: "CAM-03",
      name: "Vocational Workshop & Facility Perimeter",
      status: selectedProject.cctv_online < selectedProject.cctv_total ? "OFFLINE" : "ONLINE",
      fps: selectedProject.cctv_online < selectedProject.cctv_total ? 0 : 25,
      codec: "RTSP Live Stream",
      personCount: selectedProject.cctv_online < selectedProject.cctv_total ? 0 : 3,
      color: selectedProject.cctv_online < selectedProject.cctv_total ? "#EF4444" : "#10B981",
    },
    {
      id: "CAM-04",
      name: "Dining Hall & Nutrition Center",
      status: "ONLINE",
      fps: 24,
      codec: "H.265 / WebRTC",
      personCount: 5,
      color: "#10B981",
    },
  ];

  const handleTamperTest = () => {
    setTamperAlert("⚠️ Anomaly Detected: Camera 03 stream disrupted (Possible Lens Occlusion)");
    setTimeout(() => setTamperAlert(null), 5000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-5xl h-[90vh] bg-slate-950 border border-slate-800 text-white rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
              <Video size={20} className="text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-white">NIRNAY Real-Time CCTV Surveillance Matrix</h3>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  RTSP/WebRTC LIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                ISRO Bhuvan Cadastral Link: {selectedProject.name} ({selectedProject.district_name}, {selectedProject.state})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Facility Selector */}
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-200 border border-slate-700 cursor-pointer focus:outline-none"
            >
              {DEMO_PROJECTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.district_name})
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowSecureVisionChain(true)}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Inspect 4-Layer Security, SRTP Encryption & Hyperledger Blockchain Audit"
            >
              <Shield size={14} className="text-cyan-400" />
              <span>SecureVision Chain</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            <button
              onClick={() => setIsAiOverlayActive(!isAiOverlayActive)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                isAiOverlayActive
                  ? "bg-blue-600/30 text-blue-400 border border-blue-500/40"
                  : "bg-slate-800 text-slate-400 border border-slate-700"
              }`}
            >
              <Eye size={14} /> AI Bounding Boxes {isAiOverlayActive ? "ON" : "OFF"}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Alert Banner */}
        {tamperAlert && (
          <div className="px-4 py-2 bg-rose-950/80 border-b border-rose-500/40 text-rose-300 text-xs font-bold flex items-center justify-between animate-bounce">
            <span className="flex items-center gap-2">
              <AlertTriangle size={15} /> {tamperAlert}
            </span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-rose-600 text-white rounded">
              AUTO-INCIDENT LOGGED
            </span>
          </div>
        )}

        {/* Matrix Grid */}
        <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-slate-950 overflow-y-auto">
          {cameras.map((cam, idx) => {
            const isOffline = cam.status === "OFFLINE";

            return (
              <div
                key={cam.id}
                className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex flex-col group shadow-lg"
              >
                {/* Video Area */}
                <div className="relative flex-1 min-h-[190px] bg-slate-950 flex items-center justify-center overflow-hidden">
                  {/* Simulated Camera Video Pattern */}
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: "radial-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 0)",
                      backgroundSize: "20px 20px",
                    }}
                  />

                  {isOffline ? (
                    <div className="text-center p-4">
                      <AlertTriangle size={32} className="mx-auto text-rose-500 mb-2 animate-pulse" />
                      <p className="text-xs font-mono font-bold text-rose-400">CAMERA OFFLINE / DISCONNECTED</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Hardware ping failed (Last online: 24h ago)</p>
                    </div>
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <Video size={36} className="mx-auto text-emerald-400/80 mb-2 animate-pulse" />
                        <p className="text-xs font-mono font-bold text-slate-300">{cam.name}</p>
                        <p className="text-[10px] text-slate-500">{cam.codec} • 1080p @ {cam.fps} FPS</p>
                      </div>

                      {/* AI Computer Vision Bounding Box Overlays */}
                      {isAiOverlayActive && (
                        <>
                          <div className="absolute top-1/4 left-1/4 w-28 h-32 border-2 border-emerald-400 rounded-lg bg-emerald-500/10 flex flex-col justify-between p-1 text-[9px] font-mono font-bold text-emerald-300">
                            <span>PERSON #1 (98%)</span>
                            <span>LIVENESS: LIVE</span>
                          </div>
                          <div className="absolute bottom-6 right-1/4 w-24 h-24 border border-cyan-400 rounded-lg bg-cyan-500/10 flex flex-col justify-between p-1 text-[9px] font-mono font-bold text-cyan-300">
                            <span>ZONE: DESK</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Camera Header Overlay */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between text-[10px] font-mono font-bold">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-black/70 text-slate-200 border border-white/10">
                        {cam.id} • {cam.name}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCamForChain(cam.id);
                          setShowSecureVisionChain(true);
                        }}
                        className="px-2 py-0.5 rounded bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 cursor-pointer transition"
                        title="Inspect WebRTC SRTP Encryption & Blockchain Hash"
                      >
                        <Lock size={9} /> SRTP Encrypted
                      </button>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded flex items-center gap-1 ${
                        isOffline ? "bg-rose-500/80 text-white" : "bg-emerald-500/80 text-white"
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      {cam.status}
                    </span>
                  </div>

                  {/* Camera Footer Overlay */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[10px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-black/70 text-slate-400">
                      {new Date().toLocaleTimeString("en-IN")} IST
                    </span>
                    <span className="px-2 py-0.5 rounded bg-black/70 text-cyan-300 font-bold flex items-center gap-1">
                      <Users size={11} /> Headcount: {cam.personCount}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Control Strip */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-4 text-slate-400 text-[11px] font-medium">
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <CheckCircle2 size={13} /> 3 Online
            </span>
            <span className="flex items-center gap-1 text-rose-400 font-bold">
              <AlertTriangle size={13} /> 1 Offline
            </span>
            <span>Total Headcount Estimate: <strong className="text-white">{headcount} Persons</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSecureVisionChain(true)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
            >
              <Database size={13} /> Blockchain Audit Ledger (NIST Verified)
            </button>
            <button
              onClick={handleTamperTest}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition cursor-pointer flex items-center gap-1"
            >
              <AlertTriangle size={13} /> Simulate Tamper Alarm
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer"
            >
              Done / Return to Map
            </button>
          </div>
        </div>
      </div>

      {/* SecureVision Chain Panel Modal */}
      {showSecureVisionChain && (
        <SecureVisionChainPanel
          onClose={() => setShowSecureVisionChain(false)}
          selectedCameraId={selectedCamForChain}
          facilityName={selectedProject.name}
        />
      )}
    </div>
  );
}
