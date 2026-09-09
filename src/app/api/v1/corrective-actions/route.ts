import { NextRequest } from "next/server";
import { requireAuth, ok, fail, serverError, created, zodError } from "@/lib/auth/guard";
import { paginate } from "@/lib/validation/common";
import { z } from "zod";

const ListCorrectiveActionsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["asc", "desc"]).default("desc"),
  project_id: z.string().uuid().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
});

const CreateCorrectiveActionSchema = z.object({
  project_id: z.string().uuid(),
  inspection_id: z.string().uuid().optional(),
  risk_signal_id: z.string().uuid().optional(),
  title: z.string().min(2).max(500),
  description: z.string().optional(),
  priority: z.enum(["low", "normal", "high", "critical"]).default("normal"),
  assigned_to: z.string().uuid().optional(),
  due_date: z.string().datetime().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { supabase } = auth;
  const url = new URL(request.url);

  const parsed = ListCorrectiveActionsSchema.safeParse({
    page: url.searchParams.get("page") ?? 1,
    limit: url.searchParams.get("limit") ?? 20,
    sort: url.searchParams.get("sort") ?? "desc",
    project_id: url.searchParams.get("project_id"),
    status: url.searchParams.get("status"),
    priority: url.searchParams.get("priority"),
  });

  if (!parsed.success) return zodError(parsed.error);

  const { page, limit, sort, project_id, status, priority } = parsed.data;
  const range = paginate({ page, limit });

  let query = supabase
    .from("corrective_actions")
    .select("*, projects(name), profiles:assigned_to(full_name), profiles:created_by(full_name)", { count: "exact" });

  if (project_id) query = query.eq("project_id", project_id);
  if (status) query = query.eq("status", status);
  if (priority) query = query.eq("priority", priority);

  const { data, count, error } = await query
    .order("created_at", { ascending: sort === "asc" })
    .range(range.from, range.to);

  if (error) return serverError(error.message);

  return ok({
    corrective_actions: data ?? [],
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
  const parsed = CreateCorrectiveActionSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const { data, error } = await supabase
    .from("corrective_actions")
    .insert({ ...parsed.data, status: "open", created_by: user.id })
    .select()
    .single();

  if (error) return serverError(error.message);

  return created(data, "Corrective action created");
}
