import { describe, it, expect } from "vitest";
import { evaluateFacilityRisk, type RiskEvaluationFactors } from "@/lib/risk-engine";

describe("evaluateFacilityRisk", () => {
  const baseFactors: RiskEvaluationFactors = {
    cctv_outage_minutes: 0,
    attendance_variance_pct: 0,
    days_since_last_inspection: 0,
    unresolved_ai_anomalies_count: 0,
    scheme_compliance_history_pct: 100,
  };

  it("returns LOW risk for all-zero factors", () => {
    const result = evaluateFacilityRisk("f1", "Test Facility", baseFactors);
    expect(result.risk_tier).toBe("LOW");
    expect(result.computed_risk_score).toBeLessThan(35);
    expect(result.auto_dispatch_inspection).toBe(false);
    expect(result.auto_trigger_random_vc).toBe(false);
  });

  it("returns CRITICAL risk for high CCTV + attendance + overdue inspection", () => {
    const result = evaluateFacilityRisk("f1", "Test", {
      cctv_outage_minutes: 120,
      attendance_variance_pct: 50,
      days_since_last_inspection: 60,
      unresolved_ai_anomalies_count: 3,
      scheme_compliance_history_pct: 0,
    });
    expect(result.risk_tier).toBe("CRITICAL");
    expect(result.computed_risk_score).toBeGreaterThanOrEqual(80);
    expect(result.auto_dispatch_inspection).toBe(true);
    expect(result.auto_trigger_random_vc).toBe(true);
  });

  it("returns MODERATE risk for moderate CCTV outage alone", () => {
    const result = evaluateFacilityRisk("f1", "Test", {
      ...baseFactors,
      cctv_outage_minutes: 60,
    });
    expect(result.computed_risk_score).toBeGreaterThanOrEqual(20);
    expect(result.computed_risk_score).toBeLessThan(60);
  });

  it("penalizes attendance variance", () => {
    const result = evaluateFacilityRisk("f1", "Test", {
      ...baseFactors,
      attendance_variance_pct: 40,
    });
    expect(result.factor_breakdown.attendance_penalty).toBeGreaterThan(0);
  });

  it("penalizes overdue inspection", () => {
    const result = evaluateFacilityRisk("f1", "Test", {
      ...baseFactors,
      days_since_last_inspection: 60,
    });
    expect(result.factor_breakdown.inspection_age_penalty).toBeGreaterThan(0);
  });

  it("penalizes AI anomalies", () => {
    const result = evaluateFacilityRisk("f1", "Test", {
      ...baseFactors,
      unresolved_ai_anomalies_count: 3,
    });
    expect(result.factor_breakdown.ai_anomaly_penalty).toBe(20);
  });

  it("credits high compliance", () => {
    const result = evaluateFacilityRisk("f1", "Test", {
      ...baseFactors,
      scheme_compliance_history_pct: 90,
    });
    expect(result.factor_breakdown.compliance_credit).toBe(-10);
  });

  it("no credit for low compliance", () => {
    const result = evaluateFacilityRisk("f1", "Test", {
      ...baseFactors,
      scheme_compliance_history_pct: 70,
    });
    expect(result.factor_breakdown.compliance_credit).toBe(0);
  });

  it("generates recommended actions for high CCTV penalty", () => {
    const result = evaluateFacilityRisk("f1", "Test", {
      ...baseFactors,
      cctv_outage_minutes: 90,
    });
    expect(result.recommended_actions.some((a) => a.includes("CCTV"))).toBe(true);
  });

  it("generates recommended actions for high attendance penalty", () => {
    const result = evaluateFacilityRisk("f1", "Test", {
      ...baseFactors,
      attendance_variance_pct: 40,
    });
    expect(result.recommended_actions.some((a) => a.includes("attendance"))).toBe(true);
  });

  it("auto-triggers VC when risk >= 60", () => {
    const result = evaluateFacilityRisk("f1", "Test", {
      cctv_outage_minutes: 120,
      attendance_variance_pct: 50,
      days_since_last_inspection: 60,
      unresolved_ai_anomalies_count: 0,
      scheme_compliance_history_pct: 100,
    });
    expect(result.auto_trigger_random_vc).toBe(true);
  });

  it("caps score at 98 maximum", () => {
    const result = evaluateFacilityRisk("f1", "Test", {
      cctv_outage_minutes: 9999,
      attendance_variance_pct: 9999,
      days_since_last_inspection: 9999,
      unresolved_ai_anomalies_count: 9999,
      scheme_compliance_history_pct: 0,
    });
    expect(result.computed_risk_score).toBeLessThanOrEqual(98);
  });

  it("floors score at 5 minimum", () => {
    const result = evaluateFacilityRisk("f1", "Test", baseFactors);
    expect(result.computed_risk_score).toBeGreaterThanOrEqual(5);
  });

  it("includes facility_id and facility_name", () => {
    const result = evaluateFacilityRisk("f-123", "My Facility", baseFactors);
    expect(result.facility_id).toBe("f-123");
    expect(result.facility_name).toBe("My Facility");
  });

  it("sets evaluated_at timestamp", () => {
    const before = Date.now();
    const result = evaluateFacilityRisk("f1", "Test", baseFactors);
    const after = Date.now();
    const evalTime = new Date(result.evaluated_at).getTime();
    expect(evalTime).toBeGreaterThanOrEqual(before);
    expect(evalTime).toBeLessThanOrEqual(after);
  });
});
