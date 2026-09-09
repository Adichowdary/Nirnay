import { describe, it, expect } from "vitest";
import { generateGroundedAISummary } from "@/lib/ai/report-summarizer";
import { correctiveActionsStore } from "@/lib/corrective-actions/corrective-actions-store";

describe("Grounded AI Summarizer Engine", () => {
  it("generates structured findings without mutating original input", () => {
    const summary = generateGroundedAISummary({
      reportId: "REP-TEST-001",
      projectName: "ABC Institute",
      district: "Guntur",
      state: "AP",
      squadName: "Squad-07",
      observations: "Found 51 present vs 80 registered.",
      checklistScore: 68,
      registeredHeadcount: 80,
      observedHeadcount: 51,
      cctvFunctional: false,
      evidenceItems: [
        {
          uuid: "EV-1",
          project_id: "P1",
          type: "photo",
          filename: "test.jpg",
          file_size_bytes: 100,
          sha256_hash: "HASH",
          captured_at: new Date().toISOString(),
          gps: { latitude: 16.3, longitude: 80.4, accuracy: 5, timestamp: new Date().toISOString() },
          uploaded_by: "u1",
          uploaded_by_role: "AUDIT_SQUAD",
        },
      ],
    });

    expect(summary.source_report_id).toBe("REP-TEST-001");
    expect(summary.risk_level).toBe("CRITICAL");
    expect(summary.key_findings.length).toBeGreaterThan(0);
    expect(summary.corrective_actions_required.length).toBeGreaterThan(0);
    expect(summary.review_status).toBe("PENDING");
  });

  it("calculates low risk when headcount and CCTV are compliant", () => {
    const summary = generateGroundedAISummary({
      reportId: "REP-TEST-002",
      projectName: "XYZ Institute",
      district: "Krishna",
      state: "AP",
      squadName: "Squad-02",
      observations: "All facilities operational.",
      checklistScore: 95,
      registeredHeadcount: 50,
      observedHeadcount: 50,
      cctvFunctional: true,
      evidenceItems: [],
    });

    expect(summary.risk_level).toBe("LOW");
    expect(summary.positive_observations.length).toBeGreaterThan(0);
  });
});

describe("Corrective Actions Store & Workflow", () => {
  it("allows Agency to submit compliance response and State Admin to resolve", () => {
    const action = correctiveActionsStore.createAction({
      audit_id: "AUD-TEST-99",
      project_id: "P-99",
      project_name: "Test Institute",
      state_id: "AP",
      district_name: "Guntur",
      assigned_to_agency_id: "ORG-TEST",
      assigned_to_agency_name: "Test Foundation",
      issued_by_state_admin_id: "u_state_ap",
      issued_by_name: "State Admin AP",
      issue_title: "CCTV Offline",
      required_action: "Fix CCTV within 48h",
      due_date: "2026-09-02",
    });

    expect(action.status).toBe("ACTION_REQUIRED");

    // Agency responds
    const updated = correctiveActionsStore.submitAgencyResponse(action.id, {
      explanation: "PoE switch replaced.",
      submittedBy: "Agency Director",
      evidenceVersionIds: ["EV-V2-01"],
    });

    expect(updated?.status).toBe("RESPONSE_SUBMITTED");
    expect(updated?.agency_response?.evidence_version_ids).toContain("EV-V2-01");

    // State Admin resolves
    const resolved = correctiveActionsStore.resolveAction(action.id, "Verified RTSP stream online.");
    expect(resolved?.status).toBe("VERIFIED_CLOSED");
  });
});
