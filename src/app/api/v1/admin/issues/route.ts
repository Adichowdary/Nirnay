import { NextRequest, NextResponse } from "next/server";
import {
  getIssues,
  createIssue,
  assignIssue,
  resolveIssue,
  escalateIssue,
  addCommentToIssue,
} from "@/lib/issues/issue-store";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const state = url.searchParams.get("state") || undefined;
    const district = url.searchParams.get("district") || undefined;

    const issues = getIssues(state, district);
    return NextResponse.json({ success: true, data: issues });
  } catch (error) {
    console.error("GET issues API error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      category,
      priority,
      createdBy,
      stateId,
      stateName,
      districtId,
      districtName,
      projectId,
      projectName,
      inspectionId,
      assignedTo,
      slaHours,
    } = body;

    if (!title || !category || !priority || !stateId || !districtId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: title, category, priority, stateId, districtId" },
        { status: 400 }
      );
    }

    const newIssue = createIssue({
      title,
      description: description || "",
      category,
      priority,
      createdBy: createdBy || "Authorized Official",
      stateId,
      stateName: stateName || stateId,
      districtId,
      districtName: districtName || districtId,
      projectId,
      projectName,
      inspectionId,
      assignedTo,
      slaHours,
    });

    return NextResponse.json({
      success: true,
      message: "Issue logged into Level 1 (State Admin) resolution queue",
      data: newIssue,
    }, { status: 201 });
  } catch (error) {
    console.error("POST issue API error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, issueId, assignedToName, assignedToRole, adminName, reason, comment } = body;

    if (!issueId || !action) {
      return NextResponse.json({ success: false, error: "Missing issueId or action" }, { status: 400 });
    }

    let updatedIssue = null;

    if (action === "ASSIGN") {
      updatedIssue = assignIssue(
        issueId,
        assignedToName || "Assigned Officer",
        assignedToRole || "Inspection Officer",
        adminName || "State Admin"
      );
    } else if (action === "RESOLVE") {
      updatedIssue = resolveIssue(issueId, adminName || "Admin Official");
    } else if (action === "ESCALATE") {
      updatedIssue = escalateIssue(issueId, reason || "Manual escalation trigger");
    } else if (action === "COMMENT" && comment) {
      updatedIssue = addCommentToIssue(issueId, adminName || "Official", "Administrator", comment);
    }

    if (!updatedIssue) {
      return NextResponse.json({ success: false, error: "Issue not found or action failed" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedIssue });
  } catch (error) {
    console.error("PATCH issue API error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
