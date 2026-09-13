"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface LiveStreamEvent {
  id: string;
  timestamp: string;
  type: "BIOMETRIC_COLLISION" | "CCTV_ANOMALY" | "GRIEVANCE_FILED" | "GEOFENCE_BREACH" | "GRANT_DIVERGENCE" | "INSPECTION_SYNC";
  title: string;
  description: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "INFO";
  location: string;
  facilityName: string;
  meta?: Record<string, unknown>;
}

const SEED_EVENTS: LiveStreamEvent[] = [
  {
    id: "EVT-LIVE-001",
    timestamp: "Just now",
    type: "BIOMETRIC_COLLISION",
    title: "Dual-Center Biometric Collision",
    description: "Simultaneous FRS check-in flagged across Jaipur and Jodhpur (310km apart).",
    severity: "CRITICAL",
    location: "Jaipur, Rajasthan",
    facilityName: "Asha Rehabilitation Centre",
  },
  {
    id: "EVT-LIVE-002",
    timestamp: "1 min ago",
    type: "CCTV_ANOMALY",
    title: "Hall-B Attendance Deficit (>38%)",
    description: "YOLOv10 counter detected 48 occupants vs statutory registered quota of 80.",
    severity: "HIGH",
    location: "Warangal, Telangana",
    facilityName: "Pragati Skill Training Institute",
  },
  {
    id: "EVT-LIVE-003",
    timestamp: "3 mins ago",
    type: "GEOFENCE_BREACH",
    title: "Unscheduled Out-of-Bounds Inspector Ping",
    description: "Officer S. Venkat GPS ping registered 4.2km outside scheduled inspection geo-boundary.",
    severity: "MEDIUM",
    location: "Bhopal, MP",
    facilityName: "Umang Welfare Special School",
  },
  {
    id: "EVT-LIVE-004",
    timestamp: "5 mins ago",
    type: "GRIEVANCE_FILED",
    title: "Whistleblower Fraud Report Filed",
    description: "Anonymous whistleblower report lodged regarding midday meal quota diversion.",
    severity: "HIGH",
    location: "Noida, UP",
    facilityName: "Samarth Inclusive Care",
  },
];

const STREAM_CANDIDATES: Array<Omit<LiveStreamEvent, "id" | "timestamp">> = [
  {
    type: "BIOMETRIC_COLLISION",
    title: "Facial Embedding Collision (97.4%)",
    description: "DeepFace matched beneficiary ID-8841 simultaneously in Bhopal and Gwalior centers.",
    severity: "CRITICAL",
    location: "Gwalior, MP",
    facilityName: "Gwalior Inclusive Care Center",
  },
  {
    type: "CCTV_ANOMALY",
    title: "RTSP Stream Packet Jitter Detected",
    description: "Camera CAM-003 RTSP heartbeat latency spiked to 2.4s. AI buffer holding.",
    severity: "MEDIUM",
    location: "Guntur, AP",
    facilityName: "Asha Rehabilitation Centre",
  },
  {
    type: "GRANT_DIVERGENCE",
    title: "Milestone Divergence Flagged (₹18.2L)",
    description: "Tranche disbursement claimed 80% completion; verified physical progress is 56%.",
    severity: "HIGH",
    location: "Warangal, Telangana",
    facilityName: "Pragati Skill Foundation",
  },
  {
    type: "INSPECTION_SYNC",
    title: "Surprise Squad Evidence Uploaded",
    description: "Inspection Squad #4 uploaded 6 geo-tagged tamper-proof cryptographic evidence hashes.",
    severity: "INFO",
    location: "Lucknow, UP",
    facilityName: "Hope Foundation UP",
  },
  {
    type: "GRIEVANCE_FILED",
    title: "Citizen Whistleblower Tip Triaged",
    description: "DoSJE AI engine prioritized tip: 'Center locked during biometric check-in window'.",
    severity: "CRITICAL",
    location: "Jaipur, Rajasthan",
    facilityName: "Asha Rehabilitation Centre",
  },
  {
    type: "CCTV_ANOMALY",
    title: "CCTV Camera Cam-001 Reconnected",
    description: "High-definition edge RTSP feed restored at 60FPS. Person detection resumed.",
    severity: "INFO",
    location: "Noida, UP",
    facilityName: "Samarth Inclusive Care",
  }
];

export function useRealTimeStream(intervalMs: number = 14000) {
  const [events, setEvents] = useState<LiveStreamEvent[]>(SEED_EVENTS);
  const [latestEvent, setLatestEvent] = useState<LiveStreamEvent | null>(SEED_EVENTS[0]);
  const [activeCount, setActiveCount] = useState<number>(4);
  const counterRef = useRef<number>(100);

  const pushCandidate = useCallback(() => {
    const randomItem = STREAM_CANDIDATES[Math.floor(Math.random() * STREAM_CANDIDATES.length)];
    counterRef.current += 1;
    const newEvent: LiveStreamEvent = {
      ...randomItem,
      id: `EVT-LIVE-${counterRef.current}`,
      timestamp: "Just now",
    };

    setEvents((prev) => [newEvent, ...prev.slice(0, 14)]);
    setLatestEvent(newEvent);
    setActiveCount((c) => c + 1);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      pushCandidate();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs, pushCandidate]);

  return {
    events,
    latestEvent,
    activeCount,
    triggerManualEvent: pushCandidate,
  };
}
