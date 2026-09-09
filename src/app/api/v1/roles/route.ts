import { NextRequest } from "next/server";
import { requireAuth, ok, fail, serverError } from "@/lib/auth/guard";

export async function GET(_request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { supabase } = auth;

  const { data: roles, error } = await supabase
    .from("roles")
    .select("*");

  if (error) return serverError(error.message);

  // Get permission counts per role
  const { data: permCounts } = await supabase
    .from("role_permissions")
    .select("role_id");

  const countMap: Record<string, number> = {};
  permCounts?.forEach((rp) => {
    countMap[rp.role_id] = (countMap[rp.role_id] ?? 0) + 1;
  });

  const rolesWithCounts = roles?.map((r) => ({
    ...r,
    permission_count: countMap[r.id] ?? 0,
  })) ?? [];

  return ok(rolesWithCounts);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { user, supabase } = auth;
  if (user.role !== "ADMIN") {
    return fail("Only admins can create roles", 403);
  }

  const body = await request.json();
  const { id, name, permission_ids } = body;

  if (!id || !name) return fail("Missing required fields: id, name");

  const { error } = await supabase.from("roles").insert({ id, name });
  if (error) return serverError(error.message);

  if (permission_ids?.length > 0) {
    const perms = permission_ids.map((pid: string) => ({ role_id: id, permission_id: pid }));
    await supabase.from("role_permissions").insert(perms);
  }

  return ok({ id, name }, "Role created");
}
