import { NextRequest } from "next/server";
import { requireAuth, ok, fail, serverError } from "@/lib/auth/guard";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { supabase } = auth;
  const { searchParams } = new URL(request.url);

  // Parse filter params
  const risk = searchParams.get("risk")?.split(",").filter(Boolean) ?? [];
  const cctv = searchParams.get("cctv")?.split(",").filter(Boolean) ?? [];
  const organization = searchParams.get("organization")?.split(",").filter(Boolean) ?? [];
  const district = searchParams.get("district")?.split(",").filter(Boolean) ?? [];
  const search = searchParams.get("search") ?? "";
  const minLat = parseFloat(searchParams.get("minLat") ?? "-90");
  const maxLat = parseFloat(searchParams.get("maxLat") ?? "90");
  const minLon = parseFloat(searchParams.get("minLon") ?? "-180");
  const maxLon = parseFloat(searchParams.get("maxLon") ?? "180");

  try {
    // Get facilities with project joins
    let query = supabase
      .from("facilities")
      .select(`
        id, name, type, latitude, longitude, geofence_radius, is_active,
        project:projects!inner(
          id, name, status, state, district,
          organization:organizations!inner(id, name, type),
          ai_risk_score
        ),
        cctv_cameras(id, status)
      `)
      .eq("is_active", true)
      .gte("latitude", minLat)
      .lte("latitude", maxLat)
      .gte("longitude", minLon)
      .lte("longitude", maxLon);

    if (search) {
      query = query.or(`name.ilike.%${search}%,project.name.ilike.%${search}%`);
    }

    if (district.length > 0) {
      query = query.in("project.district", district);
    }

    if (organization.length > 0) {
      query = query.in("project.organization.type", organization);
    }

    const { data: facilities, error } = await query.limit(500);

    if (error) {
      console.error("Map query error:", error);
      return serverError("Failed to fetch map data");
    }

    // Filter by risk tier (computed in JS since risk score is on project)
    let filtered = facilities ?? [];

    if (risk.length > 0) {
      filtered = filtered.filter((f) => {
        const proj = (f as Record<string, unknown>).project;
        const score = proj && typeof proj === "object" ? (proj as Record<string, unknown>).ai_risk_score as number : 0;
        if (risk.includes("critical") && score >= 80) return true;
        if (risk.includes("high") && score >= 60 && score < 80) return true;
        if (risk.includes("medium") && score >= 35 && score < 60) return true;
        if (risk.includes("low") && score < 35) return true;
        return false;
      });
    }

    // Filter by CCTV status
    if (cctv.length > 0) {
      filtered = filtered.filter((f) => {
        const cameras = (f as Record<string, unknown>).cctv_cameras as Array<{ status: string }> | undefined;
        if (!cameras || cameras.length === 0) return cctv.includes("offline");
        const online = cameras.some((c) => c.status !== "offline");
        if (cctv.includes("online") && online) return true;
        if (cctv.includes("offline") && !online) return true;
        return false;
      });
    }

    return ok({
      facilities: filtered,
      total: filtered.length,
    });
  } catch (err) {
    console.error("Map API error:", err);
    return serverError("Internal error");
  }
}
