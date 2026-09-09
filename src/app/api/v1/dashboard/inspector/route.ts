import { NextRequest } from "next/server";
import { requireAuth, ok, serverError } from "@/lib/auth/guard";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { user, supabase } = auth;

  const { data: assignments } = await supabase
    .from("inspection_assignments")
    .select("id, status, inspection_id")
    .eq("officer_id", user.id)
    .in("status", ["pending", "accepted"]);

  const { data: recentInspections } = await supabase
    .from("inspections")
    .select("id, status, priority, created_at")
    .eq("assigned_to", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const pending_assignments = (assignments ?? []).filter((a) => a.status === "pending").length;
  const active_inspections = (assignments ?? []).filter((a) => a.status === "accepted").length;

  const { count: completedToday } = await supabase
    .from("inspections")
    .select("id", { count: "exact", head: true })
    .eq("assigned_to", user.id)
    .eq("status", "CLOSED")
    .gte("closed_at", new Date().toISOString().split("T")[0]);

  const { data: unreadNotifications } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  return ok({
    pending_assignments,
    active_inspections,
    completed_today: completedToday ?? 0,
    unread_notifications: unreadNotifications?.length ?? 0,
    recent_inspections: recentInspections ?? [],
  });
}
