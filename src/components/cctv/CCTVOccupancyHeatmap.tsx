"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Flame,
  Users,
  Eye,
  Sliders,
  Sparkles,
  AlertTriangle,
  Layers,
  Radio,
  RefreshCw,
  ShieldAlert,
  BarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BoundingBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  label: string;
  isAnomaly?: boolean;
}

interface CCTVOccupancyHeatmapProps {
  streamUrl?: string;
  videoUrl?: string;
  cameraName: string;
  location: string;
  expectedQuota: number;
  currentCount: number;
  onCountChange?: (newCount: number) => void;
  className?: string;
}

export function CCTVOccupancyHeatmap({
  videoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  cameraName,
  location,
  expectedQuota,
  currentCount: initialCount,
  onCountChange,
  className,
}: CCTVOccupancyHeatmapProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [heatmapEnabled, setHeatmapEnabled] = useState(true);
  const [boxesEnabled, setBoxesEnabled] = useState(true);
  const [gridEnabled, setGridEnabled] = useState(false);
  const [intensity, setIntensity] = useState(0.75);
  const [sensitivity, setSensitivity] = useState(0.65);
  const [liveCount, setLiveCount] = useState(initialCount || 48);
  const [zoneAlert, setZoneAlert] = useState<string | null>(null);
  const [detectedBoxes, setDetectedBoxes] = useState<BoundingBox[]>([]);

  // Generate simulated dynamic person tracks matching live video motion
  useEffect(() => {
    const interval = setInterval(() => {
      // Fluctuate count slightly around liveCount
      const variance = Math.floor(Math.random() * 5) - 2;
      const updatedCount = Math.max(12, Math.min(expectedQuota + 10, liveCount + variance));
      setLiveCount(updatedCount);
      if (onCountChange) onCountChange(updatedCount);

      // Generate random simulated bounding boxes for visible persons
      const boxCount = Math.min(16, Math.max(6, Math.floor(updatedCount / 3)));
      const newBoxes: BoundingBox[] = [];
      for (let i = 0; i < boxCount; i++) {
        const x = 0.08 + Math.random() * 0.75;
        const y = 0.2 + Math.random() * 0.6;
        const width = 0.06 + Math.random() * 0.04;
        const height = 0.14 + Math.random() * 0.08;
        const isAnomaly = Math.random() < 0.12;
        newBoxes.push({
          id: `det-${i}-${Date.now()}`,
          x,
          y,
          width,
          height,
          confidence: 0.82 + Math.random() * 0.17,
          label: isAnomaly ? "Proximity Warning" : "Beneficiary",
          isAnomaly,
        });
      }
      setDetectedBoxes(newBoxes);

      // Random zone anomaly trigger
      if (updatedCount < expectedQuota * 0.65) {
        setZoneAlert(`Attendance Deficit Alert: ${Math.round(((expectedQuota - updatedCount) / expectedQuota) * 100)}% below mandatory quota`);
      } else {
        setZoneAlert(null);
      }
    }, 2800);

    return () => clearInterval(interval);
  }, [liveCount, expectedQuota, onCountChange]);

  // Heatmap rendering loop on HTML5 Canvas
  const renderHeatmap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    if (heatmapEnabled) {
      // Draw smooth radial gradient heat sources based on detected boxes
      detectedBoxes.forEach((box) => {
        const cx = (box.x + box.width / 2) * width;
        const cy = (box.y + box.height * 0.7) * height;
        const radius = Math.max(35, width * 0.08 * intensity);

        const grad = ctx.createRadialGradient(cx, cy, 5, cx, cy, radius);
        if (box.isAnomaly) {
          grad.addColorStop(0, `rgba(239, 68, 68, ${0.85 * intensity})`);
          grad.addColorStop(0.5, `rgba(249, 115, 22, ${0.45 * intensity})`);
          grad.addColorStop(1, "rgba(239, 68, 68, 0)");
        } else {
          grad.addColorStop(0, `rgba(234, 179, 8, ${0.75 * intensity})`);
          grad.addColorStop(0.4, `rgba(16, 185, 129, ${0.5 * intensity})`);
          grad.addColorStop(0.8, `rgba(59, 130, 246, ${0.25 * intensity})`);
          grad.addColorStop(1, "rgba(59, 130, 246, 0)");
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Draw AI Inspection Grid if enabled
    if (gridEnabled) {
      ctx.strokeStyle = "rgba(56, 189, 248, 0.15)";
      ctx.lineWidth = 1;
      const stepX = width / 10;
      const stepY = height / 8;
      for (let x = 0; x < width; x += stepX) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += stepY) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    animationFrameRef.current = requestAnimationFrame(renderHeatmap);
  }, [detectedBoxes, heatmapEnabled, gridEnabled, intensity]);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && videoRef.current) {
        canvasRef.current.width = videoRef.current.clientWidth || 640;
        canvasRef.current.height = videoRef.current.clientHeight || 360;
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    animationFrameRef.current = requestAnimationFrame(renderHeatmap);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [renderHeatmap]);

  const deficitPct = Math.max(0, Math.round(((expectedQuota - liveCount) / expectedQuota) * 100));
  const occupancyPct = Math.min(100, Math.round((liveCount / expectedQuota) * 100));

  return (
    <div
      className={cn(
        "relative rounded-2xl overflow-hidden border border-slate-700/60 bg-slate-950/90 shadow-2xl backdrop-blur-xl",
        className
      )}
    >
      {/* Top Telemetry Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-900/80 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              {cameraName}
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                AI Vision Active
              </span>
            </h4>
            <p className="text-xs text-slate-400 font-mono">{location}</p>
          </div>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-xs">
            <Users className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-400">Observed:</span>
            <span className="font-bold text-slate-100 font-mono text-sm">{liveCount}</span>
            <span className="text-slate-500">/ {expectedQuota}</span>
          </div>

          <div
            className={cn(
              "px-2.5 py-1 rounded-lg border text-xs font-mono font-medium flex items-center gap-1.5",
              deficitPct > 25
                ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
            )}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>{occupancyPct}% Quota</span>
            {deficitPct > 0 && (
              <span className="text-[10px] text-rose-400 font-semibold">(-{deficitPct}%)</span>
            )}
          </div>
        </div>
      </div>

      {/* Video Stream + Heatmap Container */}
      <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          src={videoUrl}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Canvas Overlay for Heatmap and AI Grid */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />

        {/* Bounding Boxes Layer */}
        {boxesEnabled && (
          <div className="absolute inset-0 pointer-events-none z-20">
            {detectedBoxes.map((box) => (
              <div
                key={box.id}
                className={cn(
                  "absolute rounded border transition-all duration-700",
                  box.isAnomaly
                    ? "border-rose-500 bg-rose-500/15 shadow-[0_0_12px_rgba(239,68,68,0.5)]"
                    : "border-sky-400 bg-sky-400/10 shadow-[0_0_8px_rgba(56,189,248,0.3)]"
                )}
                style={{
                  left: `${box.x * 100}%`,
                  top: `${box.y * 100}%`,
                  width: `${box.width * 100}%`,
                  height: `${box.height * 100}%`,
                }}
              >
                <div
                  className={cn(
                    "absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[9px] font-mono whitespace-nowrap uppercase tracking-wider font-semibold",
                    box.isAnomaly
                      ? "bg-rose-600 text-white"
                      : "bg-sky-600/90 text-sky-50"
                  )}
                >
                  {box.label} ({Math.round(box.confidence * 100)}%)
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Live Anomaly Banner */}
        {zoneAlert && (
          <div className="absolute bottom-4 left-4 right-4 z-30 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs shadow-xl animate-pulse">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-semibold">{zoneAlert}</span>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="p-3.5 bg-slate-900/95 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setHeatmapEnabled(!heatmapEnabled)}
            className={cn(
              "px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all font-medium",
              heatmapEnabled
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-750"
            )}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            Heatmap {heatmapEnabled ? "ON" : "OFF"}
          </button>

          <button
            onClick={() => setBoxesEnabled(!boxesEnabled)}
            className={cn(
              "px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all font-medium",
              boxesEnabled
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-750"
            )}
          >
            <Eye className="w-3.5 h-3.5 text-sky-400" />
            AI Tracks {boxesEnabled ? "ON" : "OFF"}
          </button>

          <button
            onClick={() => setGridEnabled(!gridEnabled)}
            className={cn(
              "px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all font-medium",
              gridEnabled
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-750"
            )}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            Spatial Grid
          </button>
        </div>

        {/* Intensity Sliders */}
        <div className="flex items-center gap-4 text-slate-300">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Intensity:</span>
            <input
              type="range"
              min="0.2"
              max="1.5"
              step="0.1"
              value={intensity}
              onChange={(e) => setIntensity(parseFloat(e.target.value))}
              className="w-20 accent-amber-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
            />
          </div>

          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            <Sparkles className="w-3 h-3" />
            Edge CV: 24.8 FPS
          </div>
        </div>
      </div>
    </div>
  );
}
