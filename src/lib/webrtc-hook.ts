"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/db/browser";

interface Signal {
  id: string;
  session_id: string;
  sender_id: string;
  signal_type: "offer" | "answer" | "ice-candidate";
  payload: RTCSessionDescriptionInit | RTCIceCandidateInit;
  created_at: string;
}

interface UseWebRTCOptions {
  sessionId: string;
  userId: string;
  onRemoteStream?: (stream: MediaStream) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

export function useWebRTC({ sessionId, userId, onRemoteStream, onConnected, onDisconnected }: UseWebRTCOptions) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const callbacksRef = useRef({ onRemoteStream, onConnected, onDisconnected });
  const sendSignalRef = useRef<(signalType: Signal["signal_type"], payload: object) => Promise<void>>(null);

  const sendSignal = useCallback(async (signalType: Signal["signal_type"], payload: object) => {
    const supabase = createClient();
    await supabase.from("video_signal_channels").insert({
      session_id: sessionId,
      sender_id: userId,
      signal_type: signalType,
      payload,
    });
  }, [sessionId, userId]);

  // Sync refs in effect to avoid "access refs during render" lint error
  useEffect(() => {
    callbacksRef.current = { onRemoteStream, onConnected, onDisconnected };
    sendSignalRef.current = sendSignal;
  });

  const getOrCreatePeerConnection = useCallback(() => {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        ...(process.env.TURN_SERVER_URL
          ? [{
              urls: process.env.TURN_SERVER_URL,
              username: process.env.TURN_SERVER_USERNAME ?? "",
              credential: process.env.TURN_SERVER_CREDENTIAL ?? "",
            }]
          : []),
      ],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignalRef.current?.("ice-candidate", event.candidate.toJSON());
      }
    };

    pc.ontrack = (event) => {
      const remote = event.streams[0];
      setRemoteStream(remote);
      callbacksRef.current.onRemoteStream?.(remote);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        setIsConnected(true);
        callbacksRef.current.onConnected?.();
      } else if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        setIsConnected(false);
        callbacksRef.current.onDisconnected?.();
      }
    };

    pcRef.current = pc;
    return pc;
  }, []);

  const startCall = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: 640, height: 480 },
      audio: true,
    });
    setLocalStream(stream);

    const pc = getOrCreatePeerConnection();
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await sendSignal("offer", offer);
  }, [getOrCreatePeerConnection, sendSignal]);

  const answerCall = useCallback(async (offer: RTCSessionDescriptionInit) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: 640, height: 480 },
      audio: true,
    });
    setLocalStream(stream);

    const pc = getOrCreatePeerConnection();
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await sendSignal("answer", answer);
  }, [getOrCreatePeerConnection, sendSignal]);

  const toggleMute = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => { t.enabled = isMuted; });
      setIsMuted(!isMuted);
    }
  }, [localStream, isMuted]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach((t) => { t.enabled = isVideoOff; });
      setIsVideoOff(!isVideoOff);
    }
  }, [localStream, isVideoOff]);

  const endCall = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    localStream?.getTracks().forEach((t) => t.stop());
    setLocalStream(null);
    setRemoteStream(null);
    setIsConnected(false);
    channelRef.current?.unsubscribe();
  }, [localStream]);

  // Listen for incoming signals via Supabase Realtime
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`session_signals:${sessionId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "video_signal_channels",
        filter: `session_id=eq.${sessionId}`,
      }, async (payload) => {
        const signal = payload.new as Signal;
        if (signal.sender_id === userId) return;

        const pc = getOrCreatePeerConnection();

        if (signal.signal_type === "offer") {
          await answerCall(signal.payload as RTCSessionDescriptionInit);
        } else if (signal.signal_type === "answer") {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.payload as RTCSessionDescriptionInit));
        } else if (signal.signal_type === "ice-candidate") {
          await pc.addIceCandidate(new RTCIceCandidate(signal.payload as RTCIceCandidateInit));
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [sessionId, userId, getOrCreatePeerConnection, answerCall]);

  return {
    localStream,
    remoteStream,
    isConnected,
    isMuted,
    isVideoOff,
    startCall,
    answerCall,
    toggleMute,
    toggleVideo,
    endCall,
  };
}
