import type {
  FaceQualityResult,
  LivenessResult,
  FaceEmbedding,
  VerificationResult,
  LoginLocationData,
  LocationVerificationStatus,
} from "./types";

const VERIFICATION_THRESHOLD = 0.65;

export interface VerificationRequest {
  user_id: string;
  session_id: string;
  embedding: FaceEmbedding;
  quality: FaceQualityResult;
  liveness: LivenessResult;
  location?: LoginLocationData;
  device_id?: string;
}

export interface VerificationResponse {
  result: VerificationResult;
  similarity?: number;
  threshold: number;
  model_version: string;
  location_status?: LocationVerificationStatus;
  message?: string;
}

export function evaluateVerification(req: VerificationRequest, storedEmbedding: number[]): VerificationResponse {
  if (req.quality.status !== "GOOD_QUALITY") {
    return {
      result: "LOW_QUALITY",
      threshold: VERIFICATION_THRESHOLD,
      model_version: req.embedding.model_version,
      message: `Face quality: ${req.quality.status}`,
    };
  }

  if (req.liveness.status === "FAILED") {
    return {
      result: "LIVENESS_FAILED",
      threshold: VERIFICATION_THRESHOLD,
      model_version: req.embedding.model_version,
      message: req.liveness.details ?? "Liveness check failed",
    };
  }

  if (req.liveness.status === "SUSPICIOUS") {
    return {
      result: "LIVENESS_FAILED",
      threshold: VERIFICATION_THRESHOLD,
      model_version: req.embedding.model_version,
      message: "Suspicious liveness — possible presentation attack",
    };
  }

  if (!storedEmbedding || storedEmbedding.length === 0) {
    return {
      result: "ACCOUNT_NOT_ENROLLED",
      threshold: VERIFICATION_THRESHOLD,
      model_version: req.embedding.model_version,
      message: "No face template enrolled for this account",
    };
  }

  const similarity = cosineSimilarity(req.embedding.vector, storedEmbedding);

  if (similarity >= VERIFICATION_THRESHOLD) {
    return {
      result: "VERIFIED",
      similarity,
      threshold: VERIFICATION_THRESHOLD,
      model_version: req.embedding.model_version,
    };
  }

  return {
    result: "NOT_VERIFIED",
    similarity,
    threshold: VERIFICATION_THRESHOLD,
    model_version: req.embedding.model_version,
    message: `Similarity ${(similarity * 100).toFixed(1)}% below threshold ${(VERIFICATION_THRESHOLD * 100).toFixed(1)}%`,
  };
}

function cosineSimilarity(a: number[], b: number[]): number {
  const minLen = Math.min(a.length, b.length);
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < minLen; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export function evaluateLocation(
  location: LoginLocationData | undefined,
  required: boolean
): { status: LocationVerificationStatus; details?: string } {
  if (!required) {
    return { status: "LOCATION_NOT_REQUIRED" };
  }

  if (!location) {
    return { status: "LOCATION_UNAVAILABLE", details: "Location permission not granted" };
  }

  if (location.accuracy > 100) {
    return { status: "LOW_ACCURACY", details: `GPS accuracy ${location.accuracy.toFixed(0)}m — need ≤100m` };
  }

  const now = Date.now();
  const age = now - location.timestamp;
  if (age > 60000) {
    return { status: "LOCATION_UNAVAILABLE", details: "Location data is stale (>60s)" };
  }

  return { status: "LOCATION_VERIFIED" };
}
