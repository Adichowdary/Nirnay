import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const aiEngineUrl = process.env.AI_ENGINE_URL || "http://localhost:8000";

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    try {
      const response = await fetch(`${aiEngineUrl}/api/v1/cctv/headcount`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data, {
          headers: { "X-Engine-Source": "fastapi-live" },
        });
      }
    } catch {
      clearTimeout(timeout);
    }

    // Graceful fallback simulation
    const cameraId = body.camera_id || "CAM-UP-LKO-04";
    const instituteId = body.institute_id || "INST-2024-8819";
    const sanctioned = body.sanctioned_strength || 50;
    const detected = Math.max(1, Math.round(sanctioned * (0.4 + Math.random() * 0.45)));
    const occupancyRatio = +(detected / Math.max(sanctioned, 1)).toFixed(2);
    const hasAnomaly = occupancyRatio < 0.5;

    const boxes = [];
    const count = Math.min(detected, 8);
    for (let i = 0; i < count; i++) {
      boxes.push({
        id: `person_${i + 1}`,
        confidence: +(0.88 + Math.random() * 0.1).toFixed(2),
        bbox: [
          Math.floor(Math.random() * 350) + 50,
          Math.floor(Math.random() * 250) + 50,
          Math.floor(Math.random() * 60) + 50,
          Math.floor(Math.random() * 100) + 120,
        ],
        class: "head",
      });
    }

    return NextResponse.json(
      {
        camera_id: cameraId,
        institute_id: instituteId,
        timestamp: Date.now() / 1000,
        detected_count: detected,
        sanctioned_strength: sanctioned,
        occupancy_ratio: occupancyRatio,
        anomaly_detected: hasAnomaly,
        anomaly_type: hasAnomaly ? "SEVERE_OCCUPANCY_DROP" : null,
        confidence_avg: 0.94,
        bounding_boxes: boxes,
        frame_hash: `frame_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        latency_ms: +(14 + Math.random() * 8).toFixed(2),
      },
      {
        headers: { "X-Engine-Source": "nextjs-simulation-fallback" },
      }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: "CCTV analysis processing failed", details: String(err) },
      { status: 500 }
    );
  }
}
