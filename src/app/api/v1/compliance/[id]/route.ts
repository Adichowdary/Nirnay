import { NextRequest } from "next/server";
import { requireAuth, ok, notFound, fail, serverError, zodError } from "@/lib/auth/guard";
import { z } from "zod";

const UpdateComplianceSchema = z.object({
  status: z.enum(["pending", "in_progress", "compliant", "non_compliant", "overdue"]).optional(),
  notes: z.string().optional(),
  evidence_urls: z.array(z.string().url()).optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { supabase } = auth;
  const { id } = await params;

  const { data, error } = await supabase
    .from("compliance_records")
    .select("*, projects(name, state, district), profiles:created_by(full_name)")
    .eq("id", id)
    .single();

  if (error || !data) return notFound("Compliance record not found");

  return ok(data);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { supabase } = auth;
  const { id } = await params;

  const body = await request.json();
  const parsed = UpdateComplianceSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const { data: existing } = await supabase
    .from("compliance_records")
    .select("id")
    .eq("id", id)
    .single();

  if (!existing) return notFound("Compliance record not found");

  const updateData: Record<string, unknown> = {};
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;
  if (parsed.data.evidence_urls !== undefined) updateData.evidence_urls = parsed.data.evidence_urls;
  updateData.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from("compliance_records")
    .update(updateData)
    .eq("id", id);

  if (error) return serverError(error.message);

  const { data: updated } = await supabase
    .from("compliance_records")
    .select("*")
    .eq("id", id)
    .single();

  return ok(updated, "Compliance record updated");
}
