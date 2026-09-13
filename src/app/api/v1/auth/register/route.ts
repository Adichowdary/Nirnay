import { NextRequest } from "next/server";
import { createClient } from "@/lib/db";
import { RegisterSchema } from "@/lib/validation/auth.schema";
import { ok, fail, serverError, auditLog, zodError, requireAuth } from "@/lib/auth/guard";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return zodError(parsed.error);
    }

    const { email, password, full_name, phone, role, organization_id, state, district } = parsed.data;

    // Security: Prevent unauthenticated self-assignment of high-privilege administrative roles
    const PRIVILEGED_ROLES = ["CENTRAL_ADMIN", "STATE_ADMIN", "ADMIN", "DOSJE_OFFICIAL"];
    if (PRIVILEGED_ROLES.includes(role)) {
      const currentAuth = await requireAuth();
      const isAdmin = !("error" in currentAuth) && (currentAuth.user.role === "CENTRAL_ADMIN" || currentAuth.user.role === "ADMIN");
      if (!isAdmin) {
        return fail("Administrative roles require provisioning by an authorized administrator", 403);
      }
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name },
      },
    });

    if (error) {
      return fail(error.message, 400);
    }

    if (!data.user) {
      return fail("Registration failed", 400);
    }

    // Update profile
    await supabase
      .from("profiles")
      .update({
        full_name,
        phone: phone ?? null,
        organization_id: organization_id ?? null,
        state: state ?? null,
        district: district ?? null,
      })
      .eq("id", data.user.id);

    // Assign role
    await supabase
      .from("user_roles")
      .insert({
        user_id: data.user.id,
        role_id: role,
      });

    // Audit
    await auditLog(supabase, {
      actor_id: data.user.id,
      actor_name: full_name,
      action: "REGISTER",
      resource: "auth",
      metadata: { email, role },
    });

    return ok({
      user: {
        id: data.user.id,
        email: data.user.email,
        role,
        full_name,
      },
    }, "Registration successful");
  } catch (error) {
    console.error("Register error:", error);
    return serverError();
  }
}
