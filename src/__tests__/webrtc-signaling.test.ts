import { describe, it, expect, vi } from "vitest";
import {
  selectRandomVCParticipant,
  DEMO_ELIGIBLE_PARTICIPANTS,
  getFreeWebRTCConfiguration,
} from "@/lib/webrtc-signaling";

describe("selectRandomVCParticipant", () => {
  it("returns a participant from the pool", () => {
    const p = selectRandomVCParticipant();
    expect(p).toBeDefined();
    expect(p.id).toBeTruthy();
    expect(p.name).toBeTruthy();
  });

  it("returns only eligible participants", () => {
    for (let i = 0; i < 50; i++) {
      const p = selectRandomVCParticipant();
      expect(p.is_eligible).toBe(true);
    }
  });

  it("filters by facility_id when provided", () => {
    for (let i = 0; i < 30; i++) {
      const p = selectRandomVCParticipant("INS-2041");
      expect(p.facility_id).toBe("INS-2041");
    }
  });

  it("filters by role when provided", () => {
    for (let i = 0; i < 30; i++) {
      const p = selectRandomVCParticipant(undefined, "incharge");
      expect(p.role).toBe("incharge");
    }
  });

  it("filters by facility and role combined", () => {
    for (let i = 0; i < 30; i++) {
      const p = selectRandomVCParticipant("INS-2041", "staff");
      expect(p.facility_id).toBe("INS-2041");
      expect(p.role).toBe("staff");
    }
  });

  it("returns different participants over multiple calls", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 100; i++) {
      seen.add(selectRandomVCParticipant().id);
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it("DEMO_ELIGIBLE_PARTICIPANTS has entries", () => {
    expect(DEMO_ELIGIBLE_PARTICIPANTS.length).toBeGreaterThan(0);
  });
});

describe("getFreeWebRTCConfiguration", () => {
  it("returns valid RTCConfiguration", () => {
    const config = getFreeWebRTCConfiguration();
    expect(config.iceServers).toBeDefined();
    expect(config.iceServers!.length).toBeGreaterThan(0);
  });

  it("includes STUN servers", () => {
    const config = getFreeWebRTCConfiguration();
    const urls = config.iceServers!.flatMap((s) => s.urls);
    expect(urls.some((u) => String(u).includes("stun"))).toBe(true);
  });

  it("sets iceCandidatePoolSize", () => {
    const config = getFreeWebRTCConfiguration();
    expect(config.iceCandidatePoolSize).toBe(10);
  });
});
