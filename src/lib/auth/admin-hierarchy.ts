// ─────────────────────────────────────────────────────────────
// INSIGHT — Two-Level Administrative Hierarchy & Jurisdiction RBAC/ABAC
// Central Admin (Nationwide Oversight) -> State Admin (State Operations) -> Users/Field Teams
// DISTRICT IS STRICTLY A GEOGRAPHIC/ORGANIZATIONAL SCOPE (NO DISTRICT ADMIN)
// ─────────────────────────────────────────────────────────────

export type AdminLevel = "CENTRAL_ADMIN" | "STATE_ADMIN";

export type JurisdictionType = "NATIONAL" | "STATE";

export interface JurisdictionScope {
  type: JurisdictionType;
  role: string;
  stateId?: string | null;
  stateName?: string | null;
  districtId?: string | null; // Purely operational scope for field teams
  districtName?: string | null;
}

export interface AdminUserPermissions {
  // Central Admin Permissions
  canManageStates: boolean;
  canCreateStateAdmins: boolean;
  canAssignStateAdmins: boolean;
  canDeactivateStateAdmins: boolean;
  canViewNationwideAnalytics: boolean;
  canConfigureSLA: boolean;
  canReviewEscalations: boolean;
  canManagePolicies: boolean;

  // State Admin Permissions
  canManageStateUsers: boolean;
  canAssignInspections: boolean;
  canAssignIssues: boolean;
  canResolveIssues: boolean;
  canEscalateIssues: boolean;
  canViewStateReports: boolean;
  canFilterDistricts: boolean;

  // Common Permissions
  canViewAuditLogs: boolean;
  canExportReports: boolean;
}

export const ADMIN_LEVEL_PERMISSIONS: Record<AdminLevel, AdminUserPermissions> = {
  CENTRAL_ADMIN: {
    canManageStates: true,
    canCreateStateAdmins: true,
    canAssignStateAdmins: true,
    canDeactivateStateAdmins: true,
    canViewNationwideAnalytics: true,
    canConfigureSLA: true,
    canReviewEscalations: true,
    canManagePolicies: true,

    canManageStateUsers: true,
    canAssignInspections: true,
    canAssignIssues: true,
    canResolveIssues: true,
    canEscalateIssues: true,
    canViewStateReports: true,
    canFilterDistricts: true,

    canViewAuditLogs: true,
    canExportReports: true,
  },
  STATE_ADMIN: {
    canManageStates: false,
    canCreateStateAdmins: false,
    canAssignStateAdmins: false,
    canDeactivateStateAdmins: false,
    canViewNationwideAnalytics: false,
    canConfigureSLA: false,
    canReviewEscalations: false,
    canManagePolicies: false,

    canManageStateUsers: true,
    canAssignInspections: true,
    canAssignIssues: true,
    canResolveIssues: true,
    canEscalateIssues: true,
    canViewStateReports: true,
    canFilterDistricts: true,

    canViewAuditLogs: true,
    canExportReports: true,
  },
};

export interface StateDefinition {
  id: string;
  name: string;
  code: string;
  capital: string;
  districts: string[];
}

export const SUPPORTED_INDIAN_STATES: StateDefinition[] = [
  {
    id: "AP",
    name: "Andhra Pradesh",
    code: "AP",
    capital: "Amaravati",
    districts: ["Guntur", "Krishna", "Visakhapatnam", "Chittoor", "Anantapur", "NTR", "Nellore", "Kurnool", "YSR Kadapa", "Prakasam"],
  },
  {
    id: "RJ",
    name: "Rajasthan",
    code: "RJ",
    capital: "Jaipur",
    districts: ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner", "Alwar", "Bhilwara", "Sikar"],
  },
  {
    id: "MH",
    name: "Maharashtra",
    code: "MH",
    capital: "Mumbai",
    districts: ["Pune", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nashik", "Thane", "Aurangabad", "Solapur", "Kolhapur"],
  },
  {
    id: "TG",
    name: "Telangana",
    code: "TG",
    capital: "Hyderabad",
    districts: ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Rangareddy", "Medak", "Nalgonda"],
  },
  {
    id: "UP",
    name: "Uttar Pradesh",
    code: "UP",
    capital: "Lucknow",
    districts: ["Lucknow", "Varanasi", "Agra", "Kanpur", "Prayagraj", "Noida", "Ghaziabad", "Meerut", "Gorakhpur"],
  },
  {
    id: "MP",
    name: "Madhya Pradesh",
    code: "MP",
    capital: "Bhopal",
    districts: ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain", "Sagar", "Rewa", "Satna"],
  },
  {
    id: "TN",
    name: "Tamil Nadu",
    code: "TN",
    capital: "Chennai",
    districts: ["Chennai", "Coimbatore", "Madurai", "Salem", "Tiruchirappalli", "Tirunelveli", "Erode", "Vellore"],
  },
  {
    id: "OD",
    name: "Odisha",
    code: "OD",
    capital: "Bhubaneswar",
    districts: ["Bhubaneswar", "Cuttack", "Puri", "Sambalpur", "Rourkela", "Balasore", "Berhampur"],
  },
  {
    id: "KA",
    name: "Karnataka",
    code: "KA",
    capital: "Bengaluru",
    districts: ["Bengaluru Urban", "Mysuru", "Mangaluru", "Hubballi-Dharwad", "Belagavi", "Kalaburagi"],
  },
  {
    id: "GJ",
    name: "Gujarat",
    code: "GJ",
    capital: "Gandhinagar",
    districts: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar"],
  },
];

/**
 * Validates if the given target state/district falls within the user's jurisdiction scope.
 * - National scope (Central Admin): Access to all states and districts.
 * - State scope (State Admin): Access to all districts in their assigned state only.
 * - Operational user: Scoped to their assigned state and district.
 */
export function isWithinJurisdiction(
  scope: JurisdictionScope,
  targetStateId?: string,
  targetDistrictId?: string
): boolean {
  if (scope.type === "NATIONAL" || scope.role === "CENTRAL_ADMIN" || scope.role === "DOSJE_OFFICIAL" || scope.role === "ADMIN") {
    return true;
  }

  if (scope.type === "STATE" || scope.role === "STATE_ADMIN") {
    if (!targetStateId) return true;
    const isStateMatch =
      scope.stateId === targetStateId ||
      scope.stateName === targetStateId ||
      SUPPORTED_INDIAN_STATES.find((s) => s.id === scope.stateId)?.name === targetStateId ||
      SUPPORTED_INDIAN_STATES.find((s) => s.name === scope.stateName)?.id === targetStateId;
    return Boolean(isStateMatch);
  }

  // Field / operational users
  if (targetStateId && scope.stateId && scope.stateId !== targetStateId && scope.stateName !== targetStateId) {
    return false;
  }
  if (targetDistrictId && scope.districtId && scope.districtId !== targetDistrictId && scope.districtName !== targetDistrictId) {
    return false;
  }

  return true;
}
