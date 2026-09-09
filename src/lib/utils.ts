import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes intelligently.
 * Use everywhere instead of raw string concatenation.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as Indian locale (lakhs/crores).
 */
export function formatIndianNumber(n: number): string {
  return n.toLocaleString("en-IN");
}

/**
 * Format bytes to readable string (e.g. 1.2 MB).
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Format percentage with 1 decimal.
 */
export function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`;
}

/**
 * Format a date as "26 Aug 2026 · 14:31"
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }) + " · " + d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * Format relative time (e.g. "3 min ago").
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Get semantic color class for a risk score.
 */
export function getRiskColor(score: number): {
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
} {
  if (score <= 29) return {
    label: "LOW",
    bgClass: "bg-green-tint",
    textClass: "text-green-strong",
    borderClass: "border-green-base",
  };
  if (score <= 59) return {
    label: "MEDIUM",
    bgClass: "bg-amber-tint",
    textClass: "text-amber-strong",
    borderClass: "border-amber-base",
  };
  if (score <= 79) return {
    label: "HIGH",
    bgClass: "bg-red-tint",
    textClass: "text-red-strong",
    borderClass: "border-red-base",
  };
  return {
    label: "CRITICAL",
    bgClass: "bg-red-tint",
    textClass: "text-red-text",
    borderClass: "border-red-base",
  };
}

/**
 * Get semantic status style for a project status string.
 */
export function getStatusStyle(status: string): {
  dotColor: string;
  label: string;
  bgClass: string;
  textClass: string;
} {
  switch (status.toLowerCase()) {
    case "operational":
    case "healthy":
    case "active":
      return { dotColor: "#1FA957", label: status, bgClass: "bg-green-tint", textClass: "text-green-strong" };
    case "warning":
    case "at-risk":
      return { dotColor: "#E0A100", label: status, bgClass: "bg-amber-tint", textClass: "text-amber-strong" };
    case "critical":
    case "offline":
    case "suspended":
      return { dotColor: "#E23B3B", label: status, bgClass: "bg-red-tint", textClass: "text-red-strong" };
    default:
      return { dotColor: "#9AA0AC", label: status, bgClass: "bg-neutral-100", textClass: "text-neutral-600" };
  }
}

/**
 * Generate a UUID v4 (for evidence items, etc.)
 */
export function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Compute SHA-256 of a file (for evidence integrity).
 * Returns hex string.
 */
export async function computeSHA256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Haversine distance between two GPS coordinates, in km.
 */
export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Check if a GPS coordinate is within geofence radius (meters).
 */
export function isWithinGeofence(
  lat: number, lon: number,
  targetLat: number, targetLon: number,
  radiusMeters: number
): boolean {
  const distKm = haversineDistance(lat, lon, targetLat, targetLon);
  return distKm * 1000 <= radiusMeters;
}

/**
 * Truncate text to N chars with ellipsis.
 */
export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n - 1) + "…" : str;
}

/**
 * Mask sensitive data for demo mode.
 */
export function maskData(str: string, visibleChars = 3): string {
  if (str.length <= visibleChars) return "•".repeat(str.length);
  return str.slice(0, visibleChars) + "•".repeat(Math.min(str.length - visibleChars, 5));
}

/**
 * Weighted random selection with seed for inspection assignment.
 * Uses Fisher-Yates with deterministic seed for reproducibility.
 */
export function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

export function weightedRandomSelect<T>(
  items: Array<{ item: T; weight: number }>,
  seed?: number
): T | null {
  if (items.length === 0) return null;
  const totalWeight = items.reduce((sum, { weight }) => sum + weight, 0);
  let random = seed !== undefined ? seededRandom(seed) * totalWeight : Math.random() * totalWeight;
  for (const { item, weight } of items) {
    random -= weight;
    if (random <= 0) return item;
  }
  return items[items.length - 1].item;
}
