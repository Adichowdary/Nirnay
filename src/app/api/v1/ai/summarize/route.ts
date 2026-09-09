import { NextRequest } from "next/server";
import { requireAuth, ok, fail, zodError } from "@/lib/auth/guard";
import { z } from "zod";

const SummarizeSchema = z.object({
  inspection_id: z.string().uuid(),
  context: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { supabase } = auth;

  const body = await request.json();
  const parsed = SummarizeSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const { data: inspection, error: inspErr } = await supabase
    .from("inspections")
    .select(`
      id, status, inspection_type, priority, notes,
      projects(name, state, district),
      facilities(name),
      evidence(type, file_name),
      checklist_responses(question, answer, notes)
    `)
    .eq("id", parsed.data.inspection_id)
    .single();

  if (inspErr || !inspection) return fail("Inspection not found", 404);

  const checklistSummary = (inspection.checklist_responses ?? [])
    .map((cr: { question: string; answer: string; notes?: string }) =>
      `- ${cr.question}: ${cr.answer}${cr.notes ? ` (${cr.notes})` : ""}`
    )
    .join("\n");

  const evidenceSummary = (inspection.evidence ?? [])
    .map((e: { type: string; file_name?: string }) => `${e.type}: ${e.file_name ?? "unnamed"}`)
    .join(", ");

  const prompt = `Summarize this inspection report concisely:

Type: ${inspection.inspection_type}
Status: ${inspection.status}
Priority: ${inspection.priority}
Project: ${(inspection.projects as unknown as { name: string })?.name ?? "N/A"}
Location: ${(inspection.facilities as unknown as { name: string })?.name ?? "N/A"}

Checklist Responses:
${checklistSummary || "None"}

Evidence: ${evidenceSummary || "None"}

Officer Notes: ${inspection.notes || "None"}

Provide a brief, structured summary covering key findings, compliance status, and any issues detected.`;

  try {
    const ollamaUrl = process.env.OLLAMA_URL ?? "http://localhost:11434";
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL ?? "nirnay-ai",
        prompt,
        stream: false,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      return generateFallbackSummary(inspection);
    }

    const data = await response.json();
    return ok({
      summary: data.response ?? "No summary generated",
      model: "llama3.2",
      inspection_id: parsed.data.inspection_id,
    }, "Summary generated");
  } catch {
    return generateFallbackSummary(inspection);
  }
}

function generateFallbackSummary(inspection: Record<string, unknown>) {
  const evidenceCount = Array.isArray(inspection.evidence) ? inspection.evidence.length : 0;
  const checklistCount = Array.isArray(inspection.checklist_responses) ? inspection.checklist_responses.length : 0;
  const yesAnswers = Array.isArray(inspection.checklist_responses)
    ? inspection.checklist_responses.filter((r: { answer: string }) => r.answer === "yes").length
    : 0;

  const compliancePct = checklistCount > 0 ? Math.round((yesAnswers / checklistCount) * 100) : 0;

  const summary = [
    `Inspection Type: ${inspection.inspection_type}`,
    `Status: ${inspection.status}`,
    `Priority: ${inspection.priority}`,
    `Checklist: ${yesAnswers}/${checklistCount} items compliant (${compliancePct}%)`,
    `Evidence Collected: ${evidenceCount} items`,
    inspection.notes ? `Notes: ${inspection.notes}` : "",
  ].filter(Boolean).join(". ");

  return ok({
    summary,
    model: "rule-based-fallback",
    inspection_id: inspection.id,
  }, "Summary generated (fallback)");
}
