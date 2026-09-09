import { NextRequest, NextResponse } from "next/server";
import {
  getStateDetails,
  assignStateAdmin,
  deactivateStateAdmin,
} from "@/lib/admin/state-management";
import { DEMO_PROJECTS } from "@/lib/demo-data";
import { getIssues } from "@/lib/issues/issue-store";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ stateId: string }> }
) {
  try {
    const { stateId } = await context.params;
    const stateData = getStateDetails(stateId);
    if (!stateData) {
      return NextResponse.json({ success: false, error: "State not found" }, { status: 404 });
    }

    const projects = DEMO_PROJECTS.filter(
      (p) => p.state.toLowerCase() === stateData.state.name.toLowerCase() || p.state === stateData.state.id
    );
    const issues = getIssues(stateData.state.name);

    return NextResponse.json({
      success: true,
      data: {
        state: stateData.state,
        metrics: stateData.metrics,
        projects,
        issues,
      },
    });
  } catch (error) {
    console.error("GET state details API error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ stateId: string }> }
) {
  try {
    const { stateId } = await context.params;
    const body = await request.json();
    const { action, adminId } = body;

    if (action === "DEACTIVATE" && adminId) {
      const success = deactivateStateAdmin(adminId);
      return NextResponse.json({ success, message: "State Admin deactivated" });
    }

    if (action === "REASSIGN" && adminId) {
      const updated = assignStateAdmin(adminId, stateId);
      return NextResponse.json({ success: Boolean(updated), data: updated });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("PATCH state API error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
