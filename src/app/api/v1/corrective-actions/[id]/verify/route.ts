import { NextRequest } from "next/server";
import { requireAuth, ok, fail, serverError, auditLog, zodError } from "@/lib/auth/guard";
import { z } from "zod";

const VerifyCorrectiveActionSchema = z.object({
  resolution_status: z.enum(["verified", "partially_resolved", "unresolved"]),
  verification_notes: z.string().optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { user, supabase } = auth;
  const { id } = await params;

  const body = await request.json();
  const parsed = VerifyCorrectiveActionSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const { data: action, error: fetchError } = await supabase
    .from("corrective_actions")
    .select("id, status, project_id")
    .eq("id", id)
    .single();

  if (fetchError || !action) return fail("Corrective action not found", 404);
  if (action.status === "completed") return fail("Action already verified/completed");

  const newStatus = parsed.data.resolution_status === "verified" ? "completed" : "in_progress";

  const { error } = await supabase
    .from("corrective_actions")
    .update({
      status: newStatus,
      verification_status: parsed.data.resolution_status,
      verification_notes: parsed.data.verification_notes ?? null,
      verified_by: user.id,
      verified_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return serverError(error.message);

  await auditLog(supabase, {
    actor_id: user.id,
    action: "CORRECTIVE_ACTION_VERIFIED",
    resource: "corrective_actions",
    resource_id: id,
    project_id: action.project_id,
    metadata: { resolution_status: parsed.data.resolution_status },
  });

  return ok({ id, status: newStatus, verification_status: parsed.data.resolution_status }, "Corrective action verified");
}
