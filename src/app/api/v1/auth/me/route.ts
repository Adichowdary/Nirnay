import { NextRequest } from "next/server";
import { requireAuth, ok } from "@/lib/auth/guard";

export async function GET(_request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { user, supabase } = auth;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return ok({
    id: user.id,
    email: user.email,
    role: user.role,
    permissions: user.permissions,
    profile: {
      full_name: profile?.full_name ?? null,
      phone: profile?.phone ?? null,
      state: profile?.state ?? null,
      district: profile?.district ?? null,
      avatar_url: profile?.avatar_url ?? null,
      organization_id: profile?.organization_id ?? null,
      biometric_status: profile?.biometric_status ?? "NOT_ENROLLED",
    },
  });
}
