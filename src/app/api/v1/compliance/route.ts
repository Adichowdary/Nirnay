import { NextRequest } from "next/server";
import { requireAuth, ok, fail, serverError, created, zodError } from "@/lib/auth/guard";
import { paginate } from "@/lib/validation/common";
import { z } from "zod";

const ListComplianceSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["asc", "desc"]).default("desc"),
  project_id: z.string().uuid().optional(),
  status: z.string().optional(),
  requirement_type: z.string().optional(),
});

const CreateComplianceSchema = z.object({
  project_id: z.string().uuid(),
  requirement_type: z.string().min(1),
  title: z.string().min(2),
  description: z.string().optional(),
  due_date: z.string().datetime().optional(),
  evidence_required: z.boolean().default(false),
});

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { supabase } = auth;
  const url = new URL(request.url);

  const parsed = ListComplianceSchema.safeParse({
    page: url.searchParams.get("page") ?? 1,
    limit: url.searchParams.get("limit") ?? 20,
    sort: url.searchParams.get("sort") ?? "desc",
    project_id: url.searchParams.get("project_id"),
    status: url.searchParams.get("status"),
    requirement_type: url.searchParams.get("requirement_type"),
  });

  if (!parsed.success) return zodError(parsed.error);

  const { page, limit, sort, project_id, status, requirement_type } = parsed.data;
  const range = paginate({ page, limit });

  let query = supabase.from("compliance_records").select("*, projects(name)", { count: "exact" });

  if (project_id) query = query.eq("project_id", project_id);
  if (status) query = query.eq("status", status);
  if (requirement_type) query = query.eq("requirement_type", requirement_type);

  const { data, count, error } = await query
    .order("created_at", { ascending: sort === "asc" })
    .range(range.from, range.to);

  if (error) return serverError(error.message);

  return ok({
    compliance: data ?? [],
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
  const parsed = CreateComplianceSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const { data, error } = await supabase
    .from("compliance_records")
    .insert({ ...parsed.data, status: "pending", created_by: user.id })
    .select()
    .single();

  if (error) return serverError(error.message);

  return created(data, "Compliance record created");
}
