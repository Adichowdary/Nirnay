import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/db/server";

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { searchParams } = new URL(request.url);
    const queryUserId = searchParams.get("user_id");
    const targetUserId = user?.id || queryUserId || "demo-user";

    let enrollment = null;
    let template = null;

    try {
      const { data: e } = await supabase
        .from("face_enrollments")
        .select("id, status, enrolled_at, revoked_at")
        .eq("user_id", targetUserId)
        .single();
      enrollment = e;

      const { data: t } = await supabase
        .from("face_templates")
        .select("model_name, model_version, quality_score, created_at")
        .eq("user_id", targetUserId)
        .eq("status", "ACTIVE")
        .single();
      template = t;
    } catch {
      // Default to enrolled for demo flow
    }

    let recentAttempts = 0;
    let failedAttempts = 0;

    try {
      const { count: ra } = await supabase
        .from("login_attempts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", targetUserId)
        .eq("method", "face")
        .gte("created_at", new Date(Date.now() - 15 * 60 * 1000).toISOString());
      recentAttempts = ra ?? 0;

      const { count: fa } = await supabase
        .from("login_attempts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", targetUserId)
        .eq("method", "face")
        .eq("result", "FAILED")
        .gte("created_at", new Date(Date.now() - 15 * 60 * 1000).toISOString());
      failedAttempts = fa ?? 0;
    } catch {
      // Non-blocking in demo mode
    }

    return NextResponse.json({
      success: true,
      enrolled: enrollment?.status === "ACTIVE",
      enrollment_status: enrollment?.status ?? "NOT_ENROLLED",
      enrolled_at: enrollment?.enrolled_at,
      model_name: template?.model_name,
      model_version: template?.model_version,
      quality_score: template?.quality_score,
      recent_attempts: recentAttempts ?? 0,
      failed_attempts: failedAttempts ?? 0,
      max_attempts: 5,
      is_locked: (failedAttempts ?? 0) >= 5,
    });
  } catch (err) {
    console.error("Face status error:", err);
    return NextResponse.json({ success: false, error: "Status check unavailable" }, { status: 500 });
  }
}
