import { describe, it, expect } from "vitest";
import {
  getIssues,
  getEscalatedIssues,
  createIssue,
  assignIssue,
  resolveIssue,
  escalateIssue,
  returnIssueToState,
  addCommentToIssue,
  SLA_DURATIONS_HOURS,
} from "@/lib/issues/issue-store";

describe("Issue Store & SLA Escalation Engine", () => {
  it("should have correct SLA durations per priority", () => {
    expect(SLA_DURATIONS_HOURS.CRITICAL).toBe(4);
    expect(SLA_DURATIONS_HOURS.HIGH).toBe(24);
    expect(SLA_DURATIONS_HOURS.MEDIUM).toBe(72);
    expect(SLA_DURATIONS_HOURS.LOW).toBe(168);
  });

  it("should retrieve initial issues with and without filters", () => {
    const allIssues = getIssues();
    expect(allIssues.length).toBeGreaterThan(0);

    const apIssues = getIssues("AP");
    expect(apIssues.every((i) => i.stateId === "AP" || i.stateName === "Andhra Pradesh")).toBe(true);

    const gunturIssues = getIssues("AP", "Guntur");
    expect(gunturIssues.every((i) => i.districtId === "Guntur" || i.districtName === "Guntur")).toBe(true);
  });

  it("should retrieve escalated issues (Level 2 or ESCALATED status)", () => {
    const escalated = getEscalatedIssues();
    expect(escalated.every((i) => i.escalationLevel === 2 || i.status === "ESCALATED")).toBe(true);
  });

  it("should create an issue with default SLA and Level 1 assignment", () => {
    const newIssue = createIssue({
      title: "Faulty CCTV Sensor",
      description: "Sensor #12 is offline",
      category: "CCTV_OFFLINE",
      priority: "CRITICAL",
      createdBy: "Tester",
      stateId: "KA",
      stateName: "Karnataka",
      districtId: "Bengaluru Urban",
      districtName: "Bengaluru Urban",
    });

    expect(newIssue.id).toContain("ISSUE-KA-");
    expect(newIssue.status).toBe("OPEN");
    expect(newIssue.escalationLevel).toBe(1);
    expect(newIssue.slaHours).toBe(4);
    expect(newIssue.comments.length).toBe(1);

    const found = getIssues("KA").find((i) => i.id === newIssue.id);
    expect(found).toBeDefined();
  });

  it("should assign issue to an officer and update audit trail", () => {
    const issue = createIssue({
      title: "Attendance Anomaly Test",
      description: "Discrepancy in morning batch",
      category: "ATTENDANCE_ANOMALY",
      priority: "HIGH",
      createdBy: "Tester",
      stateId: "AP",
      stateName: "Andhra Pradesh",
      districtId: "Guntur",
      districtName: "Guntur",
    });

    const assigned = assignIssue(
      issue.id,
      "Priya Mehta",
      "Inspection Officer",
      "Dr. K. Venkateswarlu"
    );

    expect(assigned).not.toBeNull();
    expect(assigned?.status).toBe("ASSIGNED");
    expect(assigned?.assignedTo).toBe("Priya Mehta");
    expect(assigned?.assignedToRole).toBe("Inspection Officer");
    expect(assigned?.comments.some((c) => c.message.includes("Assigned issue to Priya Mehta"))).toBe(true);
  });

  it("should escalate issue to Level 2 (Central Admin)", () => {
    const issue = createIssue({
      title: "SLA Breach Test",
      description: "Testing manual escalation",
      category: "INFRASTRUCTURE",
      priority: "HIGH",
      createdBy: "Tester",
      stateId: "RJ",
      stateName: "Rajasthan",
      districtId: "Jaipur",
      districtName: "Jaipur",
    });

    const escalated = escalateIssue(issue.id, "Breached 24h SLA threshold");
    expect(escalated).not.toBeNull();
    expect(escalated?.status).toBe("ESCALATED");
    expect(escalated?.escalationLevel).toBe(2);
    expect(escalated?.assignedToRole).toBe("Central Admin");
  });

  it("should return escalated issue back to state with instructions", () => {
    const issue = createIssue({
      title: "Return To State Test",
      description: "Testing return workflow",
      category: "USER_COMPLAINT",
      priority: "MEDIUM",
      createdBy: "Tester",
      stateId: "MH",
      stateName: "Maharashtra",
      districtId: "Pune",
      districtName: "Pune",
    });

    escalateIssue(issue.id, "Investigate higher authority");
    const returned = returnIssueToState(
      issue.id,
      "Deploy local squad to inspect physically",
      "Central Director Sharma"
    );

    expect(returned).not.toBeNull();
    expect(returned?.status).toBe("IN_PROGRESS");
    expect(returned?.escalationLevel).toBe(1);
    expect(returned?.assignedToRole).toBe("State Admin");
  });

  it("should resolve issue and add resolution comment", () => {
    const issue = createIssue({
      title: "Resolution Test",
      description: "To be resolved",
      category: "CCTV_OFFLINE",
      priority: "LOW",
      createdBy: "Tester",
      stateId: "AP",
      stateName: "Andhra Pradesh",
      districtId: "Krishna",
      districtName: "Krishna",
    });

    const resolved = resolveIssue(issue.id, "Officer Ramesh", "Power supply replaced and verified.");
    expect(resolved).not.toBeNull();
    expect(resolved?.status).toBe("RESOLVED");
    expect(resolved?.resolvedAt).toBeDefined();
    expect(resolved?.comments.some((c) => c.message.includes("Power supply replaced"))).toBe(true);
  });

  it("should append communication comments to issue thread", () => {
    const issue = createIssue({
      title: "Comment Thread Test",
      description: "Testing communication",
      category: "INSPECTION_COMPLIANCE",
      priority: "HIGH",
      createdBy: "Tester",
      stateId: "AP",
      stateName: "Andhra Pradesh",
      districtId: "Guntur",
      districtName: "Guntur",
    });

    const updated = addCommentToIssue(
      issue.id,
      "Priya Mehta",
      "Inspection Officer",
      "Site visit scheduled for 14:00 today."
    );

    expect(updated?.comments.some((c) => c.message === "Site visit scheduled for 14:00 today.")).toBe(true);
  });
});
