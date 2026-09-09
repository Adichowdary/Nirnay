import { NextRequest } from "next/server";
import { requireAuth, ok, fail, serverError, created, zodError } from "@/lib/auth/guard";
import { paginate } from "@/lib/validation/common";
import { z } from "zod";

const ListCctvSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["asc", "desc"]).default("desc"),
  project_id: z.string().uuid().optional(),
  status: z.string().optional(),
});

const RegisterCameraSchema = z.object({
  project_id: z.string().uuid(),
  camera_id: z.string().min(1),
  label: z.string().min(1),
  location_description: z.string().optional(),
  resolution: z.string().optional(),
  fps: z.number().int().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { supabase } = auth;
  const url = new URL(request.url);

  const parsed = ListCctvSchema.safeParse({
    page: url.searchParams.get("page") ?? 1,
    limit: url.searchParams.get("limit") ?? 20,
    sort: url.searchParams.get("sort") ?? "desc",
    project_id: url.searchParams.get("project_id"),
    status: url.searchParams.get("status"),
  });

  if (!parsed.success) return zodError(parsed.error);

  const { page, limit, sort, project_id, status } = parsed.data;
  const range = paginate({ page, limit });

  let query = supabase.from("cctv_cameras").select("*, projects(name)", { count: "exact" });

  if (project_id) query = query.eq("project_id", project_id);
  if (status) query = query.eq("status", status);

  const { data, count, error } = await query
    .order("created_at", { ascending: sort === "asc" })
    .range(range.from, range.to);

  if (error) return serverError(error.message);

  return ok({
    cameras: data ?? [],
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
  const parsed = RegisterCameraSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const { data, error } = await supabase
    .from("cctv_cameras")
    .insert({ ...parsed.data, status: "offline", registered_by: user.id })
    .select()
    .single();

  if (error) return serverError(error.message);

  return created(data, "Camera registered");
}
