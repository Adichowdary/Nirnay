import { NextRequest } from "next/server";
import { requireAuth, ok, fail, zodError } from "@/lib/auth/guard";
import { z } from "zod";

const ExplainSignalSchema = z.object({
  signal_id: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { supabase } = auth;

  const body = await request.json();
  const parsed = ExplainSignalSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const { data: signal, error: sigErr } = await supabase
    .from("risk_signals")
    .select(`
      id, signal_type, severity, title, description, created_at, project_id, facility_id,
      projects(name, state, district),
      facilities(name)
    `)
    .eq("id", parsed.data.signal_id)
    .single();

  if (sigErr || !signal) return fail("Risk signal not found", 404);

  const projectId = signal.project_id as string;

  const { data: relatedInspections } = await supabase
    .from("inspections")
    .select("id, status, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: relatedAttendance } = await supabase
    .from("attendance_records")
    .select("record_date, total_enrolled, total_present, total_absent")
    .eq("project_id", projectId)
    .order("record_date", { ascending: false })
    .limit(10);

  const { data: relatedCameras } = await supabase
    .from("cctv_sources")
    .select("status, last_seen_at")
    .eq("facility_id", signal.facility_id ?? "00000000-0000-0000-0000-000000000000");

  const projectName = (signal.projects as unknown as { name: string })?.name ?? "N/A";
  const facilityName = (signal.facilities as unknown as { name: string })?.name ?? "N/A";

  const context = [
    `Signal: ${signal.title}`,
    `Type: ${signal.signal_type}`,
    `Severity: ${signal.severity}`,
    `Project: ${projectName}`,
    `Facility: ${facilityName}`,
    `Related Inspections: ${relatedInspections?.length ?? 0}`,
    `Recent Attendance Records: ${relatedAttendance?.length ?? 0}`,
    `Offline Cameras: ${relatedCameras?.filter((c) => c.status === "OFFLINE").length ?? 0}`,
  ].join("\n");

  try {
    const ollamaUrl = process.env.OLLAMA_URL ?? "http://localhost:11434";
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.2",
        prompt: `Explain this risk signal in detail for a government official:\n\n${context}\n\nProvide: what happened, why it was detected, what data was used, confidence level, and recommended actions.`,
        stream: false,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      return generateFallbackExplanation(signal, projectName, facilityName, relatedInspections, relatedAttendance, relatedCameras);
    }

    const data = await response.json();
    return ok({
      explanation: data.response ?? "No explanation generated",
      model: "llama3.2",
      signal_id: parsed.data.signal_id,
    }, "Explanation generated");
  } catch {
    return generateFallbackExplanation(signal, projectName, facilityName, relatedInspections, relatedAttendance, relatedCameras);
  }
}

function generateFallbackExplanation(
  signal: Record<string, unknown>,
  projectName: string,
  facilityName: string,
  inspections: Record<string, unknown>[] | null,
  attendance: Record<string, unknown>[] | null,
  cameras: Record<string, unknown>[] | null
) {
  const offlineCameras = cameras?.filter((c) => c.status === "OFFLINE").length ?? 0;
  const recentInspections = inspections?.length ?? 0;

  const whatHappened = `A ${signal.severity} severity ${signal.signal_type} signal was detected for project "${projectName}" at facility "${facilityName}".`;

  const whyDetected = [
    offlineCameras > 0 ? `${offlineCameras} CCTV cameras offline` : null,
    recentInspections === 0 ? "No recent inspections" : null,
    signal.description ? `Details: ${signal.description}` : null,
  ].filter(Boolean).join("; ") || "Multiple risk factors combined";

  const explanation = [
    `What happened: ${whatHappened}`,
    `Why detected: ${whyDetected}`,
    `Data used: Risk engine evaluation with CCTV, attendance, and inspection data`,
    `Confidence: 85% (rule-based assessment)`,
    `Recommended action: ${signal.severity === "critical" ? "Immediate investigation required" : "Schedule follow-up inspection"}`,
  ].join("\n\n");

  return ok({
    explanation,
    model: "rule-based-fallback",
    signal_id: signal.id,
  }, "Explanation generated (fallback)");
}
