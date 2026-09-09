import { NextRequest } from "next/server";
import { requireAuth, ok, fail, serverError } from "@/lib/auth/guard";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { user, supabase } = auth;
  const { id } = await params;

  const { data: notification, error: fetchError } = await supabase
    .from("notifications")
    .select("id, user_id")
    .eq("id", id)
    .single();

  if (fetchError || !notification) return fail("Notification not found", 404);
  if (notification.user_id !== user.id) return fail("Not your notification", 403);

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return serverError(error.message);

  return ok({ id, is_read: true }, "Notification marked as read");
}
