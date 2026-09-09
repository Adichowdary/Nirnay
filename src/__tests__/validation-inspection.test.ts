import { describe, it, expect } from "vitest";
import {
  CreateInspectionSchema,
  UpdateInspectionSchema,
  ListInspectionsSchema,
  GpsVerificationSchema,
} from "@/lib/validation/inspection.schema";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";
const VALID_DATETIME = "2026-08-28T12:00:00.000Z";

describe("CreateInspectionSchema", () => {
  it("accepts valid input", () => {
    const r = CreateInspectionSchema.safeParse({
      project_id: VALID_UUID,
      inspection_type: "surprise",
    });
    expect(r.success).toBe(true);
  });

  it("defaults priority to normal", () => {
    const r = CreateInspectionSchema.safeParse({
      project_id: VALID_UUID,
      inspection_type: "video",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.priority).toBe("normal");
  });

  it("accepts all inspection types", () => {
    for (const t of ["surprise", "scheduled", "video", "follow_up"]) {
      const r = CreateInspectionSchema.safeParse({ project_id: VALID_UUID, inspection_type: t });
      expect(r.success).toBe(true);
    }
  });

  it("rejects invalid inspection_type", () => {
    const r = CreateInspectionSchema.safeParse({ project_id: VALID_UUID, inspection_type: "random" });
    expect(r.success).toBe(false);
  });

  it("rejects invalid priority", () => {
    const r = CreateInspectionSchema.safeParse({ project_id: VALID_UUID, inspection_type: "surprise", priority: "urgent" });
    expect(r.success).toBe(false);
  });
});

describe("GpsVerificationSchema", () => {
  const valid = {
    inspection_id: VALID_UUID,
    latitude: 28.6139,
    longitude: 77.209,
    accuracy: 10,
    timestamp: VALID_DATETIME,
  };

  it("accepts valid GPS data", () => {
    expect(GpsVerificationSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts optional device_id", () => {
    expect(GpsVerificationSchema.safeParse({ ...valid, device_id: "device-1" }).success).toBe(true);
  });

  it("rejects latitude out of range", () => {
    expect(GpsVerificationSchema.safeParse({ ...valid, latitude: 91 }).success).toBe(false);
    expect(GpsVerificationSchema.safeParse({ ...valid, latitude: -91 }).success).toBe(false);
  });

  it("rejects longitude out of range", () => {
    expect(GpsVerificationSchema.safeParse({ ...valid, longitude: 181 }).success).toBe(false);
    expect(GpsVerificationSchema.safeParse({ ...valid, longitude: -181 }).success).toBe(false);
  });

  it("rejects negative accuracy", () => {
    expect(GpsVerificationSchema.safeParse({ ...valid, accuracy: -1 }).success).toBe(false);
  });

  it("rejects invalid timestamp", () => {
    expect(GpsVerificationSchema.safeParse({ ...valid, timestamp: "not-a-date" }).success).toBe(false);
  });
});

describe("ListInspectionsSchema", () => {
  it("applies defaults", () => {
    const r = ListInspectionsSchema.safeParse({});
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.page).toBe(1);
  });

  it("accepts all valid statuses", () => {
    for (const s of ["pending", "assigned", "in_progress", "submitted", "reviewed", "closed"]) {
      const r = ListInspectionsSchema.safeParse({ status: s });
      expect(r.success).toBe(true);
    }
  });
});
