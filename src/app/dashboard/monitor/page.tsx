"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Activity, Wifi, WifiOff, Camera, Maximize2, Minimize2,
  RefreshCw, Clock, MapPin, AlertTriangle, CheckCircle2,
  Loader2, Monitor, Volume2, VolumeX, Phone, ShieldCheck,
  Eye, Zap, Video, Sparkles, ZoomIn, ZoomOut, Compass, Flame,
  ChevronLeft, ChevronRight, SlidersHorizontal,
} from "lucide-react";

import { CCTVOccupancyHeatmap } from "@/components/cctv/CCTVOccupancyHeatmap";
import { cn } from "@/lib/utils";

interface CctvCamera {
  id: string;
  name: string;
  location: string;
  facility_id: string;
  facility_name: string;
  stream_url: string;
  status: "ONLINE" | "OFFLINE" | "MAINTENANCE" | "UNKNOWN";
  last_seen: string | null;
  resolution: string;
  video_url?: string;
  personCount?: number;
  expectedQuota?: number;
  anomaly?: string | null;
}

const DEMO_CAMERAS: CctvCamera[] = [
  {
    id: "cam-001",
    name: "Entrance & Biometric Gate",
    location: "Main Gate Checkpoint",
    facility_id: "p1",
    facility_name: "Asha Rehabilitation Centre",
    stream_url: "rtsp://dosje-gov.in:8554/live/asha_gate_01",
    status: "ONLINE",
    last_seen: new Date().toISOString(),
    resolution: "1080p 60FPS",
    video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    personCount: 51,
    expectedQuota: 80,
    anomaly: "41% Attendance Drop vs Registered Quota",
  },
  {
    id: "cam-002",
    name: "Activity & Skill Hall",
    location: "Activity Hall Block B",
    facility_id: "p1",
    facility_name: "Asha Rehabilitation Centre",
    stream_url: "rtsp://dosje-gov.in:8554/live/asha_hall_02",
    status: "ONLINE",
    last_seen: new Date().toISOString(),
    resolution: "1080p 30FPS",
    video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    personCount: 48,
    expectedQuota: 80,
    anomaly: "Injector Box Power Fluctuation Alert",
  },
  {
    id: "cam-003",
    name: "Dormitory Perimeter",
    location: "Dormitory Block A",
    facility_id: "p1",
    facility_name: "Asha Rehabilitation Centre",
    stream_url: "rtsp://dosje-gov.in:8554/live/asha_dorm_03",
    status: "OFFLINE",
    last_seen: new Date(Date.now() - 3600000 * 2).toISOString(),
    resolution: "1080p",
    anomaly: "RTSP Heartbeat Dropped > 15 mins",
  },
  {
    id: "cam-004",
    name: "Nutrition & Kitchen Area",
    location: "Kitchen Complex",
    facility_id: "p2",
    facility_name: "Pragati Skill Centre",
    stream_url: "rtsp://dosje-gov.in:8554/live/pragati_kitchen_01",
    status: "ONLINE",
    last_seen: new Date().toISOString(),
    resolution: "720p 30FPS",
    video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    personCount: 64,
    expectedQuota: 65,
    anomaly: null,
  },
  {
    id: "cam-005",
    name: "Administrative Office",
    location: "Admin Office Block",
    facility_id: "p2",
    facility_name: "Pragati Skill Centre",
    stream_url: "rtsp://dosje-gov.in:8554/live/pragati_office_02",
    status: "MAINTENANCE",
    last_seen: null,
    resolution: "1080p",
    anomaly: "Scheduled Calibration",
  },
  {
    id: "cam-006",
    name: "Playground & Outdoor Yard",
    location: "Outdoor Sports Ground",
    facility_id: "p3",
    facility_name: "Umang Welfare Centre",
    stream_url: "rtsp://dosje-gov.in:8554/live/umang_ground_01",
    status: "ONLINE",
    last_seen: new Date().toISOString(),
    resolution: "720p 30FPS",
    video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    personCount: 42,
    expectedQuota: 45,
    anomaly: null,
  },
];

export default function MonitorPage() {
  const [cameras, setCameras] = useState<CctvCamera[]>(DEMO_CAMERAS);
  const [selectedCamera, setSelectedCamera] = useState<CctvCamera | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showAiBoxes, setShowAiBoxes] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [viewMode, setViewMode] = useState<"GRID" | "CAROUSEL" | "HEATMAP">("GRID");
  const [activeHeatmapCamId, setActiveHeatmapCamId] = useState<string>("cam-001");
  const [heartbeatSeconds, setHeartbeatSeconds] = useState<number>(1);
  const scrollContainerRef = useRef<Record<string, HTMLDivElement | null>>({});

  const scrollRow = (facility: string, direction: "left" | "right") => {
    const el = scrollContainerRef.current[facility];
    if (el) {
      el.scrollBy({ left: direction === "left" ? -420 : 420, behavior: "smooth" });
    }
  };

  // Real-time person count & heartbeat simulator
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" }));
      setHeartbeatSeconds((prev) => (prev >= 4 ? 1 : prev + 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll real AI Headcount Engine via /api/ai/cctv every 15 seconds
  useEffect(() => {
    const targetCam = selectedCamera || cameras.find((c) => c.status === "ONLINE") || cameras[0];
    if (!targetCam) return;

    async function pollAiHeadcount() {
      try {
        const res = await fetch("/api/ai/cctv", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            camera_id: targetCam.id,
            institute_id: targetCam.facility_id,
            sanctioned_strength: targetCam.expectedQuota || 50,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setCameras((prev) =>
            prev.map((c) =>
              c.id === targetCam.id
                ? {
                    ...c,
                    personCount: data.detected_count,
                    anomaly: data.anomaly_type,
                    last_seen: new Date().toISOString(),
                  }
                : c
            )
          );
        }
      } catch {
        // Continue gracefully
      }
    }

    pollAiHeadcount();
    const pollInterval = setInterval(pollAiHeadcount, 15000);
    return () => clearInterval(pollInterval);
  }, [selectedCamera?.id]);

  const onlineCount = cameras.filter((c) => c.status === "ONLINE").length;
  const offlineCount = cameras.filter((c) => c.status === "OFFLINE").length;
  const facilities = [...new Set(cameras.map((c) => c.facility_name))];
  const activeHeatmapCam = cameras.find((c) => c.id === activeHeatmapCamId) || cameras[0];

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header with Live Signal Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
            <Monitor size={30} />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-extrabold text-white tracking-tight">
                Live CCTV Command &amp; Surveillance Grid
              </h1>
              <span className="px-3 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {onlineCount} RTSP STREAMS ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              MediaMTX WebRTC Stream Engine • Real-time AI Person Headcount &amp; Camera Tamper Detection
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-xl bg-slate-800 p-1 border border-slate-700">
            <button
              onClick={() => setViewMode("GRID")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === "GRID"
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Matrix Grid
            </button>
            <button
              onClick={() => setViewMode("CAROUSEL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === "CAROUSEL"
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <SlidersHorizontal size={13} />
              Horizontal Flow
            </button>
            <button
              onClick={() => setViewMode("HEATMAP")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === "HEATMAP"
                  ? "bg-amber-500 text-slate-950 font-extrabold shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Flame size={13} />
              AI Heatmap Lab
            </button>
          </div>

          <Link
            href="/dashboard/video-verification"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg transition"
          >
            <Phone size={14} /> Surprise Video Call (VC)
          </Link>
        </div>
      </div>

      {/* Heatmap Lab View */}
      {viewMode === "HEATMAP" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-base">
            <div>
              <h2 className="text-sm font-bold text-primary flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                AI Edge Density &amp; Spatial Occupancy Analytics
              </h2>
              <p className="text-xs text-muted">Select an active stream to analyze real-time crowd heatmaps, person bounding boxes, and quota deficits.</p>
            </div>

            {/* Camera Switcher Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted font-medium">Select Feed:</span>
              <select
                value={activeHeatmapCamId}
                onChange={(e) => setActiveHeatmapCamId(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {cameras
                  .filter((c) => c.status === "ONLINE")
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.facility_name} — {c.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <CCTVOccupancyHeatmap
            videoUrl={activeHeatmapCam.video_url}
            cameraName={activeHeatmapCam.name}
            location={`${activeHeatmapCam.facility_name} • ${activeHeatmapCam.location}`}
            expectedQuota={activeHeatmapCam.expectedQuota || 80}
            currentCount={activeHeatmapCam.personCount || 48}
          />
        </div>
      )}

      {/* Grid or Horizontal Carousel of Facilities and Cameras */}
      {(viewMode === "GRID" || viewMode === "CAROUSEL") && (
      <div className="space-y-6">
        {facilities.map((facility) => {
          const facilityCameras = cameras.filter((c) => c.facility_name === facility);
          return (
            <div key={facility} className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-extrabold text-primary flex items-center gap-2">
                    <MapPin size={16} className="text-blue-600" />
                    {facility}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      {facilityCameras.filter((c) => c.status === "ONLINE").length}/{facilityCameras.length} Online
                    </span>
                  </h2>

                  {/* Left and Right Quick Move Buttons */}
                  <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-xl border border-slate-700 ml-2">
                    <button
                      type="button"
                      onClick={() => scrollRow(facility, "left")}
                      className="p-1 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                      title="Move feeds Left"
                      aria-label="Scroll cameras left"
                    >
                      <ChevronLeft size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollRow(facility, "right")}
                      className="p-1 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                      title="Move feeds Right"
                      aria-label="Scroll cameras right"
                    >
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>

                <Link
                  href={`/dashboard/video-verification`}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Phone size={12} /> Connect Random VC
                </Link>
              </div>

              <div
                ref={(el) => {
                  scrollContainerRef.current[facility] = el;
                }}
                className={cn(
                  "scroll-smooth",
                  viewMode === "CAROUSEL"
                    ? "flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin"
                    : "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 overflow-x-auto pb-2"
                )}
              >
                {facilityCameras.map((camera) => (
                  <div
                    key={camera.id}
                    onClick={() => camera.status === "ONLINE" && setSelectedCamera(camera)}
                    className={cn(
                      "rounded-3xl overflow-hidden border bg-card transition-all cursor-pointer shadow-sm hover:-translate-y-1",
                      viewMode === "CAROUSEL" && "w-[320px] sm:w-[380px] shrink-0 snap-start",
                      camera.status === "ONLINE"
                        ? "border-base hover:border-blue-500/50"
                        : "border-rose-500/30 opacity-70"
                    )}
                  >
                    {/* Video/Preview Box */}
                    <div className="relative aspect-video bg-slate-950 overflow-hidden flex items-center justify-center">
                      {camera.status === "ONLINE" ? (
                        <>
                          <video
                            src={camera.video_url}
                            autoPlay
                            muted
                            loop
                            playsInline
                            className="w-full h-full object-cover opacity-85"
                          />

                          {/* Timestamp & RTSP Lock */}
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md text-[9px] font-mono text-white flex items-center gap-1 border border-white/10">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            LIVE · {camera.resolution}
                          </div>

                          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md text-[9px] font-mono text-amber-400 border border-amber-500/20">
                            {currentTime || "IST LOCK"}
                          </div>

                          {/* AI Headcount Tag */}
                          {camera.personCount && (
                            <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-xl bg-slate-950/90 backdrop-blur-md text-[10px] text-white font-mono border border-white/10 flex items-center gap-1.5">
                              <Sparkles size={11} className="text-cyan-400" />
                              <span>AI Count: <strong className="text-cyan-400">{camera.personCount}</strong> / {camera.expectedQuota}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center space-y-1.5 p-4">
                          <WifiOff size={28} className="text-rose-500 mx-auto animate-pulse" />
                          <span className="text-xs font-bold text-rose-400 block uppercase">Signal Disconnected</span>
                          <span className="text-[10px] text-slate-500 font-mono block">{camera.anomaly || "Stream Offline"}</span>
                        </div>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="p-4 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <h3 className="font-extrabold text-primary truncate">{camera.name}</h3>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          camera.status === "ONLINE" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                        }`}>
                          {camera.status}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{camera.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Camera Live Modal with PTZ and AI Overlays */}
      {selectedCamera && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setSelectedCamera(null)}
        >
          <div
            className="w-full max-w-4xl bg-slate-950 border border-slate-800 text-white rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <h3 className="font-extrabold text-sm text-white">{selectedCamera.name}</h3>
                  <p className="text-xs text-slate-200 font-medium">{selectedCamera.facility_name} • {selectedCamera.location}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard/video-verification"
                  className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                >
                  <Phone size={13} /> Surprise VC Call
                </Link>
                <button
                  onClick={() => setSelectedCamera(null)}
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Video Viewport */}
            <div className="relative aspect-video bg-black overflow-hidden flex items-center justify-center">
              <video
                src={selectedCamera.video_url}
                autoPlay
                muted={isMuted}
                loop
                playsInline
                className="w-full h-full object-cover transition-transform duration-300"
                style={{ transform: `scale(${zoomLevel})` }}
              />

              {/* AI Bounding Boxes Simulation */}
              {showAiBoxes && (
                <div className="absolute inset-0 pointer-events-none p-6">
                  {/* Simulated Bounding Box 1 */}
                  <div className="absolute top-1/4 left-1/3 w-28 h-40 border-2 border-cyan-400/80 rounded bg-cyan-400/10 flex flex-col justify-between p-1 shadow-lg">
                    <span className="bg-cyan-500 text-black text-[9px] font-mono font-bold px-1 rounded w-fit">
                      Person #12 (98.4%)
                    </span>
                    <span className="text-[8px] font-mono text-cyan-200 bg-black/70 px-1 rounded">
                      Headcount Token Valid
                    </span>
                  </div>

                  {/* Simulated Bounding Box 2 */}
                  <div className="absolute top-1/3 right-1/4 w-32 h-44 border-2 border-emerald-400/80 rounded bg-emerald-400/10 flex flex-col justify-between p-1 shadow-lg">
                    <span className="bg-emerald-500 text-black text-[9px] font-mono font-bold px-1 rounded w-fit">
                      Staff Lead (99.1%)
                    </span>
                    <span className="text-[8px] font-mono text-emerald-200 bg-black/70 px-1 rounded">
                      Authorized Roster
                    </span>
                  </div>
                </div>
              )}

              {/* Overlays */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md text-[10px] font-mono text-emerald-400 font-bold border border-emerald-500/30">
                  RTSP LIVE FEED (1080p 60FPS)
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md text-[10px] font-mono text-white border border-white/20">
                  {currentTime}
                </span>
              </div>

              {/* Bottom Controls */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-3">
                <div className="px-3 py-1.5 rounded-xl bg-slate-950/90 backdrop-blur-md text-xs font-mono text-white border border-white/10 flex items-center gap-2">
                  <Sparkles size={14} className="text-cyan-400" />
                  <span>AI Observed: <strong className="text-cyan-400">{selectedCamera.personCount || 51}</strong> Present</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAiBoxes(!showAiBoxes)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      showAiBoxes ? "bg-cyan-600 text-white" : "bg-black/70 text-slate-400"
                    }`}
                  >
                    <Eye size={13} /> {showAiBoxes ? "AI Vision ON" : "AI Vision OFF"}
                  </button>

                  <button
                    onClick={() => setZoomLevel((z) => (z === 1 ? 1.5 : z === 1.5 ? 2 : 1))}
                    className="px-3 py-1.5 rounded-xl bg-black/70 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <ZoomIn size={13} /> {zoomLevel}x Zoom
                  </button>

                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 rounded-xl bg-black/70 text-white hover:bg-black transition cursor-pointer"
                  >
                    {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Stream Telemetry Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div>
                <span className="text-slate-300 font-semibold block text-[10px]">RTSP Stream URI</span>
                <span className="text-slate-100 font-bold truncate block">{selectedCamera.stream_url}</span>
              </div>
              <div>
                <span className="text-slate-300 font-semibold block text-[10px]">Bitrate &amp; Codec</span>
                <span className="text-emerald-400 font-bold">4.8 Mbps · H.264</span>
              </div>
              <div>
                <span className="text-slate-300 font-semibold block text-[10px]">Tamper &amp; Occlusion</span>
                <span className="text-emerald-400 font-bold">✓ Clear Lens</span>
              </div>
              <div>
                <span className="text-slate-300 font-semibold block text-[10px]">Heartbeat Latency</span>
                <span className="text-cyan-400 font-bold">18 ms (Zero Jitter)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
