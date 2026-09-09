import { NextRequest } from "next/server";
import { requireAuth, ok, notFound, serverError } from "@/lib/auth/guard";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { supabase } = auth;
  const { id } = await params;

  const { data: project, error: projErr } = await supabase
    .from("projects")
    .select("id, name, status, organization_id")
    .eq("id", id)
    .single();

  if (projErr || !project) return notFound("Project not found");

  const [inspectionsResult, camerasResult, attendanceResult, signalsResult, reportsResult, correctiveResult] = await Promise.all([
    supabase.from("inspections").select("id, status, priority, created_at, started_at, submitted_at").eq("project_id", id),
    supabase.from("cctv_cameras").select("id, status, last_heartbeat").eq("project_id", id),
    supabase.from("attendance_records").select("date, registered, expected, observed, reported, variance_percent, is_anomaly").eq("project_id", id).order("date", { ascending: false }).limit(30),
    supabase.from("risk_signals").select("id, type, severity, is_resolved, created_at").eq("project_id", id),
    supabase.from("reports").select("id, status, created_at").eq("project_id", id),
    supabase.from("corrective_actions").select("id, status, priority, created_at, due_date").eq("project_id", id),
  ]);

  const inspections = inspectionsResult.data ?? [];
  const cameras = camerasResult.data ?? [];
  const attendance = attendanceResult.data ?? [];
  const signals = signalsResult.data ?? [];
  const reports = reportsResult.data ?? [];
  const corrective = correctiveResult.data ?? [];

  const avgAttendanceVariance = attendance.length > 0
    ? Math.round(attendance.reduce((sum, a) => sum + Math.abs(a.variance_percent), 0) / attendance.length)
    : 0;

  const lastInspection = inspections.length > 0
    ? inspections.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
    : null;

  const daysSinceLastInspection = lastInspection
    ? Math.round((Date.now() - new Date(lastInspection.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return ok({
    project: { id: project.id, name: project.name, status: project.status },
    summary: {
      total_inspections: inspections.length,
      active_inspections: inspections.filter((i) => ["IN_PROGRESS", "ARRIVED", "SUBMITTED"].includes(i.status)).length,
      completed_inspections: inspections.filter((i) => ["CLOSED", "APPROVED"].includes(i.status)).length,
      days_since_last_inspection: daysSinceLastInspection,
      cctv_total: cameras.length,
      cctv_online: cameras.filter((c) => c.status === "live").length,
      cctv_offline: cameras.filter((c) => c.status === "offline").length,
      avg_attendance_variance: avgAttendanceVariance,
      unresolved_signals: signals.filter((s) => !s.is_resolved).length,
      critical_signals: signals.filter((s) => s.severity === "critical" && !s.is_resolved).length,
      total_reports: reports.length,
      pending_reports: reports.filter((r) => r.status === "DRAFT" || r.status === "SUBMITTED").length,
      open_corrective_actions: corrective.filter((c) => c.status === "open" || c.status === "in_progress").length,
      overdue_actions: corrective.filter((c) => c.due_date && new Date(c.due_date) < new Date() && c.status !== "completed").length,
    },
    attendance_trend: attendance.slice(0, 14).reverse(),
  });
}
