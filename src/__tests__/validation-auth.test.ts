import { describe, it, expect } from "vitest";
import { LoginSchema, RegisterSchema, ChangePasswordSchema } from "@/lib/validation/auth.schema";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("LoginSchema", () => {
  it("accepts valid login", () => {
    const r = LoginSchema.safeParse({ email: "test@demo.com", password: "pass" });
    expect(r.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const r = LoginSchema.safeParse({ email: "bad", password: "pass" });
    expect(r.success).toBe(false);
  });

  it("rejects empty password", () => {
    const r = LoginSchema.safeParse({ email: "a@b.com", password: "" });
    expect(r.success).toBe(false);
  });
});

describe("RegisterSchema", () => {
  const valid = {
    email: "user@demo.com",
    password: "password123",
    full_name: "Test User",
  };

  it("accepts valid registration", () => {
    const r = RegisterSchema.safeParse(valid);
    expect(r.success).toBe(true);
  });

  it("defaults role to INSPECTION_OFFICER", () => {
    const r = RegisterSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.role).toBe("INSPECTION_OFFICER");
  });

  it("rejects short password", () => {
    const r = RegisterSchema.safeParse({ ...valid, password: "short" });
    expect(r.success).toBe(false);
  });

  it("rejects short name", () => {
    const r = RegisterSchema.safeParse({ ...valid, full_name: "A" });
    expect(r.success).toBe(false);
  });

  it("accepts optional fields", () => {
    const r = RegisterSchema.safeParse({
      ...valid,
      phone: "1234567890",
      organization_id: VALID_UUID,
      state: "Delhi",
      district: "New Delhi",
    });
    expect(r.success).toBe(true);
  });

  it("rejects invalid role", () => {
    const r = RegisterSchema.safeParse({ ...valid, role: "SUPER_ADMIN" });
    expect(r.success).toBe(false);
  });
});

describe("ChangePasswordSchema", () => {
  it("accepts valid passwords", () => {
    const r = ChangePasswordSchema.safeParse({ current_password: "old", new_password: "newpass123" });
    expect(r.success).toBe(true);
  });

  it("rejects short new password", () => {
    const r = ChangePasswordSchema.safeParse({ current_password: "old", new_password: "short" });
    expect(r.success).toBe(false);
  });

  it("rejects empty current password", () => {
    const r = ChangePasswordSchema.safeParse({ current_password: "", new_password: "newpass123" });
    expect(r.success).toBe(false);
  });
});
