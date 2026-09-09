import { createClient } from "@/lib/db";
import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export function zodError(error: ZodError): NextResponse {
  return fail(error.issues[0].message);
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export function ok<T>(data: T, message?: string): NextResponse {
  const body: ApiResponse<T> = { success: true, data, ...(message ? { message } : {}) };
  return NextResponse.json(body, { status: 200 });
}

export function created<T>(data: T, message?: string): NextResponse {
  const body: ApiResponse<T> = { success: true, data, ...(message ? { message } : {}) };
  return NextResponse.json(body, { status: 201 });
}

export function fail(error: string, status = 400): NextResponse {
  const body: ApiResponse = { success: false, error };
  return NextResponse.json(body, { status });
}

export function unauthorized(error = "Authentication required"): NextResponse {
  return fail(error, 401);
}

export function forbidden(error = "Insufficient permissions"): NextResponse {
  return fail(error, 403);
}

export function notFound(error = "Resource not found"): NextResponse {
  return fail(error, 404);
}

export function serverError(error = "Internal server error"): NextResponse {
  return fail(error, 500);
}

/**
 * Require authenticated user. Returns AuthUser or sends 401.
 */
export async function requireAuth(): Promise<
  { user: AuthUser; supabase: Awaited<ReturnType<typeof createClient>> } | { error: NextResponse }
> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: unauthorized() };
  }

  // Get role from user_roles
  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role_id")
    .eq("user_id", user.id)
    .single();

  const role = roleRow?.role_id ?? "UNKNOWN";

  // Get permissions from role_permissions
  const { data: permRows } = await supabase
    .from("role_permissions")
    .select("permission_id")
    .eq("role_id", role);

  const permissions = permRows?.map((r) => r.permission_id) ?? [];

  return {
    user: { id: user.id, email: user.email ?? "", role, permissions },
    supabase,
  };
}

/**
 * Check if user has a specific permission.
 */
export function hasPermission(user: AuthUser, permission: string): boolean {
  return user.permissions.includes(permission);
}

/**
 * Check if user has one of the specified roles.
 */
export function hasRole(user: AuthUser, ...roles: string[]): boolean {
  return roles.includes(user.role);
}

/**
 * Require specific permission. Returns 403 if missing.
 */
export function requirePermission(
  user: AuthUser,
  permission: string
): NextResponse | null {
  if (!hasPermission(user, permission)) {
    return forbidden(`Missing permission: ${permission}`);
  }
  return null;
}

/**
 * Require specific role. Returns 403 if missing.
 */
export function requireRole(
  user: AuthUser,
  ...roles: string[]
): NextResponse | null {
  if (!hasRole(user, ...roles)) {
    return forbidden(`Requires role: ${roles.join(" or ")}`);
  }
  return null;
}

/**
 * Create an audit log entry.
 */
export async function auditLog(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: {
    actor_id: string;
    actor_name?: string;
    action: string;
    resource: string;
    resource_id?: string;
    project_id?: string;
    metadata?: Record<string, unknown>;
    ip_address?: string;
    user_agent?: string;
  }
): Promise<void> {
  await supabase.from("audit_logs").insert({
    actor_id: params.actor_id,
    actor_name: params.actor_name ?? "System",
    action: params.action,
    resource: params.resource,
    resource_id: params.resource_id ?? null,
    project_id: params.project_id ?? null,
    metadata: params.metadata ?? {},
    ip_address: params.ip_address ?? null,
    user_agent: params.user_agent ?? null,
  });
}

/**
 * Create a notification.
 */
export async function createNotification(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: {
    user_id: string;
    type: string;
    title: string;
    body?: string;
    data?: Record<string, unknown>;
  }
): Promise<void> {
  await supabase.from("notifications").insert({
    user_id: params.user_id,
    type: params.type,
    title: params.title,
    body: params.body ?? null,
    data: params.data ?? {},
  });
}

/**
 * Validate inspection state transition.
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["ACKNOWLEDGED", "CANCELLED"],
  ACKNOWLEDGED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["ARRIVED", "PAUSED"],
  PAUSED: ["IN_PROGRESS"],
  ARRIVED: ["SUBMITTED", "CANCELLED"],
  SUBMITTED: ["UNDER_REVIEW", "RETURNED"],
  UNDER_REVIEW: ["APPROVED", "REJECTED", "RETURNED"],
  RETURNED: ["IN_PROGRESS"],
  APPROVED: ["CLOSED"],
  REJECTED: ["CLOSED", "IN_PROGRESS"],
  CLOSED: [],
  CANCELLED: [],
};

export function validateInspectionTransition(
  currentStatus: string,
  newStatus: string
): boolean {
  const allowed = VALID_TRANSITIONS[currentStatus];
  if (!allowed) return false;
  return allowed.includes(newStatus);
}
