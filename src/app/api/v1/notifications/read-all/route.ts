import { NextRequest } from "next/server";
import { requireAuth, ok, serverError } from "@/lib/auth/guard";

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { user, supabase } = auth;

  const { error, count } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) return serverError(error.message);

  return ok({ updated: count ?? 0 }, "All notifications marked as read");
}
