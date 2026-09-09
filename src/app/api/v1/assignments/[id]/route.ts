import { NextRequest } from "next/server";
import { requireAuth, ok, notFound, serverError } from "@/lib/auth/guard";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { supabase } = auth;
  const { id } = await params;

  const { data, error } = await supabase
    .from("inspection_assignments")
    .select(`
      *,
      inspections(id, status, inspection_type, priority, project_id),
      profiles:officer_id(full_name, email, phone),
      profiles:assigned_by(full_name)
    `)
    .eq("id", id)
    .single();

  if (error || !data) return notFound("Assignment not found");

  return ok(data);
}
