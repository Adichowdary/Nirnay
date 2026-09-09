// ─── Role IDs — stable constants, never trust client-supplied values ──────────

export const ROLES = {
  CENTRAL_ADMIN:      "CENTRAL_ADMIN",
  STATE_ADMIN:        "STATE_ADMIN",
  AUDIT_SQUAD:        "AUDIT_SQUAD",
  AGENCY_PORTAL:      "AGENCY_PORTAL",
  INSPECTION_OFFICER: "INSPECTION_OFFICER",
  NGO_INSTITUTE:      "NGO_INSTITUTE",
  PROJECT_ADMIN:      "PROJECT_ADMIN",
  PMU_USER:           "PMU_USER",
  STAFF:              "STAFF",
  BENEFICIARY:        "BENEFICIARY",
  NORMAL_USER:        "NORMAL_USER",
  ADMIN:              "ADMIN",
  // Legacy aliases
  DOSJE_OFFICIAL:     "CENTRAL_ADMIN",
} as const;

export type RoleId =
  | "CENTRAL_ADMIN"
  | "STATE_ADMIN"
  | "AUDIT_SQUAD"
  | "AGENCY_PORTAL"
  | "INSPECTION_OFFICER"
  | "NGO_INSTITUTE"
  | "PROJECT_ADMIN"
  | "PMU_USER"
  | "STAFF"
  | "BENEFICIARY"
  | "NORMAL_USER"
  | "ADMIN"
  | "DOSJE_OFFICIAL";

// ─── Role metadata for UI display ─────────────────────────────────────────────

export const ROLE_META: Record<string, {
  label: string;
  workspace: string;
  description: string;
  home: string;
  color: string;
  badgeBg: string;
  initials: string;
}> = {
  CENTRAL_ADMIN: {
    label: "Central Command Directorate",
    workspace: "National Command Center",
    description: "Nationwide monitoring, state admin management, GIS grid, SLA escalation review & policies",
    home: "/dashboard",
    color: "#E11D48",
    badgeBg: "rgba(225, 29, 72, 0.12)",
    initials: "CC",
  },
  DOSJE_OFFICIAL: {
    label: "Central Command Directorate",
    workspace: "National Command Center",
    description: "Nationwide monitoring, state admin management, GIS grid, SLA escalation review & policies",
    home: "/dashboard",
    color: "#E11D48",
    badgeBg: "rgba(225, 29, 72, 0.12)",
    initials: "CC",
  },
  STATE_ADMIN: {
    label: "State Administrative Authority",
    workspace: "State Command & Operations",
    description: "Manage state-wide projects, districts, field squads, issue assignment & SLA resolution",
    home: "/dashboard/regional",
    color: "#2563EB",
    badgeBg: "rgba(37, 99, 235, 0.12)",
    initials: "SA",
  },
  AUDIT_SQUAD: {
    label: "Audit Squad",
    workspace: "Field Audit & Squad Workspace",
    description: "Receive surprise audit tasks, capture multi-media evidence (photo/video/audio/docs), submit reports",
    home: "/dashboard/audit-squad",
    color: "#059669",
    badgeBg: "rgba(5, 150, 105, 0.12)",
    initials: "AS",
  },
  INSPECTION_OFFICER: {
    label: "Audit Squad",
    workspace: "Inspector Field Workspace",
    description: "Receive unannounced assignments, 2D map GPS geofence lock, conduct 10-point audits",
    home: "/dashboard/inspector",
    color: "#059669",
    badgeBg: "rgba(5, 150, 105, 0.12)",
    initials: "AS",
  },
  AGENCY_PORTAL: {
    label: "Agency Portal",
    workspace: "Agency & Institute Workspace",
    description: "Receive audit requests, respond with explanation & multi-media evidence, submit corrective actions",
    home: "/dashboard/agency",
    color: "#D97706",
    badgeBg: "rgba(217, 119, 6, 0.12)",
    initials: "AP",
  },
  NGO_INSTITUTE: {
    label: "Agency Portal",
    workspace: "Organization & Agency Portal",
    description: "Institutional profile, respond to verification notices, submit daily attendance & evidence",
    home: "/dashboard/agency",
    color: "#D97706",
    badgeBg: "rgba(217, 119, 6, 0.12)",
    initials: "AP",
  },
  PROJECT_ADMIN: {
    label: "Agency Portal",
    workspace: "Organization & Agency Portal",
    description: "Institutional profile, respond to verification notices, submit daily attendance & evidence",
    home: "/dashboard/agency",
    color: "#D97706",
    badgeBg: "rgba(217, 119, 6, 0.12)",
    initials: "AP",
  },
  ADMIN: {
    label: "System Admin",
    workspace: "Platform Administration",
    description: "User directory, state admins registry, live FRS telemetry verification log & system audit",
    home: "/dashboard/admin",
    color: "#7C3AED",
    badgeBg: "rgba(124, 58, 237, 0.12)",
    initials: "AD",
  },
};

// ─── STRICT Role-Based Navigation Filtering ────────────────────────────────────
// Absolute isolation: Each user only sees their own authorized operational functions!

export const ROLE_NAV: Record<string, string[]> = {
  // 1. Central Admin / DoSJE Directorate
  CENTRAL_ADMIN: [
    "/dashboard",
    "/dashboard/ghost-detection",
    "/dashboard/grievances",
    "/dashboard/database",
    "/dashboard/scenario",
    "/dashboard/admin",
    "/dashboard/admin/issues",
    "/dashboard/monitor",
    "/dashboard/ai-signals",
    "/dashboard/projects",
    "/dashboard/map",
    "/dashboard/video-verification",
    "/dashboard/inspections",
    "/dashboard/reports",
    "/dashboard/audit",
  ],
  DOSJE_OFFICIAL: [
    "/dashboard",
    "/dashboard/ghost-detection",
    "/dashboard/grievances",
    "/dashboard/database",
    "/dashboard/scenario",
    "/dashboard/admin",
    "/dashboard/admin/issues",
    "/dashboard/monitor",
    "/dashboard/ai-signals",
    "/dashboard/projects",
    "/dashboard/map",
    "/dashboard/video-verification",
    "/dashboard/inspections",
    "/dashboard/reports",
    "/dashboard/audit",
  ],

  // 2. State Admin
  STATE_ADMIN: [
    "/dashboard/regional",
    "/dashboard/ghost-detection",
    "/dashboard/grievances",
    "/dashboard/database",
    "/dashboard/scenario",
    "/dashboard/admin/issues",
    "/dashboard/projects",
    "/dashboard/inspections",
    "/dashboard/map",
    "/dashboard/reports",
  ],

  // 3. Audit Squad / PMU Officer
  AUDIT_SQUAD: [
    "/dashboard/audit-squad",
    "/dashboard/database",
    "/dashboard/inspector",
    "/dashboard/scenario",
    "/dashboard/inspections",
    "/dashboard/evidence",
    "/dashboard/map",
  ],
  INSPECTION_OFFICER: [
    "/dashboard/audit-squad",
    "/dashboard/database",
    "/dashboard/inspector",
    "/dashboard/scenario",
    "/dashboard/inspections",
    "/dashboard/evidence",
    "/dashboard/map",
  ],

  // 4. Agency Portal / NGO / Institute / Project Admin
  AGENCY_PORTAL: [
    "/dashboard/agency",
    "/dashboard/database",
    "/dashboard/organization",
    "/dashboard/evidence",
  ],
  NGO_INSTITUTE: [
    "/dashboard/agency",
    "/dashboard/database",
    "/dashboard/organization",
    "/dashboard/evidence",
  ],
  PROJECT_ADMIN: [
    "/dashboard/agency",
    "/dashboard/database",
    "/dashboard/organization",
    "/dashboard/evidence",
  ],

  // 5. System Administrator
  ADMIN: [
    "/dashboard/admin",
    "/dashboard/database",
    "/dashboard/scenario",
    "/dashboard/admin/issues",
    "/dashboard/admin/verification-log",
    "/dashboard/settings",
    "/dashboard/audit",
  ],
};
