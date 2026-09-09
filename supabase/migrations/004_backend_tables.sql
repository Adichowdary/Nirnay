-- ─────────────────────────────────────────────────────────────────────────────
-- INSIGHT — Backend Tables Migration 004
-- Adds 22 tables for the full backend architecture
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Permissions (RBAC) ────────────────────────────────────────────────────

create table if not exists permissions (
  id          text primary key,   -- 'VIEW_PROJECT', 'EDIT_PROJECT', etc.
  name        text not null,
  module      text not null,      -- 'project', 'inspection', 'cctv', etc.
  description text,
  created_at  timestamptz default now()
);

insert into permissions (id, name, module, description) values
  ('VIEW_PROJECT',               'View Project',               'project',   'View project details and summary'),
  ('EDIT_PROJECT',               'Edit Project',               'project',   'Create, update, archive projects'),
  ('VIEW_INSPECTION',            'View Inspection',            'inspection','View inspection details'),
  ('CREATE_INSPECTION',          'Create Inspection',          'inspection','Create new inspections'),
  ('ASSIGN_INSPECTION',          'Assign Inspection',          'inspection','Assign inspections to officers'),
  ('PERFORM_INSPECTION',         'Perform Inspection',         'inspection','Conduct field inspections'),
  ('REVIEW_INSPECTION',          'Review Inspection',          'inspection','Review submitted inspections'),
  ('APPROVE_INSPECTION',         'Approve Inspection',         'inspection','Approve or reject inspections'),
  ('VIEW_CCTV',                  'View CCTV',                  'cctv',      'View camera feeds and status'),
  ('REQUEST_VIDEO_VERIFICATION', 'Request Video Verification', 'video',     'Initiate video verification calls'),
  ('VIEW_REPORT',                'View Report',                'report',    'View inspection reports'),
  ('APPROVE_REPORT',             'Approve Report',             'report',    'Approve or reject reports'),
  ('MANAGE_USERS',               'Manage Users',               'admin',     'Create, update, deactivate users'),
  ('VIEW_AUDIT',                 'View Audit',                 'audit',     'View audit trail logs'),
  ('MANAGE_FACILITIES',          'Manage Facilities',          'facility',  'Create, update facilities'),
  ('MANAGE_ORGANIZATIONS',       'Manage Organizations',       'org',       'Create, update organizations'),
  ('MANAGE_COMPLIANCE',          'Manage Compliance',          'compliance','Create and verify compliance items'),
  ('VIEW_DASHBOARD',             'View Dashboard',             'dashboard', 'Access dashboard analytics')
on conflict (id) do nothing;

-- ─── Role ↔ Permission mapping ─────────────────────────────────────────────

create table if not exists role_permissions (
  id            uuid primary key default gen_random_uuid(),
  role_id       text not null references roles(id) on delete cascade,
  permission_id text not null references permissions(id) on delete cascade,
  created_at    timestamptz default now(),
  unique (role_id, permission_id)
);

-- DOSJE_OFFICIAL: full access
insert into role_permissions (role_id, permission_id)
select 'DOSJE_OFFICIAL', id from permissions
on conflict do nothing;

-- INSPECTION_OFFICER: inspection + evidence + cctv view
insert into role_permissions (role_id, permission_id)
select 'INSPECTION_OFFICER', id from permissions where id in (
  'VIEW_PROJECT', 'VIEW_INSPECTION', 'CREATE_INSPECTION', 'PERFORM_INSPECTION',
  'VIEW_CCTV', 'VIEW_REPORT'
) on conflict do nothing;

-- NGO_INSTITUTE: view own projects + compliance
insert into role_permissions (role_id, permission_id)
select 'NGO_INSTITUTE', id from permissions where id in (
  'VIEW_PROJECT', 'VIEW_INSPECTION', 'VIEW_REPORT', 'VIEW_DASHBOARD'
) on conflict do nothing;

-- DISTRICT_AUTHORITY: regional view + approve
insert into role_permissions (role_id, permission_id)
select 'DISTRICT_AUTHORITY', id from permissions where id in (
  'VIEW_PROJECT', 'VIEW_INSPECTION', 'REVIEW_INSPECTION', 'APPROVE_INSPECTION',
  'VIEW_CCTV', 'VIEW_REPORT', 'APPROVE_REPORT', 'VIEW_DASHBOARD', 'VIEW_AUDIT'
) on conflict do nothing;

-- ADMIN: all permissions
insert into role_permissions (role_id, permission_id)
select 'ADMIN', id from permissions
on conflict do nothing;

-- ─── Facilities ────────────────────────────────────────────────────────────

create table if not exists facilities (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  project_id       uuid not null references projects(id) on delete cascade,
  organization_id  uuid references organizations(id),
  type             text not null check (type in ('hostel','office','field','warehouse','other')),
  address          text,
  state            text,
  district         text,
  block            text,
  latitude         double precision not null,
  longitude        double precision not null,
  geofence_radius  integer default 200,
  contact_name     text,
  contact_phone    text,
  is_active        boolean not null default true,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create index if not exists idx_facilities_project_id on facilities(project_id);
create index if not exists idx_facilities_org_id on facilities(organization_id);

-- ─── Staff ─────────────────────────────────────────────────────────────────

create table if not exists staff (
  id               uuid primary key default gen_random_uuid(),
  facility_id      uuid not null references facilities(id) on delete cascade,
  user_id          uuid references profiles(id),
  name             text not null,
  role             text not null,  -- 'manager', 'teacher', 'cook', 'guard', etc.
  phone            text,
  email            text,
  is_active        boolean not null default true,
  joined_at        date,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create index if not exists idx_staff_facility_id on staff(facility_id);

-- ─── Beneficiaries ─────────────────────────────────────────────────────────

create table if not exists beneficiaries (
  id               uuid primary key default gen_random_uuid(),
  facility_id      uuid not null references facilities(id) on delete cascade,
  name             text not null,
  date_of_birth    date,
  gender           text check (gender in ('male','female','other')),
  guardian_name    text,
  phone            text,
  enrollment_date  date,
  is_active        boolean not null default true,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create index if not exists idx_beneficiaries_facility_id on beneficiaries(facility_id);

-- ─── Devices ───────────────────────────────────────────────────────────────

create table if not exists devices (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles(id) on delete cascade,
  device_id        text not null unique,  -- hardware device identifier
  platform         text not null check (platform in ('android','ios','web')),
  os_version       text,
  app_version      text,
  last_seen_at     timestamptz default now(),
  is_active        boolean not null default true,
  created_at       timestamptz default now()
);

create index if not exists idx_devices_user_id on devices(user_id);

-- ─── Risk Rules ────────────────────────────────────────────────────────────

create table if not exists risk_rules (
  id               uuid primary key default gen_random_uuid(),
  name             text not null unique,
  description      text,
  rule_type        text not null check (rule_type in (
    'CCTV_OFFLINE', 'ATTENDANCE_VARIANCE', 'INSPECTION_OVERDUE',
    'COMPLIANCE_FAILURE', 'EVIDENCE_REUSE', 'LOCATION_ANOMALY',
    'REPEATED_FINDING'
  )),
  condition_config jsonb not null,  -- { "operator": "<", "field": "variance_pct", "threshold": -30 }
  severity         text not null check (severity in ('low','medium','high','critical')),
  weight           numeric(5,2) default 1.0,
  is_active        boolean not null default true,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- Seed default rules
insert into risk_rules (name, description, rule_type, condition_config, severity, weight) values
  ('CCTV Offline 24h',      'Camera offline for more than 24 hours',           'CCTV_OFFLINE',       '{"hours_threshold": 24}',                           'high',     3.0),
  ('Attendance Drop 30%',   'Attendance drops more than 30% below baseline',   'ATTENDANCE_VARIANCE','{"operator": "<", "threshold": -30}',              'high',     2.5),
  ('Inspection Overdue 7d', 'Inspection not completed within 7 days',          'INSPECTION_OVERDUE', '{"days_threshold": 7}',                             'medium',   2.0),
  ('Compliance Expired',    'Compliance certificate has expired',              'COMPLIANCE_FAILURE', '{"status": "EXPIRED"}',                             'critical', 4.0),
  ('GPS Location Anomaly',  'Inspector GPS shows location mismatch',           'LOCATION_ANOMALY',   '{"accuracy_max_m": 100}',                           'high',     3.5),
  ('Evidence Reuse',        'Same evidence hash submitted twice',              'EVIDENCE_REUSE',     '{}',                                                'critical', 5.0)
on conflict (name) do nothing;

-- ─── Risk Signals ──────────────────────────────────────────────────────────

create table if not exists risk_signals (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references projects(id),
  facility_id      uuid references facilities(id),
  inspection_id    uuid references inspections(id),
  rule_id          uuid references risk_rules(id),
  signal_type      text not null check (signal_type in (
    'CCTV_OFFLINE','ATTENDANCE_ANOMALY','INSPECTION_OVERDUE',
    'COMPLIANCE_FAILURE','REPEATED_FINDING','EVIDENCE_REUSE','LOCATION_ANOMALY'
  )),
  severity         text not null check (severity in ('low','medium','high','critical')),
  title            text not null,
  description      text,
  evidence_data    jsonb default '{}',
  is_resolved      boolean default false,
  resolved_by      uuid references profiles(id),
  resolved_at      timestamptz,
  resolution_note  text,
  created_at       timestamptz default now()
);

create index if not exists idx_risk_signals_project_id on risk_signals(project_id);
create index if not exists idx_risk_signals_unresolved on risk_signals(is_resolved) where is_resolved = false;

-- ─── Compliance Requirements ───────────────────────────────────────────────

create table if not exists compliance_requirements (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  description      text,
  category         text not null,  -- 'safety', 'hygiene', 'documentation', 'financial'
  applies_to       text default 'all' check (applies_to in ('all','hostel','office','field')),
  requires_renewal boolean default false,
  validity_days    integer,        -- days before expiry
  created_at       timestamptz default now()
);

-- ─── Compliance Records ────────────────────────────────────────────────────

create table if not exists compliance_records (
  id               uuid primary key default gen_random_uuid(),
  requirement_id   uuid not null references compliance_requirements(id),
  project_id       uuid not null references projects(id),
  facility_id      uuid references facilities(id),
  status           text not null default 'PENDING_VERIFICATION'
                     check (status in ('COMPLIANT','PARTIAL','NON_COMPLIANT','PENDING_VERIFICATION','EXPIRED')),
  evidence_path    text,
  verified_by      uuid references profiles(id),
  verified_at      timestamptz,
  expires_at       timestamptz,
  notes            text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create index if not exists idx_compliance_records_project on compliance_records(project_id);
create index if not exists idx_compliance_records_status on compliance_records(status);

-- ─── Corrective Actions ────────────────────────────────────────────────────

create table if not exists corrective_actions (
  id               uuid primary key default gen_random_uuid(),
  finding_id       uuid references anomalies(id),       -- linked anomaly/risk signal
  project_id       uuid not null references projects(id),
  facility_id      uuid references facilities(id),
  title            text not null,
  description      text,
  assigned_to      uuid references profiles(id),
  priority         text default 'normal' check (priority in ('low','normal','high','critical')),
  status           text not null default 'OPEN'
                     check (status in ('OPEN','IN_PROGRESS','SUBMITTED','VERIFIED','REJECTED','CLOSED')),
  due_date         date,
  resolution_note  text,
  resolution_evidence_path text,
  verified_by      uuid references profiles(id),
  verified_at      timestamptz,
  closed_at        timestamptz,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create index if not exists idx_corrective_actions_project on corrective_actions(project_id);
create index if not exists idx_corrective_actions_status on corrective_actions(status);

-- ─── Reports ───────────────────────────────────────────────────────────────

create table if not exists reports (
  id               uuid primary key default gen_random_uuid(),
  inspection_id    uuid not null references inspections(id),
  project_id       uuid not null references projects(id),
  created_by       uuid not null references profiles(id),
  title            text,
  summary          text,
  findings         jsonb default '[]',   -- [{category, description, severity, evidence_ids}]
  recommendations  jsonb default '[]',
  status           text not null default 'DRAFT'
                     check (status in ('DRAFT','AI_GENERATED','SUBMITTED','RETURNED','APPROVED','REJECTED')),
  ai_generated     boolean default false,
  ai_model         text,                 -- which Ollama model if AI-generated
  approved_by      uuid references profiles(id),
  approved_at      timestamptz,
  rejected_by      uuid references profiles(id),
  rejected_at      timestamptz,
  return_notes     text,
  export_path      text,                 -- PDF storage path
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create index if not exists idx_reports_inspection on reports(inspection_id);
create index if not exists idx_reports_project on reports(project_id);
create index if not exists idx_reports_status on reports(status);

-- ─── CCTV Sources ──────────────────────────────────────────────────────────

create table if not exists cctv_sources (
  id               uuid primary key default gen_random_uuid(),
  facility_id      uuid not null references facilities(id) on delete cascade,
  name             text not null,
  stream_url       text not null,         -- RTSP/RTMP URL (encrypted at rest)
  snapshot_url     text,
  status           text not null default 'UNKNOWN'
                     check (status in ('ONLINE','OFFLINE','MAINTENANCE','UNKNOWN')),
  last_seen_at     timestamptz,
  last_health_check timestamptz,
  resolution       text,                  -- '1080p', '720p'
  has_audio        boolean default false,
  has_recording    boolean default true,
  storage_bucket   text,                  -- Supabase Storage bucket for recordings
  is_active        boolean not null default true,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create index if not exists idx_cctv_sources_facility on cctv_sources(facility_id);
create index if not exists idx_cctv_sources_status on cctv_sources(status);

-- ─── CCTV Health Events ────────────────────────────────────────────────────

create table if not exists cctv_health_events (
  id               uuid primary key default gen_random_uuid(),
  camera_id        uuid not null references cctv_sources(id) on delete cascade,
  status           text not null check (status in ('ONLINE','OFFLINE','MAINTENANCE')),
  latency_ms       integer,
  error_message    text,
  checked_at       timestamptz default now()
);

create index if not exists idx_cctv_health_camera on cctv_health_events(camera_id);
create index if not exists idx_cctv_health_time on cctv_health_events(checked_at desc);

-- ─── CCTV Stream Sessions ──────────────────────────────────────────────────

create table if not exists cctv_stream_sessions (
  id               uuid primary key default gen_random_uuid(),
  camera_id        uuid not null references cctv_sources(id),
  user_id          uuid not null references profiles(id),
  session_token    text not null unique,
  expires_at       timestamptz not null,
  created_at       timestamptz default now()
);

-- ─── Inspection Checklists ─────────────────────────────────────────────────

create table if not exists inspection_checklists (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  description      text,
  inspection_type  text not null check (inspection_type in ('surprise','scheduled','video','follow_up','all')),
  is_published     boolean default false,
  is_archived      boolean default false,
  created_by       uuid references profiles(id),
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ─── Inspection Questions ──────────────────────────────────────────────────

create table if not exists inspection_questions (
  id               uuid primary key default gen_random_uuid(),
  checklist_id     uuid not null references inspection_checklists(id) on delete cascade,
  question_text    text not null,
  question_type    text not null check (question_type in (
    'YES_NO','TEXT','NUMBER','SINGLE_CHOICE','MULTIPLE_CHOICE','PHOTO_REQUIRED','DOCUMENT_REQUIRED'
  )),
  options          jsonb,                -- for SINGLE_CHOICE/MULTIPLE_CHOICE: ["option1","option2"]
  is_required      boolean default true,
  sort_order       integer default 0,
  created_at       timestamptz default now()
);

create index if not exists idx_inspection_questions_checklist on inspection_questions(checklist_id);

-- ─── Inspection Answers ────────────────────────────────────────────────────

create table if not exists inspection_answers (
  id               uuid primary key default gen_random_uuid(),
  inspection_id    uuid not null references inspections(id) on delete cascade,
  question_id      uuid not null references inspection_questions(id),
  answered_by      uuid not null references profiles(id),
  answer_value     jsonb not null,       -- flexible: boolean, string, number, array
  evidence_id      uuid references evidence(id),
  notes            text,
  created_at       timestamptz default now(),
  unique (inspection_id, question_id)
);

create index if not exists idx_inspection_answers_inspection on inspection_answers(inspection_id);

-- ─── Evidence Versions ─────────────────────────────────────────────────────

create table if not exists evidence_versions (
  id               uuid primary key default gen_random_uuid(),
  evidence_id      uuid not null references evidence(id) on delete cascade,
  version_number   integer not null default 1,
  storage_path     text not null,
  sha256_hash      text not null,
  file_size_bytes  bigint,
  uploaded_by      uuid references profiles(id),
  upload_reason    text,                 -- 'original', 'replacement', 'additional_angle'
  created_at       timestamptz default now()
);

create index if not exists idx_evidence_versions_evidence on evidence_versions(evidence_id);

-- ─── Documents ─────────────────────────────────────────────────────────────

create table if not exists documents (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid references projects(id),
  inspection_id    uuid references inspections(id),
  uploaded_by      uuid not null references profiles(id),
  title            text not null,
  document_type    text not null check (document_type in (
    'report','certificate','letter','form','photo','other'
  )),
  storage_path     text not null,
  file_name        text,
  file_size_bytes  bigint,
  mime_type        text,
  sha256_hash      text,
  created_at       timestamptz default now()
);

create index if not exists idx_documents_project on documents(project_id);
create index if not exists idx_documents_inspection on documents(inspection_id);

-- ─── Document Extractions (OCR/AI) ────────────────────────────────────────

create table if not exists document_extractions (
  id               uuid primary key default gen_random_uuid(),
  document_id      uuid not null references documents(id) on delete cascade,
  raw_text         text,
  structured_data  jsonb,                -- extracted fields
  confidence       numeric(5,2),
  model_used       text,                 -- 'ollama', 'tesseract', etc.
  requires_human_review boolean default false,
  reviewed_by      uuid references profiles(id),
  reviewed_at      timestamptz,
  created_at       timestamptz default now()
);

create index if not exists idx_document_extractions_document on document_extractions(document_id);

-- ─── Video Participants ────────────────────────────────────────────────────

create table if not exists video_participants (
  id               uuid primary key default gen_random_uuid(),
  session_id       uuid not null references video_verification_sessions(id) on delete cascade,
  user_id          uuid not null references profiles(id),
  role             text not null check (role in ('initiator','participant')),
  joined_at        timestamptz,
  left_at          timestamptz,
  connection_status text default 'waiting' check (connection_status in (
    'waiting','connected','failed','disconnected'
  )),
  created_at       timestamptz default now()
);

create index if not exists idx_video_participants_session on video_participants(session_id);

-- ─── Additional Indexes ────────────────────────────────────────────────────

create index if not exists idx_inspections_status on inspections(status);
create index if not exists idx_inspections_priority on inspections(priority);
create index if not exists idx_assignments_officer on inspection_assignments(officer_id);
create index if not exists idx_assignments_status on inspection_assignments(status);
create index if not exists idx_evidence_project on evidence(project_id);
create index if not exists idx_evidence_hash on evidence(sha256_hash);
create index if not exists idx_risk_signals_type on risk_signals(signal_type);
create index if not exists idx_beneficiaries_active on beneficiaries(is_active) where is_active = true;
create index if not exists idx_staff_active on staff(is_active) where is_active = true;

-- ─── Updated_at triggers for new tables ────────────────────────────────────

create trigger trg_facilities_updated_at
  before update on facilities
  for each row execute function update_updated_at();

create trigger trg_staff_updated_at
  before update on staff
  for each row execute function update_updated_at();

create trigger trg_beneficiaries_updated_at
  before update on beneficiaries
  for each row execute function update_updated_at();

create trigger trg_risk_rules_updated_at
  before update on risk_rules
  for each row execute function update_updated_at();

create trigger trg_compliance_records_updated_at
  before update on compliance_records
  for each row execute function update_updated_at();

create trigger trg_corrective_actions_updated_at
  before update on corrective_actions
  for each row execute function update_updated_at();

create trigger trg_reports_updated_at
  before update on reports
  for each row execute function update_updated_at();

create trigger trg_cctv_sources_updated_at
  before update on cctv_sources
  for each row execute function update_updated_at();

create trigger trg_inspection_checklists_updated_at
  before update on inspection_checklists
  for each row execute function update_updated_at();
