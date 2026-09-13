import { NextRequest, NextResponse } from "next/server";
import { getEscalatedIssues, returnIssueToState, resolveIssue } from "@/lib/issues/issue-store";
import { verifyAdminRequest, APEX_ADMIN_ROLES, DEFAULT_ADMIN_ROLES } from "@/lib/auth/admin-guard";

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminRequest(request, DEFAULT_ADMIN_ROLES);
    if (!auth.authorized && auth.errorResponse) return auth.errorResponse;

    const url = new URL(request.url);
    const state = url.searchParams.get("state") || undefined;

    const escalations = getEscalatedIssues(state);
    return NextResponse.json({
      success: true,
      data: {
        totalEscalations: escalations.length,
        escalations,
      },
    });
  } catch (error) {
    console.error("GET escalations API error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminRequest(request, APEX_ADMIN_ROLES);
    if (!auth.authorized && auth.errorResponse) return auth.errorResponse;

    const body = await request.json();
    const { action, issueId, correctiveInstructions, adminName } = body;

    if (!issueId || !action) {
      return NextResponse.json({ success: false, error: "Missing issueId or action" }, { status: 400 });
    }

    if (action === "RETURN_TO_STATE") {
      const updated = returnIssueToState(
        issueId,
        correctiveInstructions || "State Admin to re-evaluate on-site compliance",
        adminName || "Central Command Directorate"
      );
      if (!updated) {
        return NextResponse.json({ success: false, error: "Issue not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: "Issue returned to State Admin", data: updated });
    }

    if (action === "CENTRAL_RESOLVE") {
      const updated = resolveIssue(issueId, adminName || "Central Command Official", "Central Directorate override resolution");
      if (!updated) {
        return NextResponse.json({ success: false, error: "Issue not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: "Issue resolved by Central Admin", data: updated });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("POST escalation action API error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
