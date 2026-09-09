import { NextRequest } from "next/server";
import { requireAuth, ok, notFound, fail, serverError, zodError } from "@/lib/auth/guard";
import { UpdateProjectSchema } from "@/lib/validation/project.schema";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { supabase } = auth;
  const { id } = await params;

  const { data, error } = await supabase
    .from("projects")
    .select(`
      *,
      organizations(id, name, type),
      facilities(id, name, latitude, longitude, geofence_radius),
      cctv_cameras(id, status),
      inspections(id, status, created_at)
    `)
    .eq("id", id)
    .single();

  if (error || !data) return notFound("Project not found");

  return ok(data);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { user, supabase } = auth;
  const { id } = await params;

  if (!user.permissions.includes("EDIT_PROJECT")) {
    return fail("Insufficient permissions", 403);
  }

  const body = await request.json();
  const parsed = UpdateProjectSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const { data: existing } = await supabase
    .from("projects")
    .select("id")
    .eq("id", id)
    .single();

  if (!existing) return notFound("Project not found");

  const { error } = await supabase
    .from("projects")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return serverError(error.message);

  const { data: updated } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  return ok(updated, "Project updated");
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { user, supabase } = auth;
  const { id } = await params;

  if (!user.permissions.includes("EDIT_PROJECT")) {
    return fail("Insufficient permissions", 403);
  }

  const { data: existing } = await supabase
    .from("projects")
    .select("id")
    .eq("id", id)
    .single();

  if (!existing) return notFound("Project not found");

  const { error } = await supabase
    .from("projects")
    .update({ status: "suspended", updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return serverError(error.message);

  return ok({ id, status: "suspended" }, "Project archived");
}
