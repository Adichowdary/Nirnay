// ─────────────────────────────────────────────────────────────
// INSIGHT — Complete Type System
// All shared TypeScript types used across the platform
// ─────────────────────────────────────────────────────────────

// ── User & Auth ───────────────────────────────────────────────

export type UserRole =
  | "CENTRAL_ADMIN"
  | "STATE_ADMIN"
  | "AUDIT_SQUAD"
  | "AGENCY_PORTAL"
  | "INSPECTION_OFFICER"
  | "PMU_USER"
  | "PROJECT_ADMIN"
  | "NGO_ADMIN"
  | "NGO_INSTITUTE"
  | "STAFF"
  | "BENEFICIARY"
  | "NORMAL_USER"
  // Legacy aliases
  | "super_admin"
  | "department_official"
  | "pmu_officer"
  | "ngo_institute"
  | "field_inspector"
  | "DOSJE_OFFICIAL"
  | "ADMIN";

export type AdminLevel = "CENTRAL_ADMIN" | "STATE_ADMIN";

export type JurisdictionType = "NATIONAL" | "STATE" | "DISTRICT" | "PROJECT";

export interface JurisdictionScope {
  role: UserRole;
  jurisdiction_type: "NATIONAL" | "STATE";
  jurisdiction_id?: string | null; // e.g. "AP", "RJ", "MH", or null for National
  state_id?: string;
  state_name?: string;
  district_id?: string; // Geographic filter / field assignment ONLY, never an admin role
  district_name?: string;
}

export interface StateRecord {
  id: string; // e.g. "AP"
  name: string; // e.g. "Andhra Pradesh"
  code: string;
  districts: string[];
  totalProjects: number;
  activeInspections: number;
  completedInspections: number;
  pendingInspections: number;
  openIssues: number;
  criticalIssues: number;
  escalatedIssues: number;
  slaBreaches: number;
  slaCompliancePercent: number;
  activeTeams: number;
  isActive: boolean;
  assignedAdminName?: string;
  assignedAdminEmail?: string;
  assignedAdminId?: string;
}

export interface StateAdminProfile {
  id: string;
  name: string;
  officialId: string;
  email: string;
  phone?: string;
  stateId: string;
  stateName: string;
  role: "STATE_ADMIN";
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  state_id?: string;
  state_name?: string;
  district_id?: string; // Operational / geographical scope ONLY
  district_name?: string;
  organization_id?: string;
  phone?: string;
  employee_id?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  last_sign_in?: string;
}

// ── Geography ─────────────────────────────────────────────────

export interface District {
  id: string;
  name: string;
  state: string;
  state_id?: string;
  code: string;
  latitude: number;
  longitude: number;
  project_count: number;
  active_inspections: number;
}

export interface GpsCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number; // meters
  timestamp: string;
  altitude?: number;
  speed?: number;
  heading?: number;
}

// ── Organizations ─────────────────────────────────────────────

export type OrgType = "ngo" | "institute" | "welfare_centre" | "rehabilitation_centre" | "skill_centre";

export interface Organization {
  id: string;
  name: string;
  type: OrgType;
  registration_number: string;
  district_id: string;
  district_name: string;
  state: string;
  address: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  scheme_ids: string[];
  is_active: boolean;
  compliance_score: number;
  created_at: string;
}

// ── Schemes ───────────────────────────────────────────────────

export interface Scheme {
  id: string;
  name: string;
  code: string;
  description: string;
  ministry: string;
  budget_allocation?: number;
  is_active: boolean;
}

// ── Projects ──────────────────────────────────────────────────

export type ProjectStatus = "operational" | "at-risk" | "critical" | "suspended" | "pending";

export interface ProjectLocation {
  latitude: number;
  longitude: number;
  address: string;
  geofence_radius_meters: number;
}

export interface ProjectHealthScore {
  overall: number;
  compliance: number;
  attendance: number;
  inspection: number;
  evidence: number;
  reporting: number;
  cctv: number;
}

export interface Project {
  id: string;
  name: string;
  organization_id: string;
  organization_name: string;
  district_id: string;
  district_name: string;
  state: string;
  scheme_id: string;
  scheme_name: string;
  status: ProjectStatus;
  location: ProjectLocation;
  health: ProjectHealthScore;
  ai_risk_score: number;
  registered_beneficiaries: number;
  expected_attendance: number;
  cctv_total: number;
  cctv_online: number;
  last_inspection_date?: string;
  last_inspection_id?: string;
  next_inspection_due?: string;
  incharge_name: string;
  incharge_phone: string;
  created_at: string;
  updated_at: string;
}

// ── Inspections ───────────────────────────────────────────────

export type InspectionType = "surprise" | "routine" | "follow_up" | "random_vc";
export type InspectionStatus =
  | "assigned"
  | "travel"
  | "arrived"
  | "in_progress"
  | "evidence_upload"
  | "completed"
  | "cancelled";

export interface InspectionAssignment {
  inspection_id: string;
  project_id: string;
  project_name: string;
  inspector_id: string;
  inspector_name: string;
  district_name: string;
  distance_km: number;
  estimated_travel_min: number;
  assignment_score: number;
  assignment_confidence: number;
  assignment_reason: AssignmentReason;
  conflict_check_passed: boolean;
  assigned_at: string;
  deadline: string;
}

export interface AssignmentReason {
  risk_weight: number;
  inspection_age_weight: number;
  random_weight: number;
  coverage_weight: number;
  recent_penalty: number;
  factors: string[];
}

export type InspectionStep =
  | "arrival"
  | "identity"
  | "checklist"
  | "attendance"
  | "infrastructure"
  | "beneficiary"
  | "evidence"
  | "ai_review"
  | "comments"
  | "declaration"
  | "submit";

export interface ChecklistItem {
  id: string;
  question: string;
  category: string;
  is_required: boolean;
  answer?: "yes" | "no" | "na" | "partial";
  notes?: string;
  evidence_ids?: string[];
}

export interface Inspection {
  id: string;
  type: InspectionType;
  status: InspectionStatus;
  project_id: string;
  project_name: string;
  organization_name: string;
  district_name: string;
  inspector_id: string;
  inspector_name: string;
  assignment: InspectionAssignment;
  current_step: InspectionStep;
  arrival_gps?: GpsCoordinates;
  arrival_verified: boolean;
  checklist_items: ChecklistItem[];
  checklist_score?: number;
  attendance_reported: number;
  attendance_observed: number;
  beneficiaries_met: number;
  evidence_ids: string[];
  ai_signals: string[];
  officer_comments?: string;
  officer_declaration?: boolean;
  final_status?: "compliant" | "non_compliant" | "partial_compliance";
  recommendations?: string;
  started_at?: string;
  completed_at?: string;
  assigned_at: string;
}

// ── Evidence & Ownership Model ──────────────────────────────────

export type EvidenceType = "photo" | "video" | "audio" | "document" | "report" | "other";
export type EvidenceStatus = "pending_upload" | "uploading" | "uploaded" | "verified" | "flagged";
export type ChainOfCustodyStatus = "captured" | "uploaded" | "verified" | "reviewed";

export type EvidenceVisibility =
  | "PRIVATE"
  | "OWNER_ONLY"
  | "STATE_AUTHORIZED"
  | "CENTRAL_AUTHORIZED"
  | "INSPECTION_TEAM"
  | "PROJECT_AUTHORIZED";

export interface EvidenceMetadata {
  uuid: string;
  evidence_id?: string;
  inspection_id?: string;
  audit_id?: string;
  project_id: string;
  owner_type?: "AUDIT_SQUAD" | "AGENCY" | "INSPECTOR" | "OFFICIAL";
  owner_id?: string;
  owner_user_id?: string;
  owner_organization_id?: string;
  uploaded_by: string;
  uploaded_by_role: string;
  state_id?: string;
  district_id?: string;
  type: EvidenceType;
  filename: string;
  file_name?: string;
  mime_type?: string;
  file_size_bytes: number;
  file_size?: number;
  storage_path?: string;
  sha256_hash: string;
  checksum?: string;
  version?: number;
  visibility?: EvidenceVisibility;
  captured_at: string;
  gps: GpsCoordinates;
  bhuvan_address?: string;
  device_id_hash?: string;
  uploader_id?: string;
  checklist_item_id?: string;
  description?: string;
  transcript?: string;
  audio_summary?: string;
  is_duplicate?: boolean;
  duplicate_of?: string;
  tamper_status?: "AUTHENTIC" | "SUSPICIOUS_METADATA" | "MODIFIED" | "VALIDATED";
  chain_of_custody?: ChainOfCustodyStatus;
  storage_url?: string;
  thumbnail_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EvidenceItem extends EvidenceMetadata {
  status: EvidenceStatus;
  upload_progress?: number;
}

// ── AI Summary & Grounded Findings ────────────────────────────

export type AIReviewStatus = "PENDING" | "REVIEWED" | "ACCEPTED" | "EDITED" | "REJECTED";

export interface AIReportSummary {
  id: string;
  source_report_id: string;
  executive_summary: string;
  key_findings: string[];
  positive_observations: string[];
  issues_identified: string[];
  compliance_concerns: string[];
  evidence_summary: {
    photos_count: number;
    videos_count: number;
    audio_count: number;
    documents_count: number;
  };
  corrective_actions_required: string[];
  risk_level: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  recommended_follow_up: string;
  model_name: string;
  model_version: string;
  confidence_score: number;
  created_at: string;
  review_status: AIReviewStatus;
  reviewed_by?: string;
  reviewed_at?: string;
}

// ── Audit Report & Controlled Workflow ────────────────────────

export type AuditReportStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "AI_PROCESSING"
  | "AI_SUMMARY_READY"
  | "STATE_REVIEW"
  | "CENTRAL_VISIBLE"
  | "ACTION_REQUIRED"
  | "RESOLVED"
  | "CLOSED"
  | "REOPENED";

export interface AuditReport {
  id: string;
  audit_id: string;
  project_id: string;
  project_name: string;
  state_id: string;
  district_name: string;
  submitted_by_squad_id: string;
  submitted_by_name: string;
  status: AuditReportStatus;
  original_report: {
    observations: string;
    checklist_score: number;
    headcount_registered: number;
    headcount_observed: number;
    cctv_functional: boolean;
    infrastructure_notes: string;
  };
  ai_summary?: AIReportSummary;
  evidence_ids: string[];
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    bhuvan_address?: string;
    captured_at: string;
  };
  tamper_proof_hash: string;
  submitted_at: string;
  state_review_notes?: string;
  central_review_notes?: string;
}

// ── Corrective Action Loop ───────────────────────────────────

export type CorrectiveActionStatus =
  | "ACTION_REQUIRED"
  | "RESPONSE_SUBMITTED"
  | "UNDER_REVIEW"
  | "VERIFIED_CLOSED"
  | "REOPENED";

export interface CorrectiveAction {
  id: string;
  audit_id: string;
  report_id?: string;
  project_id: string;
  project_name: string;
  state_id: string;
  district_name: string;
  assigned_to_agency_id: string;
  assigned_to_agency_name: string;
  issued_by_state_admin_id: string;
  issued_by_name: string;
  issue_title: string;
  required_action: string;
  due_date: string;
  status: CorrectiveActionStatus;
  agency_response?: {
    explanation: string;
    submitted_at: string;
    submitted_by: string;
    evidence_version_ids: string[];
  };
  state_resolution_notes?: string;
  created_at: string;
  resolved_at?: string;
}

// ── CCTV ──────────────────────────────────────────────────────

export type CameraStatus = "live" | "offline" | "degraded" | "demo";

export interface CCTVCamera {
  id: string;
  project_id: string;
  camera_id: string;
  label: string;
  location_description: string;
  status: CameraStatus;
  fps: number;
  latency_ms: number;
  last_heartbeat: string;
  demo_stream_url?: string;
  resolution?: string;
  connection_quality: "excellent" | "good" | "poor" | "none";
}

// ── Attendance ────────────────────────────────────────────────

export interface AttendanceRecord {
  id: string;
  project_id: string;
  date: string;
  registered: number;
  expected: number;
  observed: number;
  reported: number;
  variance_percent: number;
  is_anomaly: boolean;
  inspection_id?: string;
  verified_by?: string;
  notes?: string;
}

export interface AttendanceTrend {
  week: string;
  avg_reported: number;
  avg_observed: number;
  avg_variance: number;
}

// ── Beneficiaries ─────────────────────────────────────────────

export interface Beneficiary {
  id: string;
  project_id: string;
  masked_name: string; // Always masked in demo
  program: string;
  enrollment_date: string;
  attendance_percent: number;
  last_verification: string;
  services_received: string[];
  feedback_score?: number;
  is_active: boolean;
}

// ── AI Signals ────────────────────────────────────────────────

export type AISignalSeverity = "low" | "medium" | "high" | "critical";
export type AISignalType =
  | "attendance_anomaly"
  | "inspection_frequency"
  | "reporting_pattern"
  | "missing_evidence"
  | "duplicate_evidence"
  | "location_mismatch"
  | "cctv_availability"
  | "beneficiary_count"
  | "timestamp_anomaly"
  | "reporting_change";

export interface AISignalExplanation {
  what_happened: string;
  why_detected: string;
  data_used: string[];
  confidence: number;
  recommended_action: string;
}

export interface AISignal {
  id: string;
  project_id: string;
  project_name: string;
  district_name: string;
  type: AISignalType;
  severity: AISignalSeverity;
  title: string;
  summary: string;
  explanation: AISignalExplanation;
  risk_score: number;
  evidence_ids?: string[];
  is_resolved: boolean;
  requires_human_review: boolean;
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
}

// ── Risk Scores ───────────────────────────────────────────────

export type RiskLevel = "low" | "medium" | "high" | "critical";

export function getRiskLevel(score: number): RiskLevel {
  if (score <= 29) return "low";
  if (score <= 59) return "medium";
  if (score <= 79) return "high";
  return "critical";
}

// ── VC Sessions ───────────────────────────────────────────────

export type VCStatus = "initiating" | "waiting" | "connected" | "ended" | "failed";

export interface VCSession {
  id: string;
  project_id: string;
  initiated_by: string;
  participants: VCParticipant[];
  status: VCStatus;
  is_recording: boolean;
  consent_obtained: boolean;
  started_at?: string;
  ended_at?: string;
  duration_seconds?: number;
}

export interface VCParticipant {
  user_id: string;
  name: string;
  role: UserRole;
  joined_at?: string;
  connection_quality?: "excellent" | "good" | "poor";
}

// ── Notifications ─────────────────────────────────────────────

export type NotificationPriority = "critical" | "action_required" | "information" | "system";

export interface Notification {
  id: string;
  priority: NotificationPriority;
  title: string;
  message: string;
  related_project_id?: string;
  related_inspection_id?: string;
  is_read: boolean;
  created_at: string;
  action_url?: string;
}

// ── Audit Trail ───────────────────────────────────────────────

export type AuditAction =
  | "inspection_started"
  | "gps_verified"
  | "evidence_captured"
  | "evidence_uploaded"
  | "attendance_submitted"
  | "ai_anomaly_generated"
  | "report_submitted"
  | "vc_initiated"
  | "vc_ended"
  | "user_logged_in"
  | "assignment_created"
  | "report_approved"
  | "report_rejected"
  | "cctv_offline"
  | "cctv_online"
  | "anomaly_resolved";

export interface AuditEvent {
  id: string;
  action: AuditAction;
  actor_id: string;
  actor_name: string;
  actor_role: UserRole;
  project_id?: string;
  inspection_id?: string;
  metadata: Record<string, unknown>;
  ip_address?: string;
  timestamp: string;
}

// ── Offline Sync ──────────────────────────────────────────────

export type SyncStatus = "pending" | "syncing" | "synced" | "failed";

export interface SyncQueueItem {
  id: string;
  type: "evidence" | "attendance" | "checklist" | "inspection_update";
  payload: Record<string, unknown>;
  status: SyncStatus;
  retry_count: number;
  created_at: string;
  last_attempt?: string;
  error?: string;
}

// ── Dashboard Metrics ─────────────────────────────────────────

export interface DashboardMetrics {
  projects_monitored: number;
  active_inspections: number;
  live_sites: number;
  open_anomalies: number;
  pending_reports: number;
  critical_alerts: number;
  cctv_online: number;
  cctv_total: number;
  inspectors_active: number;
}

// ── Map ───────────────────────────────────────────────────────

export type MapMarkerType =
  | "healthy"
  | "warning"
  | "critical"
  | "inspection"
  | "cctv"
  | "inspector"
  | "ai_anomaly";

export interface MapMarker {
  id: string;
  type: MapMarkerType;
  latitude: number;
  longitude: number;
  label: string;
  data: Record<string, unknown>;
}

// ── Inspector ─────────────────────────────────────────────────

export interface Inspector {
  id: string;
  name: string;
  employee_id: string;
  district_id: string;
  district_name: string;
  phone: string;
  current_workload: number;
  max_workload: number;
  is_available: boolean;
  is_on_leave: boolean;
  last_inspection_date?: string;
  total_inspections: number;
  current_latitude?: number;
  current_longitude?: number;
}
