import { createClient } from "@/lib/db";

/**
 * Send pending notifications (placeholder for push notification integration).
 */
export async function sendPendingNotifications() {
  const supabase = await createClient();

  // In production, this would integrate with FCM/APNs
  // For now, just mark notifications as sent
  const { data: pending } = await supabase
    .from("notifications")
    .select("id")
    .is("read_at", null)
    .limit(100);

  return { pending: pending?.length ?? 0, sent: 0 };
}

/**
 * Process offline sync queue.
 */
export async function processSyncQueue() {
  const supabase = await createClient();

  const { data: pending } = await supabase
    .from("sync_operations")
    .select("id, operation, table_name, payload, user_id, retry_count")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(50);

  if (!pending?.length) return { processed: 0, failed: 0 };

  let processed = 0;
  let failed = 0;

  for (const op of pending) {
    try {
      // Process based on operation type
      const { error } = await supabase.from(op.table_name).upsert(op.payload, { onConflict: "id" });

      if (error) {
        await supabase
          .from("sync_operations")
          .update({ status: "failed", error_message: error.message, retry_count: op.retry_count + 1 })
          .eq("id", op.id);
        failed++;
      } else {
        await supabase
          .from("sync_operations")
          .update({ status: "synced", synced_at: new Date().toISOString() })
          .eq("id", op.id);
        processed++;
      }
    } catch {
      failed++;
    }
  }

  return { processed, failed };
}

/**
 * Check compliance expiry.
 */
export async function checkComplianceExpiry() {
  const supabase = await createClient();

  const now = new Date().toISOString();

  const { data: expired } = await supabase
    .from("compliance_records")
    .select("id, project_id, requirement_id")
    .eq("status", "COMPLIANT")
    .lt("expires_at", now);

  if (!expired?.length) return { expired: 0 };

  for (const record of expired) {
    await supabase
      .from("compliance_records")
      .update({ status: "EXPIRED" })
      .eq("id", record.id);

    await supabase.from("risk_signals").insert({
      project_id: record.project_id,
      signal_type: "COMPLIANCE_FAILURE",
      severity: "critical",
      title: "Compliance certificate expired",
      description: `Compliance record ${record.id} has expired.`,
    });
  }

  return { expired: expired.length };
}

/**
 * Cleanup temporary files older than 7 days.
 */
export async function cleanupTemporaryFiles() {
  const supabase = await createClient();

  const threshold = new Date();
  threshold.setDate(threshold.getDate() - 7);

  const { data: expired } = await supabase
    .from("cctv_stream_sessions")
    .select("id")
    .lt("expires_at", threshold.toISOString());

  if (expired?.length) {
    await supabase
      .from("cctv_stream_sessions")
      .delete()
      .lt("expires_at", threshold.toISOString());
  }

  return { cleaned: expired?.length ?? 0 };
}
