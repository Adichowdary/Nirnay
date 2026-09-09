/**
 * NIRNAY Polyglot Microservices Client SDK
 * ----------------------------------------
 * Interfaces with:
 * 1. Python AI / CV Engine (FastAPI) on port 8000
 * 2. Java Gov Core (Spring Boot) on port 8080
 * 3. C++ Edge Gateway (Native daemon) on port 9000
 *
 * Implements resilient health checks and graceful fallbacks for standalone/offline demos.
 */

export interface MicroserviceHealth {
  id: string;
  name: string;
  language: string;
  framework: string;
  port: number;
  status: "ONLINE" | "OFFLINE" | "EMULATED";
  latencyMs: number;
  url: string;
  capabilities: string[];
  metrics: Record<string, string | number | boolean>;
}

export interface ServiceTestResult {
  serviceId: string;
  endpoint: string;
  method: string;
  status: number;
  latencyMs: number;
  response: Record<string, unknown>;
  executedVia: "LIVE_MICROSERVICE" | "INTELLIGENT_SIMULATION";
}

const DEFAULT_ENDPOINTS = {
  python: process.env.NEXT_PUBLIC_AI_ENGINE_URL || "http://localhost:8000",
  java: process.env.NEXT_PUBLIC_GOV_CORE_URL || "http://localhost:8080",
  cpp: process.env.NEXT_PUBLIC_EDGE_GATEWAY_URL || "http://localhost:9000",
};

/**
 * Check health status of all four architectural layers
 */
export async function checkPolyglotServices(): Promise<MicroserviceHealth[]> {
  const services: MicroserviceHealth[] = [
    {
      id: "ai-engine",
      name: "AI & Computer Vision Engine",
      language: "Python 3.11+",
      framework: "FastAPI / PyTorch",
      port: 8000,
      status: "EMULATED",
      latencyMs: 16.4,
      url: DEFAULT_ENDPOINTS.python,
      capabilities: [
        "InsightFace-r100 Biometric FRS",
        "Silent-Face Anti-Spoofing Liveness",
        "YOLOv11 Crowd & Head Counting",
        "Ghost Beneficiary Correlation Model"
      ],
      metrics: {
        activeModels: 3,
        avgInferenceMs: 18.2,
        antiSpoofAccuracy: "99.2%",
        tensorAcceleration: "CUDA / TensorRT"
      }
    },
    {
      id: "gov-core",
      name: "Enterprise Gov Core & Scheme Gate",
      language: "Java 21 LTS",
      framework: "Spring Boot 3.2",
      port: 8080,
      status: "EMULATED",
      latencyMs: 8.7,
      url: DEFAULT_ENDPOINTS.java,
      capabilities: [
        "DoSJE Scheme Master Registry",
        "PFMS (Public Financial Management System) Gate",
        "Anti-Collusion Duty Randomizer",
        "Sec 65B Audit Trail Ledger"
      ],
      metrics: {
        activeSchemes: 4,
        pfmsBridgeStatus: "ENCRYPTED_ONLINE",
        monthlyBudgetCr: 96.9,
        retentionPolicy: "7_YEARS_LEGAL"
      }
    },
    {
      id: "edge-streamer",
      name: "Edge Surveillance Gateway",
      language: "C++20 Native",
      framework: "CMake / Socket Daemon",
      port: 9000,
      status: "EMULATED",
      latencyMs: 3.2,
      url: DEFAULT_ENDPOINTS.cpp,
      capabilities: [
        "Direct RTSP / ONVIF Ingestion",
        "Zero-Copy H.264/H.265 Transcoding",
        "SHA-256 Frame Cryptographic Sealing",
        "Low-Power IoT Edge Deployment"
      ],
      metrics: {
        activeRTSPPipelines: 8,
        fpsIngest: 30.0,
        frameLatencyMs: 3.4,
        hardwareAccel: "VAAPI / NVDEC"
      }
    },
    {
      id: "web-ui",
      name: "Command Center & Mobile PWA",
      language: "TypeScript",
      framework: "Next.js 15 / React 19",
      port: 3000,
      status: "ONLINE",
      latencyMs: 1.1,
      url: "http://localhost:3000",
      capabilities: [
        "Executive National Command Center",
        "Field Inspector Progressive Web App",
        "Surprise Video Verification (WebRTC)",
        "Section 65B Electronic Proof Exporter"
      ],
      metrics: {
        activeStakeholders: 5,
        theme: "Government Premium Slate",
        encryption: "AES-256-GCM / SHA-256",
        responsiveViewports: "Desktop & Mobile"
      }
    }
  ];

  // Attempt real network pings (with short timeout) to detect live containerized services
  for (const s of services) {
    if (s.id === "web-ui") continue;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 800);
      const res = await fetch(`${s.url}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        s.status = "ONLINE";
        s.metrics = { ...s.metrics, ...data };
      }
    } catch {
      // Keep as EMULATED fallback for smooth UI demo
      s.status = "EMULATED";
    }
  }

  return services;
}
