import { NextRequest, NextResponse } from "next/server";
import { getAllStatesPerformance, getStateDetails } from "@/lib/admin/state-management";
import { getIssues, getEscalatedIssues } from "@/lib/issues/issue-store";
import { DEMO_PROJECTS } from "@/lib/demo-data";
import { SUPPORTED_INDIAN_STATES } from "@/lib/auth/admin-hierarchy";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const stateFilter = url.searchParams.get("state");

    // If specific state requested (State Admin view or Central drilldown)
    if (stateFilter && stateFilter !== "ALL") {
      const stateData = getStateDetails(stateFilter);
      if (!stateData) {
        return NextResponse.json({ success: false, error: "State not found" }, { status: 404 });
      }

      const stateProjects = DEMO_PROJECTS.filter(
        (p) => p.state.toLowerCase() === stateFilter.toLowerCase() || p.state === stateData.state.id
      );
      const stateIssues = getIssues(stateFilter);

      return NextResponse.json({
        success: true,
        data: {
          scope: "STATE",
          state: stateData.state,
          metrics: stateData.metrics,
          projectsCount: stateProjects.length,
          districtsCount: stateData.state.districts.length,
          districts: stateData.state.districts,
          openIssues: stateIssues.filter((i) => i.status !== "RESOLVED" && i.status !== "CLOSED").length,
          criticalIssues: stateIssues.filter((i) => i.priority === "CRITICAL" && i.status !== "RESOLVED").length,
          escalatedIssues: stateIssues.filter((i) => i.escalationLevel === 2).length,
        },
      });
    }

    // Central Admin Nationwide Overview
    const statesPerformance = getAllStatesPerformance();
    const allIssues = getIssues();
    const escalatedIssues = getEscalatedIssues();

    const totalDistricts = SUPPORTED_INDIAN_STATES.reduce((acc, s) => acc + s.districts.length, 0);
    const totalProjects = DEMO_PROJECTS.length + 18; // Nationwide total
    const openIssues = allIssues.filter((i) => i.status !== "RESOLVED" && i.status !== "CLOSED").length;
    const criticalIssues = allIssues.filter((i) => i.priority === "CRITICAL" && i.status !== "RESOLVED").length;
    const slaBreaches = statesPerformance.reduce((acc, s) => acc + s.slaBreaches, 0);

    return NextResponse.json({
      success: true,
      data: {
        scope: "NATIONAL",
        totalStates: SUPPORTED_INDIAN_STATES.length,
        totalDistricts,
        totalProjects,
        activeInspections: 48,
        completedInspections: 192,
        pendingInspections: 28,
        openIssues,
        criticalIssues,
        escalatedIssues: escalatedIssues.length,
        slaBreaches,
        activeUsers: 86,
        statesPerformance,
      },
    });
  } catch (error) {
    console.error("Admin dashboard API error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
