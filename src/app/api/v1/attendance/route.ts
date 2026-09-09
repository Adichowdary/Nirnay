import { NextRequest } from "next/server";
import { requireAuth, ok, fail, serverError, created, zodError } from "@/lib/auth/guard";
import { paginate } from "@/lib/validation/common";
import { z } from "zod";

const ListAttendanceSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["asc", "desc"]).default("desc"),
  project_id: z.string().uuid().optional(),
  date: z.string().optional(),
  inspection_id: z.string().uuid().optional(),
});

const CreateAttendanceSchema = z.object({
  project_id: z.string().uuid(),
  inspection_id: z.string().uuid().optional(),
  date: z.string(),
  registered: z.number().int().min(0),
  expected: z.number().int().min(0),
  observed: z.number().int().min(0),
  reported: z.number().int().min(0),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { supabase } = auth;
  const url = new URL(request.url);

  const parsed = ListAttendanceSchema.safeParse({
    page: url.searchParams.get("page") ?? 1,
    limit: url.searchParams.get("limit") ?? 20,
    sort: url.searchParams.get("sort") ?? "desc",
    project_id: url.searchParams.get("project_id"),
    date: url.searchParams.get("date"),
    inspection_id: url.searchParams.get("inspection_id"),
  });

  if (!parsed.success) return zodError(parsed.error);

  const { page, limit, sort, project_id, date, inspection_id } = parsed.data;
  const range = paginate({ page, limit });

  let query = supabase.from("attendance_records").select("*, projects(name)", { count: "exact" });

  if (project_id) query = query.eq("project_id", project_id);
  if (date) query = query.eq("date", date);
  if (inspection_id) query = query.eq("inspection_id", inspection_id);

  const { data, count, error } = await query
    .order("date", { ascending: sort === "asc" })
    .range(range.from, range.to);

  if (error) return serverError(error.message);

  return ok({
    attendance: data ?? [],
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
  const parsed = CreateAttendanceSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const { registered, expected, reported } = parsed.data;
  const variancePercent = expected > 0 ? Math.round(((reported - expected) / expected) * 100) : 0;
  const isAnomaly = Math.abs(variancePercent) > 20;

  const { data, error } = await supabase
    .from("attendance_records")
    .insert({
      ...parsed.data,
      variance_percent: variancePercent,
      is_anomaly: isAnomaly,
      recorded_by: user.id,
    })
    .select()
    .single();

  if (error) return serverError(error.message);

  return created(data, "Attendance recorded");
}
