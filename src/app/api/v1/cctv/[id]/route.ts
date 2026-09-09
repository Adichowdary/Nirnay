import { NextRequest } from "next/server";
import { requireAuth, ok, notFound, fail, serverError, zodError } from "@/lib/auth/guard";
import { z } from "zod";

const UpdateCameraSchema = z.object({
  label: z.string().min(1).optional(),
  location_description: z.string().optional(),
  resolution: z.string().optional(),
  fps: z.number().int().optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { supabase } = auth;
  const { id } = await params;

  const { data, error } = await supabase
    .from("cctv_cameras")
    .select("*, projects(name, state, district)")
    .eq("id", id)
    .single();

  if (error || !data) return notFound("Camera not found");

  return ok(data);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { supabase } = auth;
  const { id } = await params;

  const body = await request.json();
  const parsed = UpdateCameraSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const { data: existing } = await supabase
    .from("cctv_cameras")
    .select("id")
    .eq("id", id)
    .single();

  if (!existing) return notFound("Camera not found");

  const { error } = await supabase
    .from("cctv_cameras")
    .update(parsed.data)
    .eq("id", id);

  if (error) return serverError(error.message);

  const { data: updated } = await supabase
    .from("cctv_cameras")
    .select("*")
    .eq("id", id)
    .single();

  return ok(updated, "Camera updated");
}
