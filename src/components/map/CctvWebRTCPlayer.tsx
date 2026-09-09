"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Wifi, WifiOff, Loader2, Play } from "lucide-react";

interface CctvWebRTCPlayerProps {
  streamUrl: string;
  cameraName: string;
  status: "online" | "offline" | "maintenance" | "unknown";
  autoPlay?: boolean;
}

export function CctvWebRTCPlayer({
  streamUrl,
  cameraName,
  status,
  autoPlay = true,
}: CctvWebRTCPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [connectionState, setConnectionState] = useState<"idle" | "connecting" | "connected" | "failed">("idle");
  const [error, setError] = useState<string | null>(null);
  const hasAutoPlayedRef = useRef(false);

  const mediamtxBase = process.env.NEXT_PUBLIC_MEDIAMTX_URL ?? "http://localhost:8889";

  const connect = useCallback(async () => {
    if (status === "offline") {
      setError("Camera is offline");
      return;
    }

    setConnectionState("connecting");
    setError(null);

    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
        ],
      });
      pcRef.current = pc;

      pc.ontrack = (event) => {
        if (videoRef.current) {
          videoRef.current.srcObject = event.streams[0];
        }
        setConnectionState("connected");
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed") {
          setConnectionState("failed");
          setError("Connection failed — is MediaMTX running?");
        }
      };

      const streamId = streamUrl.split("/").pop() ?? "camera";
      const response = await fetch(`${mediamtxBase}/webrtc?src=${streamId}`, {
        method: "POST",
        headers: { "Content-Type": "application/sdp" },
      });

      if (!response.ok) {
        throw new Error(`MediaMTX returned ${response.status}`);
      }

      const answerSdp = await response.text();
      await pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: answerSdp }));

      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          await fetch(`${mediamtxBase}/webrtc?src=${streamId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/trickle-ice-candidate" },
            body: JSON.stringify(event.candidate.toJSON()),
          });
        }
      };
    } catch (err) {
      setConnectionState("failed");
      setError(err instanceof Error ? err.message : "Failed to connect");
    }
  }, [status, streamUrl, mediamtxBase]);

  const disconnect = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    setConnectionState("idle");
  }, []);

  useEffect(() => {
    if (autoPlay && status === "online" && !hasAutoPlayedRef.current) {
      hasAutoPlayedRef.current = true;
      void connect();
    }
    return () => disconnect();
  }, [autoPlay, status, connect, disconnect]);

  return (
    <div className="relative rounded-xl overflow-hidden" style={{ background: "#000", aspectRatio: "16/9" }}>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover"
        style={{ display: connectionState === "connected" ? "block" : "none" }}
      />

      {(status === "offline" || connectionState === "failed") && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <WifiOff size={32} style={{ color: "rgba(255,255,255,0.3)" }} />
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "var(--text-xs)", marginTop: 8 }}>
            {error ?? "Camera Offline"}
          </p>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px", marginTop: 4 }}>
            {cameraName}
          </p>
        </div>
      )}

      {connectionState === "connecting" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Loader2 size={32} style={{ color: "rgba(255,255,255,0.4)" }} className="animate-spin" />
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "var(--text-xs)", marginTop: 8 }}>
            Connecting to stream...
          </p>
        </div>
      )}

      {connectionState === "idle" && status !== "offline" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <button
            onClick={connect}
            className="w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            <Play size={20} color="#fff" fill="white" />
          </button>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "var(--text-xs)", marginTop: 8 }}>
            {cameraName}
          </p>
        </div>
      )}

      <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full"
        style={{
          background: status === "online"
            ? "rgba(16,185,129,0.9)"
            : status === "maintenance"
            ? "rgba(245,158,11,0.9)"
            : "rgba(220,38,38,0.9)",
        }}
      >
        {status === "online" ? <Wifi size={10} color="#fff" /> : <WifiOff size={10} color="#fff" />}
        <span style={{ fontSize: "9px", color: "#fff", fontWeight: 600 }}>
          {status.toUpperCase()}
        </span>
      </div>
    </div>
  );
}
