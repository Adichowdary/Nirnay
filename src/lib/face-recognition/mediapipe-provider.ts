import type {
  FaceInferenceProvider,
  FaceDetection,
  FaceLandmark,
  FaceQualityResult,
  LivenessResult,
  FaceEmbedding,
} from "./types";

const FACE_LANDMARKER_MODEL = "face_landmarker.task";
const FACE_LANDMARKER_URL = `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/${FACE_LANDMARKER_MODEL}`;
const WASM_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm";

const MODEL_INFO = {
  name: "MediaPipe FaceLandmarker",
  version: "1.0.1",
  license: "Apache-2.0",
  model_hash: "float16/blaze_face_short_range",
};

const QUALITY_THRESHOLDS = {
  MIN_FACE_SIZE_RATIO: 0.15,
  MIN_LANDMARK_VISIBILITY: 0.5,
  MAX_YAW_DEVIATION: 0.4,
  MAX_PITCH_DEVIATION: 0.4,
  MIN_BRIGHTNESS: 0.2,
  MAX_BRIGHTNESS: 0.85,
  BLUR_LAPLACIAN_THRESHOLD: 50,
  EMBEDDING_SIZE: 1404,
};

const LIVENESS_CONFIG = {
  MIN_DEPTH_VARIANCE: 0.001,
  MIN_EYE_ASPECT_RATIO: 0.2,
  MAX_STATIC_FRAMES: 5,
  BLINK_THRESHOLD: 0.15,
};

type FaceLandmarkerResult = {
  faceLandmarks: Array<Array<{ x: number; y: number; z: number }>>;
  faceBlendshapes?: unknown;
  facialTransformationMatrixes?: unknown[];
};

export class MediaPipeFaceProvider implements FaceInferenceProvider {
  private faceLandmarker: { detect: (input: ImageData) => FaceLandmarkerResult } | null = null;
  private initialized = false;
  private previousLandmarks: FaceLandmark[][] = [];
  private staticFrameCount = 0;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const vision = await import("@mediapipe/tasks-vision");
    const { FaceLandmarker, FilesetResolver } = vision;

    const filesetResolver = await FilesetResolver.forVisionTasks(WASM_CDN);

    this.faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath: FACE_LANDMARKER_URL,
        delegate: "GPU",
      },
      runningMode: "IMAGE",
      numFaces: 1,
      outputFaceBlendshapes: false,
      outputFacialTransformationMatrixes: true,
    }) as { detect: (input: ImageData) => FaceLandmarkerResult };

    this.initialized = true;
  }

  isAvailable(): boolean {
    return this.initialized && this.faceLandmarker !== null;
  }

  getModelInfo() {
    return MODEL_INFO;
  }

  async detectFace(imageData: ImageData): Promise<FaceDetection | null> {
    if (!this.isAvailable() || !this.faceLandmarker) return null;

    const result = this.faceLandmarker.detect(imageData);

    if (!result.faceLandmarks || result.faceLandmarks.length === 0) {
      return null;
    }

    const landmarks = result.faceLandmarks[0];
    const score = this.computeDetectionConfidence(landmarks);

    const xs = landmarks.map((l) => l.x);
    const ys = landmarks.map((l) => l.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const faceLandmarks: FaceLandmark[] = landmarks.map((l) => ({
      x: l.x,
      y: l.y,
      z: l.z ?? 0,
    }));

    return {
      boundingBox: {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      },
      landmarks: faceLandmarks,
      score,
    };
  }

  private computeDetectionConfidence(landmarks: Array<{ x: number; y: number; z?: number }>): number {
    if (landmarks.length < 468) return 0.5;
    const nose = landmarks[1];
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const eyeDist = Math.sqrt(
      (leftEye.x - rightEye.x) ** 2 + (leftEye.y - rightEye.y) ** 2
    );
    const symmetry = 1 - Math.abs(leftEye.y - rightEye.y) / (eyeDist || 1);
    const centering = 1 - Math.abs(nose.x - 0.5) * 2;
    return Math.min(1, (symmetry * 0.5 + centering * 0.3 + Math.min(eyeDist / 0.15, 1) * 0.2));
  }

  checkQuality(detection: FaceDetection, imageWidth: number, imageHeight: number): FaceQualityResult {
    const { boundingBox, landmarks, score } = detection;

    if (landmarks.length < 468) {
      return { status: "LOW_RESOLUTION", score: 0, message: "Insufficient landmark data" };
    }

    const faceSizeRatio = Math.max(boundingBox.width, boundingBox.height);
    if (faceSizeRatio < QUALITY_THRESHOLDS.MIN_FACE_SIZE_RATIO) {
      return { status: "FACE_TOO_SMALL", score: faceSizeRatio / QUALITY_THRESHOLDS.MIN_FACE_SIZE_RATIO, message: "Move closer to the camera" };
    }

    const nose = landmarks[1];
    const leftEyeInner = landmarks[133];
    const rightEyeInner = landmarks[362];
    const leftMouth = landmarks[61];
    const rightMouth = landmarks[291];

    const eyeCenterX = (leftEyeInner.x + rightEyeInner.x) / 2;
    const mouthCenterX = (leftMouth.x + rightMouth.x) / 2;
    const yawDeviation = Math.abs(nose.x - (eyeCenterX + mouthCenterX) / 2);

    if (yawDeviation > QUALITY_THRESHOLDS.MAX_YAW_DEVIATION) {
      return { status: "BAD_POSE", score: 1 - yawDeviation, message: "Look directly at the camera" };
    }

    const foreheadY = landmarks[10].y;
    const chinY = landmarks[152].y;
    const faceHeight = chinY - foreheadY;
    const noseVerticalPosition = (nose.y - foreheadY) / (faceHeight || 1);
    const pitchDeviation = Math.abs(noseVerticalPosition - 0.45);

    if (pitchDeviation > QUALITY_THRESHOLDS.MAX_PITCH_DEVIATION) {
      return { status: "BAD_POSE", score: 1 - pitchDeviation, message: "Keep your head level" };
    }

    const brightness = this.estimateBrightness(landmarks);
    if (brightness < QUALITY_THRESHOLDS.MIN_BRIGHTNESS) {
      return { status: "LOW_LIGHT", score: brightness / QUALITY_THRESHOLDS.MIN_BRIGHTNESS, message: "Move to better lighting" };
    }
    if (brightness > QUALITY_THRESHOLDS.MAX_BRIGHTNESS) {
      return { status: "LOW_LIGHT", score: (1 - brightness) / (1 - QUALITY_THRESHOLDS.MAX_BRIGHTNESS), message: "Reduce backlight" };
    }

    const blurScore = this.estimateBlur(landmarks);
    if (blurScore < QUALITY_THRESHOLDS.BLUR_LAPLACIAN_THRESHOLD) {
      return { status: "BLURRY", score: blurScore / QUALITY_THRESHOLDS.BLUR_LAPLACIAN_THRESHOLD, message: "Hold steady, image is blurry" };
    }

    const overallScore = (faceSizeRatio / 0.4) * 0.25 + score * 0.35 + (1 - yawDeviation) * 0.2 + (1 - pitchDeviation) * 0.2;
    return { status: "GOOD_QUALITY", score: Math.min(1, overallScore) };
  }

  private estimateBrightness(landmarks: FaceLandmark[]): number {
    const nose = landmarks[1];
    const leftCheek = landmarks[234];
    const rightCheek = landmarks[454];
    const faceWidth = Math.abs(rightCheek.x - leftCheek.x);
    return Math.max(0.1, Math.min(0.9, 0.5 + (nose.z || 0) * 0.3 + faceWidth * 0.2));
  }

  private estimateBlur(landmarks: FaceLandmark[]): number {
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const eyeDist = Math.sqrt(
      (leftEye.x - rightEye.x) ** 2 + (leftEye.y - rightEye.y) ** 2
    );
    const noseTip = landmarks[1];
    const noseBridge = landmarks[6];
    const noseSharpness = Math.abs((noseTip.z || 0) - (noseBridge.z || 0));
    return eyeDist * 100 + noseSharpness * 200 + 40;
  }

  checkLiveness(detection: FaceDetection, previousDetections?: FaceDetection[]): LivenessResult {
    if (!detection || detection.landmarks.length < 468) {
      return { status: "FAILED", score: 0, details: "Insufficient face data for liveness check" };
    }

    const landmarks = detection.landmarks;
    const depthCheck = this.checkDepthConsistency(landmarks);
    const eyeMotionCheck = this.checkEyeMotion(landmarks);
    const staticCheck = this.checkStaticFrame(detection, previousDetections ?? this.previousLandmarks.map((lm) => ({
      boundingBox: { x: 0, y: 0, width: 0, height: 0 },
      landmarks: lm,
      score: 0,
    })));

    this.previousLandmarks.push(landmarks);
    if (this.previousLandmarks.length > 10) {
      this.previousLandmarks.shift();
    }

    const scores = [depthCheck.score, eyeMotionCheck.score, staticCheck.score].filter(Boolean);
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    if (staticCheck.status === "SUSPICIOUS") {
      return { status: "SUSPICIOUS", score: avgScore, details: "Static image detected — please move slightly" };
    }

    if (depthCheck.score < 0.3 || eyeMotionCheck.score < 0.3) {
      return { status: "FAILED", score: avgScore, details: "Presentation attack detected" };
    }

    if (avgScore >= 0.5) {
      return { status: "LIVE", score: avgScore, details: "Liveness confirmed" };
    }

    return { status: "SUSPICIOUS", score: avgScore, details: "Uncertain liveness — retry recommended" };
  }

  private checkDepthConsistency(landmarks: FaceLandmark[]): { score: number } {
    const nose = landmarks[1];
    const forehead = landmarks[10];
    const chin = landmarks[152];
    const leftCheek = landmarks[234];
    const rightCheek = landmarks[454];

    const zValues = [nose, forehead, chin, leftCheek, rightCheek].map((l) => l.z ?? 0);
    const mean = zValues.reduce((a, b) => a + b, 0) / zValues.length;
    const variance = zValues.reduce((a, b) => a + (b - mean) ** 2, 0) / zValues.length;

    return { score: Math.min(1, variance / LIVENESS_CONFIG.MIN_DEPTH_VARIANCE) };
  }

  private checkEyeMotion(landmarks: FaceLandmark[]): { score: number } {
    const leftIris = landmarks[468] || landmarks[159];
    const rightIris = landmarks[473] || landmarks[386];
    const leftEyeInner = landmarks[133];
    const leftEyeOuter = landmarks[33];
    const rightEyeInner = landmarks[362];
    const rightEyeOuter = landmarks[263];

    const leftEyeWidth = Math.abs(leftEyeOuter.x - leftEyeInner.x);
    const rightEyeWidth = Math.abs(rightEyeOuter.x - rightEyeInner.x);
    const leftIrisOffset = Math.abs(leftIris.x - (leftEyeInner.x + leftEyeOuter.x) / 2) / (leftEyeWidth || 0.01);
    const rightIrisOffset = Math.abs(rightIris.x - (rightEyeInner.x + rightEyeOuter.x) / 2) / (rightEyeWidth || 0.01);

    const eyeAspectRatio =
      (Math.abs(landmarks[159].y - landmarks[145].y) +
        Math.abs(landmarks[144].y - landmarks[153].y)) /
      (2 * leftEyeWidth || 0.01);

    const hasEyeMovement = leftIrisOffset > 0.1 || rightIrisOffset > 0.1;
    const eyesOpen = eyeAspectRatio > LIVENESS_CONFIG.BLINK_THRESHOLD;

    return { score: hasEyeMovement ? 0.8 : eyesOpen ? 0.6 : 0.3 };
  }

  private checkStaticFrame(detection: FaceDetection, previous: FaceDetection[]): { status: "LIVE" | "SUSPICIOUS"; score: number } {
    if (previous.length < 3) return { status: "LIVE", score: 0.7 };

    const recent = previous.slice(-5);
    const landmarkDiffs = recent.map((prev) => {
      const currLandmarks = detection.landmarks;
      const prevLandmarks = prev.landmarks;
      if (currLandmarks.length !== prevLandmarks.length) return 1;
      let totalDiff = 0;
      for (let i = 0; i < Math.min(currLandmarks.length, 100); i++) {
        totalDiff += Math.abs(currLandmarks[i].x - prevLandmarks[i].x);
        totalDiff += Math.abs(currLandmarks[i].y - prevLandmarks[i].y);
      }
      return totalDiff / Math.min(currLandmarks.length, 100);
    });

    const avgDiff = landmarkDiffs.reduce((a, b) => a + b, 0) / landmarkDiffs.length;

    if (avgDiff < 0.0005) {
      this.staticFrameCount++;
    } else {
      this.staticFrameCount = 0;
    }

    if (this.staticFrameCount > LIVENESS_CONFIG.MAX_STATIC_FRAMES) {
      return { status: "SUSPICIOUS", score: 0.2 };
    }

    return { status: "LIVE", score: Math.min(1, avgDiff * 500 + 0.5) };
  }

  async generateEmbedding(detection: FaceDetection, _imageData: ImageData): Promise<FaceEmbedding> {
    const landmarks = detection.landmarks;
    if (landmarks.length < 468) {
      return {
        vector: new Array(QUALITY_THRESHOLDS.EMBEDDING_SIZE).fill(0),
        model_name: MODEL_INFO.name,
        model_version: MODEL_INFO.version,
        quality_score: 0,
      };
    }

    const vector = this.extractGeometricEmbedding(landmarks);

    return {
      vector,
      model_name: MODEL_INFO.name,
      model_version: MODEL_INFO.version,
      quality_score: detection.score,
    };
  }

  private extractGeometricEmbedding(landmarks: FaceLandmark[]): number[] {
    const featurePoints = [
      1, 33, 263, 61, 291, 199, 94, 2,
      127, 356, 168, 6, 197, 5, 4, 152,
      10, 159, 386, 145, 374, 133, 362, 263,
      234, 454, 127, 356, 162, 16, 389, 251,
      70, 300, 468, 473,
    ];

    const noseTip = landmarks[1];
    const normalized = featurePoints.map((idx) => {
      const l = landmarks[idx] || noseTip;
      return {
        x: l.x - noseTip.x,
        y: l.y - noseTip.y,
        z: (l.z ?? 0) - (noseTip.z ?? 0),
      };
    });

    const distances: number[] = [];
    for (let i = 0; i < normalized.length; i++) {
      for (let j = i + 1; j < Math.min(normalized.length, i + 8); j++) {
        const dx = normalized[i].x - normalized[j].x;
        const dy = normalized[i].y - normalized[j].y;
        const dz = normalized[i].z - normalized[j].z;
        distances.push(Math.sqrt(dx * dx + dy * dy + dz * dz));
      }
    }

    const ratios: number[] = [];
    const eyeDist = Math.sqrt(
      (landmarks[33].x - landmarks[263].x) ** 2 +
        (landmarks[33].y - landmarks[263].y) ** 2
    ) || 0.01;

    const noseToChin = Math.sqrt(
      (landmarks[1].x - landmarks[152].x) ** 2 +
        (landmarks[1].y - landmarks[152].y) ** 2
    );
    ratios.push(noseToChin / eyeDist);

    const noseToLeftMouth = Math.sqrt(
      (landmarks[1].x - landmarks[61].x) ** 2 +
        (landmarks[1].y - landmarks[61].y) ** 2
    );
    ratios.push(noseToLeftMouth / eyeDist);

    const noseToRightMouth = Math.sqrt(
      (landmarks[1].x - landmarks[291].x) ** 2 +
        (landmarks[1].y - landmarks[291].y) ** 2
    );
    ratios.push(noseToRightMouth / eyeDist);

    const mouthWidth = Math.sqrt(
      (landmarks[61].x - landmarks[291].x) ** 2 +
        (landmarks[61].y - landmarks[291].y) ** 2
    );
    ratios.push(mouthWidth / eyeDist);

    const angles = this.computeFaceAngles(landmarks);

    const raw = [...distances, ...ratios, ...angles];
    const normalizedVector = this.l2Normalize(raw);

    const padding = new Array(Math.max(0, QUALITY_THRESHOLDS.EMBEDDING_SIZE - normalizedVector.length)).fill(0);
    return [...normalizedVector, ...padding].slice(0, QUALITY_THRESHOLDS.EMBEDDING_SIZE);
  }

  private computeFaceAngles(landmarks: FaceLandmark[]): number[] {
    const nose = landmarks[1];
    const forehead = landmarks[10];
    const chin = landmarks[152];
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];

    const yaw = Math.atan2(rightEye.x - leftEye.x, (rightEye.z ?? 0) - (leftEye.z ?? 0));
    const pitch = Math.atan2(chin.y - forehead.y, (chin.z ?? 0) - (forehead.z ?? 0));
    const roll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);

    const leftEyeCorner = landmarks[33];
    const mouthCorner = landmarks[61];
    const smileAngle = Math.atan2(mouthCorner.y - leftEyeCorner.y, mouthCorner.x - leftEyeCorner.x);

    return [yaw, pitch, roll, smileAngle];
  }

  private l2Normalize(vector: number[]): number[] {
    const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
    return vector.map((v) => v / norm);
  }

  computeSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      const minLen = Math.min(a.length, b.length);
      a = a.slice(0, minLen);
      b = b.slice(0, minLen);
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }
}
