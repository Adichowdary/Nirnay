import { NextRequest } from "next/server";
import { requireAuth, ok, serverError } from "@/lib/auth/guard";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { supabase } = auth;
  const url = new URL(request.url);
  const district = url.searchParams.get("district");

  let projectsQuery = supabase.from("projects").select("id, status, state, district");
  if (district) projectsQuery = projectsQuery.eq("district", district);

  const { data: projects } = await projectsQuery;

  const projectIds = (projects ?? []).map((p) => p.id);

  const [inspectionsResult, camerasResult, signalsResult, complianceResult] = await Promise.all([
    projectIds.length > 0
      ? supabase.from("inspections").select("status").in("project_id", projectIds)
      : { data: [] },
    projectIds.length > 0
      ? supabase.from("cctv_cameras").select("status").in("project_id", projectIds)
      : { data: [] },
    projectIds.length > 0
      ? supabase.from("risk_signals").select("severity").in("project_id", projectIds).eq("is_resolved", false)
      : { data: [] },
    projectIds.length > 0
      ? supabase.from("compliance_records").select("status").in("project_id", projectIds)
      : { data: [] },
  ]);

  const inspections = inspectionsResult.data ?? [];
  const cameras = camerasResult.data ?? [];
  const signals = signalsResult.data ?? [];
  const compliance = complianceResult.data ?? [];

  const total_projects = (projects ?? []).length;
  const critical_projects = (projects ?? []).filter((p) => p.status === "critical" || p.status === "flagged").length;
  const active_inspections = inspections.filter((i) => ["IN_PROGRESS", "ARRIVED", "SUBMITTED"].includes(i.status)).length;
  const offline_cameras = cameras.filter((c) => c.status === "offline").length;
  const critical_signals = signals.filter((s) => s.severity === "critical" || s.severity === "high").length;
  const non_compliant = compliance.filter((c) => c.status === "non_compliant").length;

  return ok({
    total_projects,
    critical_projects,
    active_inspections,
    offline_cameras,
    cctv_total: cameras.length,
    critical_signals,
    compliance_rate: compliance.length > 0
      ? Math.round(((compliance.length - non_compliant) / compliance.length) * 100)
      : 100,
    projects: projects ?? [],
  });
}
