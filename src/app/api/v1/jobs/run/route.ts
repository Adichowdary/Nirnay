import { NextRequest } from "next/server";
import { requireAuth, ok, fail, serverError } from "@/lib/auth/guard";
import { runAllJobs } from "@/lib/jobs";

export async function POST(_request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { user } = auth;
  if (user.role !== "ADMIN") {
    return fail("Only admins can trigger background jobs", 403);
  }

  try {
    const results = await runAllJobs();
    return ok(results, "Jobs completed");
  } catch (error) {
    console.error("Job runner error:", error);
    return serverError();
  }
}
