import { NextRequest } from "next/server";
import { requireAuth, ok, fail, serverError, created, auditLog, zodError } from "@/lib/auth/guard";
import { paginate } from "@/lib/validation/common";
import { z } from "zod";

const ListAssignmentsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["asc", "desc"]).default("desc"),
  status: z.string().optional(),
  officer_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
});

const CreateAssignmentSchema = z.object({
  inspection_id: z.string().uuid(),
  officer_id: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { supabase } = auth;
  const url = new URL(request.url);

  const parsed = ListAssignmentsSchema.safeParse({
    page: url.searchParams.get("page") ?? 1,
    limit: url.searchParams.get("limit") ?? 20,
    sort: url.searchParams.get("sort") ?? "desc",
    status: url.searchParams.get("status"),
    officer_id: url.searchParams.get("officer_id"),
    project_id: url.searchParams.get("project_id"),
  });

  if (!parsed.success) return zodError(parsed.error);

  const { page, limit, sort, status, officer_id, project_id } = parsed.data;
  const range = paginate({ page, limit });

  let query = supabase
    .from("inspection_assignments")
    .select("*, inspections(id, status, inspection_type, priority), profiles:officer_id(full_name, email)", { count: "exact" });

  if (status) query = query.eq("status", status);
  if (officer_id) query = query.eq("officer_id", officer_id);
  if (project_id) query = query.eq("project_id", project_id);

  const { data, count, error } = await query
    .order("created_at", { ascending: sort === "asc" })
    .range(range.from, range.to);

  if (error) return serverError(error.message);

  return ok({
    assignments: data ?? [],
    total: count ?? 0,
    page,
    limit,
    pages: Math.ceil((count ?? 0) / limit),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { user, supabase } = auth;

  const body = await request.json();
  const parsed = CreateAssignmentSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const { inspection_id, officer_id } = parsed.data;

  const { data: inspection, error: inspErr } = await supabase
    .from("inspections")
    .select("id, project_id, facility_id, status, assigned_to")
    .eq("id", inspection_id)
    .single();

  if (inspErr || !inspection) return fail("Inspection not found", 404);
  if (inspection.assigned_to) return fail("Inspection already assigned");

  let selectedOfficerId = officer_id;

  if (!selectedOfficerId) {
    const { data: officers } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "INSPECTION_OFFICER")
      .eq("is_active", true);

    if (!officers || officers.length === 0) return fail("No eligible officers available");

    const { data: facility } = await supabase
      .from("facilities")
      .select("latitude, longitude")
      .eq("id", inspection.facility_id)
      .single();

    const officerScores: { id: string; score: number }[] = [];

    for (const officer of officers) {
      const { count: activeCount } = await supabase
        .from("inspection_assignments")
        .select("id", { count: "exact", head: true })
        .eq("officer_id", officer.id)
        .in("status", ["pending", "accepted"]);

      const workload = activeCount ?? 0;
      const workloadScore = Math.max(0, 10 - workload);

      let distanceScore = 5;
      if (facility) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("latitude, longitude")
          .eq("id", officer.id)
          .single();

        if (profile?.latitude && profile?.longitude) {
          const dist = haversineDistance(profile.latitude, profile.longitude, facility.latitude, facility.longitude);
          distanceScore = Math.max(0, 10 - dist / 10);
        }
      }

      officerScores.push({ id: officer.id, score: workloadScore + distanceScore });
    }

    const totalScore = officerScores.reduce((sum, o) => sum + o.score, 0);
    let random = Math.random() * totalScore;
    for (const officer of officerScores) {
      random -= officer.score;
      if (random <= 0) {
        selectedOfficerId = officer.id;
        break;
      }
    }
    selectedOfficerId = selectedOfficerId ?? officerScores[0].id;
  }

  const { data: assignment, error } = await supabase
    .from("inspection_assignments")
    .insert({
      inspection_id,
      officer_id: selectedOfficerId,
      project_id: inspection.project_id,
      status: "pending",
      assigned_by: user.id,
    })
    .select()
    .single();

  if (error) return serverError(error.message);

  await supabase
    .from("inspections")
    .update({ assigned_to: selectedOfficerId, status: "ASSIGNED" })
    .eq("id", inspection_id);

  await auditLog(supabase, {
    actor_id: user.id,
    action: "ASSIGNMENT_CREATED",
    resource: "inspection_assignments",
    resource_id: assignment.id,
    project_id: inspection.project_id,
    metadata: { inspection_id, officer_id: selectedOfficerId },
  });

  return created(assignment, "Assignment created");
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
