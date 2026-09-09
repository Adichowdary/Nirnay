import { NextRequest } from "next/server";
import { requireAuth, ok, fail, serverError, created, zodError } from "@/lib/auth/guard";
import { z } from "zod";

const SyncPayloadSchema = z.object({
  items: z.array(z.object({
    type: z.enum(["evidence", "attendance", "checklist", "inspection_update"]),
    payload: z.record(z.string(), z.unknown()),
    client_id: z.string(),
    created_at: z.string().datetime(),
  })).min(1).max(50),
});

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { user, supabase } = auth;

  const { data: pendingItems, error } = await supabase
    .from("sync_queue")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) return serverError(error.message);

  const { count: failedCount } = await supabase
    .from("sync_queue")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "failed");

  return ok({
    pending_items: pendingItems ?? [],
    pending_count: pendingItems?.length ?? 0,
    failed_count: failedCount ?? 0,
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { user, supabase } = auth;

  const body = await request.json();
  const parsed = SyncPayloadSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const { items } = parsed.data;
  const results: { client_id: string; server_id: string; status: string }[] = [];

  for (const item of items) {
    try {
      let table: string;
      let insertData: Record<string, unknown>;

      switch (item.type) {
        case "evidence":
          table = "evidence";
          insertData = { ...item.payload, uploaded_by: user.id };
          break;
        case "attendance":
          table = "attendance_records";
          insertData = { ...item.payload, recorded_by: user.id };
          break;
        case "checklist":
          table = "checklist_responses";
          insertData = { ...item.payload, responded_by: user.id };
          break;
        case "inspection_update":
          table = "inspections";
          insertData = item.payload;
          break;
        default:
          continue;
      }

      const { data, error } = await supabase
        .from(table)
        .insert(insertData)
        .select("id")
        .single();

      if (error) throw error;

      results.push({ client_id: item.client_id, server_id: data.id, status: "synced" });
    } catch {
      results.push({ client_id: item.client_id, server_id: "", status: "failed" });

      await supabase.from("sync_queue").insert({
        user_id: user.id,
        type: item.type,
        payload: item.payload,
        status: "failed",
        client_id: item.client_id,
        error: "Sync failed",
      });
    }
  }

  const synced = results.filter((r) => r.status === "synced").length;
  const failed = results.filter((r) => r.status === "failed").length;

  return ok({
    synced,
    failed,
    results,
  }, `${synced} items synced, ${failed} failed`);
}
