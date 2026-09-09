import { NextRequest } from "next/server";
import { requireAuth, ok, fail, serverError, created, zodError } from "@/lib/auth/guard";
import { paginate } from "@/lib/validation/common";
import { UploadEvidenceSchema, ListEvidenceSchema } from "@/lib/validation/evidence.schema";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { supabase } = auth;
  const url = new URL(request.url);

  const parsed = ListEvidenceSchema.safeParse({
    page: url.searchParams.get("page") ?? 1,
    limit: url.searchParams.get("limit") ?? 20,
    sort: url.searchParams.get("sort") ?? "desc",
    inspection_id: url.searchParams.get("inspection_id"),
    project_id: url.searchParams.get("project_id"),
    type: url.searchParams.get("type"),
  });

  if (!parsed.success) return zodError(parsed.error);

  const { page, limit, sort, inspection_id, project_id, type } = parsed.data;
  const range = paginate({ page, limit });

  let query = supabase.from("evidence").select("*", { count: "exact" });

  if (inspection_id) query = query.eq("inspection_id", inspection_id);
  if (project_id) query = query.eq("project_id", project_id);
  if (type) query = query.eq("type", type);

  const { data, count, error } = await query
    .order("created_at", { ascending: sort === "asc" })
    .range(range.from, range.to);

  if (error) return serverError(error.message);

  return ok({
    evidence: data ?? [],
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
  const parsed = UploadEvidenceSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const { data, error } = await supabase
    .from("evidence")
    .insert({ ...parsed.data, uploaded_by: user.id })
    .select()
    .single();

  if (error) return serverError(error.message);

  return created(data, "Evidence recorded");
}
