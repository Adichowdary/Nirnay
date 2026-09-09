import { NextRequest } from "next/server";
import { requireAuth, ok, fail, serverError, created, zodError } from "@/lib/auth/guard";
import { paginate } from "@/lib/validation/common";
import { z } from "zod";

const ListReportsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["asc", "desc"]).default("desc"),
  project_id: z.string().uuid().optional(),
  status: z.string().optional(),
  inspection_id: z.string().uuid().optional(),
});

const CreateReportSchema = z.object({
  inspection_id: z.string().uuid(),
  project_id: z.string().uuid(),
  title: z.string().min(2).max(500),
  summary: z.string().optional(),
  findings: z.string().optional(),
  recommendations: z.string().optional(),
  compliance_status: z.enum(["compliant", "non_compliant", "partial_compliance"]).optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { supabase } = auth;
  const url = new URL(request.url);

  const parsed = ListReportsSchema.safeParse({
    page: url.searchParams.get("page") ?? 1,
    limit: url.searchParams.get("limit") ?? 20,
    sort: url.searchParams.get("sort") ?? "desc",
    project_id: url.searchParams.get("project_id"),
    status: url.searchParams.get("status"),
    inspection_id: url.searchParams.get("inspection_id"),
  });

  if (!parsed.success) return zodError(parsed.error);

  const { page, limit, sort, project_id, status, inspection_id } = parsed.data;
  const range = paginate({ page, limit });

  let query = supabase
    .from("reports")
    .select("*, projects(name), inspections(id, inspection_type), profiles:created_by(full_name)", { count: "exact" });

  if (project_id) query = query.eq("project_id", project_id);
  if (status) query = query.eq("status", status);
  if (inspection_id) query = query.eq("inspection_id", inspection_id);

  const { data, count, error } = await query
    .order("created_at", { ascending: sort === "asc" })
    .range(range.from, range.to);

  if (error) return serverError(error.message);

  return ok({
    reports: data ?? [],
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
  const parsed = CreateReportSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const { data, error } = await supabase
    .from("reports")
    .insert({ ...parsed.data, status: "DRAFT", created_by: user.id })
    .select()
    .single();

  if (error) return serverError(error.message);

  return created(data, "Report created");
}
