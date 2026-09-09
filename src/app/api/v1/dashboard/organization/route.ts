import { NextRequest } from "next/server";
import { requireAuth, ok, serverError } from "@/lib/auth/guard";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { user, supabase } = auth;
  const url = new URL(request.url);
  const organization_id = url.searchParams.get("organization_id") ?? user.id;

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, status, district, state")
    .eq("organization_id", organization_id);

  const projectIds = (projects ?? []).map((p) => p.id);

  const [inspectionsResult, camerasResult, signalsResult, attendanceResult] = await Promise.all([
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
      ? supabase.from("attendance_records").select("variance_percent").in("project_id", projectIds).order("date", { ascending: false }).limit(30)
      : { data: [] },
  ]);

  const inspections = inspectionsResult.data ?? [];
  const cameras = camerasResult.data ?? [];
  const signals = signalsResult.data ?? [];
  const attendance = attendanceResult.data ?? [];

  const avgAttendance = attendance.length > 0
    ? Math.round(attendance.reduce((sum, a) => sum + Math.abs(a.variance_percent), 0) / attendance.length)
    : 0;

  return ok({
    total_projects: (projects ?? []).length,
    operational_projects: (projects ?? []).filter((p) => p.status === "operational" || p.status === "active").length,
    at_risk_projects: (projects ?? []).filter((p) => p.status === "at-risk" || p.status === "flagged").length,
    active_inspections: inspections.filter((i) => ["IN_PROGRESS", "ARRIVED", "SUBMITTED"].includes(i.status)).length,
    pending_inspections: inspections.filter((i) => ["DRAFT", "ASSIGNED", "ACKNOWLEDGED"].includes(i.status)).length,
    offline_cameras: cameras.filter((c) => c.status === "offline").length,
    cctv_total: cameras.length,
    critical_signals: signals.filter((s) => s.severity === "critical" || s.severity === "high").length,
    avg_attendance_variance: avgAttendance,
    projects: projects ?? [],
  });
}
