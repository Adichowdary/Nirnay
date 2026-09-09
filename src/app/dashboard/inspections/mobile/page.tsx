"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { DEMO_INSPECTION_ACTIVE, DEMO_PROJECTS } from "@/lib/demo-data";
import {
  MapPin,
  Navigation,
  CheckCircle,
  AlertTriangle,
  Camera,
  ClipboardCheck,
  ChevronRight,
  Wifi,
  WifiOff,
  Battery,
  Shield,
  Clock,
  ArrowRight,
  User,
  Zap,
  Mic,
  Sun,
  RotateCcw,
  ArrowLeft,
  Users,
  FileCheck,
} from "lucide-react";

type InspectionStep =
  | "mission"
  | "arrival"
  | "checklist"
  | "attendance"
  | "beneficiary"
  | "evidence"
  | "observations"
  | "declaration"
  | "submitted";

const STEP_INFO: Record<InspectionStep, { index: number; label: string }> = {
  mission: { index: 1, label: "Mission Briefing" },
  arrival: { index: 2, label: "GPS Geofence" },
  checklist: { index: 3, label: "Facility Checklist" },
  attendance: { index: 4, label: "Attendance Verification" },
  beneficiary: { index: 5, label: "Beneficiary Feedback" },
  evidence: { index: 6, label: "Tamper-Proof Evidence" },
  observations: { index: 7, label: "Field Observations" },
  declaration: { index: 8, label: "Sign & Submit" },
  submitted: { index: 8, label: "Dossier Sealed" },
};

export default function MobileInspectionApp() {
  const [step, setStep] = useState<InspectionStep>("mission");
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isOutdoorMode, setIsOutdoorMode] = useState<boolean>(false);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  // GPS Telemetry State
  const [accuracy] = useState<number>(4);
  const [offsetDistance] = useState<number>(38);

  // Checklist State
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Attendance State
  const [reported, setReported] = useState<string>("74");
  const [observed, setObserved] = useState<string>("51");

  // Beneficiary Feedback State
  const [beneficiaryFeedback, setBeneficiaryFeedback] = useState<Record<string, number>>({
    services: 4,
    food: 5,
  });

  // Evidence Media State
  const [capturedPhotos, setCapturedPhotos] = useState<
    Array<{ id: string; title: string; timestamp: string; hash: string; coords: string; url: string }>
  >([
    {
      id: "EVD-01",
      title: "Entrance & Ramp Assessment",
      timestamp: "14:35:10 IST",
      hash: "8f4b52c79a9e3d81b24e6501a2d718b560195e26c6d231940989fba7541b2c45",
      coords: "16.3067°N, 80.4365°E",
      url: "https://images.unsplash.com/photo-1584467735815-f778f274e296?w=600&auto=format&fit=crop&q=80",
    },
  ]);
  const [isShutterActive, setIsShutterActive] = useState<boolean>(false);

  // Voice Note State
  const [isRecordingVoice, setIsRecordingVoice] = useState<boolean>(false);
  const [voiceNoteRecorded, setVoiceNoteRecorded] = useState<boolean>(false);

  // Signature Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hasSigned, setHasSigned] = useState<boolean>(false);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  const project = DEMO_PROJECTS.find((p) => p.id === DEMO_INSPECTION_ACTIVE.project_id) || DEMO_PROJECTS[0];

  // Attendance variance calculation
  const repNum = Number(reported) || 0;
  const obsNum = Number(observed) || 0;
  const diff = repNum - obsNum;
  const variancePct = repNum > 0 ? ((diff / repNum) * 100).toFixed(1) : "0";
  const isHighVariance = Number(variancePct) > 20;

  // HTML5 Canvas Signature handling
  function startDrawing(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = isOutdoorMode ? "#000000" : "#1D4FD1";

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSigned(true);
  }

  function stopDrawing() {
    setIsDrawing(false);
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  }

  function snapLiveEvidence() {
    setIsShutterActive(true);
    setTimeout(() => {
      setIsShutterActive(false);
      const timeStr = new Date().toLocaleTimeString("en-IN", { hour12: false });
      const newEvd = {
        id: `EVD-0${capturedPhotos.length + 1}`,
        title: `Live Verified Frame #${capturedPhotos.length + 1}`,
        timestamp: `${timeStr} IST`,
        hash: "3a7c91e4f2081d59ba2e6501a2d718b560195e26c6d231940989fba7541e98d1",
        coords: `${project.location.latitude.toFixed(4)}°N, ${project.location.longitude.toFixed(4)}°E`,
        url: "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=600&auto=format&fit=crop&q=80",
      };
      setCapturedPhotos((prev) => [...prev, newEvd]);
      if (isOffline) setPendingSyncCount((c) => c + 1);
    }, 400);
  }

  function triggerVoiceMemo() {
    if (!isRecordingVoice) {
      setIsRecordingVoice(true);
      setTimeout(() => {
        setIsRecordingVoice(false);
        setVoiceNoteRecorded(true);
      }, 2500);
    }
  }

  return (
    <div
      className={`min-h-screen w-full flex flex-col items-center ${
        isOutdoorMode ? "bg-amber-50 text-neutral-900" : "bg-app text-primary"
      }`}
    >
      {/* Container — Full width on mobile phones, max-w-lg cleanly centered on tablets/laptops */}
      <div className="w-full max-w-lg min-h-screen bg-card flex flex-col border-x border-base shadow-sm">
        {/* Top Header */}
        <header
          className="sticky top-0 z-20 px-4 py-3 border-b border-base flex items-center justify-between gap-2"
          style={{ backgroundColor: isOutdoorMode ? "#FEF3C7" : "var(--surface-card)" }}
        >
          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard/inspections"
              className="p-1.5 rounded-lg border border-base bg-secondary text-secondary hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Back to Inspections"
            >
              <ArrowLeft size={16} aria-hidden="true" />
            </Link>
            <div>
              <div className="flex items-center gap-1.5">
                <Shield size={14} className="text-blue-base" aria-hidden="true" />
                <span className="font-bold text-xs text-primary leading-tight">INSIGHT Field</span>
              </div>
              <p className="text-[10px] text-muted leading-none mt-0.5 font-mono">
                Step {STEP_INFO[step].index}/8: {STEP_INFO[step].label}
              </p>
            </div>
          </div>

          {/* Quick Field Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsOutdoorMode(!isOutdoorMode)}
              className={`p-1.5 rounded-lg border transition-colors ${
                isOutdoorMode
                  ? "bg-amber-400 text-black border-amber-500 shadow-sm"
                  : "bg-secondary text-secondary border-base hover:text-primary"
              }`}
              title="High contrast outdoor readability mode for field sunlight"
              aria-label="Toggle outdoor sunlight mode"
            >
              <Sun size={15} aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => setIsOffline(!isOffline)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                isOffline
                  ? "bg-amber-tint text-amber-strong border-amber-base"
                  : "bg-green-tint text-green-strong border-green-base"
              }`}
              title="Toggle network simulation"
            >
              {isOffline ? <WifiOff size={12} aria-hidden="true" /> : <Wifi size={12} aria-hidden="true" />}
              <span>{isOffline ? "Offline" : "5G Online"}</span>
            </button>
          </div>
        </header>

        {/* Step Progress Bar */}
        {step !== "submitted" && (
          <div
            className="flex items-center justify-center gap-1.5 px-4 py-2 flex-shrink-0"
            style={{
              borderBottom: "1px solid var(--border-light)",
              background: isOutdoorMode ? "#FEF9E7" : "var(--surface-secondary)",
            }}
            role="progressbar"
            aria-valuenow={STEP_INFO[step].index}
            aria-valuemin={1}
            aria-valuemax={8}
            aria-label={`Step ${STEP_INFO[step].index} of 8: ${STEP_INFO[step].label}`}
          >
            {(Object.keys(STEP_INFO) as InspectionStep[]).filter(s => s !== "submitted").map((s) => {
              const thisIdx = STEP_INFO[s].index;
              const curIdx  = STEP_INFO[step].index;
              const state   = thisIdx < curIdx ? "done" : thisIdx === curIdx ? "active" : "pending";
              return (
                <div
                  key={s}
                  className={`progress-step ${state}`}
                  title={STEP_INFO[s].label}
                />
              );
            })}
            <span
              className="text-[10px] font-mono ml-2 flex-shrink-0"
              style={{ color: "var(--text-muted)" }}
            >
              {STEP_INFO[step].index}/8
            </span>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 space-y-4 overflow-y-auto">
          {/* STEP 1: MISSION BRIEFING */}
          {step === "mission" && (
            <div className="space-y-4 animate-in">
              <div className="card p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <span className="status-pill bg-red-tint text-red-strong text-[10px] font-bold">
                    PRIORITY SURPRISE INSPECTION
                  </span>
                  <span className="text-[10px] font-mono text-muted">ID: INSP-0094</span>
                </div>

                <div>
                  <h1 className="text-base font-bold text-primary">{project.name}</h1>
                  <p className="text-xs text-muted mt-0.5">{project.district_name}, {project.state}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2.5 rounded bg-secondary">
                    <span className="text-muted text-[10px] block">SCHEME</span>
                    <span className="font-semibold text-primary truncate block">{project.scheme_name}</span>
                  </div>
                  <div className="p-2.5 rounded bg-secondary">
                    <span className="text-muted text-[10px] block">FACILITY INCHARGE</span>
                    <span className="font-semibold text-primary truncate block">{project.incharge_name}</span>
                  </div>
                  <div className="p-2.5 rounded bg-secondary">
                    <span className="text-muted text-[10px] block">DISTANCE</span>
                    <span className="font-semibold text-blue-base">18.4 km</span>
                  </div>
                  <div className="p-2.5 rounded bg-secondary">
                    <span className="text-muted text-[10px] block">ESTIMATED TRAVEL</span>
                    <span className="font-semibold text-green-strong">24 mins</span>
                  </div>
                </div>
              </div>

              <div className="card p-3.5 bg-secondary space-y-1 text-xs">
                <span className="section-label">SURPRISE PROTOCOL REQUIREMENTS</span>
                <p className="text-muted text-[11px] leading-relaxed">
                  Zero advance notice has been delivered. On arrival, stand within 100m of the registered centroid to unlock physical attendance and evidence cameras.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setStep("arrival")}
                className="w-full py-3.5 rounded-xl bg-blue-base text-white text-xs font-bold shadow-md hover:opacity-90 flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <Navigation size={15} aria-hidden="true" />
                START INSPECTION EN ROUTE
              </button>
            </div>
          )}

          {/* STEP 2: GPS GEOFENCE VERIFICATION */}
          {step === "arrival" && (
            <div className="space-y-4 animate-in text-center">
              <div className="w-20 h-20 rounded-full bg-blue-tint text-blue-base mx-auto flex items-center justify-center relative mt-2">
                <MapPin size={36} aria-hidden="true" />
                <div className="absolute inset-0 rounded-full border-2 border-blue-base animate-ping opacity-25" />
              </div>

              <div>
                <h2 className="text-sm font-bold text-primary">GNSS Geofence Verification</h2>
                <p className="text-xs text-muted mt-1">Dual-band satellite positioning required on campus</p>
              </div>

              <div className="card p-3.5 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted">Target Centroid:</span>
                  <span className="font-mono text-primary">{project.location.latitude}°N, {project.location.longitude}°E</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Enforcement Radius:</span>
                  <span className="font-semibold text-primary">100 meters</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Current GNSS Drift:</span>
                  <span className="font-semibold text-green-strong">±{accuracy}m (Lock Active)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Offset from Facility:</span>
                  <span className="font-bold text-green-strong">{offsetDistance} meters (Inside Geofence)</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-green-tint text-green-strong text-xs font-semibold flex items-center justify-center gap-1.5">
                <CheckCircle size={15} aria-hidden="true" />
                Officer Location Authenticated on Premises
              </div>

              <button
                type="button"
                onClick={() => setStep("checklist")}
                className="w-full py-3.5 rounded-xl bg-blue-base text-white text-xs font-bold shadow-md hover:opacity-90 flex items-center justify-center gap-2"
              >
                <ClipboardCheck size={15} aria-hidden="true" />
                PROCEED TO FACILITY CHECKLIST
              </button>
            </div>
          )}

          {/* STEP 3: STANDARDIZED CHECKLIST */}
          {step === "checklist" && (
            <div className="space-y-3 animate-in">
              <div>
                <h2 className="text-xs font-bold text-primary">Standardized 10-Point Checklist</h2>
                <p className="text-[11px] text-muted">Tap answers based on on-site visual verification</p>
              </div>

              <div className="space-y-2.5">
                {[
                  { id: "c1", q: "Is the facility operational during designated scheme hours?", cat: "Operations" },
                  { id: "c2", q: "Are all registered beneficiaries accounted for?", cat: "Attendance" },
                  { id: "c3", q: "Is physical attendance register signed & up to date?", cat: "Documentation" },
                  { id: "c4", q: "Are CCTV cameras functional and recording to DVR?", cat: "Security" },
                  { id: "c5", q: "Are qualified instructors / therapists on duty?", cat: "Staffing" },
                ].map((item) => (
                  <div key={item.id} className="card p-3 space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-muted">
                      <span className="font-mono uppercase">{item.cat}</span>
                      <span className="text-red-500 font-bold">*Required</span>
                    </div>
                    <p className="text-xs font-medium text-primary leading-tight">{item.q}</p>

                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      {["YES", "NO", "N/A", "PARTIAL"].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setAnswers((prev) => ({ ...prev, [item.id]: opt }))}
                          className={`py-2 rounded text-[11px] font-bold border transition-colors ${
                            answers[item.id] === opt
                              ? opt === "YES"
                                ? "bg-green-base text-white border-green-base"
                                : opt === "NO"
                                ? "bg-red-base text-white border-red-base"
                                : "bg-amber-base text-white border-amber-base"
                              : "bg-secondary text-muted border-base"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setStep("attendance")}
                className="w-full py-3.5 rounded-xl bg-blue-base text-white text-xs font-bold shadow-md hover:opacity-90 mt-2"
              >
                CONTINUE TO ATTENDANCE COUNT
              </button>
            </div>
          )}

          {/* STEP 4: ATTENDANCE VERIFICATION */}
          {step === "attendance" && (
            <div className="space-y-4 animate-in">
              <div>
                <h2 className="text-xs font-bold text-primary">Attendance Head Count Verification</h2>
                <p className="text-[11px] text-muted">Compare physical register vs in-person head count</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label htmlFor="reported-count" className="section-label block mb-1">
                    1. REPORTED IN PHYSICAL REGISTER
                  </label>
                  <input
                    id="reported-count"
                    type="number"
                    inputMode="numeric"
                    value={reported}
                    onChange={(e) => setReported(e.target.value)}
                    className="w-full p-3 rounded-xl border border-base bg-secondary text-primary font-bold text-center text-2xl tabular focus-visible:ring-2 focus-visible:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="observed-count" className="section-label block mb-1">
                    2. PHYSICALLY VERIFIED HEAD COUNT
                  </label>
                  <input
                    id="observed-count"
                    type="number"
                    inputMode="numeric"
                    value={observed}
                    onChange={(e) => setObserved(e.target.value)}
                    className="w-full p-3 rounded-xl border border-base bg-secondary text-primary font-bold text-center text-2xl tabular focus-visible:ring-2 focus-visible:ring-blue-500"
                  />
                </div>
              </div>

              {/* Instant Real-Time Discrepancy Card */}
              <div
                className={`card p-3.5 space-y-2 border-l-4 ${
                  isHighVariance ? "border-l-red-base bg-red-tint/30" : "border-l-green-base bg-green-tint/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary">Statistical Discrepancy:</span>
                  <span
                    className={`text-xs font-bold tabular px-2 py-0.5 rounded ${
                      isHighVariance ? "bg-red-tint text-red-strong" : "bg-green-tint text-green-strong"
                    }`}
                  >
                    {variancePct}% Variance
                  </span>
                </div>
                <div className="text-xs text-muted flex justify-between">
                  <span>Missing / Unaccounted:</span>
                  <span className="font-bold text-primary tabular">{diff > 0 ? `-${diff} Beneficiaries` : "0"}</span>
                </div>
                {isHighVariance && (
                  <p className="text-[10px] text-red-text font-medium leading-tight">
                    ⚠️ Exceeds 20% tolerance limit. This anomaly will automatically attach to the official inspection dossier.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setStep("beneficiary")}
                className="w-full py-3.5 rounded-xl bg-blue-base text-white text-xs font-bold shadow-md hover:opacity-90"
              >
                CONTINUE TO BENEFICIARY INTERACTION
              </button>
            </div>
          )}

          {/* STEP 5: BENEFICIARY INTERACTION */}
          {step === "beneficiary" && (
            <div className="space-y-4 animate-in">
              <div>
                <div className="flex items-center gap-1.5">
                  <Users size={16} className="text-blue-base" aria-hidden="true" />
                  <h2 className="text-xs font-bold text-primary">Beneficiary Interaction & Scheme Audit</h2>
                </div>
                <p className="text-[11px] text-muted mt-0.5">
                  Anonymous field interviews to verify direct service delivery
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="card p-3 space-y-1.5">
                  <p className="font-medium text-primary leading-tight">
                    1. Are scheduled skill/rehabilitation sessions held consistently?
                  </p>
                  <div className="flex gap-2 pt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setBeneficiaryFeedback((f) => ({ ...f, services: star }))}
                        className={`flex-1 py-2 rounded font-bold text-xs ${
                          beneficiaryFeedback.services >= star ? "bg-blue-base text-white" : "bg-secondary text-muted"
                        }`}
                      >
                        ★ {star}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="card p-3 space-y-1.5">
                  <p className="font-medium text-primary leading-tight">
                    2. Are mandated meals, aids, or stipends provided without deductions?
                  </p>
                  <div className="flex gap-2 pt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setBeneficiaryFeedback((f) => ({ ...f, food: star }))}
                        className={`flex-1 py-2 rounded font-bold text-xs ${
                          beneficiaryFeedback.food >= star ? "bg-blue-base text-white" : "bg-secondary text-muted"
                        }`}
                      >
                        ★ {star}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-secondary text-[10px] text-muted">
                Beneficiary identities remain masked under the DPDP Act 2023. Audio and qualitative feedback are anonymous.
              </div>

              <button
                type="button"
                onClick={() => setStep("evidence")}
                className="w-full py-3.5 rounded-xl bg-blue-base text-white text-xs font-bold shadow-md hover:opacity-90"
              >
                CONTINUE TO EVIDENCE CAMERA
              </button>
            </div>
          )}

          {/* STEP 6: TAMPER-EVIDENT EVIDENCE CAMERA */}
          {step === "evidence" && (
            <div className="space-y-4 animate-in">
              <div>
                <h2 className="text-xs font-bold text-primary">Tamper-Evident Media Capture</h2>
                <p className="text-[11px] text-muted">GPS telemetry and SHA-256 hash burned directly into frame</p>
              </div>

              {/* Camera Viewfinder */}
              <div className="relative aspect-[4/3] bg-black rounded-xl overflow-hidden shadow-inner border border-neutral-700">
                <img
                  src="https://images.unsplash.com/photo-1577896851231-70ef18881754?w=600&auto=format&fit=crop&q=80"
                  alt="Camera Viewfinder"
                  className="w-full h-full object-cover opacity-80"
                />

                {/* Burned-in Watermark Overlay */}
                <div className="absolute top-2 left-2 right-2 flex justify-between text-[9px] font-mono text-white bg-black/60 backdrop-blur-sm p-1.5 rounded">
                  <span>GPS: {project.location.latitude.toFixed(4)}°N, {project.location.longitude.toFixed(4)}°E</span>
                  <span>ACCURACY: ±{accuracy}m</span>
                </div>

                <div className="absolute bottom-2 left-2 right-2 text-[9px] font-mono text-white bg-black/60 backdrop-blur-sm p-1.5 rounded">
                  <div>TIMESTAMP: {new Date().toISOString()}</div>
                  <div className="text-green-400">HASH: 3a7c91e4f2081d59ba2e6501a2d718b5...</div>
                </div>

                {isShutterActive && <div className="absolute inset-0 bg-white animate-fade-out" />}
              </div>

              {/* Shutter Button */}
              <div className="flex items-center justify-center py-1">
                <button
                  type="button"
                  onClick={snapLiveEvidence}
                  className="w-16 h-16 rounded-full border-4 border-white bg-red-600 shadow-xl active:scale-95 transition-transform flex items-center justify-center text-white"
                  aria-label="Capture geotagged evidence photo"
                >
                  <Camera size={24} aria-hidden="true" />
                </button>
              </div>

              {/* Captured Frames Reel */}
              <div className="space-y-1">
                <span className="section-label">CAPTURED FRAMES ({capturedPhotos.length})</span>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {capturedPhotos.map((photo) => (
                    <div key={photo.id} className="w-20 aspect-video rounded bg-neutral-900 overflow-hidden relative flex-shrink-0 border border-base">
                      <img src={photo.url} alt={photo.title} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] font-mono text-white text-center">
                        {photo.id}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep("observations")}
                className="w-full py-3.5 rounded-xl bg-blue-base text-white text-xs font-bold shadow-md hover:opacity-90"
              >
                PROCEED TO VOICE OBSERVATIONS
              </button>
            </div>
          )}

          {/* STEP 7: OBSERVATIONS & VOICE MEMO */}
          {step === "observations" && (
            <div className="space-y-4 animate-in">
              <div>
                <h2 className="text-xs font-bold text-primary">Officer Qualitative Observations</h2>
                <p className="text-[11px] text-muted">Record audio notes or dictate findings while on-site</p>
              </div>

              <div className="card p-4 text-center space-y-3 bg-secondary">
                <button
                  type="button"
                  onClick={triggerVoiceMemo}
                  className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center text-white shadow-md transition-all ${
                    isRecordingVoice ? "bg-red-600 animate-pulse scale-110" : "bg-blue-base hover:opacity-90"
                  }`}
                  aria-label={isRecordingVoice ? "Recording voice observation" : "Start voice recording"}
                >
                  <Mic size={22} aria-hidden="true" />
                </button>
                <div>
                  <span className="text-xs font-bold text-primary block">
                    {isRecordingVoice ? "Listening… (Recording Field Voice Note)" : voiceNoteRecorded ? "Voice Note Saved (0:34)" : "Tap Mic to Dictate Findings"}
                  </span>
                  <span className="text-[10px] text-muted mt-0.5 block">
                    Automated speech-to-text transcription enabled
                  </span>
                </div>

                {voiceNoteRecorded && (
                  <div className="p-2.5 rounded bg-card text-left text-[11px] text-primary border border-base font-mono leading-tight">
                    &quot;Verified physical register showing 74 enrolled. In-person head count confirmed 51 beneficiaries present in rooms A and B. 23 unaccounted for. Incharge claims seasonal absence.&quot;
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="notes-text" className="section-label block mb-1">
                  WRITTEN REMARKS (OPTIONAL)
                </label>
                <textarea
                  id="notes-text"
                  rows={3}
                  placeholder="Enter additional findings, equipment status, or disciplinary remarks…"
                  className="w-full p-2.5 rounded-lg border border-base bg-secondary text-xs text-primary placeholder:text-muted focus-visible:ring-2 focus-visible:ring-blue-500"
                  defaultValue="Recommend formal verification inquiry regarding attendance discrepancy of 23 beneficiaries."
                />
              </div>

              <button
                type="button"
                onClick={() => setStep("declaration")}
                className="w-full py-3.5 rounded-xl bg-blue-base text-white text-xs font-bold shadow-md hover:opacity-90"
              >
                PROCEED TO FINAL DECLARATION
              </button>
            </div>
          )}

          {/* STEP 8: DIGITAL SIGNATURE & DECLARATION */}
          {step === "declaration" && (
            <div className="space-y-4 animate-in">
              <div>
                <h2 className="text-xs font-bold text-primary">Officer Declaration & Digital Signature</h2>
                <p className="text-[11px] text-muted">Legal certification under DoSJE Inspection Bylaws</p>
              </div>

              <div className="card p-3.5 bg-secondary text-xs space-y-1.5 leading-relaxed text-secondary">
                <p>
                  I, <strong>Officer S. Mehra</strong> (ID: PMU-TG-0022), hereby solemnly declare that this inspection was conducted personally on-site at the specified GPS coordinates and time. All evidence captured is authentic.
                </p>
              </div>

              {/* Touch Signature Canvas */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="section-label">DRAW DIGITAL SIGNATURE ON SCREEN</span>
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="text-[11px] text-blue-base font-semibold hover:underline flex items-center gap-1"
                  >
                    <RotateCcw size={10} aria-hidden="true" />
                    Clear
                  </button>
                </div>

                <div className="border-2 border-dashed border-base rounded-xl overflow-hidden bg-card relative">
                  <canvas
                    ref={canvasRef}
                    width={340}
                    height={130}
                    className="w-full h-[130px] touch-none cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                  {!hasSigned && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-muted text-xs italic">
                      Sign with finger or stylus here
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep("submitted")}
                className="w-full py-4 rounded-xl bg-green-base text-white text-xs font-bold shadow-lg hover:opacity-90 flex items-center justify-center gap-2"
              >
                <Shield size={16} aria-hidden="true" />
                DIGITALLY SEAL & SUBMIT REPORT
              </button>
            </div>
          )}

          {/* STEP 9: SUBMISSION CONFIRMATION */}
          {step === "submitted" && (
            <div className="card p-6 text-center space-y-4 animate-in">
              <div className="w-16 h-16 rounded-full bg-green-tint text-green-strong mx-auto flex items-center justify-center">
                <CheckCircle size={36} aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-bold text-primary">Inspection Dossier Committed</h2>
                <p className="text-xs text-muted mt-1">Cryptographically hashed and uploaded to DoSJE ledger.</p>
              </div>

              <div className="card p-3.5 bg-secondary text-left space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-muted">Report ID:</span>
                  <span className="text-primary font-bold">INSP-0094-V3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Digital Seal:</span>
                  <span className="text-green-strong font-bold">SHA-256 VALID</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Status:</span>
                  <span className="text-amber-strong font-bold">AI ANOMALY FLAGGED</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Link
                  href="/dashboard/inspections/INSP-0089"
                  className="w-full py-3 rounded-lg bg-blue-base text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:opacity-90"
                >
                  View Official Digital Dossier
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setStep("mission");
                    setHasSigned(false);
                  }}
                  className="w-full py-2.5 rounded-lg border border-base text-xs font-medium text-secondary hover:bg-secondary"
                >
                  Start New Field Mission
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Sticky Mobile Bottom Navigation */}
        <footer
          className="sticky bottom-0 z-20 px-4 py-2.5 border-t border-base flex items-center justify-around text-muted text-[10px]"
          style={{ backgroundColor: isOutdoorMode ? "#FEF3C7" : "var(--surface-card)" }}
        >
          <button
            type="button"
            onClick={() => setStep("mission")}
            className={`flex flex-col items-center gap-0.5 ${step === "mission" ? "text-blue-base font-bold" : ""}`}
          >
            <Shield size={16} aria-hidden="true" />
            <span>Mission</span>
          </button>

          <button
            type="button"
            onClick={() => setStep("arrival")}
            className={`flex flex-col items-center gap-0.5 ${step === "arrival" ? "text-blue-base font-bold" : ""}`}
          >
            <MapPin size={16} aria-hidden="true" />
            <span>GPS</span>
          </button>

          <button
            type="button"
            onClick={() => setStep("checklist")}
            className={`flex flex-col items-center gap-0.5 ${step === "checklist" ? "text-blue-base font-bold" : ""}`}
          >
            <ClipboardCheck size={16} aria-hidden="true" />
            <span>Checklist</span>
          </button>

          <button
            type="button"
            onClick={() => setStep("evidence")}
            className={`flex flex-col items-center gap-0.5 ${step === "evidence" ? "text-blue-base font-bold" : ""}`}
          >
            <Camera size={16} aria-hidden="true" />
            <span>Evidence</span>
          </button>

          <button
            type="button"
            onClick={() => setStep("declaration")}
            className={`flex flex-col items-center gap-0.5 ${step === "declaration" ? "text-blue-base font-bold" : ""}`}
          >
            <FileCheck size={16} aria-hidden="true" />
            <span>Sign</span>
          </button>
        </footer>
      </div>
    </div>
  );
}
