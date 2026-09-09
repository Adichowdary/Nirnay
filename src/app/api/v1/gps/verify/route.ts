import { NextRequest } from "next/server";
import { requireAuth, ok, fail, serverError, zodError, auditLog } from "@/lib/auth/guard";
import { GpsVerificationSchema } from "@/lib/validation/inspection.schema";

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { user, supabase } = auth;
  const body = await request.json();
  const parsed = GpsVerificationSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const { inspection_id, latitude, longitude, accuracy, timestamp, device_id } = parsed.data;

  // Get inspection
  const { data: inspection, error: inspErr } = await supabase
    .from("inspections")
    .select("id, facility_id, project_id")
    .eq("id", inspection_id)
    .single();

  if (inspErr || !inspection) return fail("Inspection not found", 404);

  // Get facility coordinates
  let facilityLat: number;
  let facilityLon: number;
  let facilityRadius: number;
  let facilityName: string;
  let facilityId: string | null = null;

  if (inspection.facility_id) {
    const { data: facility } = await supabase
      .from("facilities")
      .select("id, name, latitude, longitude, geofence_radius")
      .eq("id", inspection.facility_id)
      .single();

    if (!facility) return fail("Facility not found", 404);
    facilityLat = facility.latitude;
    facilityLon = facility.longitude;
    facilityRadius = facility.geofence_radius ?? 200;
    facilityName = facility.name;
    facilityId = facility.id;
  } else {
    // Demo fallback
    facilityLat = 28.6139;
    facilityLon = 77.209;
    facilityRadius = 200;
    facilityName = "Demo Facility";
  }

  const distance = haversineDistance(latitude, longitude, facilityLat, facilityLon);

  // Anti-spoofing checks
  const now = Date.now();
  const gpsTime = new Date(timestamp).getTime();
  const timeDiffMs = Math.abs(now - gpsTime);
  const isTimestampAnomaly = timeDiffMs > 60000;

  // Determine verification status
  let verificationStatus: string;
  if (isTimestampAnomaly) {
    verificationStatus = "POTENTIAL_LOCATION_ANOMALY";
  } else if (accuracy > 100) {
    verificationStatus = "LOW_ACCURACY";
  } else if (distance > facilityRadius) {
    verificationStatus = "OUTSIDE_GEOFENCE";
  } else {
    verificationStatus = "VERIFIED";
  }

  // Store in location_verifications table
  const { error: insertErr } = await supabase.from("location_verifications").insert({
    inspection_id,
    inspector_id: user.id,
    latitude,
    longitude,
    accuracy,
    facility_id: facilityId,
    facility_latitude: facilityLat,
    facility_longitude: facilityLon,
    distance_meters: Math.round(distance),
    geofence_radius: facilityRadius,
    verification_status: verificationStatus,
    device_id: device_id ?? null,
    is_mock_location: false,
    captured_at: timestamp,
    synced_at: new Date().toISOString(),
  });

  if (insertErr) {
    console.error("GPS verification insert error:", insertErr);
  }

  // Update inspection GPS fields
  await supabase
    .from("inspections")
    .update({
      gps_verified: verificationStatus === "VERIFIED",
      gps_lat: latitude,
      gps_lon: longitude,
      gps_accuracy_m: accuracy,
    })
    .eq("id", inspection_id);

  // Audit log
  await auditLog(supabase, {
    actor_id: user.id,
    action: "GPS_VERIFICATION",
    resource: "location_verifications",
    resource_id: inspection_id,
    project_id: inspection.project_id,
    metadata: {
      status: verificationStatus,
      distance: Math.round(distance),
      accuracy: Math.round(accuracy),
      facility: facilityName,
    },
  });

  // Explanation messages
  const explanations: Record<string, string> = {
    VERIFIED: `Physical presence confirmed at ${facilityName}. Distance: ${Math.round(distance)}m.`,
    OUTSIDE_GEOFENCE: `Inspector is ${Math.round(distance)}m from ${facilityName} (radius: ${facilityRadius}m).`,
    LOW_ACCURACY: `GPS accuracy is too low (±${Math.round(accuracy)}m). Move to an open area.`,
    POTENTIAL_LOCATION_ANOMALY: `GPS timestamp differs from server by ${Math.round(timeDiffMs / 1000)}s.`,
    LOCATION_UNAVAILABLE: "Unable to determine location.",
  };

  return ok({
    verification_status: verificationStatus,
    is_verified: verificationStatus === "VERIFIED",
    distance_meters: Math.round(distance),
    allowed_radius_meters: facilityRadius,
    accuracy_meters: Math.round(accuracy),
    facility_name: facilityName,
    explanation: explanations[verificationStatus] ?? "Unknown status",
  });
}
