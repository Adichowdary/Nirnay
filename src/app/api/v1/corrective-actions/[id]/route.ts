import { NextRequest } from "next/server";
import { requireAuth, ok, notFound, fail, serverError, zodError } from "@/lib/auth/guard";
import { z } from "zod";

const UpdateCorrectiveActionSchema = z.object({
  title: z.string().min(2).max(500).optional(),
  description: z.string().optional(),
  priority: z.enum(["low", "normal", "high", "critical"]).optional(),
  status: z.enum(["open", "in_progress", "completed", "overdue", "cancelled"]).optional(),
  assigned_to: z.string().uuid().optional(),
  due_date: z.string().datetime().optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { supabase } = auth;
  const { id } = await params;

  const { data, error } = await supabase
    .from("corrective_actions")
    .select(`
      *,
      projects(name, state, district),
      profiles:assigned_to(full_name, email),
      profiles:created_by(full_name),
      risk_signals(id, type, severity, title)
    `)
    .eq("id", id)
    .single();

  if (error || !data) return notFound("Corrective action not found");

  return ok(data);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { supabase } = auth;
  const { id } = await params;

  const body = await request.json();
  const parsed = UpdateCorrectiveActionSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const { data: existing } = await supabase
    .from("corrective_actions")
    .select("id")
    .eq("id", id)
    .single();

  if (!existing) return notFound("Corrective action not found");

  const { error } = await supabase
    .from("corrective_actions")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return serverError(error.message);

  const { data: updated } = await supabase
    .from("corrective_actions")
    .select("*")
    .eq("id", id)
    .single();

  return ok(updated, "Corrective action updated");
}
