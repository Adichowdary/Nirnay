import { describe, it, expect } from "vitest";
import {
  CreateUserSchema,
  UpdateUserSchema,
  ListUsersSchema,
} from "@/lib/validation/user.schema";
import {
  CreateOrganizationSchema,
  UpdateOrganizationSchema,
  ListOrganizationsSchema,
} from "@/lib/validation/organization.schema";
import {
  CreateProjectSchema,
  UpdateProjectSchema,
  ListProjectsSchema,
} from "@/lib/validation/project.schema";
import {
  CreateFacilitySchema,
  UpdateFacilitySchema,
  ListFacilitiesSchema,
} from "@/lib/validation/facility.schema";
import { UploadEvidenceSchema, ListEvidenceSchema } from "@/lib/validation/evidence.schema";

const UUID = "550e8400-e29b-41d4-a716-446655440000";
const DT = "2026-08-28T12:00:00.000Z";

describe("User Schemas", () => {
  describe("UpdateUserSchema", () => {
    it("accepts empty update", () => {
      expect(UpdateUserSchema.safeParse({}).success).toBe(true);
    });

    it("accepts partial updates", () => {
      expect(UpdateUserSchema.safeParse({ full_name: "New Name" }).success).toBe(true);
      expect(UpdateUserSchema.safeParse({ phone: "123" }).success).toBe(true);
      expect(UpdateUserSchema.safeParse({ is_active: false }).success).toBe(true);
    });

    it("rejects invalid avatar_url", () => {
      expect(UpdateUserSchema.safeParse({ avatar_url: "not-a-url" }).success).toBe(false);
    });

    it("accepts valid avatar_url", () => {
      expect(UpdateUserSchema.safeParse({ avatar_url: "https://example.com/img.png" }).success).toBe(true);
    });
  });

  describe("ListUsersSchema", () => {
    it("accepts is_active as string (coerced)", () => {
      const r = ListUsersSchema.safeParse({ is_active: "true" });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.is_active).toBe(true);
    });
  });
});

describe("Organization Schemas", () => {
  describe("UpdateOrganizationSchema", () => {
    it("accepts empty update", () => {
      expect(UpdateOrganizationSchema.safeParse({}).success).toBe(true);
    });

    it("rejects invalid email", () => {
      expect(UpdateOrganizationSchema.safeParse({ contact_email: "bad" }).success).toBe(false);
    });
  });

  describe("ListOrganizationsSchema", () => {
    it("accepts all filters", () => {
      const r = ListOrganizationsSchema.safeParse({ type: "NGO", state: "Delhi", search: "test" });
      expect(r.success).toBe(true);
    });
  });
});

describe("Project Schemas", () => {
  describe("UpdateProjectSchema", () => {
    it("accepts empty update", () => {
      expect(UpdateProjectSchema.safeParse({}).success).toBe(true);
    });

    it("accepts valid status update", () => {
      expect(UpdateProjectSchema.safeParse({ status: "flagged" }).success).toBe(true);
    });
  });

  describe("ListProjectsSchema", () => {
    it("accepts risk score filters", () => {
      const r = ListProjectsSchema.safeParse({ min_risk_score: "30", max_risk_score: "70" });
      expect(r.success).toBe(true);
      if (r.success) {
        expect(r.data.min_risk_score).toBe(30);
        expect(r.data.max_risk_score).toBe(70);
      }
    });
  });
});

describe("Facility Schemas", () => {
  describe("UpdateFacilitySchema", () => {
    it("accepts empty update", () => {
      expect(UpdateFacilitySchema.safeParse({}).success).toBe(true);
    });

    it("accepts valid latitude/longitude", () => {
      expect(UpdateFacilitySchema.safeParse({ latitude: 28.6, longitude: 77.2 }).success).toBe(true);
    });
  });

  describe("ListFacilitiesSchema", () => {
    it("accepts all filters", () => {
      const r = ListFacilitiesSchema.safeParse({ project_id: UUID, type: "hostel", state: "Delhi", search: "test" });
      expect(r.success).toBe(true);
    });
  });
});

describe("Evidence Schemas", () => {
  describe("ListEvidenceSchema", () => {
    it("accepts empty filters", () => {
      expect(ListEvidenceSchema.safeParse({}).success).toBe(true);
    });

    it("accepts all filters", () => {
      const r = ListEvidenceSchema.safeParse({
        inspection_id: UUID,
        project_id: UUID,
        type: "photo",
      });
      expect(r.success).toBe(true);
    });
  });

  describe("UploadEvidenceSchema", () => {
    it("accepts optional metadata", () => {
      const r = UploadEvidenceSchema.safeParse({
        inspection_id: UUID,
        project_id: UUID,
        type: "photo",
        sha256_hash: "abc",
        captured_at: DT,
        metadata: { key: "value", count: 42 },
      });
      expect(r.success).toBe(true);
    });

    it("accepts location data", () => {
      const r = UploadEvidenceSchema.safeParse({
        inspection_id: UUID,
        project_id: UUID,
        type: "video",
        sha256_hash: "def",
        captured_at: DT,
        latitude: 28.6139,
        longitude: 77.209,
        location_accuracy_m: 10,
      });
      expect(r.success).toBe(true);
    });
  });
});
