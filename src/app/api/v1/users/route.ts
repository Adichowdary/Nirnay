import { NextRequest } from "next/server";
import { requireAuth, ok, fail, serverError, zodError } from "@/lib/auth/guard";
import { paginate } from "@/lib/validation/common";
import { ListUsersSchema } from "@/lib/validation/user.schema";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { supabase } = auth;
  const url = new URL(request.url);

  const parsed = ListUsersSchema.safeParse({
    page: url.searchParams.get("page") ?? 1,
    limit: url.searchParams.get("limit") ?? 20,
    sort: url.searchParams.get("sort") ?? "desc",
    role: url.searchParams.get("role"),
    state: url.searchParams.get("state"),
    is_active: url.searchParams.get("is_active"),
  });

  if (!parsed.success) return zodError(parsed.error);

  const { page, limit, sort, role, state, is_active } = parsed.data;
  const range = paginate({ page, limit });

  let query = supabase
    .from("profiles")
    .select("*, user_roles(role_id)", { count: "exact" });

  if (role) {
    const { data: roleUsers } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role_id", role);
    const userIds = roleUsers?.map((r) => r.user_id) ?? [];
    query = query.in("id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"]);
  }
  if (state) query = query.eq("state", state);
  if (is_active !== undefined) query = query.eq("is_active", is_active);

  const { data, count, error } = await query
    .order("created_at", { ascending: sort === "asc" })
    .range(range.from, range.to);

  if (error) return serverError(error.message);

  return ok({
    users: data ?? [],
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
  if (!user.permissions.includes("MANAGE_USERS")) {
    return fail("Insufficient permissions", 403);
  }

  try {
    const body = await request.json();
    const { email, password, full_name, phone, role, organization_id, state, district } = body;

    if (!email || !password || !full_name || !role) {
      return fail("Missing required fields: email, password, full_name, role");
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (error) return fail(error.message, 400);

    await supabase.from("profiles").update({
      full_name, phone: phone ?? null, organization_id: organization_id ?? null,
      state: state ?? null, district: district ?? null,
    }).eq("id", data.user.id);

    await supabase.from("user_roles").insert({ user_id: data.user.id, role_id: role });

    return ok({ id: data.user.id, email, full_name, role }, "User created");
  } catch (error) {
    console.error("Create user error:", error);
    return serverError();
  }
}
