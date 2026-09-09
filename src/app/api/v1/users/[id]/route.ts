import { NextRequest } from "next/server";
import { requireAuth, ok, notFound, fail, serverError, zodError } from "@/lib/auth/guard";
import { UpdateUserSchema } from "@/lib/validation/user.schema";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { supabase } = auth;
  const { id } = await params;

  const { data, error } = await supabase
    .from("profiles")
    .select(`
      *,
      user_roles(role_id, roles(name)),
      organizations(id, name)
    `)
    .eq("id", id)
    .single();

  if (error || !data) return notFound("User not found");

  const { count: inspectionCount } = await supabase
    .from("inspection_assignments")
    .select("id", { count: "exact", head: true })
    .eq("officer_id", id);

  const { count: activeAssignments } = await supabase
    .from("inspection_assignments")
    .select("id", { count: "exact", head: true })
    .eq("officer_id", id)
    .in("status", ["pending", "accepted"]);

  return ok({
    ...data,
    total_inspections: inspectionCount ?? 0,
    active_assignments: activeAssignments ?? 0,
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { user, supabase } = auth;
  const { id } = await params;

  if (!user.permissions.includes("MANAGE_USERS") && user.id !== id) {
    return fail("Insufficient permissions", 403);
  }

  const body = await request.json();
  const parsed = UpdateUserSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", id)
    .single();

  if (!existing) return notFound("User not found");

  const { error } = await supabase
    .from("profiles")
    .update(parsed.data)
    .eq("id", id);

  if (error) return serverError(error.message);

  const { data: updated } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  return ok(updated, "User updated");
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { user, supabase } = auth;
  const { id } = await params;

  if (!user.permissions.includes("MANAGE_USERS")) {
    return fail("Insufficient permissions", 403);
  }

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", id)
    .single();

  if (!existing) return notFound("User not found");

  const { error } = await supabase
    .from("profiles")
    .update({ is_active: false, deactivated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return serverError(error.message);

  return ok({ id, deactivated: true }, "User deactivated");
}
