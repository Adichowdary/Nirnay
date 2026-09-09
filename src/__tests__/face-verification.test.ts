import { describe, it, expect } from "vitest";
import { evaluateVerification, evaluateLocation, VerificationRequest } from "@/lib/face-recognition/verification";

describe("Face Recognition & Verification Logic", () => {
  const dummyEmbedding = Array.from({ length: 128 }, (_, i) => Math.sin(i));
  const identicalEmbedding = [...dummyEmbedding];
  const differentEmbedding = Array.from({ length: 128 }, (_, i) => Math.cos(i * 2));

  const validRequest: VerificationRequest = {
    user_id: "user-123",
    session_id: "sess-abc",
    embedding: {
      vector: dummyEmbedding,
      model_name: "mediapipe_face_embedder",
      model_version: "v1.0.0",
      quality_score: 0.95,
    },
    quality: {
      status: "GOOD_QUALITY",
      score: 0.95,
      message: "Optimal lighting and angle",
    },
    liveness: {
      status: "LIVE",
      score: 0.98,
      details: "Live motion validated",
    },
    location: {
      latitude: 28.6139,
      longitude: 77.209,
      accuracy: 10,
      timestamp: Date.now(),
      provider: "gps",
    },
  };

  it("should verify successfully with matching embeddings and good quality/liveness", () => {
    const res = evaluateVerification(validRequest, identicalEmbedding);
    expect(res.result).toBe("VERIFIED");
    expect(res.similarity).toBeGreaterThanOrEqual(0.65);
  });

  it("should reject when face quality is low", () => {
    const lowQualityReq: VerificationRequest = {
      ...validRequest,
      quality: {
        status: "LOW_LIGHT",
        score: 0.3,
        message: "Lighting too dim",
      },
    };
    const res = evaluateVerification(lowQualityReq, identicalEmbedding);
    expect(res.result).toBe("LOW_QUALITY");
    expect(res.message).toContain("LOW_LIGHT");
  });

  it("should reject when liveness check fails", () => {
    const failedLivenessReq: VerificationRequest = {
      ...validRequest,
      liveness: {
        status: "FAILED",
        score: 0.2,
        details: "Photo attack detected",
      },
    };
    const res = evaluateVerification(failedLivenessReq, identicalEmbedding);
    expect(res.result).toBe("LIVENESS_FAILED");
    expect(res.message).toBe("Photo attack detected");
  });

  it("should reject when liveness is suspicious", () => {
    const suspLivenessReq: VerificationRequest = {
      ...validRequest,
      liveness: {
        status: "SUSPICIOUS",
        score: 0.45,
      },
    };
    const res = evaluateVerification(suspLivenessReq, identicalEmbedding);
    expect(res.result).toBe("LIVENESS_FAILED");
  });

  it("should return ACCOUNT_NOT_ENROLLED if stored template is empty", () => {
    const res = evaluateVerification(validRequest, []);
    expect(res.result).toBe("ACCOUNT_NOT_ENROLLED");
  });

  it("should return NOT_VERIFIED if embeddings do not match threshold", () => {
    const res = evaluateVerification(validRequest, differentEmbedding);
    expect(res.result).toBe("NOT_VERIFIED");
  });

  describe("Location Evaluation", () => {
    it("should return LOCATION_NOT_REQUIRED when location is not mandatory", () => {
      const res = evaluateLocation(undefined, false);
      expect(res.status).toBe("LOCATION_NOT_REQUIRED");
    });

    it("should return LOCATION_UNAVAILABLE if location is missing when required", () => {
      const res = evaluateLocation(undefined, true);
      expect(res.status).toBe("LOCATION_UNAVAILABLE");
    });

    it("should return LOW_ACCURACY if GPS accuracy is > 100m", () => {
      const res = evaluateLocation(
        {
          latitude: 28.6139,
          longitude: 77.209,
          accuracy: 250,
          timestamp: Date.now(),
          provider: "cellular",
        },
        true
      );
      expect(res.status).toBe("LOW_ACCURACY");
    });

    it("should return LOCATION_UNAVAILABLE if timestamp is older than 60s", () => {
      const res = evaluateLocation(
        {
          latitude: 28.6139,
          longitude: 77.209,
          accuracy: 15,
          timestamp: Date.now() - 120000,
          provider: "gps",
        },
        true
      );
      expect(res.status).toBe("LOCATION_UNAVAILABLE");
      expect(res.details).toContain("stale");
    });

    it("should return LOCATION_VERIFIED for accurate, fresh GPS location", () => {
      const res = evaluateLocation(
        {
          latitude: 28.6139,
          longitude: 77.209,
          accuracy: 8,
          timestamp: Date.now() - 5000,
          provider: "gps",
        },
        true
      );
      expect(res.status).toBe("LOCATION_VERIFIED");
    });
  });
});
