export type FaceQualityStatus =
  | "GOOD_QUALITY"
  | "NO_FACE"
  | "MULTIPLE_FACES"
  | "LOW_LIGHT"
  | "BLURRY"
  | "FACE_TOO_SMALL"
  | "BAD_POSE"
  | "LOW_RESOLUTION";

export type LivenessStatus = "LIVE" | "SUSPICIOUS" | "FAILED" | "UNAVAILABLE";

export type VerificationResult =
  | "VERIFIED"
  | "NOT_VERIFIED"
  | "RETRY_REQUIRED"
  | "LOW_QUALITY"
  | "LIVENESS_FAILED"
  | "MODEL_UNAVAILABLE"
  | "ACCOUNT_NOT_ENROLLED";

export type LocationVerificationStatus =
  | "LOCATION_VERIFIED"
  | "LOCATION_UNAVAILABLE"
  | "LOW_ACCURACY"
  | "LOCATION_POLICY_FAILED"
  | "LOCATION_NOT_REQUIRED";

export type LoginFrsState =
  | "READY"
  | "DETECTING_FACE"
  | "CHECKING_QUALITY"
  | "CHECKING_LIVENESS"
  | "VERIFYING_IDENTITY"
  | "VERIFYING_LOCATION"
  | "SUCCESS"
  | "FAILED"
  | "RETRY"
  | "MODEL_UNAVAILABLE"
  | "LOCATION_UNAVAILABLE";

export type EnrollmentStatus = "PENDING" | "ACTIVE" | "REVOKED";

export interface FaceLandmark {
  x: number;
  y: number;
  z: number;
}

export interface FaceDetection {
  boundingBox: { x: number; y: number; width: number; height: number };
  landmarks: FaceLandmark[];
  score: number;
}

export interface FaceQualityResult {
  status: FaceQualityStatus;
  score: number;
  message?: string;
}

export interface LivenessResult {
  status: LivenessStatus;
  score: number;
  details?: string;
}

export interface FaceEmbedding {
  vector: number[];
  model_name: string;
  model_version: string;
  quality_score: number;
}

export interface VerificationSession {
  id: string;
  user_id: string;
  created_at: string;
  expires_at: string;
  location_required: boolean;
}

export interface LoginLocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  provider: string;
}

export interface FaceInferenceProvider {
  initialize(): Promise<void>;
  detectFace(imageData: ImageData): Promise<FaceDetection | null>;
  checkQuality(detection: FaceDetection, imageWidth: number, imageHeight: number): FaceQualityResult;
  checkLiveness(detection: FaceDetection, previousDetections?: FaceDetection[]): LivenessResult;
  generateEmbedding(detection: FaceDetection, imageData: ImageData): Promise<FaceEmbedding>;
  computeSimilarity(a: number[], b: number[]): number;
  isAvailable(): boolean;
  getModelInfo(): { name: string; version: string; license: string };
}

// TrustLayer AI Multi-Stage Pipeline Types
export type TrustLayerPipelineStage =
  | "INITIALIZING"
  | "FACE_DETECTION"
  | "QUALITY_CHECK"
  | "LIVENESS_CHALLENGE"
  | "EMBEDDING_EXTRACTION"
  | "RISK_ASSESSMENT"
  | "VERIFIED_SUCCESS"
  | "FAILED";

export interface FaceQualityBreakdown {
  lighting: number;    // percentage 0-100
  sharpness: number;   // percentage 0-100
  pose: number;        // percentage 0-100
  faceSize: number;    // percentage 0-100
  occlusion: number;   // percentage 0-100
  overall: number;     // weighted composite 0-100
}

export type LivenessChallengeType =
  | "CENTER_GAZE"
  | "HEAD_ANGLE"
  | "BLINK_DETECTION"
  | "DEPTH_CONSISTENCY";

export interface LivenessChallengeStatus {
  activeChallenge: LivenessChallengeType;
  instructions: string;
  progress: number;       // 0-100
  blinkDetected: boolean;
  angleVariance: number;
  isCompleted: boolean;
}

export interface AntiSpoofTelemetry {
  verdict: "PASS" | "REVIEW" | "SPOOF_DETECTED";
  presentationAttackRisk: "LOW" | "ELEVATED" | "CRITICAL";
  textureScore: number;     // 0-100
  depthConsistency: number; // 0-100
  screenArtifacts: number;  // 0-100
}

export interface BiometricConfidenceScorecard {
  officerId: string;
  employeeName: string;
  designation: string;
  faceMatchScore: number;      // e.g. 98.4%
  livenessScore: number;       // e.g. 99.2%
  faceQualityScore: number;    // e.g. 95.8%
  antiSpoofVerdict: string;    // e.g. "PASS (No Presentation Attack Detected)"
  sessionRisk: "LOW" | "MEDIUM" | "HIGH";
  gnssCadastreLock: string;    // e.g. "ISRO Bhuvan Cadastre Locked (±3.2m)"
  timestamp: string;
  merkleSealDigest: string;    // SHA-256 hash
}

export interface EmbeddingVectorTelemetry {
  dimension: number; // 512
  sampleCoordinates: number[]; // preview of normalized float values e.g. [0.21, -0.08, 0.73, ...]
  sha256Digest: string;
}

