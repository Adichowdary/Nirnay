import { describe, it, expect } from "vitest";
import { extractInspectionFromTranscript } from "@/lib/ai/speech-transcriber";
import { createCryptographicSeal, generateSha256Hash } from "@/lib/evidence/crypto-seal";

describe("Multilingual Speech-to-Audit Parser", () => {
  it("should extract headcount and checklist answers from English dictation", () => {
    const transcript =
      "Center is operating on time. Observed 52 beneficiaries physically present. Attendance register is verified, CCTV camera 3 is offline.";
    const result = extractInspectionFromTranscript(transcript, "en-IN");

    expect(result.observedAttendance).toBe(52);
    expect(result.answers["q1"]).toBe("YES");
    expect(result.answers["q2"]).toBe("YES");
    expect(result.answers["q3"]).toBe("YES");
    expect(result.answers["q4"]).toBe("NO");
    expect(result.criticalDefects.length).toBeGreaterThan(0);
  });

  it("should extract headcount and flagged parameters from Hindi dictation", () => {
    const transcript =
      "केंद्र समय पर खुला है। 48 लाभार्थी शारीरिक रूप से उपस्थित हैं, लेकिन पीने का पानी उपलब्ध नहीं है।";
    const result = extractInspectionFromTranscript(transcript, "hi-IN");

    expect(result.observedAttendance).toBe(48);
    expect(result.answers["q1"]).toBe("YES");
    expect(result.answers["q5"]).toBe("FLAGGED");
  });
});

describe("Cryptographic Proof-of-Presence & Merkle Seal", () => {
  it("should generate deterministic SHA-256 hashes", () => {
    const hash1 = generateSha256Hash("TEST_PAYLOAD_1");
    const hash2 = generateSha256Hash("TEST_PAYLOAD_1");
    const hash3 = generateSha256Hash("TEST_PAYLOAD_2");

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1.startsWith("0x")).toBe(true);
  });

  it("should create a valid immutable cryptographic seal certificate", () => {
    const payload = {
      reportId: "INSP-0094-RJ",
      facilityId: "FAC-RJ-048",
      facilityName: "Asha Rehabilitation Centre",
      timestamp: new Date().toISOString(),
      gpsCoords: { latitude: 26.9124, longitude: 75.7873, accuracy: 6 },
      cellTowerId: "AIRTEL-404-45",
      inspectorId: "OFF-PMU-882",
      inspectorName: "Priya Mehta",
      frsFaceEncodingHash: "0x1234567890abcdef",
      cctvSnapshotSha256: "0xfedcba0987654321",
      observedHeadcount: 48,
      statutoryChecklistScore: 92,
    };

    const seal = createCryptographicSeal(payload);

    expect(seal.certificateId).toContain("CERT-NIRNAY-INSP-0094-RJ");
    expect(seal.merkleRoot).toBeTruthy();
    expect(seal.isTamperProofValid).toBe(true);
    expect(seal.signatures.leadInspector.verified).toBe(true);
    expect(seal.signatures.nodalOfficer.verified).toBe(true);
  });
});
