/**
 * INSIGHT — Cross-System Automated Risk Engine
 * 
 * Unifies:
 * 1. CCTV Outage Telemetry (MediaMTX / Heartbeat)
 * 2. Biometric Attendance Anomalies (Daily reported vs expected variance)
 * 3. Inspection Age & Frequency
 * 4. AI Anomaly Signals (Ghost beneficiary flags, repetitive photos, location skews)
 * 
 * Auto-triggers Unannounced Inspections and Random VC verification when Risk Score >= 70.
 */

export interface RiskEvaluationFactors {
  cctv_outage_minutes: number;
  attendance_variance_pct: number;
  days_since_last_inspection: number;
  unresolved_ai_anomalies_count: number;
  scheme_compliance_history_pct: number;
}

export interface RiskEvaluationResult {
  facility_id: string;
  facility_name: string;
  computed_risk_score: number; // 0 - 100
  risk_tier: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  factor_breakdown: {
    cctv_penalty: number;
    attendance_penalty: number;
    inspection_age_penalty: number;
    ai_anomaly_penalty: number;
    compliance_credit: number;
  };
  recommended_actions: string[];
  auto_dispatch_inspection: boolean;
  auto_trigger_random_vc: boolean;
  evaluated_at: string;
}

export function evaluateFacilityRisk(
  facilityId: string,
  facilityName: string,
  factors: RiskEvaluationFactors
): RiskEvaluationResult {
  // 1. CCTV Outage Factor (Up to 35 pts)
  // Offline > 30 mins starts accumulating high risk
  let cctvPenalty = 0;
  if (factors.cctv_outage_minutes > 15) {
    cctvPenalty = Math.min(35, Math.round(15 + (factors.cctv_outage_minutes - 15) * 0.4));
  }

  // 2. Attendance Variance Factor (Up to 30 pts)
  // e.g. Reported 80 vs Observed 47 (41% drop) -> +28 pts
  let attendancePenalty = 0;
  if (factors.attendance_variance_pct > 10) {
    attendancePenalty = Math.min(30, Math.round(factors.attendance_variance_pct * 0.7));
  }

  // 3. Inspection Age Factor (Up to 25 pts)
  // Overdue > 30 days
  let inspectionAgePenalty = 0;
  if (factors.days_since_last_inspection > 30) {
    inspectionAgePenalty = Math.min(25, Math.round((factors.days_since_last_inspection - 30) * 0.6));
  }

  // 4. AI Anomalies Factor (Up to 20 pts)
  const aiAnomalyPenalty = Math.min(20, factors.unresolved_ai_anomalies_count * 10);

  // 5. Compliance History Credit (Reduces score by up to 15 pts for consistent good track records)
  const complianceCredit = factors.scheme_compliance_history_pct > 85 ? -10 : 0;

  const rawScore = cctvPenalty + attendancePenalty + inspectionAgePenalty + aiAnomalyPenalty + complianceCredit;
  const computed_risk_score = Math.max(5, Math.min(98, rawScore));

  let risk_tier: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" = "LOW";
  if (computed_risk_score >= 80) risk_tier = "CRITICAL";
  else if (computed_risk_score >= 60) risk_tier = "HIGH";
  else if (computed_risk_score >= 35) risk_tier = "MODERATE";

  const recommended_actions: string[] = [];
  if (cctvPenalty >= 20) {
    recommended_actions.push("Dispatch technical query for prolonged CCTV offline stream.");
  }
  if (attendancePenalty >= 20) {
    recommended_actions.push("Perform biometric attendance audit (potential ghost beneficiary discrepancy).");
  }
  if (computed_risk_score >= 70) {
    recommended_actions.push("Auto-schedule surprise unannounced physical inspection.");
    recommended_actions.push("Trigger instant unannounced WebRTC video verification.");
  }

  return {
    facility_id: facilityId,
    facility_name: facilityName,
    computed_risk_score,
    risk_tier,
    factor_breakdown: {
      cctv_penalty: cctvPenalty,
      attendance_penalty: attendancePenalty,
      inspection_age_penalty: inspectionAgePenalty,
      ai_anomaly_penalty: aiAnomalyPenalty,
      compliance_credit: complianceCredit,
    },
    recommended_actions,
    auto_dispatch_inspection: computed_risk_score >= 70,
    auto_trigger_random_vc: computed_risk_score >= 60,
    evaluated_at: new Date().toISOString(),
  };
}
