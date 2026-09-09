import { createClient } from "@/lib/db";

/**
 * Check CCTV camera health and update status.
 */
export async function checkCCTVHealth() {
  const supabase = await createClient();

  const { data: cameras } = await supabase
    .from("cctv_sources")
    .select("id, facility_id, last_seen_at, status")
    .eq("is_active", true);

  if (!cameras?.length) return { checked: 0, offline: 0 };

  const now = Date.now();
  const OFFLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
  let offline = 0;

  for (const camera of cameras) {
    const lastSeen = camera.last_seen_at ? new Date(camera.last_seen_at).getTime() : 0;
    const isOffline = now - lastSeen > OFFLINE_THRESHOLD_MS;
    const newStatus = isOffline ? "OFFLINE" : "ONLINE";

    if (camera.status !== newStatus) {
      await supabase
        .from("cctv_sources")
        .update({ status: newStatus, last_health_check: new Date().toISOString() })
        .eq("id", camera.id);

      await supabase.from("cctv_health_events").insert({
        camera_id: camera.id,
        status: newStatus,
      });

      if (isOffline) {
        offline++;
        // Create risk signal for prolonged offline cameras
        const hoursOffline = Math.floor((now - lastSeen) / 3600000);
        if (hoursOffline >= 1) {
          await supabase.from("risk_signals").insert({
            project_id: camera.facility_id, // resolved via facility
            facility_id: camera.facility_id,
            signal_type: "CCTV_OFFLINE",
            severity: hoursOffline >= 24 ? "critical" : "high",
            title: `Camera offline for ${hoursOffline} hours`,
            description: `Camera ${camera.id} has been offline since ${new Date(lastSeen).toISOString()}`,
          });
        }
      }
    }
  }

  return { checked: cameras.length, offline };
}
