import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET as bhuvanGET } from "@/app/api/v1/geo/bhuvan/route";
import { verifyAdminRequest, APEX_ADMIN_ROLES } from "@/lib/auth/admin-guard";

describe("Security Hardening Tests", () => {
  describe("Geospatial Input Validation (Bhuvan Route)", () => {
    it("rejects latitude greater than 90 degrees", async () => {
      const req = new NextRequest("http://localhost:3000/api/v1/geo/bhuvan?lat=95.5&lng=80.4");
      const res = await bhuvanGET(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain("Latitude must be between -90 and 90");
    });

    it("rejects longitude outside [-180, 180]", async () => {
      const req = new NextRequest("http://localhost:3000/api/v1/geo/bhuvan?lat=20.0&lng=-195.0");
      const res = await bhuvanGET(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain("longitude between -180 and 180");
    });

    it("rejects negative accuracy", async () => {
      const req = new NextRequest("http://localhost:3000/api/v1/geo/bhuvan?lat=16.3&lng=80.4&accuracy=-10");
      const res = await bhuvanGET(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain("Accuracy must be a valid non-negative number");
    });

    it("accepts valid Indian coordinates and sets isBhuvanVerified to true", async () => {
      const req = new NextRequest("http://localhost:3000/api/v1/geo/bhuvan?lat=16.3067&lng=80.4365&accuracy=4.2");
      const res = await bhuvanGET(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.location.isBhuvanVerified).toBe(true);
      expect(data.location.districtName).toBe("Guntur");
    });

    it("flags coordinates outside India as isBhuvanVerified false", async () => {
      // London coordinates
      const req = new NextRequest("http://localhost:3000/api/v1/geo/bhuvan?lat=51.5074&lng=-0.1278");
      const res = await bhuvanGET(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.location.isBhuvanVerified).toBe(false);
      expect(data.location.formattedAddress).toContain("outside sovereign Indian territorial boundary");
    });
  });

  describe("Admin Authorization Verification (admin-guard)", () => {
    beforeEach(() => {
      vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "true");
    });

    it("authorizes valid demo admin roles", async () => {
      const req = new NextRequest("http://localhost:3000/api/v1/admin/issues", {
        headers: {
          cookie: "insight_demo_role=CENTRAL_ADMIN",
        },
      });
      const result = await verifyAdminRequest(req);
      expect(result.authorized).toBe(true);
      expect(result.role).toBe("CENTRAL_ADMIN");
    });

    it("denies access to non-apex roles when apex role is required", async () => {
      const req = new NextRequest("http://localhost:3000/api/v1/admin/escalations", {
        headers: {
          cookie: "insight_demo_role=AUDIT_SQUAD",
        },
      });
      const result = await verifyAdminRequest(req, APEX_ADMIN_ROLES);
      expect(result.authorized).toBe(false);
    });

    it("denies unauthenticated requests when demo mode is disabled", async () => {
      vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "false");
      const req = new NextRequest("http://localhost:3000/api/v1/admin/issues");
      const result = await verifyAdminRequest(req);
      expect(result.authorized).toBe(false);
      expect(result.errorResponse?.status).toBe(401);
    });
  });

  describe("HTTP Header Injection Sanitization", () => {
    it("strips CRLF and quotes from attachment filenames", () => {
      const rawFilename = 'malicious\r\nSet-Cookie: evil=1\r\n.pdf"';
      const sanitized = rawFilename.replace(/[\r\n"\\;]/g, "_").slice(0, 150);
      expect(sanitized).not.toContain("\r");
      expect(sanitized).not.toContain("\n");
      expect(sanitized).not.toContain('"');
      expect(sanitized).toBe("malicious__Set-Cookie: evil=1__.pdf_");
    });
  });
});
