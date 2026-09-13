import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

// ─── Role → workspace mapping (2-Level Admin Architecture) ───────────────────
const ROLE_HOME: Record<string, string> = {
  CENTRAL_ADMIN:      "/dashboard",
  DOSJE_OFFICIAL:     "/dashboard",
  STATE_ADMIN:        "/dashboard/regional",
  AUDIT_SQUAD:        "/dashboard/audit-squad",
  INSPECTION_OFFICER: "/dashboard/inspector",
  AGENCY_PORTAL:      "/dashboard/agency",
  NGO_INSTITUTE:      "/dashboard/agency",
  PROJECT_ADMIN:      "/dashboard/agency",
  ADMIN:              "/dashboard/admin",
  NORMAL_USER:        "/consent",
  BENEFICIARY:        "/consent",
};

// Routes that are open to anyone (unauthenticated OK)
const PUBLIC_PATHS = ["/login", "/auth", "/consent"];

// Strict route prefixes that belong exclusively to specific roles (ordered specific to general)
const ROLE_PREFIX_RULES: { prefix: string; allowedRoles: string[] }[] = [
  // SLA Issues & Escalations registry accessible to State Admin & Central Directorate & SysAdmin
  {
    prefix: "/dashboard/admin/issues",
    allowedRoles: ["ADMIN", "CENTRAL_ADMIN", "DOSJE_OFFICIAL", "STATE_ADMIN"],
  },
  // Platform administration
  {
    prefix: "/dashboard/admin",
    allowedRoles: ["ADMIN", "CENTRAL_ADMIN", "DOSJE_OFFICIAL"],
  },
  // Field audit & inspector missions
  {
    prefix: "/dashboard/inspector",
    allowedRoles: ["INSPECTION_OFFICER", "AUDIT_SQUAD", "ADMIN", "CENTRAL_ADMIN", "DOSJE_OFFICIAL"],
  },
  {
    prefix: "/dashboard/audit-squad",
    allowedRoles: ["INSPECTION_OFFICER", "AUDIT_SQUAD", "ADMIN", "CENTRAL_ADMIN", "DOSJE_OFFICIAL"],
  },
  // Agency & Grantee Institution portal
  {
    prefix: "/dashboard/organization",
    allowedRoles: ["NGO_INSTITUTE", "PROJECT_ADMIN", "AGENCY_PORTAL", "ADMIN", "CENTRAL_ADMIN", "DOSJE_OFFICIAL"],
  },
  {
    prefix: "/dashboard/agency",
    allowedRoles: ["NGO_INSTITUTE", "PROJECT_ADMIN", "AGENCY_PORTAL", "ADMIN", "CENTRAL_ADMIN", "DOSJE_OFFICIAL"],
  },
  // State administration
  {
    prefix: "/dashboard/regional",
    allowedRoles: ["STATE_ADMIN", "ADMIN", "CENTRAL_ADMIN", "DOSJE_OFFICIAL"],
  },
];

function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-DNS-Prefetch-Control", "off");
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(self), microphone=(self), geolocation=(self), display-capture=(self)"
  );
  if (process.env.NODE_ENV === "production") {
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }
  return res;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static/internal Next.js paths
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(ico|png|svg|jpg|jpeg|webp|woff2?)$/)
  ) {
    return applySecurityHeaders(NextResponse.next());
  }

  // Create Supabase client and get response with refreshed session cookie
  const { supabase, supabaseResponse } = createClient(request);

  // Check demo mode cookie fallback — ONLY active when NEXT_PUBLIC_DEMO_MODE=true
  const isDemoModeEnabled = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  let demoRoleCookie = isDemoModeEnabled
    ? request.cookies.get("insight_demo_role")?.value
    : undefined;

  // If user is explicitly visiting /login or has signout flag:
  // NEVER redirect away from /login, and delete the demo role cookie to ensure clean sign-out
  if (pathname === "/login") {
    if (request.nextUrl.searchParams.get("signout") === "true" || !demoRoleCookie) {
      supabaseResponse.cookies.set("insight_demo_role", "", {
        path: "/",
        expires: new Date(0),
      });
    }
    return applySecurityHeaders(supabaseResponse);
  }

  // In demo mode: If visiting protected routes (e.g. /dashboard) without a role cookie, auto-default to CENTRAL_ADMIN
  if (isDemoModeEnabled && !demoRoleCookie && pathname.startsWith("/dashboard")) {
    demoRoleCookie = "CENTRAL_ADMIN";
    supabaseResponse.cookies.set("insight_demo_role", "CENTRAL_ADMIN", {
      path: "/",
      maxAge: 86400,
      sameSite: "lax",
    });
  }
  const isDemoActive = Boolean(demoRoleCookie);

  // Fast user session resolution with 200ms timeout race to prevent hanging
  let user = null;
  if (!isDemoActive) {
    try {
      const userPromise = supabase.auth.getUser();
      const timeoutPromise = new Promise<{ data: { user: null } }>((resolve) =>
        setTimeout(() => resolve({ data: { user: null } }), 200)
      );
      const res = await Promise.race([userPromise, timeoutPromise]);
      user = res.data?.user ?? null;
    } catch {
      user = null;
    }
  }

  // ── 1. Unauthenticated user hitting protected routes ─────────────────────
  // 1a. Intercept unauthenticated visits to administrative API routes
  if (!user && !isDemoActive && pathname.startsWith("/api/v1/admin")) {
    return applySecurityHeaders(
      NextResponse.json(
        { success: false, error: "Authentication required for administrative operations" },
        { status: 401 }
      )
    );
  }

  // 1b. Intercept unauthenticated visits to dashboard pages
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (!user && !isDemoActive && !isPublic && pathname.startsWith("/dashboard")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return applySecurityHeaders(NextResponse.redirect(loginUrl));
  }

  // ── 2. Authenticated / Demo user hitting root (/) → route to their workspace ─
  let resolvedRole = isDemoActive && demoRoleCookie ? demoRoleCookie : "NORMAL_USER";
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
      if (roleRes.data?.role_id) {
        resolvedRole = roleRes.data.role_id;
      } else {
        resolvedRole = "NORMAL_USER";
      }
    } catch {
      resolvedRole = "NORMAL_USER";
    }
  }

  if (pathname === "/") {
    if (user || isDemoActive) {
      const home = ROLE_HOME[resolvedRole] ?? "/dashboard";
      return applySecurityHeaders(NextResponse.redirect(new URL(home, request.url)));
    } else {
      return applySecurityHeaders(NextResponse.redirect(new URL("/login", request.url)));
    }
  }

  // ── 3. Role Containment: Block unauthorized cross-role route visits ──────
  if ((user || isDemoActive) && pathname.startsWith("/dashboard")) {
    for (const rule of ROLE_PREFIX_RULES) {
      if (pathname.startsWith(rule.prefix)) {
        if (!rule.allowedRoles.includes(resolvedRole)) {
          const home = ROLE_HOME[resolvedRole] ?? "/dashboard";
          return applySecurityHeaders(NextResponse.redirect(new URL(home, request.url)));
        }
        break; // Matched the most specific prefix rule, stop checking broader rules
      }
    }

    // If an NGO, Inspector, or State Admin tries to access root Command Center `/dashboard`, redirect to their home
    if (pathname === "/dashboard" && resolvedRole !== "CENTRAL_ADMIN" && resolvedRole !== "DOSJE_OFFICIAL" && resolvedRole !== "ADMIN") {
      const home = ROLE_HOME[resolvedRole];
      if (home && home !== "/dashboard") {
        return applySecurityHeaders(NextResponse.redirect(new URL(home, request.url)));
      }
    }
  }

  return applySecurityHeaders(supabaseResponse);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
