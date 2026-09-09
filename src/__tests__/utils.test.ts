import { describe, it, expect } from "vitest";
import {
  cn,
  formatIndianNumber,
  formatPercent,
  formatDateTime,
  formatRelativeTime,
  getRiskColor,
  getStatusStyle,
  generateUUID,
  haversineDistance,
  isWithinGeofence,
  truncate,
  maskData,
  seededRandom,
  weightedRandomSelect,
} from "@/lib/utils";

describe("Utility Functions", () => {
  it("cn correctly merges class names and overrides Tailwind conflicts", () => {
    expect(cn("px-2 py-1", "bg-red-500", { "text-white": true, "opacity-50": false })).toContain("px-2 py-1 bg-red-500 text-white");
    expect(cn("p-4", "p-2")).toBe("p-2");
  });

  it("formatIndianNumber formats numbers using Indian numbering system", () => {
    const formatted = formatIndianNumber(1250000);
    expect(formatted).toBe("12,50,000");
  });

  it("formatPercent formats decimal numbers as percentages", () => {
    expect(formatPercent(85.456)).toBe("85.5%");
  });

  it("formatDateTime formats dates correctly", () => {
    const formatted = formatDateTime(new Date("2026-08-15T10:30:00Z"));
    expect(formatted).toBeDefined();
    expect(typeof formatted).toBe("string");
  });

  it("formatRelativeTime formats past and recent timestamps", () => {
    expect(formatRelativeTime(new Date(Date.now() - 10000))).toBe("Just now");
    expect(formatRelativeTime(new Date(Date.now() - 1000 * 60 * 5))).toBe("5 min ago");
    expect(formatRelativeTime(new Date(Date.now() - 1000 * 60 * 60 * 3))).toBe("3h ago");
    expect(formatRelativeTime(new Date(Date.now() - 1000 * 60 * 60 * 48))).toBe("2d ago");
  });

  it("getRiskColor assigns semantic colors and labels for risk scores", () => {
    expect(getRiskColor(20).label).toBe("LOW");
    expect(getRiskColor(45).label).toBe("MEDIUM");
    expect(getRiskColor(70).label).toBe("HIGH");
    expect(getRiskColor(90).label).toBe("CRITICAL");
  });

  it("getStatusStyle assigns styles and dot colors for project statuses", () => {
    expect(getStatusStyle("operational").dotColor).toBe("#1FA957");
    expect(getStatusStyle("at-risk").dotColor).toBe("#E0A100");
    expect(getStatusStyle("critical").dotColor).toBe("#E23B3B");
    expect(getStatusStyle("unknown").dotColor).toBe("#9AA0AC");
  });

  it("generateUUID produces valid UUID strings", () => {
    const uuid1 = generateUUID();
    const uuid2 = generateUUID();
    expect(uuid1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(uuid1).not.toBe(uuid2);
  });

  it("haversineDistance and isWithinGeofence calculate spatial distances accurately", () => {
    // Distance between New Delhi (28.6139, 77.2090) and Connaught Place (28.6315, 77.2167) ~2km
    const distKm = haversineDistance(28.6139, 77.209, 28.6315, 77.2167);
    expect(distKm).toBeGreaterThan(1.5);
    expect(distKm).toBeLessThan(2.5);

    // Geofence check
    const inside = isWithinGeofence(28.6139, 77.209, 28.614, 77.2091, 50);
    expect(inside).toBe(true);

    const outside = isWithinGeofence(28.6139, 77.209, 28.6315, 77.2167, 100);
    expect(outside).toBe(false);
  });

  it("truncate and maskData handle text truncation and masking", () => {
    expect(truncate("Hello World", 5)).toBe("Hell…");
    expect(truncate("Short", 10)).toBe("Short");

    expect(maskData("1234567890", 4)).toBe("1234•••••");
    expect(maskData("ABC", 3)).toBe("•••");
  });

  it("seededRandom and weightedRandomSelect provide reproducible weighted selections", () => {
    const val1 = seededRandom(42);
    const val2 = seededRandom(42);
    expect(val1).toBe(val2);

    const items = [
      { item: "A", weight: 10 },
      { item: "B", weight: 90 },
    ];
    const selected = weightedRandomSelect(items, 42);
    expect(selected).toBeDefined();
    expect(["A", "B"]).toContain(selected);

    expect(weightedRandomSelect([])).toBeNull();
  });
});
