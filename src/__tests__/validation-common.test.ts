import { describe, it, expect } from "vitest";
import {
  PaginationSchema,
  UuidParam,
  SearchQuery,
  paginate,
} from "@/lib/validation/common";

describe("PaginationSchema", () => {
  it("applies defaults for empty input", () => {
    const result = PaginationSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
      expect(result.data.sort).toBe("desc");
    }
  });

  it("accepts valid pagination params", () => {
    const result = PaginationSchema.safeParse({ page: "3", limit: "50", sort: "asc" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.limit).toBe(50);
      expect(result.data.sort).toBe("asc");
    }
  });

  it("rejects page < 1", () => {
    const result = PaginationSchema.safeParse({ page: "0" });
    expect(result.success).toBe(false);
  });

  it("rejects limit > 100", () => {
    const result = PaginationSchema.safeParse({ limit: "101" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid sort order", () => {
    const result = PaginationSchema.safeParse({ sort: "random" });
    expect(result.success).toBe(false);
  });

  it("accepts optional sort_by", () => {
    const result = PaginationSchema.safeParse({ sort_by: "created_at" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sort_by).toBe("created_at");
    }
  });
});

describe("UuidParam", () => {
  it("accepts valid UUID", () => {
    const result = UuidParam.safeParse({ id: "550e8400-e29b-41d4-a716-446655440000" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid UUID", () => {
    const result = UuidParam.safeParse({ id: "not-a-uuid" });
    expect(result.success).toBe(false);
  });
});

describe("SearchQuery", () => {
  it("accepts valid search", () => {
    const result = SearchQuery.safeParse({ q: "inspection report" });
    expect(result.success).toBe(true);
  });

  it("rejects empty search", () => {
    const result = SearchQuery.safeParse({ q: "" });
    expect(result.success).toBe(false);
  });

  it("rejects search > 200 chars", () => {
    const result = SearchQuery.safeParse({ q: "x".repeat(201) });
    expect(result.success).toBe(false);
  });
});

describe("paginate", () => {
  it("calculates offset for page 1", () => {
    const result = paginate({ page: 1, limit: 20 });
    expect(result).toEqual({ from: 0, to: 19 });
  });

  it("calculates offset for page 3", () => {
    const result = paginate({ page: 3, limit: 10 });
    expect(result).toEqual({ from: 20, to: 29 });
  });

  it("handles limit=1", () => {
    const result = paginate({ page: 5, limit: 1 });
    expect(result).toEqual({ from: 4, to: 4 });
  });
});
