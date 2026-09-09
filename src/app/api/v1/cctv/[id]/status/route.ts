import { NextRequest } from "next/server";
import { requireAuth, ok, fail, serverError, zodError } from "@/lib/auth/guard";
import { z } from "zod";

const UpdateCameraStatusSchema = z.object({
  status: z.enum(["live", "offline", "degraded", "demo"]),
  latency_ms: z.number().int().optional(),
  fps: z.number().int().optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { supabase } = auth;
  const { id } = await params;

  const body = await request.json();
  const parsed = UpdateCameraStatusSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const { data: camera, error: fetchError } = await supabase
    .from("cctv_cameras")
    .select("id, status, project_id")
    .eq("id", id)
    .single();

  if (fetchError || !camera) return fail("Camera not found", 404);

  const { error } = await supabase
    .from("cctv_cameras")
    .update({
      status: parsed.data.status,
      last_heartbeat: new Date().toISOString(),
      ...(parsed.data.latency_ms !== undefined && { latency_ms: parsed.data.latency_ms }),
      ...(parsed.data.fps !== undefined && { fps: parsed.data.fps }),
    })
    .eq("id", id);

  if (error) return serverError(error.message);

  await supabase.from("camera_health_events").insert({
    camera_id: id,
    project_id: camera.project_id,
    old_status: camera.status,
    new_status: parsed.data.status,
    latency_ms: parsed.data.latency_ms ?? null,
    recorded_at: new Date().toISOString(),
  });

  return ok({ id, status: parsed.data.status }, "Camera status updated");
}
