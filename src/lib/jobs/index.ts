import { checkOverdueInspections } from "./overdue-inspections";
import { checkCCTVHealth } from "./cctv-health";
import { calculateRiskSignals } from "./risk-signals";
import { sendPendingNotifications, processSyncQueue, checkComplianceExpiry, cleanupTemporaryFiles } from "./notifications";

export interface JobResult {
  job: string;
  status: "success" | "error";
  result: unknown;
  duration_ms: number;
}

export async function runAllJobs(): Promise<JobResult[]> {
  const jobs = [
    { name: "checkOverdueInspections", fn: checkOverdueInspections },
    { name: "checkCCTVHealth", fn: checkCCTVHealth },
    { name: "calculateRiskSignals", fn: calculateRiskSignals },
    { name: "sendPendingNotifications", fn: sendPendingNotifications },
    { name: "processSyncQueue", fn: processSyncQueue },
    { name: "checkComplianceExpiry", fn: checkComplianceExpiry },
    { name: "cleanupTemporaryFiles", fn: cleanupTemporaryFiles },
  ];

  const results: JobResult[] = [];

  for (const job of jobs) {
    const start = Date.now();
    try {
      const result = await job.fn();
      results.push({
        job: job.name,
        status: "success",
        result,
        duration_ms: Date.now() - start,
      });
    } catch (error) {
      results.push({
        job: job.name,
        status: "error",
        result: error instanceof Error ? error.message : "Unknown error",
        duration_ms: Date.now() - start,
      });
    }
  }

  return results;
}
