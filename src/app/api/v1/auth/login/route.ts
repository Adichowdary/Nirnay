import { NextRequest } from "next/server";
import { createClient } from "@/lib/db";
import { LoginSchema } from "@/lib/validation/auth.schema";
import { ok, fail, serverError, auditLog, zodError } from "@/lib/auth/guard";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return zodError(parsed.error);
    }

    const { email, password } = parsed.data;
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return fail("Invalid email or password", 401);
    }

    if (!data.user) {
      return fail("Login failed", 401);
    }

    // Get user role
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role_id")
      .eq("user_id", data.user.id)
      .single();

    const role = roleRow?.role_id ?? "UNKNOWN";

    // Get permissions
    const { data: permRows } = await supabase
      .from("role_permissions")
      .select("permission_id")
      .eq("role_id", role);

    const permissions = permRows?.map((r) => r.permission_id) ?? [];

    // Get profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone, state, district, avatar_url")
      .eq("id", data.user.id)
      .single();

    // Audit log
    await auditLog(supabase, {
      actor_id: data.user.id,
      actor_name: profile?.full_name ?? email,
      action: "LOGIN",
      resource: "auth",
      metadata: { email, role },
      ip_address: request.headers.get("x-forwarded-for") ?? undefined,
      user_agent: request.headers.get("user-agent") ?? undefined,
    });

    return ok({
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
      user: {
        id: data.user.id,
        email: data.user.email,
        role,
        permissions,
        profile: {
          full_name: profile?.full_name ?? null,
          phone: profile?.phone ?? null,
          state: profile?.state ?? null,
          district: profile?.district ?? null,
          avatar_url: profile?.avatar_url ?? null,
        },
      },
    }, "Login successful");
  } catch (error) {
    console.error("Login error:", error);
    return serverError();
  }
}
