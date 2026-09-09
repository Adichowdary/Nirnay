import { NextRequest } from "next/server";
import { requireAuth, ok, notFound, serverError } from "@/lib/auth/guard";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { supabase } = auth;
  const { id } = await params;

  const { data, error } = await supabase
    .from("inspections")
    .select(`
      *,
      projects(name, state, district, organization_id),
      facilities(name, latitude, longitude, geofence_radius),
      profiles:assigned_to(full_name, email, phone),
      profiles:assigned_by(full_name),
      evidence(id, type, file_name, sha256_hash, created_at),
      checklist_responses(id, checklist_id, question, answer, notes)
    `)
    .eq("id", id)
    .single();

  if (error || !data) return notFound("Inspection not found");

  return ok(data);
}
