import { NextRequest } from "next/server";
import { requireAuth, ok, fail, serverError, created, zodError } from "@/lib/auth/guard";
import { paginate } from "@/lib/validation/common";
import { CreateProjectSchema, ListProjectsSchema } from "@/lib/validation/project.schema";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { supabase } = auth;
  const url = new URL(request.url);

  const parsed = ListProjectsSchema.safeParse({
    page: url.searchParams.get("page") ?? 1,
    limit: url.searchParams.get("limit") ?? 20,
    sort: url.searchParams.get("sort") ?? "desc",
    state: url.searchParams.get("state"),
    district: url.searchParams.get("district"),
    status: url.searchParams.get("status"),
    organization_id: url.searchParams.get("organization_id"),
    search: url.searchParams.get("search"),
  });

  if (!parsed.success) return zodError(parsed.error);

  const { page, limit, sort, state, district, status, organization_id, search } = parsed.data;
  const range = paginate({ page, limit });

  let query = supabase.from("projects").select("*", { count: "exact" });

  if (state) query = query.eq("state", state);
  if (district) query = query.eq("district", district);
  if (status) query = query.eq("status", status);
  if (organization_id) query = query.eq("organization_id", organization_id);
  if (search) query = query.ilike("name", `%${search}%`);

  const { data, count, error } = await query
    .order("created_at", { ascending: sort === "asc" })
    .range(range.from, range.to);

  if (error) return serverError(error.message);

  return ok({
    projects: data ?? [],
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
  if (!user.permissions.includes("EDIT_PROJECT")) {
    return fail("Insufficient permissions", 403);
  }

  const body = await request.json();
  const parsed = CreateProjectSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const { data, error } = await supabase
    .from("projects")
    .insert({ ...parsed.data, created_by: user.id })
    .select()
    .single();

  if (error) return serverError(error.message);
  return created(data, "Project created");
}
