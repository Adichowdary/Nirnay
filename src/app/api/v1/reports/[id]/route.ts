import { NextRequest } from "next/server";
import { requireAuth, ok, notFound, fail, serverError, zodError } from "@/lib/auth/guard";
import { z } from "zod";

const UpdateReportSchema = z.object({
  title: z.string().min(2).max(500).optional(),
  summary: z.string().optional(),
  findings: z.string().optional(),
  recommendations: z.string().optional(),
  compliance_status: z.enum(["compliant", "non_compliant", "partial_compliance"]).optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { supabase } = auth;
  const { id } = await params;

  const { data, error } = await supabase
    .from("reports")
    .select(`
      *,
      projects(name, state, district),
      inspections(id, inspection_type, status),
      profiles:created_by(full_name),
      profiles:reviewed_by(full_name)
    `)
    .eq("id", id)
    .single();

  if (error || !data) return notFound("Report not found");

  return ok(data);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { user, supabase } = auth;
  const { id } = await params;

  const body = await request.json();
  const parsed = UpdateReportSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const { data: existing } = await supabase
    .from("reports")
    .select("id, status")
    .eq("id", id)
    .single();

  if (!existing) return notFound("Report not found");
  if (existing.status === "APPROVED") return fail("Cannot edit an approved report");

  const { error } = await supabase
    .from("reports")
    .update({ ...parsed.data, updated_by: user.id })
    .eq("id", id);

  if (error) return serverError(error.message);

  const { data: updated } = await supabase
    .from("reports")
    .select("*")
    .eq("id", id)
    .single();

  return ok(updated, "Report updated");
}
