import { NextRequest } from "next/server";
import { requireAuth, ok, serverError } from "@/lib/auth/guard";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { supabase } = auth;

  const { data, error } = await supabase
    .from("risk_signals")
    .select("*, projects(name, state, district)")
    .eq("is_resolved", false)
    .order("created_at", { ascending: false });

  if (error) return serverError(error.message);

  return ok(data ?? []);
}
