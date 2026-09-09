import { NextRequest } from "next/server";
import { requireAuth, ok, fail, serverError, auditLog } from "@/lib/auth/guard";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { user, supabase } = auth;
  const { id } = await params;

  const body = await request.json().catch(() => ({}));
  const { resolution_notes } = body as { resolution_notes?: string };

  const { data: signal, error: fetchError } = await supabase
    .from("risk_signals")
    .select("id, project_id, is_resolved")
    .eq("id", id)
    .single();

  if (fetchError || !signal) return fail("Risk signal not found", 404);
  if (signal.is_resolved) return fail("Signal already resolved");

  const { error } = await supabase
    .from("risk_signals")
    .update({
      is_resolved: true,
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
      resolution_notes: resolution_notes ?? null,
    })
    .eq("id", id);

  if (error) return serverError(error.message);

  await auditLog(supabase, {
    actor_id: user.id,
    action: "RISK_SIGNAL_RESOLVED",
    resource: "risk_signals",
    resource_id: id,
    project_id: signal.project_id,
    metadata: { resolution_notes },
  });

  return ok({ id, is_resolved: true }, "Risk signal resolved");
}
