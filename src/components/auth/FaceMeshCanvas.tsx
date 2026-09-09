"use client";

import React, { useEffect, useRef } from "react";
import type { TrustLayerPipelineStage } from "@/lib/face-recognition/types";

interface FaceMeshCanvasProps {
  width: number;
  height: number;
  stage: TrustLayerPipelineStage;
  livenessChallenge?: string;
  isVerified?: boolean;
}

export function FaceMeshCanvas({
  width,
  height,
  stage,
  livenessChallenge,
  isVerified = false,
}: FaceMeshCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const startTime = performance.now();

    const render = (time: number) => {
      const elapsed = (time - startTime) / 1000;
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const isSuccess = isVerified || stage === "VERIFIED_SUCCESS";

      // Luxury Executive Palette: Refined Platinum Cyan & Royal Emerald
      const primaryRgb = isSuccess ? "16, 185, 129" : "56, 189, 248";
      const goldRgb = "217, 119, 6"; // Subtle government gold touch
      const glowRgb = isSuccess ? "52, 211, 153" : "125, 211, 252";

      // Silky, smooth breathing rhythm (calm & prestigious)
      const breath = Math.sin(elapsed * 1.8) * 0.015;
      const baseScale = 1 + breath;

      // 1. Sleek Executive Outer Target Reticle
      const reticleRadius = Math.min(width, height) * 0.38 * baseScale;
      
      // Ambient Soft Glow Ring
      const ambientGlow = ctx.createRadialGradient(cx, cy, reticleRadius * 0.7, cx, cy, reticleRadius * 1.25);
      ambientGlow.addColorStop(0, `rgba(${primaryRgb}, 0.0)`);
      ambientGlow.addColorStop(0.8, `rgba(${primaryRgb}, ${isSuccess ? 0.12 : 0.05})`);
      ambientGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = ambientGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, reticleRadius * 1.25, 0, Math.PI * 2);
      ctx.fill();

      // Precision Outer Ring with Micro-Ticks
      ctx.save();
      ctx.strokeStyle = `rgba(${primaryRgb}, ${isSuccess ? 0.7 : 0.35})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, reticleRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Rotating Precision Orbital Arcs
      const rotAngle = (elapsed * 0.4) % (Math.PI * 2);
      ctx.strokeStyle = `rgba(${glowRgb}, ${isSuccess ? 0.9 : 0.6})`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(cx, cy, reticleRadius + 4, rotAngle, rotAngle + Math.PI * 0.35);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, reticleRadius + 4, rotAngle + Math.PI, rotAngle + Math.PI * 1.35);
      ctx.stroke();
      ctx.restore();

      // Precision Corner Brackets (Executive Minimalist)
      const bSize = 16;
      const bDist = reticleRadius + 14;
      ctx.strokeStyle = `rgba(${primaryRgb}, 0.65)`;
      ctx.lineWidth = 1.8;

      // Top-Left
      ctx.beginPath();
      ctx.moveTo(cx - bDist, cy - bDist + bSize);
      ctx.lineTo(cx - bDist, cy - bDist);
      ctx.lineTo(cx - bDist + bSize, cy - bDist);
      ctx.stroke();

      // Top-Right
      ctx.beginPath();
      ctx.moveTo(cx + bDist - bSize, cy - bDist);
      ctx.lineTo(cx + bDist, cy - bDist);
      ctx.lineTo(cx + bDist, cy - bDist + bSize);
      ctx.stroke();

      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(cx - bDist, cy + bDist - bSize);
      ctx.lineTo(cx - bDist, cy + bDist);
      ctx.lineTo(cx - bDist + bSize, cy + bDist);
      ctx.stroke();

      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(cx + bDist - bSize, cy + bDist);
      ctx.lineTo(cx + bDist, cy + bDist);
      ctx.lineTo(cx + bDist, cy + bDist - bSize);
      ctx.stroke();

      // 2. High-Class Biometric Facial Oval Guide
      const ovalRx = reticleRadius * 0.72;
      const ovalRy = reticleRadius * 0.98;
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, cy - 2, ovalRx, ovalRy, 0, 0, Math.PI * 2);
      ctx.strokeStyle = isSuccess ? "rgba(16, 185, 129, 0.8)" : "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = isSuccess ? 2 : 1.2;
      if (!isSuccess) ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.restore();

      // 3. Elegant Biometric Anchor Landmarks (Eyes, Nose Apex, Lip Center, Chin)
      const eyeSpacing = ovalRx * 0.44;
      const eyeY = cy - ovalRy * 0.18;
      const noseY = cy + ovalRy * 0.12;
      const mouthY = cy + ovalRy * 0.45;
      const chinY = cy + ovalRy * 0.78;

      const landmarks = [
        { x: cx - eyeSpacing, y: eyeY, label: "IRIS_L" },
        { x: cx + eyeSpacing, y: eyeY, label: "IRIS_R" },
        { x: cx, y: noseY, label: "NOSE_APEX" },
        { x: cx, y: mouthY, label: "ORAL_CTR" },
        { x: cx, y: chinY, label: "MENTUM" },
      ];

      // Subtle Connecting Wireframe Lines between key landmarks
      ctx.save();
      ctx.strokeStyle = `rgba(${primaryRgb}, ${isSuccess ? 0.5 : 0.25})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(landmarks[0].x, landmarks[0].y);
      ctx.lineTo(landmarks[1].x, landmarks[1].y);
      ctx.lineTo(landmarks[2].x, landmarks[2].y);
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(landmarks[2].x, landmarks[2].y);
      ctx.lineTo(landmarks[3].x, landmarks[3].y);
      ctx.lineTo(landmarks[4].x, landmarks[4].y);
      ctx.stroke();

      // Soft Depth Ring Pulses around Iris and Nose
      landmarks.forEach((pt, i) => {
        const pulseR = 3 + Math.sin(elapsed * 3 + i) * 1.5;
        ctx.fillStyle = `rgba(${glowRgb}, ${isSuccess ? 0.9 : 0.7})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(${primaryRgb}, 0.35)`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pulseR + 4, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.restore();

      // 4. Silky Smooth Executive Laser Wave Scan (Gentle, Feathered & Luxurious)
      if (!isSuccess) {
        const scanPeriod = 2.8;
        const phase = (elapsed % scanPeriod) / scanPeriod;
        // Smooth sine bounce across the face box
        const scanY = cy - ovalRy * 0.85 + Math.sin(phase * Math.PI) * (ovalRy * 1.7);

        // Feathered horizontal laser band
        const grad = ctx.createLinearGradient(0, scanY - 18, 0, scanY + 18);
        grad.addColorStop(0, "rgba(56, 189, 248, 0)");
        grad.addColorStop(0.5, "rgba(56, 189, 248, 0.18)");
        grad.addColorStop(1, "rgba(56, 189, 248, 0)");

        ctx.fillStyle = grad;
        ctx.fillRect(cx - ovalRx * 1.2, scanY - 18, ovalRx * 2.4, 36);

        // Fine luxury beam
        const beamGrad = ctx.createLinearGradient(cx - ovalRx, 0, cx + ovalRx, 0);
        beamGrad.addColorStop(0, "rgba(56, 189, 248, 0)");
        beamGrad.addColorStop(0.2, "rgba(125, 211, 252, 0.7)");
        beamGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.95)");
        beamGrad.addColorStop(0.8, "rgba(125, 211, 252, 0.7)");
        beamGrad.addColorStop(1, "rgba(56, 189, 248, 0)");

        ctx.strokeStyle = beamGrad;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - ovalRx * 1.1, scanY);
        ctx.lineTo(cx + ovalRx * 1.1, scanY);
        ctx.stroke();
      }

      // 5. Liveness Directional Challenge Prompt Overlay (Executive Style)
      if (stage === "LIVENESS_CHALLENGE" && livenessChallenge) {
        ctx.save();
        ctx.fillStyle = "rgba(7, 13, 26, 0.85)";
        ctx.roundRect(cx - 130, cy + ovalRy + 16, 260, 28, 8);
        ctx.fill();
        ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = "#e0f2fe";
        ctx.font = "600 10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(livenessChallenge.toUpperCase(), cx, cy + ovalRy + 34);
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [width, height, stage, livenessChallenge, isVerified]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 pointer-events-none z-10"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
