import { NextRequest } from "next/server";
import { requireAuth, ok, serverError, zodError } from "@/lib/auth/guard";
import { paginate } from "@/lib/validation/common";
import { z } from "zod";

const ListAuditLogsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["asc", "desc"]).default("desc"),
  actor_id: z.string().uuid().optional(),
  action: z.string().optional(),
  resource: z.string().optional(),
  project_id: z.string().uuid().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { supabase } = auth;
  const url = new URL(request.url);

  const parsed = ListAuditLogsSchema.safeParse({
    page: url.searchParams.get("page") ?? 1,
    limit: url.searchParams.get("limit") ?? 20,
    sort: url.searchParams.get("sort") ?? "desc",
    actor_id: url.searchParams.get("actor_id"),
    action: url.searchParams.get("action"),
    resource: url.searchParams.get("resource"),
    project_id: url.searchParams.get("project_id"),
    start_date: url.searchParams.get("start_date"),
    end_date: url.searchParams.get("end_date"),
  });

  if (!parsed.success) return zodError(parsed.error);

  const { page, limit, sort, actor_id, action, resource, project_id, start_date, end_date } = parsed.data;
  const range = paginate({ page, limit });

  let query = supabase.from("audit_logs").select("*", { count: "exact" });

  if (actor_id) query = query.eq("actor_id", actor_id);
  if (action) query = query.eq("action", action);
  if (resource) query = query.eq("resource", resource);
  if (project_id) query = query.eq("project_id", project_id);
  if (start_date) query = query.gte("created_at", start_date);
  if (end_date) query = query.lte("created_at", end_date);

  const { data, count, error } = await query
    .order("created_at", { ascending: sort === "asc" })
    .range(range.from, range.to);

  if (error) return serverError(error.message);

  return ok({
    audit_logs: data ?? [],
    total: count ?? 0,
    page,
    limit,
    pages: Math.ceil((count ?? 0) / limit),
  });
}
