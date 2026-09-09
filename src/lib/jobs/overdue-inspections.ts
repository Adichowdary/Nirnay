import { createClient } from "@/lib/db";

/**
 * Check for overdue inspections and create risk signals.
 */
export async function checkOverdueInspections() {
  const supabase = await createClient();

  const threshold = new Date();
  threshold.setDate(threshold.getDate() - 7);

  const { data: overdue } = await supabase
    .from("inspections")
    .select("id, project_id, assigned_to, created_at")
    .in("status", ["assigned", "in_progress"])
    .lt("created_at", threshold.toISOString());

  if (!overdue?.length) return { checked: 0, signals: 0 };

  let signals = 0;
  for (const inspection of overdue) {
    const { error } = await supabase.from("risk_signals").insert({
      project_id: inspection.project_id,
      inspection_id: inspection.id,
      signal_type: "INSPECTION_OVERDUE",
      severity: "high",
      title: `Inspection overdue for ${Math.floor((Date.now() - new Date(inspection.created_at).getTime()) / 86400000)} days`,
      description: `Inspection ${inspection.id} has not been completed within the expected timeframe.`,
    });

    if (!error) signals++;
  }

  return { checked: overdue.length, signals };
}
