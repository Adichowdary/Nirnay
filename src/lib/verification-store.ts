"use client";

export type MatchResult = "VERIFIED" | "UNCERTAIN" | "FAILED";

export interface VerificationRecord {
  id: string;
  employee: string;
  role: string;
  roleId: string;
  checkpoint: "LOGIN" | "MISSION_START" | "EVIDENCE_CAPTURE" | "MISSION_END";
  timestamp: string;
  confidence: number | null;
  result: MatchResult;
  location: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  device: string;
  project?: string;
  snapshotUrl?: string; // base64 face snapshot
  livenessScore?: number;
  qualityScore?: number;
  antiSpoofVerdict?: string;
  merkleDigest?: string;
  vectorSample?: number[];
  isRealWebcam?: boolean;
}

const INITIAL_EVENTS: VerificationRecord[] = [
  {
    id: "v-seed-1",
    employee: "Rajesh Kumar Sharma",
    role: "Central Directorate Official",
    roleId: "CENTRAL_ADMIN",
    checkpoint: "LOGIN",
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    confidence: 0.99,
    result: "VERIFIED",
    location: "New Delhi (HQ - Shastri Bhawan) (28.6149°N, 77.2144°E ±8m)",
    latitude: 28.6149,
    longitude: 77.2144,
    accuracy: 8,
    device: "Official Workstation / Chrome 124",
    snapshotUrl: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "v-seed-2",
    employee: "Priya Mehta",
    role: "PMU / Inspection Officer",
    roleId: "INSPECTION_OFFICER",
    checkpoint: "MISSION_START",
    timestamp: new Date(Date.now() - 1000 * 60 * 85).toISOString(),
    confidence: 0.96,
    result: "VERIFIED",
    location: "Guntur District, Andhra Pradesh (16.3067°N, 80.4365°E ±10m)",
    latitude: 16.3067,
    longitude: 80.4365,
    accuracy: 10,
    device: "Samsung Galaxy S23 (Gov-MDM)",
    project: "Guntur Skill Centre [DEMO]",
    snapshotUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "v-seed-3",
    employee: "K. Ramesh Babu",
    role: "State Admin (Andhra Pradesh)",
    roleId: "STATE_ADMIN",
    checkpoint: "LOGIN",
    timestamp: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
    confidence: 0.98,
    result: "VERIFIED",
    location: "AP Secretariat, Amaravati (16.5131°N, 80.5165°E ±8m)",
    latitude: 16.5131,
    longitude: 80.5165,
    accuracy: 8,
    device: "HP EliteBook (AP-Gov-LAN)",
    snapshotUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "v-seed-4",
    employee: "Anjali Verma",
    role: "NGO / Institute Incharge",
    roleId: "NGO_INSTITUTE",
    checkpoint: "LOGIN",
    timestamp: new Date(Date.now() - 1000 * 60 * 210).toISOString(),
    confidence: 0.94,
    result: "VERIFIED",
    location: "Jaipur District, Rajasthan (26.9124°N, 75.7873°E ±12m)",
    latitude: 26.9124,
    longitude: 75.7873,
    accuracy: 12,
    device: "iPad Pro (Institute Portal)",
    project: "Aadarsh Seva Sansthan [DEMO]",
    snapshotUrl: "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=300&auto=format&fit=crop&q=80",
  },
];

const STORAGE_KEY = "insight_verification_events_v3";

export function getVerificationEvents(): VerificationRecord[] {
  if (typeof window === "undefined") return INITIAL_EVENTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_EVENTS));
      return INITIAL_EVENTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading verification events", e);
    return INITIAL_EVENTS;
  }
}

export function saveVerificationEvent(event: Omit<VerificationRecord, "id">): VerificationRecord {
  const newEvent: VerificationRecord = {
    ...event,
    id: `v-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
  };

  if (typeof window !== "undefined") {
    try {
      const existing = getVerificationEvents();
      // Keep up to 30 recent records to guarantee swift localStorage access
      const updated = [newEvent, ...existing].slice(0, 30);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("verification_event_added", { detail: newEvent }));
      window.dispatchEvent(new Event("storage"));
    } catch (e) {
      console.error("Error saving verification event", e);
    }
  }

  return newEvent;
}

export function getLatestOfficerSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  const events = getVerificationEvents();
  for (const ev of events) {
    if (ev.snapshotUrl) return ev.snapshotUrl;
  }
  return null;
}

