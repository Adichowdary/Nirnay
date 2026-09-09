import { describe, it, expect } from "vitest";
import { CreateUserSchema, UpdateUserSchema, ListUsersSchema } from "@/lib/validation/user.schema";
import { CreateOrganizationSchema, UpdateOrganizationSchema } from "@/lib/validation/organization.schema";
import { CreateProjectSchema, UpdateProjectSchema } from "@/lib/validation/project.schema";
import { CreateFacilitySchema, UpdateFacilitySchema } from "@/lib/validation/facility.schema";
import { UploadEvidenceSchema } from "@/lib/validation/evidence.schema";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";
const VALID_DATETIME = "2026-08-28T12:00:00.000Z";

describe("CreateUserSchema", () => {
  const valid = { email: "u@x.com", password: "pass1234", full_name: "Test User", role: "ADMIN" };

  it("accepts valid user", () => {
    expect(CreateUserSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects all invalid roles", () => {
    for (const r of ["SUPER_ADMIN", "GUEST", "viewer"]) {
      expect(CreateUserSchema.safeParse({ ...valid, role: r }).success).toBe(false);
    }
  });

  it("accepts all valid roles", () => {
    for (const r of ["CENTRAL_ADMIN", "STATE_ADMIN", "INSPECTION_OFFICER", "NGO_INSTITUTE", "ADMIN", "DOSJE_OFFICIAL"]) {
      expect(CreateUserSchema.safeParse({ ...valid, role: r }).success).toBe(true);
    }
  });
});

describe("CreateOrganizationSchema", () => {
  const valid = { name: "Test Org", type: "NGO" };

  it("accepts valid org", () => {
    expect(CreateOrganizationSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts all org types", () => {
    for (const t of ["NGO", "INSTITUTE", "GOVERNMENT", "PRIVATE"]) {
      expect(CreateOrganizationSchema.safeParse({ ...valid, type: t }).success).toBe(true);
    }
  });

  it("rejects invalid type", () => {
    expect(CreateOrganizationSchema.safeParse({ ...valid, type: "FEDERAL" }).success).toBe(false);
  });
});

describe("CreateProjectSchema", () => {
  const valid = { name: "Project A", state: "Delhi", district: "New Delhi" };

  it("accepts valid project", () => {
    expect(CreateProjectSchema.safeParse(valid).success).toBe(true);
  });

  it("defaults status to active", () => {
    const r = CreateProjectSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.status).toBe("active");
  });

  it("rejects missing state", () => {
    expect(CreateProjectSchema.safeParse({ name: "X", district: "Y" }).success).toBe(false);
  });

  it("rejects missing district", () => {
    expect(CreateProjectSchema.safeParse({ name: "X", state: "Y" }).success).toBe(false);
  });
});

describe("CreateFacilitySchema", () => {
  const valid = {
    name: "Facility",
    project_id: VALID_UUID,
    type: "hostel",
    latitude: 28.6139,
    longitude: 77.209,
  };

  it("accepts valid facility", () => {
    expect(CreateFacilitySchema.safeParse(valid).success).toBe(true);
  });

  it("defaults geofence_radius to 200", () => {
    const r = CreateFacilitySchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.geofence_radius).toBe(200);
  });

  it("rejects geofence_radius < 50", () => {
    expect(CreateFacilitySchema.safeParse({ ...valid, geofence_radius: 49 }).success).toBe(false);
  });

  it("rejects geofence_radius > 5000", () => {
    expect(CreateFacilitySchema.safeParse({ ...valid, geofence_radius: 5001 }).success).toBe(false);
  });

  it("accepts all facility types", () => {
    for (const t of ["hostel", "office", "field", "warehouse", "other"]) {
      expect(CreateFacilitySchema.safeParse({ ...valid, type: t }).success).toBe(true);
    }
  });
});

describe("UploadEvidenceSchema", () => {
  const valid = {
    inspection_id: VALID_UUID,
    project_id: VALID_UUID,
    type: "photo",
    sha256_hash: "abc123",
    captured_at: VALID_DATETIME,
  };

  it("accepts valid evidence", () => {
    expect(UploadEvidenceSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts all evidence types", () => {
    for (const t of ["photo", "video", "audio", "document"]) {
      expect(UploadEvidenceSchema.safeParse({ ...valid, type: t }).success).toBe(true);
    }
  });

  it("rejects empty sha256_hash", () => {
    expect(UploadEvidenceSchema.safeParse({ ...valid, sha256_hash: "" }).success).toBe(false);
  });
});
