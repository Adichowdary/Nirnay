import { describe, it, expect } from "vitest";
import {
  calculateStateMetrics,
  getAllStatesPerformance,
  getStateDetails,
  createStateAdmin,
  assignStateAdmin,
  deactivateStateAdmin,
  getAllStateAdmins,
  getStateOperationalUsers,
  createStateOperationalUser,
  deactivateStateOperationalUser,
} from "@/lib/admin/state-management";
import { SUPPORTED_INDIAN_STATES } from "@/lib/auth/admin-hierarchy";

describe("State Management & Hierarchy Module", () => {
  it("should calculate state metrics accurately for supported states", () => {
    const ap = SUPPORTED_INDIAN_STATES.find((s) => s.id === "AP")!;
    const metrics = calculateStateMetrics(ap);

    expect(metrics.stateId).toBe("AP");
    expect(metrics.stateName).toBe("Andhra Pradesh");
    expect(metrics.totalDistricts).toBe(ap.districts.length);
    expect(metrics.totalProjects).toBeGreaterThanOrEqual(1);
    expect(metrics.slaComplianceRate).toBeGreaterThanOrEqual(0);
    expect(metrics.slaComplianceRate).toBeLessThanOrEqual(100);
  });

  it("should retrieve all states performance across India", () => {
    const all = getAllStatesPerformance();
    expect(all.length).toBe(SUPPORTED_INDIAN_STATES.length);
    expect(all.some((s) => s.stateId === "AP")).toBe(true);
    expect(all.some((s) => s.stateId === "RJ")).toBe(true);
  });

  it("should get state details by ID or Name", () => {
    const byId = getStateDetails("AP");
    expect(byId).not.toBeNull();
    expect(byId?.state.name).toBe("Andhra Pradesh");

    const byName = getStateDetails("Rajasthan");
    expect(byName).not.toBeNull();
    expect(byName?.state.id).toBe("RJ");

    const nonExistent = getStateDetails("XYZ");
    expect(nonExistent).toBeNull();
  });

  it("should manage State Admins (create, assign, deactivate)", () => {
    const newAdmin = createStateAdmin({
      name: "Suresh Chandra",
      officialId: "SA-KA-999",
      email: "suresh.ka@gov.in",
      phone: "+91 98765 43210",
      stateId: "KA",
    });

    expect(newAdmin.stateId).toBe("KA");
    expect(newAdmin.isActive).toBe(true);
    expect(newAdmin.permissions.length).toBeGreaterThan(5);

    const allAdmins = getAllStateAdmins();
    expect(allAdmins.some((a) => a.id === newAdmin.id)).toBe(true);

    const reassigned = assignStateAdmin(newAdmin.id, "AP");
    expect(reassigned?.stateId).toBe("AP");
    expect(reassigned?.stateName).toBe("Andhra Pradesh");

    const deactivated = deactivateStateAdmin(newAdmin.id);
    expect(deactivated).toBe(true);
    const updated = getAllStateAdmins().find((a) => a.id === newAdmin.id);
    expect(updated?.isActive).toBe(false);
  });

  it("should manage State Operational Users with district filtering", () => {
    const opUser = createStateOperationalUser({
      name: "Anita Sharma",
      email: "anita.sharma@gov.in",
      phone: "+91 91234 56789",
      role: "INSPECTION_OFFICER",
      stateId: "AP",
      districtId: "Guntur",
    });

    expect(opUser.role).toBe("INSPECTION_OFFICER");
    expect(opUser.districtId).toBe("Guntur");
    expect(opUser.isActive).toBe(true);

    const gunturUsers = getStateOperationalUsers("AP", "Guntur");
    expect(gunturUsers.some((u) => u.id === opUser.id)).toBe(true);

    const krishnaUsers = getStateOperationalUsers("AP", "Krishna");
    expect(krishnaUsers.some((u) => u.id === opUser.id)).toBe(false);

    const deactivated = deactivateStateOperationalUser(opUser.id);
    expect(deactivated).toBe(true);
    const checked = getStateOperationalUsers("AP").find((u) => u.id === opUser.id);
    expect(checked?.isActive).toBe(false);
  });
});
