import { NextRequest } from "next/server";
import { requireAuth, ok, fail, serverError, created, auditLog, zodError } from "@/lib/auth/guard";
import { paginate } from "@/lib/validation/common";
import { CreateInspectionSchema, ListInspectionsSchema } from "@/lib/validation/inspection.schema";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { supabase } = auth;
  const url = new URL(request.url);

  const parsed = ListInspectionsSchema.safeParse({
    page: url.searchParams.get("page") ?? 1,
    limit: url.searchParams.get("limit") ?? 20,
    sort: url.searchParams.get("sort") ?? "desc",
    project_id: url.searchParams.get("project_id"),
    status: url.searchParams.get("status"),
    priority: url.searchParams.get("priority"),
    inspection_type: url.searchParams.get("inspection_type"),
    assigned_to: url.searchParams.get("assigned_to"),
  });

  if (!parsed.success) return zodError(parsed.error);

  const { page, limit, sort, project_id, status, priority, inspection_type, assigned_to } = parsed.data;
  const range = paginate({ page, limit });

  let query = supabase.from("inspections").select("*, projects(name, state, district), profiles:assigned_to(full_name)", { count: "exact" });

  if (project_id) query = query.eq("project_id", project_id);
  if (status) query = query.eq("status", status);
  if (priority) query = query.eq("priority", priority);
  if (inspection_type) query = query.eq("inspection_type", inspection_type);
  if (assigned_to) query = query.eq("assigned_to", assigned_to);

  const { data, count, error } = await query
    .order("created_at", { ascending: sort === "asc" })
    .range(range.from, range.to);

  if (error) return serverError(error.message);

  return ok({
    inspections: data ?? [],
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
  if (!user.permissions.includes("CREATE_INSPECTION")) {
    return fail("Insufficient permissions", 403);
  }

  const body = await request.json();
  const parsed = CreateInspectionSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const { data, error } = await supabase
    .from("inspections")
    .insert({ ...parsed.data, assigned_by: user.id })
    .select()
    .single();

  if (error) return serverError(error.message);

  await auditLog(supabase, {
    actor_id: user.id,
    action: "INSPECTION_CREATED",
    resource: "inspections",
    resource_id: data.id,
    project_id: parsed.data.project_id,
    metadata: { type: parsed.data.inspection_type, priority: parsed.data.priority },
  });

  return created(data, "Inspection created");
}
