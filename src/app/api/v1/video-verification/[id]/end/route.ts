import { NextRequest } from "next/server";
import { requireAuth, ok, fail, serverError, auditLog, zodError } from "@/lib/auth/guard";
import { z } from "zod";

const EndSessionSchema = z.object({
  outcome: z.enum(["verified", "inconclusive", "failed"]),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { user, supabase } = auth;
  const { id } = await params;

  const body = await request.json();
  const parsed = EndSessionSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const { data: session, error: fetchError } = await supabase
    .from("video_sessions")
    .select("id, initiated_by, status, started_at, project_id")
    .eq("id", id)
    .single();

  if (fetchError || !session) return fail("Session not found", 404);
  if (session.status !== "connected") return fail(`Session is ${session.status}, not connected`);

  const endedAt = new Date().toISOString();
  const durationSeconds = session.started_at
    ? Math.round((new Date(endedAt).getTime() - new Date(session.started_at).getTime()) / 1000)
    : 0;

  const { error } = await supabase
    .from("video_sessions")
    .update({
      status: "ended",
      ended_at: endedAt,
      duration_seconds: durationSeconds,
      outcome: parsed.data.outcome,
      notes: parsed.data.notes ?? null,
    })
    .eq("id", id);

  if (error) return serverError(error.message);

  await auditLog(supabase, {
    actor_id: user.id,
    action: "VC_SESSION_ENDED",
    resource: "video_sessions",
    resource_id: id,
    project_id: session.project_id,
    metadata: { outcome: parsed.data.outcome, duration_seconds: durationSeconds },
  });

  return ok({
    id,
    status: "ended",
    outcome: parsed.data.outcome,
    duration_seconds: durationSeconds,
  }, "Session ended");
}
