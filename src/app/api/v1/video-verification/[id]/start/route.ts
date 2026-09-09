import { NextRequest } from "next/server";
import { requireAuth, ok, fail, serverError, auditLog } from "@/lib/auth/guard";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { user, supabase } = auth;
  const { id } = await params;

  const { data: session, error: fetchError } = await supabase
    .from("video_sessions")
    .select("id, initiated_by, status, project_id")
    .eq("id", id)
    .single();

  if (fetchError || !session) return fail("Session not found", 404);
  if (session.initiated_by !== user.id) return fail("Only initiator can start the session", 403);
  if (session.status !== "initiating" && session.status !== "waiting") {
    return fail(`Cannot start session in ${session.status} status`);
  }

  const { error } = await supabase
    .from("video_sessions")
    .update({ status: "connected", started_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return serverError(error.message);

  await auditLog(supabase, {
    actor_id: user.id,
    action: "VC_SESSION_STARTED",
    resource: "video_sessions",
    resource_id: id,
    project_id: session.project_id,
  });

  return ok({ id, status: "connected" }, "Session started");
}
