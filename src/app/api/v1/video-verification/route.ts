import { NextRequest } from "next/server";
import { requireAuth, ok, fail, serverError, created, zodError } from "@/lib/auth/guard";
import { paginate } from "@/lib/validation/common";
import { z } from "zod";

const ListSessionsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["asc", "desc"]).default("desc"),
  project_id: z.string().uuid().optional(),
  status: z.string().optional(),
});

const CreateSessionSchema = z.object({
  project_id: z.string().uuid(),
  participant_ids: z.array(z.string().uuid()).optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { supabase } = auth;
  const url = new URL(request.url);

  const parsed = ListSessionsSchema.safeParse({
    page: url.searchParams.get("page") ?? 1,
    limit: url.searchParams.get("limit") ?? 20,
    sort: url.searchParams.get("sort") ?? "desc",
    project_id: url.searchParams.get("project_id"),
    status: url.searchParams.get("status"),
  });

  if (!parsed.success) return zodError(parsed.error);

  const { page, limit, sort, project_id, status } = parsed.data;
  const range = paginate({ page, limit });

  let query = supabase
    .from("video_sessions")
    .select("*, projects(name), profiles:initiated_by(full_name)", { count: "exact" });

  if (project_id) query = query.eq("project_id", project_id);
  if (status) query = query.eq("status", status);

  const { data, count, error } = await query
    .order("created_at", { ascending: sort === "asc" })
    .range(range.from, range.to);

  if (error) return serverError(error.message);

  return ok({
    sessions: data ?? [],
    total: count ?? 0,
    page,
    limit,
    pages: Math.ceil((count ?? 0) / limit),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { user, supabase } = auth;

  const body = await request.json();
  const parsed = CreateSessionSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const { project_id, participant_ids } = parsed.data;

  let selectedParticipants = participant_ids;

  if (!selectedParticipants || selectedParticipants.length === 0) {
    const { data: eligible } = await supabase
      .from("profiles")
      .select("id")
      .in("role", ["field_inspector", "pmu_officer", "department_official"])
      .eq("is_active", true);

    if (!eligible || eligible.length === 0) return fail("No eligible participants");

    const shuffled = eligible.sort(() => Math.random() - 0.5);
    selectedParticipants = shuffled.slice(0, Math.min(3, shuffled.length)).map((p) => p.id);
  }

  const { data: session, error } = await supabase
    .from("video_sessions")
    .insert({
      project_id,
      initiated_by: user.id,
      status: "initiating",
      is_recording: false,
      consent_obtained: false,
    })
    .select()
    .single();

  if (error) return serverError(error.message);

  const participantRows = selectedParticipants.map((pid) => ({
    session_id: session.id,
    user_id: pid,
    status: "invited",
  }));

  await supabase.from("video_session_participants").insert(participantRows);

  return created(session, "Video session created");
}
