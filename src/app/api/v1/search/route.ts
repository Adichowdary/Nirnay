import { NextRequest } from "next/server";
import { requireAuth, ok, serverError, zodError } from "@/lib/auth/guard";
import { SearchQuery } from "@/lib/validation/common";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { supabase } = auth;
  const url = new URL(request.url);

  const parsed = SearchQuery.safeParse({ q: url.searchParams.get("q") });
  if (!parsed.success) return zodError(parsed.error);

  const { q } = parsed.data;
  const limit = parseInt(url.searchParams.get("limit") ?? "10");

  const [projectsResult, inspectionsResult, organizationsResult] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, status, state, district, organization_id")
      .or(`name.ilike.%${q}%,district.ilike.%${q}%`)
      .limit(limit),
    supabase
      .from("inspections")
      .select("id, status, inspection_type, project_id")
      .or(`notes.ilike.%${q}%`)
      .limit(limit),
    supabase
      .from("organizations")
      .select("id, name, type, state, district")
      .or(`name.ilike.%${q}%,registration_number.ilike.%${q}%`)
      .limit(limit),
  ]);

  if (projectsResult.error) return serverError(projectsResult.error.message);
  if (inspectionsResult.error) return serverError(inspectionsResult.error.message);
  if (organizationsResult.error) return serverError(organizationsResult.error.message);

  return ok({
    projects: projectsResult.data ?? [],
    inspections: inspectionsResult.data ?? [],
    organizations: organizationsResult.data ?? [],
    total: (projectsResult.data?.length ?? 0) + (inspectionsResult.data?.length ?? 0) + (organizationsResult.data?.length ?? 0),
  });
}
