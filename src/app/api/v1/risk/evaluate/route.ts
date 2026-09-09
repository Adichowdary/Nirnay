import { NextRequest } from "next/server";
import { requireAuth, ok, fail, serverError, created, zodError } from "@/lib/auth/guard";
import { z } from "zod";
import { evaluateFacilityRisk } from "@/lib/risk-engine";

const EvaluateRiskSchema = z.object({
  project_id: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { user, supabase } = auth;

  const body = await request.json();
  const parsed = EvaluateRiskSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const { project_id } = parsed.data;

  const { data: project, error: projErr } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", project_id)
    .single();

  if (projErr || !project) return fail("Project not found", 404);

  const { data: facility } = await supabase
    .from("facilities")
    .select("id, name, latitude, longitude, geofence_radius")
    .eq("project_id", project_id)
    .limit(1)
    .single();

  const { data: offlineCameras } = await supabase
    .from("cctv_cameras")
    .select("id", { count: "exact", head: true })
    .eq("project_id", project_id)
    .eq("status", "offline");

  const { data: latestAttendance } = await supabase
    .from("attendance_records")
    .select("variance_percent")
    .eq("project_id", project_id)
    .order("date", { ascending: false })
    .limit(1)
    .single();

  const { data: lastInspection } = await supabase
    .from("inspections")
    .select("created_at")
    .eq("project_id", project_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const { data: unresolvedAnomalies } = await supabase
    .from("risk_signals")
    .select("id", { count: "exact", head: true })
    .eq("project_id", project_id)
    .eq("is_resolved", false);

  const daysSinceLastInspection = lastInspection?.created_at
    ? Math.round((Date.now() - new Date(lastInspection.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 90;

  const facilityName = facility?.name ?? project.name;
  const facilityId = facility?.id ?? project_id;

  const result = evaluateFacilityRisk(facilityId, facilityName, {
    cctv_outage_minutes: (offlineCameras?.length ?? 0) * 30,
    attendance_variance_pct: Math.abs(latestAttendance?.variance_percent ?? 0),
    days_since_last_inspection: daysSinceLastInspection,
    unresolved_ai_anomalies_count: unresolvedAnomalies?.length ?? 0,
    scheme_compliance_history_pct: 80,
  });

  if (result.auto_dispatch_inspection) {
    await supabase.from("risk_signals").insert({
      project_id,
      facility_id: facilityId,
      type: "inspection_trigger",
      severity: result.risk_tier === "CRITICAL" ? "critical" : "high",
      title: `Auto-triggered inspection for ${facilityName}`,
      summary: `Risk score ${result.computed_risk_score} exceeds threshold. ${result.recommended_actions.join(" ")}`,
      risk_score: result.computed_risk_score,
      triggered_by: user.id,
    });
  }

  await supabase.from("risk_evaluations").insert({
    project_id,
    facility_id: facilityId,
    risk_score: result.computed_risk_score,
    risk_tier: result.risk_tier,
    factor_breakdown: result.factor_breakdown,
    recommended_actions: result.recommended_actions,
    evaluated_by: user.id,
  });

  return ok(result, "Risk evaluation complete");
}
