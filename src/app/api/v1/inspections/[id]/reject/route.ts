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
    .select("id, status, project_id, assigned_to")
    .eq("id", id)
    .single();

  if (fetchError || !inspection) return fail("Inspection not found", 404);
  if (!validateInspectionTransition(inspection.status, "REJECTED")) {
    return fail(`Cannot reject inspection in ${inspection.status} status`);
  }

  const { error } = await supabase
    .from("inspections")
    .update({
      status: "REJECTED",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      rejection_reason: reason ?? null,
    })
    .eq("id", id);

  if (error) return serverError(error.message);

  await auditLog(supabase, {
    actor_id: user.id,
    action: "INSPECTION_REJECTED",
    resource: "inspections",
    resource_id: id,
    project_id: inspection.project_id,
    metadata: { reason },
  });

  return ok({ id, status: "REJECTED" }, "Inspection rejected");
}
