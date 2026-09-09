import { describe, it, expect, vi } from "vitest";
import {
  zodError,
  ok,
  created,
  fail,
  unauthorized,
  forbidden,
  notFound,
  serverError,
  hasPermission,
  hasRole,
  requirePermission,
  requireRole,
  validateInspectionTransition,
  type AuthUser,
} from "@/lib/auth/guard";

// Mock NextResponse.json for response body parsing
function parseResponse(res: Response) {
  return res.json() as Promise<Record<string, unknown>>;
}

describe("API Response Helpers", () => {
  describe("ok()", () => {
    it("returns 200 with data", async () => {
      const res = ok({ id: 1 }, "success msg");
      expect(res.status).toBe(200);
      const body = await parseResponse(res);
      expect(body.success).toBe(true);
      expect(body.data).toEqual({ id: 1 });
      expect(body.message).toBe("success msg");
    });

    it("omits message when not provided", async () => {
      const res = ok("data");
      const body = await parseResponse(res);
      expect(body.message).toBeUndefined();
    });
  });

  describe("created()", () => {
    it("returns 201", async () => {
      const res = created({ id: 2 });
      expect(res.status).toBe(201);
      const body = await parseResponse(res);
      expect(body.success).toBe(true);
    });
  });

  describe("fail()", () => {
    it("returns 400 by default", async () => {
      const res = fail("bad input");
      expect(res.status).toBe(400);
      const body = await parseResponse(res);
      expect(body.success).toBe(false);
      expect(body.error).toBe("bad input");
    });

    it("accepts custom status", async () => {
      const res = fail("gone", 410);
      expect(res.status).toBe(410);
    });
  });

  describe("unauthorized()", () => {
    it("returns 401", async () => {
      const res = unauthorized();
      expect(res.status).toBe(401);
      const body = await parseResponse(res);
      expect(body.error).toBe("Authentication required");
    });
  });

  describe("forbidden()", () => {
    it("returns 403", async () => {
      const res = forbidden();
      expect(res.status).toBe(403);
    });
  });

  describe("notFound()", () => {
    it("returns 404", async () => {
      const res = notFound("item missing");
      expect(res.status).toBe(404);
    });
  });

  describe("serverError()", () => {
    it("returns 500", async () => {
      const res = serverError();
      expect(res.status).toBe(500);
    });
  });
});

describe("zodError()", () => {
  it("extracts first issue message", async () => {
    const mockError = {
      issues: [{ message: "Invalid email" }],
    } as Parameters<typeof zodError>[0];
    const res = zodError(mockError);
    expect(res.status).toBe(400);
    const body = await parseResponse(res);
    expect(body.error).toBe("Invalid email");
  });
});

describe("hasPermission()", () => {
  const user: AuthUser = {
    id: "u1",
    email: "a@b.com",
    role: "ADMIN",
    permissions: ["inspections.create", "inspections.read"],
  };

  it("returns true for existing permission", () => {
    expect(hasPermission(user, "inspections.create")).toBe(true);
  });

  it("returns false for missing permission", () => {
    expect(hasPermission(user, "inspections.delete")).toBe(false);
  });
});

describe("hasRole()", () => {
  const user: AuthUser = {
    id: "u1",
    email: "a@b.com",
    role: "ADMIN",
    permissions: [],
  };

  it("returns true for matching role", () => {
    expect(hasRole(user, "ADMIN")).toBe(true);
  });

  it("returns true when one of many roles matches", () => {
    expect(hasRole(user, "ADMIN", "DOSJE_OFFICIAL")).toBe(true);
  });

  it("returns false when no role matches", () => {
    expect(hasRole(user, "INSPECTION_OFFICER", "NGO_INSTITUTE")).toBe(false);
  });
});

describe("requirePermission()", () => {
  const user: AuthUser = {
    id: "u1",
    email: "a@b.com",
    role: "ADMIN",
    permissions: ["reports.view"],
  };

  it("returns null when permission exists", () => {
    expect(requirePermission(user, "reports.view")).toBeNull();
  });

  it("returns 403 response when missing", () => {
    const res = requirePermission(user, "reports.delete");
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
  });
});

describe("requireRole()", () => {
  const user: AuthUser = {
    id: "u1",
    email: "a@b.com",
    role: "ADMIN",
    permissions: [],
  };

  it("returns null when role matches", () => {
    expect(requireRole(user, "ADMIN")).toBeNull();
  });

  it("returns 403 when role doesn't match", () => {
    const res = requireRole(user, "INSPECTION_OFFICER");
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
  });
});

describe("validateInspectionTransition()", () => {
  it("allows ASSIGNED -> ACKNOWLEDGED", () => {
    expect(validateInspectionTransition("ASSIGNED", "ACKNOWLEDGED")).toBe(true);
  });

  it("allows IN_PROGRESS -> ARRIVED", () => {
    expect(validateInspectionTransition("IN_PROGRESS", "ARRIVED")).toBe(true);
  });

  it("allows ARRIVED -> SUBMITTED", () => {
    expect(validateInspectionTransition("ARRIVED", "SUBMITTED")).toBe(true);
  });

  it("allows SUBMITTED -> UNDER_REVIEW", () => {
    expect(validateInspectionTransition("SUBMITTED", "UNDER_REVIEW")).toBe(true);
  });

  it("allows UNDER_REVIEW -> APPROVED", () => {
    expect(validateInspectionTransition("UNDER_REVIEW", "APPROVED")).toBe(true);
  });

  it("allows APPROVED -> CLOSED", () => {
    expect(validateInspectionTransition("APPROVED", "CLOSED")).toBe(true);
  });

  it("rejects CLOSED -> anything", () => {
    expect(validateInspectionTransition("CLOSED", "ASSIGNED")).toBe(false);
  });

  it("rejects CANCELLED -> anything", () => {
    expect(validateInspectionTransition("CANCELLED", "ASSIGNED")).toBe(false);
  });

  it("rejects invalid transitions", () => {
    expect(validateInspectionTransition("ASSIGNED", "APPROVED")).toBe(false);
    expect(validateInspectionTransition("ARRIVED", "APPROVED")).toBe(false);
    expect(validateInspectionTransition("DRAFT", "APPROVED")).toBe(false);
  });

  it("rejects unknown current status", () => {
    expect(validateInspectionTransition("UNKNOWN", "ASSIGNED")).toBe(false);
  });

  it("allows RETURNED -> IN_PROGRESS", () => {
    expect(validateInspectionTransition("RETURNED", "IN_PROGRESS")).toBe(true);
  });

  it("allows REJECTED -> IN_PROGRESS", () => {
    expect(validateInspectionTransition("REJECTED", "IN_PROGRESS")).toBe(true);
  });

  it("allows IN_PROGRESS -> PAUSED", () => {
    expect(validateInspectionTransition("IN_PROGRESS", "PAUSED")).toBe(true);
  });

  it("allows PAUSED -> IN_PROGRESS", () => {
    expect(validateInspectionTransition("PAUSED", "IN_PROGRESS")).toBe(true);
  });

  it("allows DRAFT -> CANCELLED", () => {
    expect(validateInspectionTransition("DRAFT", "CANCELLED")).toBe(true);
  });
});
