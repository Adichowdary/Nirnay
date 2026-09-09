import { NextRequest } from "next/server";
import { requireAuth, ok, serverError } from "@/lib/auth/guard";
import { paginate } from "@/lib/validation/common";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { user, supabase } = auth;
  const url = new URL(request.url);

  const page = parseInt(url.searchParams.get("page") ?? "1");
  const limit = parseInt(url.searchParams.get("limit") ?? "20");
  const range = paginate({ page, limit });

  const { data, count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(range.from, range.to);

  if (error) return serverError(error.message);

  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  return ok({
    notifications: data ?? [],
    total: count ?? 0,
    unread_count: unreadCount ?? 0,
    page,
    limit,
    pages: Math.ceil((count ?? 0) / limit),
  });
}
