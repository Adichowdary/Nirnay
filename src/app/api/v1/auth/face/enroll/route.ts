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
    const { embedding, quality_score } = body;

    if (!embedding?.vector || !Array.isArray(embedding.vector) || embedding.vector.length === 0) {
      return NextResponse.json(
        { success: false, error: "Valid face embedding vector is required" },
        { status: 400 }
      );
    }

    // Check if user already has an active enrollment
    const { data: existing } = await supabase
      .from("face_enrollments")
      .select("id, status")
      .eq("user_id", user.id)
      .single();

    if (existing?.status === "ACTIVE") {
      // Revoke old template first
      await supabase
        .from("face_templates")
        .update({ status: "REVOKED", revoked_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("status", "ACTIVE");

      await supabase
        .from("face_enrollments")
        .update({ status: "REVOKED", revoked_at: new Date().toISOString(), revocation_reason: "Re-enrolled" })
        .eq("id", existing.id);
    }

    // Create enrollment
    const { data: enrollment, error: enrollError } = await supabase
      .from("face_enrollments")
      .insert({
        user_id: user.id,
        status: "ACTIVE",
      })
      .select("id")
      .single();

    if (enrollError) {
      console.error("Enrollment creation error:", enrollError);
      return NextResponse.json({ success: false, error: "Failed to create enrollment" }, { status: 500 });
    }

    // Store face template
    const { error: templateError } = await supabase
      .from("face_templates")
      .insert({
        enrollment_id: enrollment.id,
        user_id: user.id,
        model_name: embedding.model_name ?? "MediaPipe FaceLandmarker",
        model_version: embedding.model_version ?? "1.0.1",
        embedding: embedding.vector,
        quality_score: quality_score ?? 0,
        status: "ACTIVE",
      });

    if (templateError) {
      console.error("Template storage error:", templateError);
      return NextResponse.json({ success: false, error: "Failed to store face template" }, { status: 500 });
    }

    // Audit event
    await supabase.from("biometric_audit_events").insert({
      user_id: user.id,
      event_type: "FACE_ENROLLMENT_SUCCESS",
      metadata: {
        enrollment_id: enrollment.id,
        model_name: embedding.model_name,
        model_version: embedding.model_version,
        quality_score,
      },
      ip_address: request.headers.get("x-forwarded-for"),
      user_agent: request.headers.get("user-agent"),
    });

    return NextResponse.json({
      success: true,
      enrollment_id: enrollment.id,
      status: "ACTIVE",
      message: "Face enrolled successfully",
    });
  } catch (err) {
    console.error("Face enrollment error:", err);
    return NextResponse.json({ success: false, error: "Enrollment service unavailable" }, { status: 500 });
  }
}
