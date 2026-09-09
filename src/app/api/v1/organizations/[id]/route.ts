import { NextRequest } from "next/server";
import { requireAuth, ok, notFound, fail, serverError, zodError } from "@/lib/auth/guard";
import { UpdateOrganizationSchema } from "@/lib/validation/organization.schema";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { supabase } = auth;
  const { id } = await params;

  const { data, error } = await supabase
    .from("organizations")
    .select(`
      *,
      projects(id, name, status, district),
      profiles(id, full_name, role)
    `)
    .eq("id", id)
    .single();

  if (error || !data) return notFound("Organization not found");

  return ok(data);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { user, supabase } = auth;
  const { id } = await params;

  if (!user.permissions.includes("MANAGE_ORGANIZATIONS")) {
    return fail("Insufficient permissions", 403);
  }

  const body = await request.json();
  const parsed = UpdateOrganizationSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const { data: existing } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", id)
    .single();

  if (!existing) return notFound("Organization not found");

  const { error } = await supabase
    .from("organizations")
    .update(parsed.data)
    .eq("id", id);

  if (error) return serverError(error.message);

  const { data: updated } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", id)
    .single();

  return ok(updated, "Organization updated");
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { user, supabase } = auth;
  const { id } = await params;

  if (!user.permissions.includes("MANAGE_ORGANIZATIONS")) {
    return fail("Insufficient permissions", 403);
  }

  const { data: existing } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!existing) return notFound("Organization not found");

  const { error } = await supabase
    .from("organizations")
    .update({ is_active: false, deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return serverError(error.message);

  return ok({ id, deactivated: true }, "Organization deactivated");
}
