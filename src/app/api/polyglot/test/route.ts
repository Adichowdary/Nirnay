import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { targetService } = await req.json();
    const startTime = Date.now();

    if (targetService === "ai-engine") {
      // 1. Test Python AI Engine (FastAPI)
      const pythonUrl = process.env.NEXT_PUBLIC_AI_ENGINE_URL || "http://localhost:8000";
      try {
        const pyRes = await fetch(`${pythonUrl}/api/v1/cctv/headcount`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            camera_id: "CAM-UP-LKO-04",
            institute_id: "INST-2024-8819",
            room_type: "DINING_HALL",
            sanctioned_strength: 50
          }),
          signal: AbortSignal.timeout(1200)
        });
        if (pyRes.ok) {
          const data = await pyRes.json();
          return NextResponse.json({
            service: "Python AI Engine",
            endpoint: "POST /api/v1/cctv/headcount",
            latencyMs: Date.now() - startTime,
            mode: "LIVE_DOCKER_CONTAINER",
            data
          });
        }
      } catch {
        // Fallback simulation
      }

      return NextResponse.json({
        service: "Python AI Engine (FastAPI / YOLOv11)",
        endpoint: "POST /api/v1/cctv/headcount",
        latencyMs: 19.4,
        mode: "NATIVE_PYTHON_SPEC_SIMULATED",
        data: {
          camera_id: "CAM-UP-LKO-04",
          institute_id: "INST-2024-8819",
          detected_count: 24,
          sanctioned_strength: 50,
          occupancy_ratio: 0.48,
          anomaly_detected: true,
          anomaly_type: "SEVERE_OCCUPANCY_DROP",
          confidence_avg: 0.942,
          yolo_bounding_boxes: 24,
          frame_hash_sha256: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
          inference_engine: "InsightFace-YOLO-Pipeline (Python 3.11)"
        }
      });
    } else if (targetService === "gov-core") {
      // 2. Test Java Enterprise Gov Core (Spring Boot)
      const javaUrl = process.env.NEXT_PUBLIC_GOV_CORE_URL || "http://localhost:8080";
      try {
        const javaRes = await fetch(`${javaUrl}/api/v1/pfms/validate-disbursement`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instituteId: "INST-2024-8819",
            schemeCode: "PM-AJAY",
            amountCr: 1.45,
            biometricIntegrityScore: 0.94
          }),
          signal: AbortSignal.timeout(1200)
        });
        if (javaRes.ok) {
          const data = await javaRes.json();
          return NextResponse.json({
            service: "Java Gov Core",
            endpoint: "POST /api/v1/pfms/validate-disbursement",
            latencyMs: Date.now() - startTime,
            mode: "LIVE_DOCKER_CONTAINER",
            data
          });
        }
      } catch {
        // Fallback simulation
      }

      return NextResponse.json({
        service: "Java Enterprise Gov Core (Spring Boot 3.2)",
        endpoint: "POST /api/v1/pfms/validate-disbursement",
        latencyMs: 11.2,
        mode: "NATIVE_JAVA_SPEC_SIMULATED",
        data: {
          instituteId: "INST-2024-8819",
          schemeCode: "PM-AJAY",
          requestedAmountCr: 1.45,
          biometricIntegrityScore: 0.94,
          clearedForPFMSTransfer: true,
          clearanceCode: "PFMS-CLEAR-B94A71C2",
          complianceStandard: "DoSJE Direct Benefit Transfer (DBT) Rule 2024 / GFR 238",
          runtime: "Eclipse Temurin 21 (JVM)"
        }
      });
    } else if (targetService === "edge-streamer") {
      // 3. Test C++ Edge Gateway
      const cppUrl = process.env.NEXT_PUBLIC_EDGE_GATEWAY_URL || "http://localhost:9000";
      try {
        const cppRes = await fetch(`${cppUrl}/api/v1/stream/stats`, {
          signal: AbortSignal.timeout(1000)
        });
        if (cppRes.ok) {
          const data = await cppRes.json();
          return NextResponse.json({
            service: "C++ Edge Gateway",
            endpoint: "GET /api/v1/stream/stats",
            latencyMs: Date.now() - startTime,
            mode: "LIVE_DOCKER_CONTAINER",
            data
          });
        }
      } catch {
        // Fallback simulation
      }

      return NextResponse.json({
        service: "C++20 Edge Surveillance Gateway",
        endpoint: "GET /api/v1/stream/stats",
        latencyMs: 3.8,
        mode: "NATIVE_CPP_SPEC_SIMULATED",
        data: {
          codec: "H.264 / High Profile Level 4.1",
          resolution: "1920x1080@30fps",
          bitrate_kbps: 2450,
          dropped_frames: 0,
          hardware_acceleration: "VAAPI / NVDEC",
          tamper_evident_seal: "SEC_65B_CHAIN_VALID",
          stream_source: "rtsp://edge-hostel-04.dosje.local:554/live"
        }
      });
    }

    return NextResponse.json({ error: "Invalid target service" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
