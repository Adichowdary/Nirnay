import { createClient } from "@/lib/db";

/**
 * Evaluate risk rules for all active projects.
 */
export async function calculateRiskSignals() {
  const supabase = await createClient();

  const { data: rules } = await supabase
    .from("risk_rules")
    .select("*")
    .eq("is_active", true);

  const { data: projects } = await supabase
    .from("projects")
    .select("id")
    .eq("status", "active");

  if (!rules?.length || !projects?.length) return { evaluated: 0, signals: 0 };

  let signals = 0;

  for (const project of projects) {
    for (const rule of rules) {
      let triggered = false;

      switch (rule.rule_type) {
        case "CCTV_OFFLINE": {
          const { data: cameras } = await supabase
            .from("cctv_sources")
            .select("id")
            .eq("status", "OFFLINE");
          triggered = (cameras?.length ?? 0) > 0;
          break;
        }
        case "INSPECTION_OVERDUE": {
          const daysThreshold = (rule.condition_config as Record<string, number>)?.days_threshold ?? 7;
          const threshold = new Date();
          threshold.setDate(threshold.getDate() - daysThreshold);
          const { data: overdue } = await supabase
            .from("inspections")
            .select("id")
            .eq("project_id", project.id)
            .in("status", ["assigned", "in_progress"])
            .lt("created_at", threshold.toISOString());
          triggered = (overdue?.length ?? 0) > 0;
          break;
        }
        case "COMPLIANCE_FAILURE": {
          const { data: expired } = await supabase
            .from("compliance_records")
            .select("id")
            .eq("project_id", project.id)
            .eq("status", "EXPIRED");
          triggered = (expired?.length ?? 0) > 0;
          break;
        }
        default:
          break;
      }

      if (triggered) {
        const { error } = await supabase.from("risk_signals").insert({
          project_id: project.id,
          rule_id: rule.id,
          signal_type: rule.rule_type,
          severity: rule.severity,
          title: `${rule.name} — triggered for project`,
          description: `Rule "${rule.name}" was triggered by the risk engine.`,
        });
        if (!error) signals++;
      }
    }
  }

  return { evaluated: projects.length * rules.length, signals };
}
