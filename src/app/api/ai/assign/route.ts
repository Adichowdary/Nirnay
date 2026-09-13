import { NextRequest, NextResponse } from "next/server";

const DEFAULT_INSPECTORS = [
  { id: "INS-UP-0881", name: "Vikramaditya Rathore", phone: "+91-98102-34981", cadre: "Senior Central Auditor", district: "Lucknow" },
  { id: "INS-UP-0942", name: "Pooja Deshmukh", phone: "+91-98711-87234", cadre: "State Vigilance Officer", district: "Varanasi" },
  { id: "INS-UP-1025", name: "Rajiv Nambiar", phone: "+91-94470-12893", cadre: "PMU District Inspector", district: "Kanpur" },
  { id: "INS-UP-1194", name: "Dr. Ananya Sen", phone: "+91-98300-45678", cadre: "Technical Evaluation Specialist", district: "Prayagraj" },
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const aiEngineUrl = process.env.AI_ENGINE_URL || "http://localhost:8000";

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    try {
      const response = await fetch(`${aiEngineUrl}/api/v1/inspection/assign`, {
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
    const inspectors = body.available_inspectors || DEFAULT_INSPECTORS;
    const selected = inspectors[Math.floor(Math.random() * inspectors.length)];
    const assignmentId = `ASG-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;

    return NextResponse.json(
      {
        assignment_id: assignmentId,
        institute_id: body.institute_id || "INST-2024-8819",
        assigned_inspector_id: selected.id,
        assigned_inspector_name: selected.name,
        inspector_phone: selected.phone || "+91-98000-00000",
        scheduled_window: "Within 48 Hours (Surprise Window)",
        verification_hash: `HASH_${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
        anti_collusion_cleared: true,
        risk_tier: body.risk_level || "HIGH",
        created_at: new Date().toISOString(),
      },
      {
        headers: { "X-Engine-Source": "nextjs-simulation-fallback" },
      }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: "Duty assignment failed", details: String(err) },
      { status: 500 }
    );
  }
}
