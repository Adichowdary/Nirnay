"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, CheckCircle, AlertTriangle, Loader2, Shield } from "lucide-react";
import type { FaceQualityResult } from "@/lib/face-recognition/types";

interface FaceEnrollProps {
  userId: string;
  onComplete: () => void;
  onCancel: () => void;
}

type EnrollState = "CAMERA" | "CAPTURING" | "PROCESSING" | "SUCCESS" | "FAILED";

export function FaceEnroll({ userId, onComplete, onCancel }: FaceEnrollProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [state, setState] = useState<EnrollState>("CAMERA");
  const [message, setMessage] = useState("Position your face in the circle");
  const [capturedSamples, setCapturedSamples] = useState<number>(0);
  const [quality, setQuality] = useState<FaceQualityResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const REQUIRED_SAMPLES = 3;

  useEffect(() => {
    let stream: MediaStream | null = null;
    let isCancelled = false;

    if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({
          video: { facingMode: "user", width: 640, height: 480 },
          audio: false,
        })
        .then((s) => {
          if (isCancelled) {
            s.getTracks().forEach((t) => t.stop());
            return;
          }
          stream = s;
          streamRef.current = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play().catch(() => {});
          }
          setError(null);
          setState("CAPTURING");
          setMessage("Look at the camera — hold steady");
        })
        .catch(() => {
          if (!isCancelled) {
            setError("Camera permission denied. Please allow camera access.");
            setState("FAILED");
          }
        });
    }

    return () => {
      isCancelled = true;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const captureSample = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx || video.readyState < 2) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    try {
      setState("PROCESSING");
      setMessage("Analyzing face quality...");

      const { MediaPipeFaceProvider } = await import("@/lib/face-recognition/mediapipe-provider");
      const provider = new MediaPipeFaceProvider();
      await provider.initialize();

      const detection = await provider.detectFace(imageData);
      if (!detection) {
        setQuality({ status: "NO_FACE", score: 0 });
        setMessage("No face detected. Please position your face.");
        setState("CAPTURING");
        return;
      }

      const q = provider.checkQuality(detection, canvas.width, canvas.height);
      setQuality(q);

      if (q.status !== "GOOD_QUALITY") {
        setMessage(q.message ?? "Face quality too low");
        setState("CAPTURING");
        return;
      }

      const embedding = await provider.generateEmbedding(detection, imageData);

      const res = await fetch("/api/v1/auth/face/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embedding,
          quality_score: q.score,
        }),
      });

      const result = await res.json();

      if (result.success) {
        setCapturedSamples((s) => s + 1);

        if (capturedSamples + 1 >= REQUIRED_SAMPLES) {
          setState("SUCCESS");
          setMessage("Face enrolled successfully");
          setTimeout(onComplete, 2000);
        } else {
          setMessage(`Sample ${capturedSamples + 1}/${REQUIRED_SAMPLES} captured. Hold steady...`);
          setState("CAPTURING");
        }
      } else {
        setMessage(result.error ?? "Enrollment failed");
        setState("CAPTURING");
      }
    } catch {
      setMessage("Processing error. Please try again.");
      setState("CAPTURING");
    }
  }, [capturedSamples, onComplete]);

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="relative rounded-xl overflow-hidden mb-4" style={{ background: "#000", aspectRatio: "4/3" }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />
        <canvas ref={canvasRef} className="hidden" />

        <div className="absolute inset-0 flex flex-col items-center justify-between p-4">
          {/* Top status */}
          <div className="w-full flex items-center justify-between">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{
                background: state === "SUCCESS" ? "rgba(16,185,129,0.9)" : "rgba(0,0,0,0.6)",
              }}
            >
              {state === "SUCCESS" ? <CheckCircle size={14} className="text-green-400" /> : <Camera size={14} />}
              <span style={{ fontSize: "11px", color: "#fff", fontWeight: 600 }}>
                {state === "SUCCESS" ? "ENROLLED" : "ENROLLING"}
              </span>
            </div>
            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)" }}>
              {capturedSamples}/{REQUIRED_SAMPLES} samples
            </span>
          </div>

          {/* Center guide */}
          <div className="relative">
            <div
              className="w-40 h-48 rounded-full border-2 transition-colors"
              style={{
                borderColor: quality?.status === "GOOD_QUALITY" ? "#10b981" : "rgba(255,255,255,0.4)",
              }}
            />
            {state === "SUCCESS" && (
              <div className="absolute inset-0 flex items-center justify-center">
                <CheckCircle size={48} className="text-green-400" />
              </div>
            )}
          </div>

          {/* Bottom */}
          <div className="w-full text-center">
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)" }}>{message}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-3 p-3 rounded-lg" style={{ background: "#fee2e2", border: "1px solid #fecaca" }}>
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} style={{ color: "#dc2626" }} />
            <span style={{ fontSize: "12px", color: "#991b1b" }}>{error}</span>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {state === "CAPTURING" && (
          <button
            onClick={captureSample}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold cursor-pointer transition-all hover:opacity-90"
            style={{ background: "#4A2BC2", color: "#fff", fontSize: "var(--text-sm, 14px)" }}
          >
            <Camera size={14} />
            Capture
          </button>
        )}
        {state === "PROCESSING" && (
          <div className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg"
            style={{ background: "#4A2BC2", color: "#fff", fontSize: "var(--text-sm, 14px)" }}
          >
            <Loader2 size={14} className="animate-spin" />
            Processing...
          </div>
        )}
        <button
          onClick={onCancel}
          className="px-4 py-2.5 rounded-lg font-semibold cursor-pointer transition-all hover:opacity-90"
          style={{
            background: "var(--surface-elevated, #f1f5f9)",
            color: "var(--text-primary, #0f172a)",
            fontSize: "var(--text-sm, 14px)",
            border: "1px solid var(--border-subtle, #e2e8f0)",
          }}
        >
          Cancel
        </button>
      </div>

      <div className="mt-3 flex items-start gap-2">
        <Shield size={14} style={{ color: "var(--text-tertiary, #94a3b8)", marginTop: 2 }} />
        <span style={{ fontSize: "11px", color: "var(--text-tertiary, #94a3b8)", lineHeight: "1.4" }}>
          Your face template is stored securely on our servers. Raw images are never saved.
          You can revoke face login anytime from Settings.
        </span>
      </div>
    </div>
  );
}
