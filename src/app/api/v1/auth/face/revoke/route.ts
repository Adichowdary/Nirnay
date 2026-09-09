import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/db/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { reason } = body ?? {};

    // Revoke active template
    const { error: templateError } = await supabase
      .from("face_templates")
      .update({ status: "REVOKED", revoked_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("status", "ACTIVE");

    // Revoke enrollment
    const { error: enrollmentError } = await supabase
      .from("face_enrollments")
      .update({
        status: "REVOKED",
        revoked_at: new Date().toISOString(),
        revocation_reason: reason ?? "User requested revocation",
      })
      .eq("user_id", user.id)
      .eq("status", "ACTIVE");

    if (templateError || enrollmentError) {
      return NextResponse.json({ success: false, error: "Failed to revoke face data" }, { status: 500 });
    }

    // Audit event
    await supabase.from("biometric_audit_events").insert({
      user_id: user.id,
      event_type: "FACE_TEMPLATE_REVOKED",
      metadata: { reason: reason ?? "User requested" },
      ip_address: request.headers.get("x-forwarded-for"),
      user_agent: request.headers.get("user-agent"),
    });

    return NextResponse.json({
      success: true,
      message: "Face template revoked successfully",
    });
  } catch (err) {
    console.error("Face revoke error:", err);
    return NextResponse.json({ success: false, error: "Revocation service unavailable" }, { status: 500 });
  }
}
