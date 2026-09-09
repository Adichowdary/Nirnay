// ─────────────────────────────────────────────────────────────
// INSIGHT — Central Admin & State Admin Management Store
// State Administration, State Performance Analytics & Operational User Management
// ─────────────────────────────────────────────────────────────

import { SUPPORTED_INDIAN_STATES, StateDefinition } from "@/lib/auth/admin-hierarchy";
import { DEMO_PROJECTS } from "@/lib/demo-data";
import { getIssues } from "@/lib/issues/issue-store";

export interface StateAdminRecord {
  id: string;
  name: string;
  officialId: string;
  email: string;
  phone: string;
  stateId: string;
  stateName: string;
  role: "STATE_ADMIN";
  permissions: string[];
  isActive: boolean;
  assignedAt: string;
  lastLogin?: string;
}

export interface StateOperationalUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "INSPECTION_OFFICER" | "PMU_USER" | "STAFF" | "PROJECT_ADMIN";
  stateId: string;
  stateName: string;
  districtId: string; // Operational geographic scope ONLY
  districtName: string;
  organizationName?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface StatePerformanceMetrics {
  stateId: string;
  stateName: string;
  code: string;
  totalDistricts: number;
  totalProjects: number;
  activeInspections: number;
  completedInspections: number;
  pendingInspections: number;
  openIssues: number;
  criticalIssues: number;
  escalatedIssues: number;
  slaBreaches: number;
  slaComplianceRate: number;
  activeTeams: number;
  assignedAdmin?: StateAdminRecord;
}

// Initial State Admins
const INITIAL_STATE_ADMINS: StateAdminRecord[] = [
  {
    id: "sa-ap-01",
    name: "Dr. K. Venkateswarlu",
    officialId: "SA-AP-2025-01",
    email: "stateadmin.ap@dosje.gov.in",
    phone: "+91 863 223 4455",
    stateId: "AP",
    stateName: "Andhra Pradesh",
    role: "STATE_ADMIN",
    permissions: ["VIEW_STATE", "MANAGE_STATE_USERS", "VIEW_PROJECTS", "MANAGE_PROJECTS", "VIEW_INSPECTIONS", "ASSIGN_INSPECTIONS", "VIEW_ISSUES", "ASSIGN_ISSUES", "RESOLVE_ISSUES", "ESCALATE_ISSUES", "VIEW_REPORTS"],
    isActive: true,
    assignedAt: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
    lastLogin: "10 mins ago (FRS Verified)",
  },
  {
    id: "sa-rj-02",
    name: "Suresh Chand Gupta",
    officialId: "SA-RJ-2025-02",
    email: "stateadmin.rj@dosje.gov.in",
    phone: "+91 141 238 8890",
    stateId: "RJ",
    stateName: "Rajasthan",
    role: "STATE_ADMIN",
    permissions: ["VIEW_STATE", "MANAGE_STATE_USERS", "VIEW_PROJECTS", "MANAGE_PROJECTS", "VIEW_INSPECTIONS", "ASSIGN_INSPECTIONS", "VIEW_ISSUES", "ASSIGN_ISSUES", "RESOLVE_ISSUES", "ESCALATE_ISSUES", "VIEW_REPORTS"],
    isActive: true,
    assignedAt: new Date(Date.now() - 3600000 * 24 * 45).toISOString(),
    lastLogin: "2 hours ago (FRS Verified)",
  },
  {
    id: "sa-mh-03",
    name: "Smita Deshmukh",
    officialId: "SA-MH-2025-03",
    email: "stateadmin.mh@dosje.gov.in",
    phone: "+91 22 2202 5544",
    stateId: "MH",
    stateName: "Maharashtra",
    role: "STATE_ADMIN",
    permissions: ["VIEW_STATE", "MANAGE_STATE_USERS", "VIEW_PROJECTS", "MANAGE_PROJECTS", "VIEW_INSPECTIONS", "ASSIGN_INSPECTIONS", "VIEW_ISSUES", "ASSIGN_ISSUES", "RESOLVE_ISSUES", "ESCALATE_ISSUES", "VIEW_REPORTS"],
    isActive: true,
    assignedAt: new Date(Date.now() - 3600000 * 24 * 60).toISOString(),
    lastLogin: "Yesterday (FRS Verified)",
  },
  {
    id: "sa-tg-04",
    name: "R. Prabhakar Rao",
    officialId: "SA-TG-2025-04",
    email: "stateadmin.tg@dosje.gov.in",
    phone: "+91 40 2345 6789",
    stateId: "TG",
    stateName: "Telangana",
    role: "STATE_ADMIN",
    permissions: ["VIEW_STATE", "MANAGE_STATE_USERS", "VIEW_PROJECTS", "MANAGE_PROJECTS", "VIEW_INSPECTIONS", "ASSIGN_INSPECTIONS", "VIEW_ISSUES", "ASSIGN_ISSUES", "RESOLVE_ISSUES", "ESCALATE_ISSUES", "VIEW_REPORTS"],
    isActive: true,
    assignedAt: new Date(Date.now() - 3600000 * 24 * 15).toISOString(),
    lastLogin: "3 hours ago (FRS Verified)",
  },
];

// Initial Operational Field Users scoped to states & districts
const INITIAL_OPERATIONAL_USERS: StateOperationalUser[] = [
  {
    id: "usr-ap-01",
    name: "Priya Mehta",
    email: "priya.mehta@field.dosje.gov.in",
    phone: "+91 98765 43210",
    role: "INSPECTION_OFFICER",
    stateId: "AP",
    stateName: "Andhra Pradesh",
    districtId: "Guntur",
    districtName: "Guntur",
    organizationName: "AP PMU Audit Squad",
    isActive: true,
    createdAt: new Date(Date.now() - 3600000 * 24 * 60).toISOString(),
    lastLogin: "Active Now (FRS Verified)",
  },
  {
    id: "usr-ap-02",
    name: "K. Ramesh Babu",
    email: "ramesh.k@field.dosje.gov.in",
    phone: "+91 98480 12345",
    role: "INSPECTION_OFFICER",
    stateId: "AP",
    stateName: "Andhra Pradesh",
    districtId: "Krishna",
    districtName: "Krishna",
    organizationName: "AP Inspection Unit",
    isActive: true,
    createdAt: new Date(Date.now() - 3600000 * 24 * 40).toISOString(),
    lastLogin: "45 mins ago",
  },
  {
    id: "usr-ap-03",
    name: "Anjali Verma",
    email: "contact@asharehab.org",
    phone: "+91 863 222 1100",
    role: "PROJECT_ADMIN",
    stateId: "AP",
    stateName: "Andhra Pradesh",
    districtId: "Guntur",
    districtName: "Guntur",
    organizationName: "Asha Rehabilitation Centre",
    isActive: true,
    createdAt: new Date(Date.now() - 3600000 * 24 * 90).toISOString(),
    lastLogin: "1 hour ago",
  },
  {
    id: "usr-rj-01",
    name: "Vikram Rathore",
    email: "vikram.rathore@field.dosje.gov.in",
    phone: "+91 94140 55443",
    role: "INSPECTION_OFFICER",
    stateId: "RJ",
    stateName: "Rajasthan",
    districtId: "Jaipur",
    districtName: "Jaipur",
    organizationName: "Rajasthan Audit Wing",
    isActive: true,
    createdAt: new Date(Date.now() - 3600000 * 24 * 50).toISOString(),
    lastLogin: "2 hours ago",
  },
];

const stateAdminsStore: StateAdminRecord[] = [...INITIAL_STATE_ADMINS];
const operationalUsersStore: StateOperationalUser[] = [...INITIAL_OPERATIONAL_USERS];

/**
 * Calculates real-time performance metrics for a specific state
 */
export function calculateStateMetrics(stateDef: StateDefinition): StatePerformanceMetrics {
  const stateProjects = DEMO_PROJECTS.filter(
    (p) => p.state === stateDef.name || p.state === stateDef.id || p.state === stateDef.code
  );

  const stateIssues = getIssues(stateDef.name);

  const openIssues = stateIssues.filter((i) => i.status !== "RESOLVED" && i.status !== "CLOSED").length;
  const criticalIssues = stateIssues.filter((i) => i.priority === "CRITICAL" && i.status !== "RESOLVED").length;
  const escalatedIssues = stateIssues.filter((i) => i.status === "ESCALATED" || i.escalationLevel === 2).length;
  const slaBreaches = stateIssues.filter((i) => {
    return new Date(i.dueAt).getTime() < Date.now() && i.status !== "RESOLVED" && i.status !== "CLOSED";
  }).length;

  const totalProjects = Math.max(stateProjects.length, stateDef.id === "AP" ? 4 : stateDef.id === "RJ" ? 3 : 2);
  const activeInspections = Math.max(1, Math.floor(totalProjects * 0.6));
  const completedInspections = Math.max(3, totalProjects * 3);
  const pendingInspections = Math.max(1, Math.floor(totalProjects * 0.4));

  const totalIssuesCount = stateIssues.length || 1;
  const resolvedOnTime = stateIssues.filter((i) => i.status === "RESOLVED").length;
  const slaComplianceRate = slaBreaches > 0 ? Math.max(70, Math.round(100 - (slaBreaches / totalIssuesCount) * 40)) : 96;

  const assignedAdmin = stateAdminsStore.find((a) => a.stateId === stateDef.id && a.isActive);

  return {
    stateId: stateDef.id,
    stateName: stateDef.name,
    code: stateDef.code,
    totalDistricts: stateDef.districts.length,
    totalProjects,
    activeInspections,
    completedInspections,
    pendingInspections,
    openIssues,
    criticalIssues,
    escalatedIssues,
    slaBreaches,
    slaComplianceRate,
    activeTeams: assignedAdmin ? 3 : 1,
    assignedAdmin,
  };
}

/**
 * Central Admin: Get all state performance records across India
 */
export function getAllStatesPerformance(): StatePerformanceMetrics[] {
  return SUPPORTED_INDIAN_STATES.map((s) => calculateStateMetrics(s));
}

/**
 * Get state details and performance by state ID or Name
 */
export function getStateDetails(stateIdOrName: string): { state: StateDefinition; metrics: StatePerformanceMetrics } | null {
  const stateDef = SUPPORTED_INDIAN_STATES.find(
    (s) => s.id.toLowerCase() === stateIdOrName.toLowerCase() || s.name.toLowerCase() === stateIdOrName.toLowerCase()
  );
  if (!stateDef) return null;

  return {
    state: stateDef,
    metrics: calculateStateMetrics(stateDef),
  };
}

/**
 * Central Admin: Create a new State Admin account and assign to state
 */
export function createStateAdmin(data: {
  name: string;
  officialId: string;
  email: string;
  phone: string;
  stateId: string;
  permissions?: string[];
}): StateAdminRecord {
  const stateDef = SUPPORTED_INDIAN_STATES.find((s) => s.id === data.stateId);
  const stateName = stateDef ? stateDef.name : data.stateId;

  // Deactivate any existing active admin for this state to maintain 1 primary admin per state
  stateAdminsStore.forEach((admin) => {
    if (admin.stateId === data.stateId) {
      admin.isActive = false;
    }
  });

  const newAdmin: StateAdminRecord = {
    id: `sa-${data.stateId.toLowerCase()}-${Date.now()}`,
    name: data.name,
    officialId: data.officialId || `SA-${data.stateId}-${Math.floor(100 + Math.random() * 900)}`,
    email: data.email,
    phone: data.phone || "+91 00000 00000",
    stateId: data.stateId,
    stateName,
    role: "STATE_ADMIN",
    permissions: data.permissions || [
      "VIEW_STATE",
      "MANAGE_STATE_USERS",
      "VIEW_PROJECTS",
      "MANAGE_PROJECTS",
      "VIEW_INSPECTIONS",
      "ASSIGN_INSPECTIONS",
      "VIEW_ISSUES",
      "ASSIGN_ISSUES",
      "RESOLVE_ISSUES",
      "ESCALATE_ISSUES",
      "VIEW_REPORTS",
    ],
    isActive: true,
    assignedAt: new Date().toISOString(),
    lastLogin: "Pending First FRS Sign-in",
  };

  stateAdminsStore.push(newAdmin);
  return newAdmin;
}

/**
 * Central Admin: Reassign or update State Admin
 */
export function assignStateAdmin(adminId: string, newStateId: string): StateAdminRecord | null {
  const admin = stateAdminsStore.find((a) => a.id === adminId);
  if (!admin) return null;

  const stateDef = SUPPORTED_INDIAN_STATES.find((s) => s.id === newStateId);
  admin.stateId = newStateId;
  admin.stateName = stateDef ? stateDef.name : newStateId;
  admin.assignedAt = new Date().toISOString();
  return admin;
}

/**
 * Central Admin: Deactivate State Admin
 */
export function deactivateStateAdmin(adminId: string): boolean {
  const admin = stateAdminsStore.find((a) => a.id === adminId);
  if (!admin) return false;
  admin.isActive = false;
  return true;
}

/**
 * Get all State Admins
 */
export function getAllStateAdmins(): StateAdminRecord[] {
  return [...stateAdminsStore];
}

/**
 * State Admin: Get operational users for a specific state
 */
export function getStateOperationalUsers(stateIdOrName: string, districtFilter?: string): StateOperationalUser[] {
  return operationalUsersStore.filter((u) => {
    const stateMatches =
      u.stateId.toLowerCase() === stateIdOrName.toLowerCase() ||
      u.stateName.toLowerCase() === stateIdOrName.toLowerCase();
    if (!stateMatches) return false;

    if (districtFilter && districtFilter !== "ALL") {
      return u.districtId.toLowerCase() === districtFilter.toLowerCase() || u.districtName.toLowerCase() === districtFilter.toLowerCase();
    }
    return true;
  });
}

/**
 * State Admin: Create an operational user (Inspection Officer, PMU, Staff) for a district
 */
export function createStateOperationalUser(data: {
  name: string;
  email: string;
  phone: string;
  role: "INSPECTION_OFFICER" | "PMU_USER" | "STAFF" | "PROJECT_ADMIN";
  stateId: string;
  districtId: string;
  organizationName?: string;
}): StateOperationalUser {
  const stateDef = SUPPORTED_INDIAN_STATES.find((s) => s.id === data.stateId || s.name === data.stateId);
  const stateId = stateDef ? stateDef.id : data.stateId;
  const stateName = stateDef ? stateDef.name : data.stateId;

  const newUser: StateOperationalUser = {
    id: `usr-${stateId.toLowerCase()}-${Date.now()}`,
    name: data.name,
    email: data.email,
    phone: data.phone,
    role: data.role,
    stateId,
    stateName,
    districtId: data.districtId,
    districtName: data.districtId,
    organizationName: data.organizationName || "State Operational Staff",
    isActive: true,
    createdAt: new Date().toISOString(),
    lastLogin: "Pending First FRS Sign-in",
  };

  operationalUsersStore.push(newUser);
  return newUser;
}

/**
 * State Admin: Deactivate operational user
 */
export function deactivateStateOperationalUser(userId: string): boolean {
  const user = operationalUsersStore.find((u) => u.id === userId);
  if (!user) return false;
  user.isActive = false;
  return true;
}
