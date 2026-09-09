import { NextRequest } from "next/server";
import { requireAuth, ok, serverError } from "@/lib/auth/guard";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { supabase } = auth;

  const [projectsResult, inspectionsResult, camerasResult, attendanceResult, signalsResult, reportsResult, correctiveResult] = await Promise.all([
    supabase.from("projects").select("id, status"),
    supabase.from("inspections").select("id, status, priority, created_at"),
    supabase.from("cctv_cameras").select("id, status, last_heartbeat"),
    supabase.from("attendance_records").select("variance_percent, is_anomaly, date").order("date", { ascending: false }).limit(100),
    supabase.from("risk_signals").select("id, severity, is_resolved, created_at"),
    supabase.from("reports").select("id, status"),
    supabase.from("corrective_actions").select("id, status, priority"),
  ]);

  const projects = projectsResult.data ?? [];
  const inspections = inspectionsResult.data ?? [];
  const cameras = camerasResult.data ?? [];
  const attendance = attendanceResult.data ?? [];
  const signals = signalsResult.data ?? [];
  const reports = reportsResult.data ?? [];
  const corrective = correctiveResult.data ?? [];

  return ok({
    inspections: {
      total: inspections.length,
      active: inspections.filter((i) => ["IN_PROGRESS", "ARRIVED", "SUBMITTED"].includes(i.status)).length,
      pending: inspections.filter((i) => ["DRAFT", "ASSIGNED", "ACKNOWLEDGED"].includes(i.status)).length,
      completed: inspections.filter((i) => ["CLOSED", "APPROVED"].includes(i.status)).length,
      by_priority: {
        critical: inspections.filter((i) => i.priority === "critical").length,
        high: inspections.filter((i) => i.priority === "high").length,
        normal: inspections.filter((i) => i.priority === "normal").length,
        low: inspections.filter((i) => i.priority === "low").length,
      },
    },
    attendance: {
      total_records: attendance.length,
      anomalies: attendance.filter((a) => a.is_anomaly).length,
      avg_variance: attendance.length > 0
        ? Math.round(attendance.reduce((sum, a) => sum + Math.abs(a.variance_percent), 0) / attendance.length)
        : 0,
    },
    cctv: {
      total: cameras.length,
      online: cameras.filter((c) => c.status === "live").length,
      offline: cameras.filter((c) => c.status === "offline").length,
      degraded: cameras.filter((c) => c.status === "degraded").length,
    },
    risk: {
      total_signals: signals.length,
      unresolved: signals.filter((s) => !s.is_resolved).length,
      critical: signals.filter((s) => s.severity === "critical" && !s.is_resolved).length,
      high: signals.filter((s) => s.severity === "high" && !s.is_resolved).length,
    },
    reports: {
      total: reports.length,
      draft: reports.filter((r) => r.status === "DRAFT").length,
      submitted: reports.filter((r) => r.status === "SUBMITTED").length,
      approved: reports.filter((r) => r.status === "APPROVED").length,
    },
    corrective_actions: {
      total: corrective.length,
      open: corrective.filter((c) => c.status === "open").length,
      in_progress: corrective.filter((c) => c.status === "in_progress").length,
      completed: corrective.filter((c) => c.status === "completed").length,
    },
    projects: {
      total: projects.length,
      operational: projects.filter((p) => p.status === "operational" || p.status === "active").length,
      at_risk: projects.filter((p) => p.status === "at-risk" || p.status === "flagged").length,
      critical: projects.filter((p) => p.status === "critical").length,
    },
  });
}
