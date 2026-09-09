import { NextRequest } from "next/server";
import { requireAuth, ok, fail, serverError, auditLog } from "@/lib/auth/guard";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { user, supabase } = auth;
  const { id } = await params;

  const body = await request.json().catch(() => ({}));
  const { reason } = body as { reason?: string };

  const { data: report, error: fetchError } = await supabase
    .from("reports")
    .select("id, status, project_id")
    .eq("id", id)
    .single();

  if (fetchError || !report) return fail("Report not found", 404);
  if (report.status !== "SUBMITTED") return fail(`Cannot reject report in ${report.status} status`);

  const { error } = await supabase
    .from("reports")
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
    action: "REPORT_REJECTED",
    resource: "reports",
    resource_id: id,
    project_id: report.project_id,
    metadata: { reason },
  });

  return ok({ id, status: "REJECTED" }, "Report rejected");
}
