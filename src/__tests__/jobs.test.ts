import { describe, it, expect, vi } from "vitest";
import { runAllJobs, type JobResult } from "@/lib/jobs/index";

// Mock all job modules
vi.mock("@/lib/jobs/overdue-inspections", () => ({
  checkOverdueInspections: vi.fn().mockResolvedValue({ checked: 2, signals: 0 }),
}));

vi.mock("@/lib/jobs/cctv-health", () => ({
  checkCCTVHealth: vi.fn().mockResolvedValue({ offline_cameras: 1 }),
}));

vi.mock("@/lib/jobs/risk-signals", () => ({
  calculateRiskSignals: vi.fn().mockResolvedValue({ signals_created: 3 }),
}));

vi.mock("@/lib/jobs/notifications", () => ({
  sendPendingNotifications: vi.fn().mockResolvedValue({ sent: 5 }),
  processSyncQueue: vi.fn().mockResolvedValue({ synced: 0 }),
  checkComplianceExpiry: vi.fn().mockResolvedValue({ expired: 1 }),
  cleanupTemporaryFiles: vi.fn().mockResolvedValue({ deleted: 0 }),
}));

describe("runAllJobs", () => {
  it("runs all 7 jobs and returns results", async () => {
    const results = await runAllJobs();
    expect(results).toHaveLength(7);
  });

  it("each result has required fields", async () => {
    const results = await runAllJobs();
    for (const r of results) {
      expect(r.job).toBeTruthy();
      expect(["success", "error"]).toContain(r.status);
      expect(r.duration_ms).toBeGreaterThanOrEqual(0);
      expect(r.result).toBeDefined();
    }
  });

  it("all jobs succeed with mocked implementations", async () => {
    const results = await runAllJobs();
    const failures = results.filter((r) => r.status === "error");
    expect(failures).toHaveLength(0);
  });

  it("returns job names in order", async () => {
    const results = await runAllJobs();
    const names = results.map((r) => r.job);
    expect(names).toEqual([
      "checkOverdueInspections",
      "checkCCTVHealth",
      "calculateRiskSignals",
      "sendPendingNotifications",
      "processSyncQueue",
      "checkComplianceExpiry",
      "cleanupTemporaryFiles",
    ]);
  });

  it("handles job failure gracefully", async () => {
    const { checkOverdueInspections } = await import("@/lib/jobs/overdue-inspections");
    vi.mocked(checkOverdueInspections).mockRejectedValueOnce(new Error("DB connection failed"));

    const results = await runAllJobs();
    const failure = results.find((r) => r.job === "checkOverdueInspections");
    expect(failure?.status).toBe("error");
    expect(failure?.result).toBe("DB connection failed");

    // Other jobs still succeed
    const otherResults = results.filter((r) => r.job !== "checkOverdueInspections");
    expect(otherResults.every((r) => r.status === "success")).toBe(true);

    // Reset mock
    vi.mocked(checkOverdueInspections).mockResolvedValue({ checked: 0, signals: 0 });
  });
});
