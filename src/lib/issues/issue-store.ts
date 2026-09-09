// ─────────────────────────────────────────────────────────────
// INSIGHT — Centralized Issue Management & Automated SLA Escalation Engine
// TWO-LEVEL ADMINISTRATIVE WORKFLOW:
// Level 1: State Admin (Operational Resolution & Assignment)
// Level 2: Central Admin (National Oversight & Escalation Governance)
// DISTRICT IS GEOGRAPHIC/ORGANIZATIONAL SCOPE ONLY (NO DISTRICT ADMIN)
// ─────────────────────────────────────────────────────────────

export type IssuePriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type IssueStatus =
  | "OPEN"
  | "ACKNOWLEDGED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "WAITING_FOR_INFORMATION"
  | "RESOLVED"
  | "REJECTED"
  | "ESCALATED"
  | "CLOSED"
  | "REOPENED";

export type IssueCategory =
  | "CCTV_OFFLINE"
  | "GPS_GEOFENCE_FAILURE"
  | "ATTENDANCE_ANOMALY"
  | "INSPECTION_COMPLIANCE"
  | "INFRASTRUCTURE"
  | "USER_COMPLAINT"
  | "INSPECTION_ANOMALY";

export interface IssueComment {
  id: string;
  authorName: string;
  authorRole: string;
  message: string;
  createdAt: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  priority: IssuePriority;
  status: IssueStatus;
  createdBy: string;
  assignedTo: string;
  assignedToRole?: string;
  stateId: string;
  stateName: string;
  districtId: string; // Geographical classification
  districtName: string;
  projectId?: string;
  projectName?: string;
  inspectionId?: string;
  escalationLevel: 1 | 2; // Level 1 = State Admin, Level 2 = Central Admin (NO District Admin)
  slaHours: number;
  createdAt: string;
  updatedAt: string;
  dueAt: string;
  resolvedAt?: string;
  comments: IssueComment[];
}

export const SLA_DURATIONS_HOURS: Record<IssuePriority, number> = {
  CRITICAL: 4,
  HIGH: 24,
  MEDIUM: 72,
  LOW: 168,
};

const INITIAL_DEMO_ISSUES: Issue[] = [
  {
    id: "ISSUE-AP-001",
    title: "CCTV Camera #03 Stream Blackout",
    description: "Camera 03 at Asha Rehabilitation Centre Guntur lost live streaming during mandatory inspection window.",
    category: "CCTV_OFFLINE",
    priority: "CRITICAL",
    status: "ESCALATED",
    createdBy: "Priya Mehta (Inspection Officer)",
    assignedTo: "Central Command Directorate (Escalation Queue)",
    assignedToRole: "Central Admin",
    stateId: "AP",
    stateName: "Andhra Pradesh",
    districtId: "Guntur",
    districtName: "Guntur",
    projectId: "p1",
    projectName: "Asha Rehabilitation Centre",
    escalationLevel: 2,
    slaHours: 4,
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(), // 6 hours ago (SLA breached)
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    dueAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    comments: [
      {
        id: "c1",
        authorName: "Dr. K. Venkateswarlu (State Admin AP)",
        authorRole: "State Admin",
        message: "Assigned field inspector Priya Mehta to verify on-site solar power backup failure.",
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
      {
        id: "c2",
        authorName: "Automated SLA Escalation Engine",
        authorRole: "System SLA Engine",
        message: "⚠ Critical SLA Exceeded (4h threshold breached). Auto-escalated to Level 2 (Central Admin Directorate).",
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
    ],
  },
  {
    id: "ISSUE-AP-002",
    title: "GPS Geofence Offset Mismatch at Krishna Welfare Unit",
    description: "Inspection Squad arrived at location but secondary GPS accuracy lock deviated 24m outside perimeter.",
    category: "GPS_GEOFENCE_FAILURE",
    priority: "HIGH",
    status: "ASSIGNED",
    createdBy: "NIRNAY Geofence Engine",
    assignedTo: "K. Ramesh Babu (Inspection Officer)",
    assignedToRole: "Inspection Officer",
    stateId: "AP",
    stateName: "Andhra Pradesh",
    districtId: "Krishna",
    districtName: "Krishna",
    projectId: "p2",
    projectName: "Krishna Integrated Child & Senior Care",
    escalationLevel: 1,
    slaHours: 24,
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    dueAt: new Date(Date.now() + 3600000 * 16).toISOString(),
    comments: [
      {
        id: "c3",
        authorName: "Dr. K. Venkateswarlu (State Admin AP)",
        authorRole: "State Admin",
        message: "Assigned Inspection Officer Ramesh Babu to re-verify polygon coordinates using dual-band GPS.",
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
    ],
  },
  {
    id: "ISSUE-RJ-003",
    title: "Biometric Facial Verification Discrepancy",
    description: "14 beneficiary records flagged with facial similarity variance under 78% threshold during daily morning rollcall.",
    category: "ATTENDANCE_ANOMALY",
    priority: "HIGH",
    status: "IN_PROGRESS",
    createdBy: "AI Risk Engine",
    assignedTo: "Vikram Rathore (Inspection Officer)",
    assignedToRole: "Inspection Officer",
    stateId: "RJ",
    stateName: "Rajasthan",
    districtId: "Jaipur",
    districtName: "Jaipur",
    projectId: "p6",
    projectName: "Jaipur Special Welfare Institute",
    escalationLevel: 1,
    slaHours: 24,
    createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    dueAt: new Date(Date.now() + 3600000 * 14).toISOString(),
    comments: [
      {
        id: "c4",
        authorName: "Suresh Chand Gupta (State Admin RJ)",
        authorRole: "State Admin",
        message: "Assigned unannounced verification audit to Audit Squad Jaipur.",
        createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      },
    ],
  },
  {
    id: "ISSUE-MH-004",
    title: "Sanitation & Fire Safety Compliance Incomplete",
    description: "Annual Fire NOC certificate renewal missing from grantee organization uploaded documents repository.",
    category: "INFRASTRUCTURE",
    priority: "MEDIUM",
    status: "OPEN",
    createdBy: "Compliance Verification Service",
    assignedTo: "Smita Deshmukh (State Admin MH)",
    assignedToRole: "State Admin",
    stateId: "MH",
    stateName: "Maharashtra",
    districtId: "Pune",
    districtName: "Pune",
    projectId: "p3",
    projectName: "Sahyog Institute of Inclusion",
    escalationLevel: 1,
    slaHours: 72,
    createdAt: new Date(Date.now() - 3600000 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 14).toISOString(),
    dueAt: new Date(Date.now() + 3600000 * 58).toISOString(),
    comments: [],
  },
];

let memoryIssuesStore: Issue[] = [...INITIAL_DEMO_ISSUES];

/**
 * Get issues with optional state and district filters.
 * State Admin uses this to view all issues in their state or filter by specific district.
 * Central Admin uses this to query nationwide or drill into a specific state.
 */
export function getIssues(stateFilter?: string, districtFilter?: string): Issue[] {
  return memoryIssuesStore.filter((issue) => {
    if (stateFilter && stateFilter !== "ALL") {
      const stateMatches =
        issue.stateId.toLowerCase() === stateFilter.toLowerCase() ||
        issue.stateName.toLowerCase() === stateFilter.toLowerCase();
      if (!stateMatches) return false;
    }
    if (districtFilter && districtFilter !== "ALL") {
      const districtMatches =
        issue.districtId.toLowerCase() === districtFilter.toLowerCase() ||
        issue.districtName.toLowerCase() === districtFilter.toLowerCase();
      if (!districtMatches) return false;
    }
    return true;
  });
}

/**
 * Central Admin: Get all escalated issues (Level 2 SLA breaches)
 */
export function getEscalatedIssues(stateFilter?: string): Issue[] {
  return memoryIssuesStore.filter((issue) => {
    const isEscalated = issue.escalationLevel === 2 || issue.status === "ESCALATED";
    if (!isEscalated) return false;

    if (stateFilter && stateFilter !== "ALL") {
      return (
        issue.stateId.toLowerCase() === stateFilter.toLowerCase() ||
        issue.stateName.toLowerCase() === stateFilter.toLowerCase()
      );
    }
    return true;
  });
}

/**
 * Create a new issue (Level 1: Directed to State Admin for resolution)
 */
export function createIssue(data: {
  title: string;
  description: string;
  category: IssueCategory;
  priority: IssuePriority;
  createdBy: string;
  stateId: string;
  stateName: string;
  districtId: string;
  districtName: string;
  projectId?: string;
  projectName?: string;
  inspectionId?: string;
  assignedTo?: string;
  assignedToRole?: string;
  slaHours?: number;
}): Issue {
  const sla = data.slaHours || SLA_DURATIONS_HOURS[data.priority] || 24;
  const now = new Date();
  const due = new Date(now.getTime() + sla * 3600000);

  const newIssue: Issue = {
    id: `ISSUE-${data.stateId}-${Math.floor(100 + Math.random() * 900)}`,
    title: data.title,
    description: data.description,
    category: data.category,
    priority: data.priority,
    status: "OPEN",
    createdBy: data.createdBy,
    assignedTo: data.assignedTo || `State Admin (${data.stateName})`,
    assignedToRole: data.assignedToRole || "State Admin",
    stateId: data.stateId,
    stateName: data.stateName,
    districtId: data.districtId,
    districtName: data.districtName,
    projectId: data.projectId,
    projectName: data.projectName,
    inspectionId: data.inspectionId,
    escalationLevel: 1, // Always Level 1: State Admin
    slaHours: sla,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    dueAt: due.toISOString(),
    comments: [
      {
        id: `c-${Date.now()}`,
        authorName: data.createdBy,
        authorRole: "Issue Initiator",
        message: `Issue opened: ${data.title}`,
        createdAt: now.toISOString(),
      },
    ],
  };

  memoryIssuesStore = [newIssue, ...memoryIssuesStore];
  return newIssue;
}

/**
 * State Admin: Assign issue to Inspection Officer, PMU Team, or Project Incharge
 */
export function assignIssue(
  issueId: string,
  assignedToName: string,
  assignedToRole: string,
  assignedByAdminName: string
): Issue | null {
  const idx = memoryIssuesStore.findIndex((i) => i.id === issueId);
  if (idx === -1) return null;

  memoryIssuesStore[idx].status = "ASSIGNED";
  memoryIssuesStore[idx].assignedTo = assignedToName;
  memoryIssuesStore[idx].assignedToRole = assignedToRole;
  memoryIssuesStore[idx].updatedAt = new Date().toISOString();

  memoryIssuesStore[idx].comments.push({
    id: `c-${Date.now()}`,
    authorName: assignedByAdminName,
    authorRole: "State Admin",
    message: `Assigned issue to ${assignedToName} (${assignedToRole}).`,
    createdAt: new Date().toISOString(),
  });

  return memoryIssuesStore[idx];
}

/**
 * Mark issue as RESOLVED
 */
export function resolveIssue(issueId: string, authorName: string, resolutionNotes?: string): Issue | null {
  const idx = memoryIssuesStore.findIndex((i) => i.id === issueId);
  if (idx === -1) return null;

  const now = new Date().toISOString();
  memoryIssuesStore[idx].status = "RESOLVED";
  memoryIssuesStore[idx].resolvedAt = now;
  memoryIssuesStore[idx].updatedAt = now;
  memoryIssuesStore[idx].comments.push({
    id: `c-${Date.now()}`,
    authorName,
    authorRole: "Admin",
    message: resolutionNotes ? `✓ Issue RESOLVED. Notes: ${resolutionNotes}` : "✓ Issue marked as RESOLVED.",
    createdAt: now,
  });

  return memoryIssuesStore[idx];
}

/**
 * Escalate issue to Level 2 (Central Admin)
 */
export function escalateIssue(issueId: string, reason: string): Issue | null {
  const idx = memoryIssuesStore.findIndex((i) => i.id === issueId);
  if (idx === -1) return null;

  const now = new Date().toISOString();
  memoryIssuesStore[idx].status = "ESCALATED";
  memoryIssuesStore[idx].escalationLevel = 2;
  memoryIssuesStore[idx].assignedTo = "Central Command Directorate (Escalation Directorate)";
  memoryIssuesStore[idx].assignedToRole = "Central Admin";
  memoryIssuesStore[idx].updatedAt = now;

  memoryIssuesStore[idx].comments.push({
    id: `c-${Date.now()}`,
    authorName: "SLA Escalation Engine",
    authorRole: "System Audit",
    message: `⚠ Escalated to Level 2 (Central Admin Directorate). Reason: ${reason}`,
    createdAt: now,
  });

  return memoryIssuesStore[idx];
}

/**
 * Central Admin: Return escalated issue to State Admin with corrective instructions
 */
export function returnIssueToState(
  issueId: string,
  correctiveInstructions: string,
  centralAdminName: string
): Issue | null {
  const idx = memoryIssuesStore.findIndex((i) => i.id === issueId);
  if (idx === -1) return null;

  const now = new Date().toISOString();
  memoryIssuesStore[idx].status = "IN_PROGRESS";
  memoryIssuesStore[idx].escalationLevel = 1;
  memoryIssuesStore[idx].assignedTo = `State Admin (${memoryIssuesStore[idx].stateName})`;
  memoryIssuesStore[idx].assignedToRole = "State Admin";
  memoryIssuesStore[idx].updatedAt = now;

  memoryIssuesStore[idx].comments.push({
    id: `c-${Date.now()}`,
    authorName: centralAdminName,
    authorRole: "Central Admin",
    message: `Returned to State Admin with corrective instructions: ${correctiveInstructions}`,
    createdAt: now,
  });

  return memoryIssuesStore[idx];
}

/**
 * Add communication comment to issue thread
 */
export function addCommentToIssue(
  issueId: string,
  authorName: string,
  authorRole: string,
  message: string
): Issue | null {
  const idx = memoryIssuesStore.findIndex((i) => i.id === issueId);
  if (idx === -1) return null;

  const comment: IssueComment = {
    id: `c-${Date.now()}`,
    authorName,
    authorRole,
    message,
    createdAt: new Date().toISOString(),
  };

  memoryIssuesStore[idx].comments.push(comment);
  memoryIssuesStore[idx].updatedAt = new Date().toISOString();
  return memoryIssuesStore[idx];
}
