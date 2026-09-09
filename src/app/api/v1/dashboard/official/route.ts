import { NextRequest } from "next/server";
import { requireAuth, ok, serverError } from "@/lib/auth/guard";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { supabase } = auth;

  const [projectsCount, inspectionsResult, camerasResult, reportsResult, signalsResult, correctiveResult] = await Promise.all([
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase.from("inspections").select("status"),
    supabase.from("cctv_cameras").select("status"),
    supabase.from("reports").select("status"),
    supabase.from("risk_signals").select("severity", { count: "exact", head: true }).eq("is_resolved", false),
    supabase.from("corrective_actions").select("status", { count: "exact", head: true }).eq("status", "open"),
  ]);

  const inspections = inspectionsResult.data ?? [];
  const cameras = camerasResult.data ?? [];
  const reports = reportsResult.data ?? [];

  const active_inspections = inspections.filter((i) =>
    ["IN_PROGRESS", "ARRIVED", "SUBMITTED"].includes(i.status)
  ).length;

  const pending_inspections = inspections.filter((i) =>
    ["DRAFT", "ASSIGNED", "ACKNOWLEDGED"].includes(i.status)
  ).length;

  const offline_cameras = cameras.filter((c) => c.status === "offline").length;
  const total_cameras = cameras.length;

  const pending_reports = reports.filter((r) => r.status === "DRAFT" || r.status === "SUBMITTED").length;

  const critical_signals = signalsResult.count ?? 0;

  return ok({
    projects_monitored: projectsCount.count ?? 0,
    active_inspections,
    pending_inspections,
    live_sites: total_cameras - offline_cameras,
    open_anomalies: critical_signals,
    pending_reports,
    critical_alerts: critical_signals,
    offline_cameras,
    cctv_online: total_cameras - offline_cameras,
    cctv_total: total_cameras,
    open_corrective_actions: correctiveResult.count ?? 0,
    inspectors_active: inspections.filter((i) => i.status === "IN_PROGRESS").length,
  });
}
