import { NextRequest } from "next/server";
import { requireAuth, ok, fail, serverError, auditLog } from "@/lib/auth/guard";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { user, supabase } = auth;
  const { id } = await params;

  const { data: participant, error: fetchError } = await supabase
    .from("video_session_participants")
    .select("id, session_id, user_id, status")
    .eq("session_id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !participant) return fail("Not a participant in this session", 403);
  if (participant.status !== "invited") return fail(`Already ${participant.status}`);

  const { error } = await supabase
    .from("video_session_participants")
    .update({ status: "accepted", joined_at: new Date().toISOString() })
    .eq("id", participant.id);

  if (error) return serverError(error.message);

  await auditLog(supabase, {
    actor_id: user.id,
    action: "VC_PARTICIPANT_ACCEPTED",
    resource: "video_sessions",
    resource_id: id,
  });

  return ok({ status: "accepted" }, "Video request accepted");
}
