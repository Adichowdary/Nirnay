import { NextRequest } from "next/server";
import { requireAuth, ok, fail, serverError, auditLog } from "@/lib/auth/guard";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { user, supabase } = auth;
  const { id } = await params;

  const body = await request.json().catch(() => ({}));
  const { reason } = body as { reason?: string };

  const { data: assignment, error: fetchError } = await supabase
    .from("inspection_assignments")
    .select("id, officer_id, inspection_id, project_id, status")
    .eq("id", id)
    .single();

  if (fetchError || !assignment) return fail("Assignment not found", 404);
  if (assignment.officer_id !== user.id) return fail("Not your assignment", 403);
  if (assignment.status !== "pending") return fail(`Assignment already ${assignment.status}`);

  const { error } = await supabase
    .from("inspection_assignments")
    .update({ status: "rejected", rejected_at: new Date().toISOString(), rejection_reason: reason ?? null })
    .eq("id", id);

  if (error) return serverError(error.message);

  await supabase
    .from("inspections")
    .update({ assigned_to: null, status: "DRAFT" })
    .eq("id", assignment.inspection_id);

  await auditLog(supabase, {
    actor_id: user.id,
    action: "ASSIGNMENT_REJECTED",
    resource: "inspection_assignments",
    resource_id: id,
    project_id: assignment.project_id,
    metadata: { reason },
  });

  return ok({ id, status: "rejected" }, "Assignment rejected");
}
