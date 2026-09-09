import { NextRequest } from "next/server";
import { requireAuth, ok, fail, serverError, created, zodError } from "@/lib/auth/guard";
import { paginate } from "@/lib/validation/common";
import { z } from "zod";

const ListChecklistsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["asc", "desc"]).default("desc"),
  project_id: z.string().uuid().optional(),
  search: z.string().optional(),
});

const CreateChecklistSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().optional(),
  project_id: z.string().uuid().optional(),
  questions: z.array(z.object({
    question: z.string().min(1),
    category: z.string().optional(),
    is_required: z.boolean().default(true),
  })).min(1),
});

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { supabase } = auth;
  const url = new URL(request.url);

  const parsed = ListChecklistsSchema.safeParse({
    page: url.searchParams.get("page") ?? 1,
    limit: url.searchParams.get("limit") ?? 20,
    sort: url.searchParams.get("sort") ?? "desc",
    project_id: url.searchParams.get("project_id"),
    search: url.searchParams.get("search"),
  });

  if (!parsed.success) return zodError(parsed.error);

  const { page, limit, sort, project_id, search } = parsed.data;
  const range = paginate({ page, limit });

  let query = supabase.from("checklists").select("*, checklist_questions(id)", { count: "exact" });

  if (project_id) query = query.eq("project_id", project_id);
  if (search) query = query.ilike("name", `%${search}%`);

  const { data, count, error } = await query
    .order("created_at", { ascending: sort === "asc" })
    .range(range.from, range.to);

  if (error) return serverError(error.message);

  return ok({
    checklists: data ?? [],
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
  const parsed = CreateChecklistSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const { name, description, project_id, questions } = parsed.data;

  const { data: checklist, error } = await supabase
    .from("checklists")
    .insert({ name, description, project_id, created_by: user.id })
    .select()
    .single();

  if (error) return serverError(error.message);

  const questionRows = questions.map((q, idx) => ({
    checklist_id: checklist.id,
    question: q.question,
    category: q.category ?? "general",
    is_required: q.is_required,
    sort_order: idx,
  }));

  await supabase.from("checklist_questions").insert(questionRows);

  return created(checklist, "Checklist created");
}
