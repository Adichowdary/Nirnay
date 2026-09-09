// ─────────────────────────────────────────────────────────────
// INSIGHT — Corrective Actions Store & Workflow Engine
// Supports:
// 1. State Admin creates Corrective Action Request
// 2. Agency Portal receives ACTION_REQUIRED and submits response + v2/v3 evidence
// 3. State Admin reviews & marks VERIFIED_CLOSED or REOPENED
// 4. Central Admin national oversight
// ─────────────────────────────────────────────────────────────

import { CorrectiveAction, CorrectiveActionStatus } from "@/types";

export const INITIAL_CORRECTIVE_ACTIONS: CorrectiveAction[] = [
  {
    id: "CA-2026-001",
    audit_id: "AUD-2026-0094",
    report_id: "REP-2026-0094",
    project_id: "INS-2041",
    project_name: "Asha Rehabilitation Centre",
    state_id: "AP",
    district_name: "Guntur",
    assigned_to_agency_id: "ORG-ASHA-001",
    assigned_to_agency_name: "Asha Welfare Foundation",
    issued_by_state_admin_id: "u_state_admin_ap",
    issued_by_name: "Ramesh Naidu (State Admin AP)",
    issue_title: "CCTV Stream Outage & Attendance Variance",
    required_action: "1. Restore Camera 02 RTSP live transmission within 24 hours. 2. Provide verified hospital OPD proof for absent beneficiaries.",
    due_date: "2026-09-02",
    status: "RESPONSE_SUBMITTED",
    agency_response: {
      explanation: "Replaced faulty PoE surge injector. Camera 02 is back online. Attached official Civil Hospital OPD records for all 29 beneficiaries undergoing medical evaluation.",
      submitted_at: "2026-08-30T13:46:00+05:30",
      submitted_by: "Dr. K. S. Rao (Centre Incharge)",
      evidence_version_ids: ["EV-AG-001", "EV-AG-002"],
    },
    created_at: "2026-08-30T11:30:00+05:30",
  },
  {
    id: "CA-2026-002",
    audit_id: "AUD-2026-0088",
    project_id: "INS-1002",
    project_name: "Navjeevan Skill Centre",
    state_id: "AP",
    district_name: "Krishna",
    assigned_to_agency_id: "ORG-NAV-002",
    assigned_to_agency_name: "Navjeevan Education Trust",
    issued_by_state_admin_id: "u_state_admin_ap",
    issued_by_name: "Ramesh Naidu (State Admin AP)",
    issue_title: "Assistive Tool Kit Register Not Maintained",
    required_action: "Update physical stock ledger of braille kits and wheelchairs with beneficiary signature tokens.",
    due_date: "2026-09-05",
    status: "ACTION_REQUIRED",
    created_at: "2026-08-29T14:15:00+05:30",
  },
];

class CorrectiveActionsManager {
  private actions: CorrectiveAction[] = [...INITIAL_CORRECTIVE_ACTIONS];

  getActionsForUser(user: { id: string; role: string; stateId?: string | null; organizationId?: string | null }): CorrectiveAction[] {
    const role = (user.role || "").toUpperCase();

    if (role === "CENTRAL_ADMIN" || role === "DOSJE_OFFICIAL" || role === "ADMIN") {
      return this.actions;
    }

    if (role === "STATE_ADMIN") {
      if (!user.stateId) return this.actions;
      return this.actions.filter((a) => a.state_id === user.stateId);
    }

    if (role === "AGENCY_PORTAL" || role === "NGO_INSTITUTE" || role === "PROJECT_ADMIN") {
      return this.actions.filter((a) => a.assigned_to_agency_id === user.organizationId || a.assigned_to_agency_id === "ORG-ASHA-001");
    }

    return this.actions;
  }

  createAction(action: Omit<CorrectiveAction, "id" | "created_at" | "status">): CorrectiveAction {
    const newAction: CorrectiveAction = {
      ...action,
      id: `CA-${Date.now().toString(36).toUpperCase()}`,
      status: "ACTION_REQUIRED",
      created_at: new Date().toISOString(),
    };
    this.actions.unshift(newAction);
    return newAction;
  }

  submitAgencyResponse(actionId: string, response: { explanation: string; submittedBy: string; evidenceVersionIds: string[] }): CorrectiveAction | null {
    const act = this.actions.find((a) => a.id === actionId);
    if (!act) return null;

    act.status = "RESPONSE_SUBMITTED";
    act.agency_response = {
      explanation: response.explanation,
      submitted_at: new Date().toISOString(),
      submitted_by: response.submittedBy,
      evidence_version_ids: response.evidenceVersionIds,
    };
    return act;
  }

  resolveAction(actionId: string, resolutionNotes: string): CorrectiveAction | null {
    const act = this.actions.find((a) => a.id === actionId);
    if (!act) return null;

    act.status = "VERIFIED_CLOSED";
    act.state_resolution_notes = resolutionNotes;
    act.resolved_at = new Date().toISOString();
    return act;
  }
}

export const correctiveActionsStore = new CorrectiveActionsManager();
