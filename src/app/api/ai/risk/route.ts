import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const aiEngineUrl = process.env.AI_ENGINE_URL || "http://localhost:8000";

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    try {
      const response = await fetch(`${aiEngineUrl}/api/v1/risk/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data, {
          headers: { "X-Engine-Source": "fastapi-live" },
        });
      }
    } catch {
      clearTimeout(timeout);
    }

    // Graceful fallback
    const sanctioned = body.sanctioned_funds || 1000000;
    const utilized = body.utilized_funds || 650000;
    const reported = body.reported_beneficiaries || 120;
    const verified = body.verified_beneficiaries || 88;
    const complaints = body.prior_complaints_count || 1;
    const cctvUptime = body.cctv_uptime_percentage || 94.0;

    const utilizationRate = utilized / Math.max(sanctioned, 1);
    const fundRisk = (1.0 - Math.min(utilizationRate, 1.0)) * 30.0;
    const beneficiaryGap = Math.max(0, reported - verified) / Math.max(reported, 1);
    const beneficiaryRisk = Math.min(beneficiaryGap * 40.0, 40.0);
    const complaintRisk = Math.min(complaints * 10.0, 20.0);
    const cctvRisk = (100.0 - Math.min(cctvUptime, 100.0)) * 0.1;

    const totalScore = +(Math.min(100.0, fundRisk + beneficiaryRisk + complaintRisk + cctvRisk)).toFixed(1);
    const tier = totalScore >= 70 ? "CRITICAL" : totalScore >= 45 ? "HIGH" : totalScore >= 25 ? "MODERATE" : "LOW";

    return NextResponse.json(
      {
        institute_id: body.institute_id || "INST-2024-8819",
        composite_risk_score: totalScore,
        risk_tier: tier,
        factors: {
          fund_risk: +fundRisk.toFixed(1),
          beneficiary_risk: +beneficiaryRisk.toFixed(1),
          complaint_risk: +complaintRisk.toFixed(1),
          cctv_offline_risk: +cctvRisk.toFixed(1),
        },
        recommended_action: tier === "CRITICAL" || tier === "HIGH" ? "PRIORITY_SURPRISE_AUDIT" : "STANDARD_QUARTERLY_AUDIT",
      },
      {
        headers: { "X-Engine-Source": "nextjs-simulation-fallback" },
      }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: "Risk score calculation failed", details: String(err) },
      { status: 500 }
    );
  }
}
