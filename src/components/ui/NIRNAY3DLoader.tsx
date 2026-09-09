"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface NIRNAY3DLoaderProps {
  onComplete: () => void;
  autoStart?: boolean;
}

const INITIALIZATION_STAGES = [
  "INITIALIZING NIRNAY 3D GEOSPATIAL ENGINE",
  "ESTABLISHING SATELLITE TELEMETRY & GPS LOCK",
  "CALIBRATING FRS BIOMETRIC PROXY & LIVENESS MESH",
  "CONNECTING TWO-LEVEL SLA JURISDICTION ENGINE",
  "NIRNAY NATIONAL GOVERNANCE PLATFORM READY",
];

export function NIRNAY3DLoader({ onComplete, autoStart = true }: NIRNAY3DLoaderProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Particle system for 3D space effect
    const numParticles = 160;
    const particles: Array<{
      x: number;
      y: number;
      z: number;
      size: number;
      speed: number;
      color: string;
      alpha: number;
    }> = [];

    const colors = ["#E11D48", "#2563EB", "#059669", "#D97706", "#7C3AED", "#38BDF8", "#F59E0B"];

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: (Math.random() - 0.5) * width * 1.6,
        y: (Math.random() - 0.5) * height * 1.6,
        z: Math.random() * 1000 + 1,
        size: Math.random() * 2.2 + 1,
        speed: Math.random() * 2.8 + 1.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.8 + 0.2,
      });
    }

    let angle = 0;
    const startTime = performance.now();
    const duration = 2600; // 2.6 seconds

    const render = (time: number) => {
      const elapsed = time - startTime;
      const pct = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(pct);

      const currentStage = Math.min(
        INITIALIZATION_STAGES.length - 1,
        Math.floor((pct / 100) * INITIALIZATION_STAGES.length)
      );
      setStageIndex(currentStage);

      // Deep space background with subtle trail
      ctx.fillStyle = "rgba(8, 12, 22, 0.28)";
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      angle += 0.025;

      // Draw 3D Perspective Grid Floor
      ctx.save();
      ctx.strokeStyle = "rgba(37, 99, 235, 0.15)";
      ctx.lineWidth = 1;
      const gridY = cy + 130;
      for (let x = -width; x < width * 2; x += 45) {
        ctx.beginPath();
        ctx.moveTo(x + Math.sin(angle * 0.8) * 8, gridY);
        ctx.lineTo(cx + (x - cx) * 3.5, height);
        ctx.stroke();
      }
      for (let z = 10; z < 220; z += 22) {
        const y = gridY + Math.pow(z / 10, 1.85);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.restore();

      // Render 3D Floating Cybernetic Particles
      particles.forEach((p) => {
        p.z -= p.speed * 2.2;
        if (p.z <= 0) p.z = 1000;

        const fov = 420;
        const scale = fov / (fov + p.z);
        const px = cx + p.x * scale;
        const py = cy + p.y * scale;

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          const alpha = Math.min(1, (1000 - p.z) / 600) * p.alpha;
          ctx.save();
          ctx.beginPath();
          ctx.arc(px, py, p.size * scale * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = alpha;
          ctx.shadowBlur = 14 * scale;
          ctx.shadowColor = p.color;
          ctx.fill();
          ctx.restore();
        }
      });

      // Render 3D Holographic Dual Counter-Rotating Quantum Rings in center
      ctx.save();
      ctx.translate(cx, cy - 42);

      // Outer gold/blue ring
      ctx.beginPath();
      ctx.ellipse(0, 0, 150, 52, angle * 0.6, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(217, 119, 6, 0.45)";
      ctx.lineWidth = 2.2;
      ctx.shadowColor = "#F59E0B";
      ctx.shadowBlur = 18;
      ctx.stroke();

      // Secondary blue ring
      ctx.beginPath();
      ctx.ellipse(0, 0, 130, 42, -angle * 0.9, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(37, 99, 235, 0.55)";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#3B82F6";
      ctx.shadowBlur = 20;
      ctx.stroke();

      // Inner crimson pulse ring
      ctx.beginPath();
      ctx.ellipse(0, 0, 105, 32, angle * 1.2, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(225, 29, 72, 0.45)";
      ctx.lineWidth = 1.8;
      ctx.shadowColor = "#E11D48";
      ctx.shadowBlur = 16;
      ctx.stroke();

      // Center glowing pulse sphere behind logo
      const pulseRadius = 48 + Math.sin(angle * 3.5) * 8;
      const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, pulseRadius);
      grad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      grad.addColorStop(0.35, "rgba(37, 99, 235, 0.7)");
      grad.addColorStop(0.7, "rgba(217, 119, 6, 0.3)");
      grad.addColorStop(1, "rgba(225, 29, 72, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, pulseRadius, 0, Math.PI * 2);
      ctx.fill();

      // Scanning vertical laser beam
      const laserY = Math.sin(angle * 2.5) * 60;
      ctx.beginPath();
      ctx.moveTo(-90, laserY);
      ctx.lineTo(90, laserY);
      ctx.strokeStyle = "rgba(56, 189, 248, 0.75)";
      ctx.lineWidth = 1.5;
      ctx.shadowColor = "#38BDF8";
      ctx.shadowBlur = 12;
      ctx.stroke();

      ctx.restore();

      if (pct < 100) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        setIsFading(true);
        setTimeout(() => {
          onComplete();
        }, 350);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [onComplete]);

  const handleSkip = () => {
    setIsFading(true);
    setTimeout(() => {
      onComplete();
    }, 180);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-500 ${
        isFading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{ background: "radial-gradient(ellipse at center, #0f172a 0%, #080c16 100%)", overflow: "hidden" }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Foreground Holographic Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
        {/* Main Circular Transparent Logo Emblem */}
        <div className="relative mb-5 group cursor-pointer">
          {/* Pulsing Aura */}
          <div
            className="absolute -inset-6 rounded-full opacity-80 blur-2xl transition duration-500 animate-pulse"
            style={{ background: "radial-gradient(circle, rgba(217,119,6,0.5) 0%, rgba(37,99,235,0.4) 50%, rgba(225,29,72,0.3) 100%)" }}
          />

          {/* Clean Transparent Medallion (No Square Background Box) */}
          <div className="relative w-32 h-32 flex items-center justify-center filter drop-shadow-[0_10px_35px_rgba(245,158,11,0.45)] transition-transform duration-300 transform group-hover:scale-105">
            <Image
              src="/images/main_logo.png"
              alt="NIRNAY Official Circular Emblem"
              width={128}
              height={128}
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Brand Text */}
        <h1
          className="text-4xl sm:text-5xl font-black tracking-wider mb-1.5 uppercase"
          style={{
            background: "linear-gradient(135deg, #FFFFFF 15%, #FDE68A 45%, #60A5FA 80%, #3B82F6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 4px 22px rgba(37, 99, 235, 0.45))",
            letterSpacing: "0.18em",
          }}
        >
          NIRNAY
        </h1>

        <p
          className="text-[11px] sm:text-xs font-bold tracking-widest text-amber-300/90 uppercase mb-7 max-w-md"
          style={{ letterSpacing: "0.24em" }}
        >
          Real-Time Monitoring &amp; Inspection Directorate
        </p>

        {/* 3D Progress Loader Bar */}
        <div className="w-72 sm:w-88 flex flex-col items-center gap-2 mb-5">
          <div className="w-full flex items-center justify-between text-[11px] font-mono font-bold px-1">
            <span className="flex items-center gap-1.5 text-sky-400">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
              {INITIALIZATION_STAGES[stageIndex]}
            </span>
            <span className="text-amber-400 font-black">{progress}%</span>
          </div>

          <div
            className="w-full h-2 rounded-full overflow-hidden p-0.5"
            style={{
              background: "rgba(15, 23, 42, 0.85)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              boxShadow: "inset 0 2px 5px rgba(0,0,0,0.6)",
            }}
          >
            <div
              className="h-full rounded-full transition-all duration-100 ease-out"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #3B82F6 0%, #F59E0B 50%, #10B981 100%)",
                boxShadow: "0 0 16px rgba(245, 158, 11, 0.85)",
              }}
            />
          </div>
        </div>

        {/* Security & Official Ministry Attribution */}
        <div className="text-[10px] text-slate-400/80 font-mono tracking-wide flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Government of India • Ministry of Social Justice &amp; Empowerment
        </div>
      </div>

      {/* Skip Button */}
      <button
        onClick={handleSkip}
        className="absolute bottom-6 right-6 z-20 px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
        style={{
          background: "rgba(255, 255, 255, 0.08)",
          border: "1px solid rgba(255, 255, 255, 0.18)",
          backdropFilter: "blur(10px)",
        }}
      >
        Skip Intro &rarr;
      </button>
    </div>
  );
}
