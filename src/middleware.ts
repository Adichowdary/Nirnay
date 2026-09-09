import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

// ─── Role → workspace mapping (2-Level Admin Architecture) ───────────────────
const ROLE_HOME: Record<string, string> = {
  CENTRAL_ADMIN:      "/dashboard",
  DOSJE_OFFICIAL:     "/dashboard",
  STATE_ADMIN:        "/dashboard/regional",
  INSPECTION_OFFICER: "/dashboard/inspector",
  NGO_INSTITUTE:      "/dashboard/organization",
  PROJECT_ADMIN:      "/dashboard/organization",
  ADMIN:              "/dashboard/admin",
};

// Routes that are open to anyone (unauthenticated OK)
const PUBLIC_PATHS = ["/", "/login", "/auth", "/consent"];

// Strict route prefixes that belong exclusively to a specific role
const ROLE_PREFIXES: Record<string, string[]> = {
  "/dashboard/admin":        ["ADMIN", "CENTRAL_ADMIN", "DOSJE_OFFICIAL"],
  "/dashboard/inspector":    ["INSPECTION_OFFICER"],
  "/dashboard/organization": ["NGO_INSTITUTE", "PROJECT_ADMIN"],
  "/dashboard/regional":     ["STATE_ADMIN"],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static/internal Next.js paths
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(ico|png|svg|jpg|jpeg|webp|woff2?)$/)
  ) {
    return NextResponse.next();
  }

  // Create Supabase client and get response with refreshed session cookie
  const { supabase, supabaseResponse } = createClient(request);

  // Check demo mode cookie fallback — ONLY active when NEXT_PUBLIC_DEMO_MODE=true
  // In production this env var must be unset or false, making the cookie harmless
  const isDemoModeEnabled = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const demoRoleCookie = isDemoModeEnabled
    ? request.cookies.get("insight_demo_role")?.value
    : undefined;
  const isDemoActive = Boolean(demoRoleCookie);

  // Fast user session resolution with 500ms timeout race to prevent hanging
  let user = null;
  if (!isDemoActive) {
    try {
      const userPromise = supabase.auth.getUser();
      const timeoutPromise = new Promise<{ data: { user: null } }>((resolve) =>
        setTimeout(() => resolve({ data: { user: null } }), 600)
      );
      const res = await Promise.race([userPromise, timeoutPromise]);
      user = res.data?.user ?? null;
    } catch {
      user = null;
    }
  }

  // ── 1. Unauthenticated user hitting a protected route ─────────────────────
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (!user && !isDemoActive && !isPublic && pathname.startsWith("/dashboard")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── 2. Authenticated / Demo user hitting /login or root → route to their workspace ─
  let resolvedRole = demoRoleCookie || "CENTRAL_ADMIN";
  if (user) {
    try {
      const rolePromise = supabase
        .from("user_roles")
        .select("role_id")
        .eq("user_id", user.id)
        .single();
      const timeoutPromise = new Promise<{ data: null }>((resolve) =>
        setTimeout(() => resolve({ data: null }), 600)
      );
      const roleRes = (await Promise.race([rolePromise, timeoutPromise])) as { data: { role_id?: string } | null };
      if (roleRes.data?.role_id) resolvedRole = roleRes.data.role_id;
    } catch {
      // Use fallback
    }
  }

  if ((user || isDemoActive) && (pathname === "/login" || pathname === "/")) {
    const home = ROLE_HOME[resolvedRole] ?? "/dashboard";
    return NextResponse.redirect(new URL(home, request.url));
  }

  // ── 3. Role Containment: Block unauthorized cross-role route visits ──────
  if ((user || isDemoActive) && pathname.startsWith("/dashboard")) {
    for (const [prefix, allowedRoles] of Object.entries(ROLE_PREFIXES)) {
      if (pathname.startsWith(prefix) && !allowedRoles.includes(resolvedRole)) {
        const home = ROLE_HOME[resolvedRole] ?? "/dashboard";
        return NextResponse.redirect(new URL(home, request.url));
      }
    }

    // If an NGO or Inspector tries to access root Command Center `/dashboard`, redirect to their home
    if (pathname === "/dashboard" && resolvedRole !== "CENTRAL_ADMIN" && resolvedRole !== "DOSJE_OFFICIAL") {
      const home = ROLE_HOME[resolvedRole];
      if (home && home !== "/dashboard") {
        return NextResponse.redirect(new URL(home, request.url));
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
