"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { Activity, ArrowRight, ShieldCheck } from "lucide-react";

interface AppLoadingAnimationProps {
  onComplete?: () => void;
}

const INITIALIZATION_STAGES = [
  "INITIALIZING NIRNAY NATIONAL INTELLIGENCE SUITE",
  "CONNECTING ISRO BHUVAN SATELLITE GEODETIC MESH",
  "CALIBRATING REAL-TIME FRS & AI RISK ENGINE",
  "SYNCHRONIZING TWO-LEVEL SLA ESCALATION PROTOCOLS",
  "NIRNAY NATIONAL COMMAND CENTER READY",
];

export function AppLoadingAnimation({ onComplete }: AppLoadingAnimationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const completedRef = useRef(false);

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setIsFading(true);
    setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, 250);
  }, [onComplete]);

  // Keyboard shortcut: ESC, Enter, or Space skips the animation immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " " || e.key === "q") {
        finish();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [finish]);

  // Auto-play video with fast, sleek 1.8s completion
  useEffect(() => {
    if (!isVisible) return;

    const v = videoRef.current;
    if (v) {
      v.muted = true;
      v.play().catch(() => {});
    }

    // Fast, responsive 1.8s initialization cycle
    const totalDuration = 1800;
    const startTime = performance.now();

    const interval = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / totalDuration) * 100));
      setProgress(pct);
      const stage = Math.min(
        INITIALIZATION_STAGES.length - 1,
        Math.floor((pct / 100) * INITIALIZATION_STAGES.length)
      );
      setStageIndex(stage);
      if (pct >= 100) {
        clearInterval(interval);
        finish();
      }
    }, 40);

    const hardTimeout = setTimeout(() => {
      finish();
    }, 2500);

    return () => {
      clearInterval(interval);
      clearTimeout(hardTimeout);
    };
  }, [isVisible, finish]);

  if (!isVisible) return null;

  return (
    <div
      onClick={finish}
      className={`fixed inset-0 z-[999999] w-screen h-screen overflow-hidden bg-black flex flex-col justify-between select-none transition-opacity duration-300 ease-out cursor-pointer ${
        isFading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      aria-label="NIRNAY Full-Screen Loading Animation (Click anywhere to skip)"
      role="dialog"
      aria-modal="true"
    >
      {/* ── 1. LIGHTWEIGHT HIGH-PERFORMANCE BACKDROP (No GPU blur shaders) ── */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-black to-slate-950 pointer-events-none z-0" />

      {/* ── 2. SINGLE SHARP HARDWARE-ACCELERATED VIDEO ── */}
      <video
        ref={videoRef}
        src="/loading-animation.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover sm:object-contain z-10 opacity-90 pointer-events-none"
        onEnded={finish}
      />

      {/* ── 3. CINEMATIC TOP HEADER VIGNETTE ── */}
      <div className="relative z-20 w-full bg-gradient-to-b from-black/85 via-black/45 to-transparent px-6 sm:px-10 pt-6 pb-12 flex items-center justify-between">
        {/* Left: Official Emblem & Identity */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl overflow-hidden border border-white/25 shadow-[0_4px_16px_rgba(245,158,11,0.35)] flex-shrink-0 bg-slate-950 flex items-center justify-center">
            <Image
              src="/images/1 image-central admin.jpeg"
              alt="National Emblem"
              width={44}
              height={44}
              className="object-cover"
              priority
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-base sm:text-lg tracking-widest text-white leading-none">
                NIRNAY
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/25 text-sky-400 border border-blue-500/35 font-bold">
                v2.5 NATIONAL SUITE
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium tracking-wide mt-1 flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-emerald-400" />
              Government of India • Ministry of Social Justice &amp; Empowerment
            </p>
          </div>
        </div>

        {/* Right: Telemetry pill & Skip Intro button */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-[11px] font-mono text-emerald-400 shadow-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            ISRO BHUVAN GNSS: LOCKED
          </div>

          <button
            type="button"
            onClick={finish}
            className="group px-4 py-2 rounded-xl text-xs font-bold text-white bg-white/15 hover:bg-white/25 active:scale-95 transition-all backdrop-blur-md border border-white/25 flex items-center gap-2 cursor-pointer shadow-xl hover:border-amber-400/50"
            aria-label="Skip Intro Animation"
          >
            <span>Skip Intro</span>
            <span className="text-[10px] font-mono opacity-70 bg-black/40 px-1.5 py-0.5 rounded border border-white/10">
              ESC
            </span>
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* ── 4. CINEMATIC BOTTOM HUD & PROGRESS BAR ── */}
      <div className="relative z-20 w-full bg-gradient-to-t from-black/95 via-black/60 to-transparent px-6 sm:px-10 pb-6 sm:pb-8 pt-12">
        <div className="max-w-4xl mx-auto w-full flex flex-col gap-3">
          {/* Status Stage Text & Percentage */}
          <div className="flex items-center justify-between text-xs sm:text-sm font-mono font-bold px-1">
            <div className="flex items-center gap-2 text-amber-300 drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]">
              <Activity size={15} className="animate-spin text-amber-400 flex-shrink-0" />
              <span className="tracking-wide">{INITIALIZATION_STAGES[stageIndex]}</span>
            </div>
            <span className="text-white font-black tracking-widest text-sm sm:text-base drop-shadow-[0_2px_8px_rgba(255,255,255,0.4)]">
              {progress}%
            </span>
          </div>

          {/* Glowing Neon Progress Bar Track */}
          <div className="w-full h-2.5 sm:h-3 rounded-full overflow-hidden p-0.5 bg-black/60 backdrop-blur-md border border-white/20 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)]">
            <div
              className="h-full rounded-full transition-all duration-150 ease-out"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #3B82F6 0%, #F59E0B 50%, #10B981 100%)",
                boxShadow: "0 0 20px rgba(245, 158, 11, 0.95)",
              }}
            />
          </div>

          {/* Telemetry Footnote */}
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400/90 font-mono pt-1">
            <span>ZERO-TRUST JURISDICTION • TWO-LEVEL SLA ENGINE</span>
            <span>HYBRID ATLAS STORAGE • READY</span>
          </div>
        </div>
      </div>
    </div>
  );
}
