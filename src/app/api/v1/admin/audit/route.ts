import { NextRequest, NextResponse } from "next/server";

export interface AdminAuditEntry {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: "CENTRAL_ADMIN" | "STATE_ADMIN" | "SYSTEM";
  action: string;
  resourceType: "STATE" | "STATE_ADMIN" | "USER" | "ISSUE" | "POLICY" | "REPORT";
  resourceId: string;
  stateId?: string;
  details: string;
  timestamp: string;
}

const ADMIN_AUDIT_LOGS: AdminAuditEntry[] = [
  {
    id: "aud-01",
    actorId: "central-01",
    actorName: "Rajesh Kumar Sharma",
    actorRole: "CENTRAL_ADMIN",
    action: "STATE_ADMIN_ASSIGNED",
    resourceType: "STATE_ADMIN",
    resourceId: "sa-ap-01",
    stateId: "AP",
    details: "Assigned Dr. K. Venkateswarlu as State Admin for Andhra Pradesh",
    timestamp: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
  },
  {
    id: "aud-02",
    actorId: "sa-ap-01",
    actorName: "Dr. K. Venkateswarlu",
    actorRole: "STATE_ADMIN",
    action: "ISSUE_ASSIGNED",
    resourceType: "ISSUE",
    resourceId: "ISSUE-AP-001",
    stateId: "AP",
    details: "Assigned CCTV blackout issue in Guntur to Inspection Officer Priya Mehta",
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "aud-03",
    actorId: "sys-sla",
    actorName: "Automated SLA Engine",
    actorRole: "SYSTEM",
    action: "ISSUE_ESCALATED",
    resourceType: "ISSUE",
    resourceId: "ISSUE-AP-001",
    stateId: "AP",
    details: "SLA threshold (4h) breached for Critical issue. Auto-escalated to Level 2 (Central Admin)",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const state = url.searchParams.get("state");

    const logs = state && state !== "ALL"
      ? ADMIN_AUDIT_LOGS.filter((l) => l.stateId === state)
      : ADMIN_AUDIT_LOGS;

    return NextResponse.json({
      success: true,
      data: {
        total: logs.length,
        logs,
      },
    });
  } catch (error) {
    console.error("GET admin audit API error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { actorId, actorName, actorRole, action, resourceType, resourceId, stateId, details } = body;

    const newEntry: AdminAuditEntry = {
      id: `aud-${Date.now()}`,
      actorId: actorId || "system",
      actorName: actorName || "Authorized Admin",
      actorRole: actorRole || "STATE_ADMIN",
      action: action || "GENERIC_ACTION",
      resourceType: resourceType || "ISSUE",
      resourceId: resourceId || "res-001",
      stateId,
      details: details || "",
      timestamp: new Date().toISOString(),
    };

    ADMIN_AUDIT_LOGS.unshift(newEntry);

    return NextResponse.json({ success: true, data: newEntry }, { status: 201 });
  } catch (error) {
    console.error("POST admin audit API error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
