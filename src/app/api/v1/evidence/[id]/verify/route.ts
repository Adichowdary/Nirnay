import { NextRequest } from "next/server";
import { requireAuth, ok, fail, serverError, auditLog } from "@/lib/auth/guard";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { user, supabase } = auth;
  const { id } = await params;

  const { data: evidence, error: fetchError } = await supabase
    .from("evidence")
    .select("id, sha256_hash, inspection_id, project_id")
    .eq("id", id)
    .single();

  if (fetchError || !evidence) return fail("Evidence not found", 404);

  const isVerified = !!evidence.sha256_hash && evidence.sha256_hash.length === 64;

  const { error } = await supabase
    .from("evidence")
    .update({
      verification_status: isVerified ? "verified" : "failed",
      verified_at: new Date().toISOString(),
      verified_by: user.id,
    })
    .eq("id", id);

  if (error) return serverError(error.message);

  await auditLog(supabase, {
    actor_id: user.id,
    action: "EVIDENCE_VERIFIED",
    resource: "evidence",
    resource_id: id,
    project_id: evidence.project_id,
    metadata: { hash_valid: isVerified },
  });

  return ok({
    id,
    is_verified: isVerified,
    sha256_hash: evidence.sha256_hash,
    verification_status: isVerified ? "verified" : "failed",
  }, isVerified ? "Evidence hash verified" : "Evidence hash verification failed");
}
