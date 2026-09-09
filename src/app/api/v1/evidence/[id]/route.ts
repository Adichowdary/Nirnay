import { NextRequest } from "next/server";
import { requireAuth, ok, notFound } from "@/lib/auth/guard";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { supabase } = auth;
  const { id } = await params;

  const { data, error } = await supabase
    .from("evidence")
    .select(`
      *,
      inspections(id, status, project_id),
      profiles:uploaded_by(full_name, email)
    `)
    .eq("id", id)
    .single();

  if (error || !data) return notFound("Evidence not found");

  return ok(data);
}
