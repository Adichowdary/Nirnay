import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { user_id: bodyUserId, location_required = false } = body ?? {};
    const timeoutMinutes = 5;
    const generatedSessionId = `frs_sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    return NextResponse.json({
      success: true,
      session_id: generatedSessionId,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + timeoutMinutes * 60 * 1000).toISOString(),
      location_required,
    });
  } catch (err) {
    console.error("Verification session error:", err);
    return NextResponse.json({ success: false, error: "Session service unavailable" }, { status: 500 });
  }
}
