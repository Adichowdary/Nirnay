import { NextRequest } from "next/server";
import { requireAuth, ok, notFound, fail, serverError, zodError } from "@/lib/auth/guard";
import { UpdateFacilitySchema } from "@/lib/validation/facility.schema";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { supabase } = auth;
  const { id } = await params;

  const { data, error } = await supabase
    .from("facilities")
    .select(`
      *,
      projects(id, name, status, organization_id),
      cctv_cameras(id, camera_id, label, status, last_heartbeat),
      inspections(id, status, assigned_to, created_at)
    `)
    .eq("id", id)
    .single();

  if (error || !data) return notFound("Facility not found");

  return ok(data);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { user, supabase } = auth;
  const { id } = await params;

  if (!user.permissions.includes("MANAGE_FACILITIES")) {
    return fail("Insufficient permissions", 403);
  }

  const body = await request.json();
  const parsed = UpdateFacilitySchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const { data: existing } = await supabase
    .from("facilities")
    .select("id")
    .eq("id", id)
    .single();

  if (!existing) return notFound("Facility not found");

  const { error } = await supabase
    .from("facilities")
    .update(parsed.data)
    .eq("id", id);

  if (error) return serverError(error.message);

  const { data: updated } = await supabase
    .from("facilities")
    .select("*")
    .eq("id", id)
    .single();

  return ok(updated, "Facility updated");
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { user, supabase } = auth;
  const { id } = await params;

  if (!user.permissions.includes("MANAGE_FACILITIES")) {
    return fail("Insufficient permissions", 403);
  }

  const { data: existing } = await supabase
    .from("facilities")
    .select("id")
    .eq("id", id)
    .single();

  if (!existing) return notFound("Facility not found");

  const { error } = await supabase
    .from("facilities")
    .update({ is_active: false, deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return serverError(error.message);

  return ok({ id, deactivated: true }, "Facility deactivated");
}
