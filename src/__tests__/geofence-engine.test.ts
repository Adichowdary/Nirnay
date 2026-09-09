import { describe, it, expect } from "vitest";
import {
  calculateHaversineDistanceMeters,
  verifyInspectorGeofence,
  sha256String,
  createOfflineCheckpoint,
  type GpsLocationReading,
  type FacilityGeofence,
} from "@/lib/geofence-engine";

describe("calculateHaversineDistanceMeters", () => {
  it("returns 0 for identical points", () => {
    const dist = calculateHaversineDistanceMeters(28.6139, 77.209, 28.6139, 77.209);
    expect(dist).toBe(0);
  });

  it("calculates ~1km distance between known Delhi points", () => {
    // India Gate to Rashtrapati Bhavan is ~3.2km
    const dist = calculateHaversineDistanceMeters(28.6129, 77.2295, 28.6139, 77.209);
    expect(dist).toBeGreaterThan(1500);
    expect(dist).toBeLessThan(2500);
  });

  it("calculates cross-country distance (~1500km Delhi to Mumbai)", () => {
    const dist = calculateHaversineDistanceMeters(28.6139, 77.209, 19.076, 72.8777);
    expect(dist).toBeGreaterThan(1_100_000);
    expect(dist).toBeLessThan(1_400_000);
  });

  it("handles equator crossing", () => {
    const dist = calculateHaversineDistanceMeters(1.0, 36.0, -1.0, 36.0);
    expect(dist).toBeGreaterThan(200_000);
    expect(dist).toBeLessThan(230_000);
  });

  it("handles antimeridian", () => {
    const dist = calculateHaversineDistanceMeters(0, 179.9, 0, -179.9);
    expect(dist).toBeGreaterThan(0);
    expect(dist).toBeLessThan(25_000);
  });
});

describe("verifyInspectorGeofence", () => {
  const facility: FacilityGeofence = {
    id: "f1",
    name: "Asha Centre",
    latitude: 28.6139,
    longitude: 77.209,
    radius_meters: 200,
  };

  it("returns VERIFIED when inside geofence with good accuracy", () => {
    const reading: GpsLocationReading = {
      latitude: 28.614,
      longitude: 77.2091,
      accuracy: 10,
      timestamp: Date.now(),
    };
    const result = verifyInspectorGeofence(reading, facility);
    expect(result.status).toBe("VERIFIED");
    expect(result.is_verified).toBe(true);
    expect(result.confidence_score).toBeGreaterThan(0.7);
    expect(result.verification_token).toBeDefined();
  });

  it("returns OUTSIDE_GEOFENCE when far away", () => {
    const reading: GpsLocationReading = {
      latitude: 19.076,
      longitude: 72.8777,
      accuracy: 10,
      timestamp: Date.now(),
    };
    const result = verifyInspectorGeofence(reading, facility);
    expect(result.status).toBe("OUTSIDE_GEOFENCE");
    expect(result.is_verified).toBe(false);
    expect(result.distance_meters).toBeGreaterThan(1000000);
  });

  it("returns LOW_ACCURACY when accuracy exceeds threshold", () => {
    const reading: GpsLocationReading = {
      latitude: 28.6139,
      longitude: 77.209,
      accuracy: 50,
      timestamp: Date.now(),
    };
    const result = verifyInspectorGeofence(reading, facility);
    expect(result.status).toBe("LOW_ACCURACY");
    expect(result.is_verified).toBe(false);
  });

  it("returns MOCK_PROVIDER_DETECTED when is_mock is true", () => {
    const reading: GpsLocationReading = {
      latitude: 28.6139,
      longitude: 77.209,
      accuracy: 5,
      timestamp: Date.now(),
      is_mock: true,
    };
    const result = verifyInspectorGeofence(reading, facility);
    expect(result.status).toBe("MOCK_PROVIDER_DETECTED");
    expect(result.is_verified).toBe(false);
    expect(result.confidence_score).toBe(0);
  });

  it("returns SPEED_ANOMALY_DETECTED on teleportation", () => {
    const reading: GpsLocationReading = {
      latitude: 19.076,
      longitude: 72.8777,
      accuracy: 10,
      timestamp: Date.now(),
    };
    const previousReading: GpsLocationReading = {
      latitude: 28.6139,
      longitude: 77.209,
      accuracy: 10,
      timestamp: Date.now() - 60000,
    };
    const result = verifyInspectorGeofence(reading, facility, previousReading);
    expect(result.status).toBe("SPEED_ANOMALY_DETECTED");
    expect(result.is_verified).toBe(false);
  });

  it("allows normal driving speed between readings", () => {
    // Two nearby points ~100m apart, 30 seconds apart = ~12 km/h
    const reading: GpsLocationReading = {
      latitude: 28.6148,
      longitude: 77.209,
      accuracy: 10,
      timestamp: Date.now(),
    };
    const previousReading: GpsLocationReading = {
      latitude: 28.6139,
      longitude: 77.209,
      accuracy: 10,
      timestamp: Date.now() - 30000,
    };
    const result = verifyInspectorGeofence(reading, facility, previousReading);
    expect(result.status).not.toBe("SPEED_ANOMALY_DETECTED");
  });

  it("includes explanation in result", () => {
    const reading: GpsLocationReading = {
      latitude: 28.6139,
      longitude: 77.209,
      accuracy: 10,
      timestamp: Date.now(),
    };
    const result = verifyInspectorGeofence(reading, facility);
    expect(result.explanation).toBeTruthy();
    expect(typeof result.explanation).toBe("string");
  });
});

describe("sha256String", () => {
  it("returns a hex string", async () => {
    const hash = await sha256String("hello world");
    expect(hash).toMatch(/^[a-f0-9]+$/);
    expect(hash.length).toBeGreaterThan(0);
  });

  it("returns consistent hash for same input", async () => {
    const h1 = await sha256String("test input");
    const h2 = await sha256String("test input");
    expect(h1).toBe(h2);
  });

  it("returns a non-empty string", async () => {
    const h = await sha256String("any input");
    expect(h.length).toBeGreaterThan(0);
  });
});

describe("createOfflineCheckpoint", () => {
  it("creates a checkpoint with required fields", async () => {
    const reading: GpsLocationReading = {
      latitude: 28.6139,
      longitude: 77.209,
      accuracy: 10,
      timestamp: Date.now(),
    };
    const record = await createOfflineCheckpoint("insp-1", "user-1", "fac-1", reading);
    expect(record.id).toMatch(/^OFFLINE_CKPT_/);
    expect(record.inspection_id).toBe("insp-1");
    expect(record.inspector_id).toBe("user-1");
    expect(record.facility_id).toBe("fac-1");
    expect(record.is_synced).toBe(false);
    expect(record.record_hash).toBeTruthy();
    expect(record.signature).toMatch(/^HMAC_ED25519_/);
  });

  it("uses previous_hash in chain", async () => {
    const reading: GpsLocationReading = {
      latitude: 28.6139,
      longitude: 77.209,
      accuracy: 10,
      timestamp: Date.now(),
    };
    const r1 = await createOfflineCheckpoint("insp-1", "user-1", "fac-1", reading);
    const r2 = await createOfflineCheckpoint("insp-1", "user-1", "fac-1", reading, r1.record_hash);
    expect(r2.previous_hash).toBe(r1.record_hash);
  });
});
