import { NextRequest, NextResponse } from "next/server";
import { requireAuth, fail, unauthorized } from "@/lib/auth/guard";

export interface AdminAuthResult {
  authorized: boolean;
  role?: string;
  name?: string;
  errorResponse?: NextResponse;
}

export const DEFAULT_ADMIN_ROLES = [
  "CENTRAL_ADMIN",
  "STATE_ADMIN",
  "ADMIN",
  "INSPECTION_OFFICER",
  "AUDIT_SQUAD",
  "DOSJE_OFFICIAL",
];

export const APEX_ADMIN_ROLES = [
  "CENTRAL_ADMIN",
  "ADMIN",
  "DOSJE_OFFICIAL",
];

/**
 * Validates that an incoming API request is authenticated and has an authorized role.
 * Respects active session tokens and demo mode cookies with timeout protection.
 */
export async function verifyAdminRequest(
  request: NextRequest,
  allowedRoles: string[] = DEFAULT_ADMIN_ROLES
): Promise<AdminAuthResult> {
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const demoRole = isDemo ? request.cookies.get("insight_demo_role")?.value : undefined;

  // 1. If demo mode is active and demo role cookie is present
  if (isDemo && demoRole) {
    if (allowedRoles.includes(demoRole)) {
      return { authorized: true, role: demoRole, name: "Authorized Demo Official" };
    }
    return {
      authorized: false,
      errorResponse: fail(`Access denied: Requires role ${allowedRoles.join(" or ")}`, 403),
    };
  }

  // If in demo mode and no demo role cookie is provided, require authentication
  if (isDemo && !demoRole) {
    return { authorized: false, errorResponse: unauthorized("Authentication required") };
  }

  // 2. Check Supabase session with timeout race
  try {
    const authPromise = requireAuth();
    const timeoutPromise = new Promise<{ error: NextResponse }>((resolve) =>
      setTimeout(() => resolve({ error: unauthorized("Session verification timed out") }), 800)
    );
    const auth = await Promise.race([authPromise, timeoutPromise]);

    if ("error" in auth) {
      return { authorized: false, errorResponse: auth.error };
    }

    if (!allowedRoles.includes(auth.user.role)) {
      return {
        authorized: false,
        errorResponse: fail(`Access denied: Requires role ${allowedRoles.join(" or ")}`, 403),
      };
    }

    return { authorized: true, role: auth.user.role, name: auth.user.email };
  } catch {
    return { authorized: false, errorResponse: unauthorized() };
  }
}
