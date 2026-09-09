import { NextRequest } from "next/server";
import { requireAuth, ok, fail, serverError, auditLog } from "@/lib/auth/guard";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { user, supabase } = auth;
  const { id } = await params;

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
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return serverError(error.message);

  await supabase
    .from("inspections")
    .update({ status: "ACKNOWLEDGED" })
    .eq("id", assignment.inspection_id);

  await auditLog(supabase, {
    actor_id: user.id,
    action: "ASSIGNMENT_ACCEPTED",
    resource: "inspection_assignments",
    resource_id: id,
    project_id: assignment.project_id,
  });

  return ok({ id, status: "accepted" }, "Assignment accepted");
}
