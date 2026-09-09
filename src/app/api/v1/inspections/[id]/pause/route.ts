import { NextRequest } from "next/server";
import { requireAuth, ok, fail, serverError, auditLog, validateInspectionTransition } from "@/lib/auth/guard";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { user, supabase } = auth;
  const { id } = await params;

  const body = await request.json().catch(() => ({}));
  const { reason } = body as { reason?: string };

  const { data: inspection, error: fetchError } = await supabase
    .from("inspections")
    .select("id, status, assigned_to, project_id")
    .eq("id", id)
    .single();

  if (fetchError || !inspection) return fail("Inspection not found", 404);
  if (inspection.assigned_to !== user.id) return fail("Not assigned to this inspection", 403);
  if (!validateInspectionTransition(inspection.status, "PAUSED")) {
    return fail(`Cannot pause inspection in ${inspection.status} status`);
  }

  const { error } = await supabase
    .from("inspections")
    .update({ status: "PAUSED", pause_reason: reason ?? null })
    .eq("id", id);

  if (error) return serverError(error.message);

  await auditLog(supabase, {
    actor_id: user.id,
    action: "INSPECTION_PAUSED",
    resource: "inspections",
    resource_id: id,
    project_id: inspection.project_id,
    metadata: { reason },
  });

  return ok({ id, status: "PAUSED" }, "Inspection paused");
}
