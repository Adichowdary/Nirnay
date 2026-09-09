import { NextRequest } from "next/server";
import { requireAuth, ok, notFound } from "@/lib/auth/guard";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { supabase } = auth;
  const { id } = await params;

  const { data, error } = await supabase
    .from("video_sessions")
    .select(`
      *,
      projects(name, state, district),
      profiles:initiated_by(full_name),
      video_session_participants(*, profiles:user_id(full_name, role))
    `)
    .eq("id", id)
    .single();

  if (error || !data) return notFound("Video session not found");

  return ok(data);
}
