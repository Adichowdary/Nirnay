import { NextRequest } from "next/server";
import { requireAuth, ok, fail, notFound, serverError, zodError } from "@/lib/auth/guard";
import { z } from "zod";

const UpdateChecklistSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  description: z.string().optional(),
  questions: z.array(z.object({
    id: z.string().uuid().optional(),
    question: z.string().min(1),
    category: z.string().optional(),
    is_required: z.boolean().default(true),
  })).optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { supabase } = auth;
  const { id } = await params;

  const { data, error } = await supabase
    .from("checklists")
    .select("*, checklist_questions(*)")
    .eq("id", id)
    .single();

  if (error || !data) return notFound("Checklist not found");

  return ok(data);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { user, supabase } = auth;
  const { id } = await params;

  const body = await request.json();
  const parsed = UpdateChecklistSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const { name, description, questions } = parsed.data;

  const { data: existing } = await supabase
    .from("checklists")
    .select("id, created_by")
    .eq("id", id)
    .single();

  if (!existing) return notFound("Checklist not found");

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  updateData.updated_by = user.id;

  const { error } = await supabase
    .from("checklists")
    .update(updateData)
    .eq("id", id);

  if (error) return serverError(error.message);

  if (questions) {
    await supabase.from("checklist_questions").delete().eq("checklist_id", id);

    const questionRows = questions.map((q, idx) => ({
      checklist_id: id,
      question: q.question,
      category: q.category ?? "general",
      is_required: q.is_required,
      sort_order: idx,
    }));

    await supabase.from("checklist_questions").insert(questionRows);
  }

  const { data: updated } = await supabase
    .from("checklists")
    .select("*, checklist_questions(*)")
    .eq("id", id)
    .single();

  return ok(updated, "Checklist updated");
}
