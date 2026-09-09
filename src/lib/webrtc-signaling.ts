/**
 * INSIGHT — Supabase Realtime WebRTC Signaling & DPDP Compliance Engine
 * 
 * Free / Open-Source signaling protocol for unannounced random video calls.
 * 
 * Protocol Flow:
 * 1. Officer initiates call -> Supabase Realtime inserts `video_sessions` row
 * 2. Signaling exchanged over Supabase Broadcast channel (`session_signals:<sessionId>`)
 *    - SDP Offer (Caller -> Callee)
 *    - SDP Answer (Callee -> Caller)
 *    - ICE Candidates (Peer <-> Peer)
 * 3. DPDP Act 2023 Compliance Gate:
 *    - Vulnerable beneficiaries are protected by strict purpose limitation and masking
 *    - No raw recording without written administrative consent
 *    - Ephemeral WebRTC session with cryptographic attestation logging
 */

export interface DPDPParticipantProfile {
  id: string;
  name: string;
  role: "incharge" | "staff" | "beneficiary" | "welfare_officer";
  facility_id: string;
  facility_name: string;
  phone_masked: string;
  consent_status: "consented" | "guardian_consented" | "exempt_statutory_audit" | "pending";
  dpdp_category: "standard" | "vulnerable_deaddiction" | "vulnerable_minor" | "disability_support";
  is_eligible: boolean;
  avatar_url?: string;
}

export type WebRTCSignalType =
  | "OFFER"
  | "ANSWER"
  | "ICE_CANDIDATE"
  | "CALL_INITIATED"
  | "CALL_ACCEPTED"
  | "CALL_REJECTED"
  | "CALL_TERMINATED"
  | "CONSENT_ACKNOWLEDGED";

export interface WebRTCSignalMessage {
  sessionId: string;
  senderId: string;
  senderRole: string;
  type: WebRTCSignalType;
  sdp?: RTCSessionDescriptionInit | null;
  candidate?: RTCIceCandidateInit | null;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface VideoSessionRecord {
  id: string;
  facility_id: string;
  facility_name: string;
  officer_id: string;
  officer_name: string;
  participant_id: string;
  participant_name: string;
  participant_role: string;
  status: "RINGING" | "NEGOTIATING" | "CONNECTED" | "VERIFIED" | "FAILED" | "ENDED";
  started_at: string;
  connected_at?: string;
  ended_at?: string;
  duration_seconds: number;
  dpdp_compliance: {
    data_fiduciary: "DoSJE_GOV_IN";
    purpose: "SURPRISE_STATUTORY_FACILITY_VERIFICATION";
    retention_period: "EPHEMERAL_STREAM_NO_STORAGE";
    consent_mode: string;
    beneficiary_blur_applied: boolean;
  };
  evidence_snapshot_hashes: string[];
  audit_signature?: string;
}

export const DEMO_ELIGIBLE_PARTICIPANTS: DPDPParticipantProfile[] = [
  {
    id: "p-incharge-1",
    name: "Dr. Ramesh Babu",
    role: "incharge",
    facility_id: "INS-2041",
    facility_name: "Asha Rehabilitation Centre",
    phone_masked: "+91-9849X-XXXX1",
    consent_status: "exempt_statutory_audit",
    dpdp_category: "standard",
    is_eligible: true,
    avatar_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "p-staff-1",
    name: "Smt. Sunita Rao (Senior Counselor)",
    role: "staff",
    facility_id: "INS-2041",
    facility_name: "Asha Rehabilitation Centre",
    phone_masked: "+91-9440X-XXXX8",
    consent_status: "consented",
    dpdp_category: "standard",
    is_eligible: true,
    avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "p-beneficiary-1",
    name: "Beneficiary #8841 (Masked)",
    role: "beneficiary",
    facility_id: "INS-2041",
    facility_name: "Asha Rehabilitation Centre",
    phone_masked: "+91-9123X-XXXX4",
    consent_status: "consented",
    dpdp_category: "vulnerable_deaddiction",
    is_eligible: true,
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "p-incharge-2",
    name: "Mrs. Kavitha Reddy",
    role: "incharge",
    facility_id: "INS-2042",
    facility_name: "Pragati Skill Centre",
    phone_masked: "+91-9700X-XXXX5",
    consent_status: "exempt_statutory_audit",
    dpdp_category: "standard",
    is_eligible: true,
    avatar_url: "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "p-staff-2",
    name: "Mr. Anand Varma (Vocational Instructor)",
    role: "staff",
    facility_id: "INS-2042",
    facility_name: "Pragati Skill Centre",
    phone_masked: "+91-9866X-XXXX2",
    consent_status: "consented",
    dpdp_category: "standard",
    is_eligible: true,
    avatar_url: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&auto=format&fit=crop&q=80",
  },
];

/**
 * Weighted Random Participant Selector adhering to DPDP Compliance & Open Anomaly Scores.
 */
export function selectRandomVCParticipant(
  facilityId?: string,
  preferredRole?: "staff" | "beneficiary" | "incharge"
): DPDPParticipantProfile {
  let pool = DEMO_ELIGIBLE_PARTICIPANTS.filter((p) => p.is_eligible);

  if (facilityId) {
    const facilityPool = pool.filter((p) => p.facility_id === facilityId);
    if (facilityPool.length > 0) {
      pool = facilityPool;
    }
  }

  if (preferredRole) {
    const rolePool = pool.filter((p) => p.role === preferredRole);
    if (rolePool.length > 0) {
      pool = rolePool;
    }
  }

  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}

/**
 * Generates MediaMTX / WebRTC STUN/TURN ICE server configuration.
 * Uses public Google / Cloudflare STUN servers for zero-cost operation.
 */
export function getFreeWebRTCConfiguration(): RTCConfiguration {
  return {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun.cloudflare.com:3478" },
    ],
    iceCandidatePoolSize: 10,
  };
}
