import { NextRequest, NextResponse } from "next/server";

const VC_TARGETS = [
  { role: "PROJECT_INCHARGE", name: "Sri Rajeshwar Prasad", phone: "+91-98210-77123", aadhaar: "4891" },
  { role: "SENIOR_WARDEN", name: "Smt. Sunita Devi", phone: "+91-94150-88321", aadhaar: "9012" },
  { role: "STUDENT_BENEFICIARY", name: "Aakash Kumar Gautam", phone: "+91-99881-22345", aadhaar: "7731" },
  { role: "STUDENT_BENEFICIARY", name: "Kavita Kumari", phone: "+91-97112-99014", aadhaar: "5524" },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const instituteId = searchParams.get("institute_id") || "INST-2024-8819";
    const instituteName = searchParams.get("institute_name") || "Dr. Ambedkar Hostel & Training Center";
    const aiEngineUrl = process.env.AI_ENGINE_URL || "http://localhost:8000";

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    try {
      const response = await fetch(
        `${aiEngineUrl}/api/v1/vc/random-select?institute_id=${encodeURIComponent(
          instituteId
        )}&institute_name=${encodeURIComponent(instituteName)}`,
        {
          signal: controller.signal,
        }
      );
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
    const chosen = VC_TARGETS[Math.floor(Math.random() * VC_TARGETS.length)];
    const sessionId = `VC-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;

    return NextResponse.json(
      {
        session_id: sessionId,
        institute_id: instituteId,
        institute_name: instituteName,
        selected_role: chosen.role,
        target_name: chosen.name,
        target_contact: chosen.phone,
        target_aadhaar_last4: chosen.aadhaar,
        surprise_call_token: `SURPRISE_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        generated_at: new Date().toISOString(),
      },
      {
        headers: { "X-Engine-Source": "nextjs-simulation-fallback" },
      }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: "Random VC selection failed", details: String(err) },
      { status: 500 }
    );
  }
}
