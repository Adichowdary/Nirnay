-- ─────────────────────────────────────────────────────────────────────────────
-- INSIGHT — Core Schema Migration 001
-- Run in Supabase SQL Editor or via supabase db push
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID generation
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm"; -- for fuzzy search

-- ─── Roles ───────────────────────────────────────────────────────────────────

create table if not exists roles (
  id   text primary key,  -- 'DOSJE_OFFICIAL', 'INSPECTION_OFFICER', etc.
  name text not null
);

insert into roles (id, name) values
  ('DOSJE_OFFICIAL',     'DoSJE Official'),
  ('INSPECTION_OFFICER', 'PMU / Inspection Officer'),
  ('NGO_INSTITUTE',      'NGO / Institute'),
  ('DISTRICT_AUTHORITY', 'State / District Authority'),
  ('ADMIN',              'System Administrator')
on conflict (id) do nothing;

-- ─── Profiles ─────────────────────────────────────────────────────────────────

create table if not exists profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  full_name            text,
  official_id          text unique,
  phone                text,
  organization_id      uuid,                 -- FK added after organizations table
  state                text,
  district             text,
  avatar_url           text,
  biometric_status     text not null default 'NOT_ENROLLED'
                         check (biometric_status in ('NOT_ENROLLED','ENROLLED','CONSENT_DECLINED')),
  consent_given_at     timestamptz,
  consent_version      text,
  is_active            boolean not null default true,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

-- ─── User → Role mapping ──────────────────────────────────────────────────────

create table if not exists user_roles (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  role_id    text not null references roles(id),
  granted_by uuid references profiles(id),
  granted_at timestamptz default now(),
  unique (user_id, role_id)
);

-- ─── Organizations ────────────────────────────────────────────────────────────

create table if not exists organizations (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  type            text not null check (type in ('NGO','INSTITUTE','GOVERNMENT','PRIVATE')),
  registration_no text unique,
  state           text,
  district        text,
  address         text,
  contact_email   text,
  contact_phone   text,
  is_verified     boolean default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Backfill FK on profiles
alter table profiles
  add constraint profiles_organization_id_fkey
  foreign key (organization_id) references organizations(id)
  on delete set null;

-- ─── Projects ─────────────────────────────────────────────────────────────────

create table if not exists projects (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  scheme_name         text,
  description         text,
  organization_id     uuid references organizations(id),
  state               text not null,
  district            text not null,
  block               text,
  status              text not null default 'active'
                        check (status in ('active','under-inspection','completed','flagged','suspended')),
  ai_risk_score       numeric(4,1) default 0,
  health_overall      numeric(5,2) default 100,
  health_attendance   numeric(5,2) default 100,
  health_evidence     numeric(5,2) default 100,
  health_compliance   numeric(5,2) default 100,
  cctv_total          integer default 0,
  cctv_online         integer default 0,
  beneficiary_count   integer default 0,
  last_inspection_at  timestamptz,
  created_by          uuid references profiles(id),
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- ─── Project Locations ────────────────────────────────────────────────────────

create table if not exists project_locations (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references projects(id) on delete cascade,
  label        text,                  -- e.g. "Main Building", "Hostel Block A"
  latitude     double precision not null,
  longitude    double precision not null,
  radius_m     integer default 200,   -- geofence radius for GPS verification
  is_primary   boolean default false,
  created_at   timestamptz default now()
);

-- ─── Inspections ──────────────────────────────────────────────────────────────

create table if not exists inspections (
  id                  uuid primary key default gen_random_uuid(),
  project_id          uuid not null references projects(id),
  inspection_type     text not null check (inspection_type in ('surprise','scheduled','video','follow_up')),
  status              text not null default 'pending'
                        check (status in ('pending','assigned','in_progress','submitted','reviewed','closed')),
  priority            text default 'normal' check (priority in ('low','normal','high','critical')),
  assigned_to         uuid references profiles(id),
  assigned_by         uuid references profiles(id),
  assignment_score    numeric(5,2),   -- weighted selection score (transparent)
  assignment_reason   text,           -- human-readable reason for assignment
  scheduled_for       timestamptz,
  started_at          timestamptz,
  submitted_at        timestamptz,
  reviewed_at         timestamptz,
  reviewed_by         uuid references profiles(id),
  gps_verified        boolean,
  gps_lat             double precision,
  gps_lon             double precision,
  gps_accuracy_m      numeric,
  notes               text,
  review_notes        text,
  anomaly_flags       jsonb default '[]',
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- ─── Inspection Assignments (queue / history) ─────────────────────────────────

create table if not exists inspection_assignments (
  id            uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references inspections(id) on delete cascade,
  officer_id    uuid not null references profiles(id),
  assigned_by   uuid references profiles(id),
  assigned_at   timestamptz default now(),
  notified_at   timestamptz,
  accepted_at   timestamptz,
  status        text default 'pending' check (status in ('pending','accepted','declined','reassigned'))
);

-- ─── Evidence ─────────────────────────────────────────────────────────────────

create table if not exists evidence (
  id              uuid primary key default gen_random_uuid(),
  inspection_id   uuid not null references inspections(id) on delete cascade,
  project_id      uuid not null references projects(id),
  captured_by     uuid not null references profiles(id),
  type            text not null check (type in ('photo','video','audio','document')),
  storage_path    text not null,   -- path in Supabase Storage bucket
  file_name       text,
  file_size_bytes bigint,
  sha256_hash     text not null,   -- computed on-device before upload
  mime_type       text,
  latitude        double precision,
  longitude       double precision,
  location_accuracy_m numeric,
  captured_at     timestamptz not null,
  upload_at       timestamptz default now(),
  is_tampered     boolean default false,  -- set by integrity check
  metadata        jsonb default '{}'
);

-- ─── Attendance Records ───────────────────────────────────────────────────────

create table if not exists attendance_records (
  id            uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references inspections(id),
  project_id    uuid not null references projects(id),
  recorded_by   uuid not null references profiles(id),
  record_date   date not null,
  total_enrolled   integer,
  total_present    integer,
  total_absent     integer,
  is_gps_verified  boolean default false,
  notes            text,
  created_at       timestamptz default now()
);

-- ─── Anomalies ────────────────────────────────────────────────────────────────

create table if not exists anomalies (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references projects(id),
  inspection_id   uuid references inspections(id),
  type            text not null,       -- 'attendance_drop','cctv_offline','gps_mismatch', etc.
  severity        text not null check (severity in ('low','medium','high','critical')),
  signal_source   text not null check (signal_source in ('REAL','SIMULATED')),
  title           text not null,
  description     text,
  ai_explanation  text,                -- Ollama-generated, always labeled
  is_resolved     boolean default false,
  resolved_by     uuid references profiles(id),
  resolved_at     timestamptz,
  resolution_note text,
  created_at      timestamptz default now()
);

-- ─── Video Verification Sessions ─────────────────────────────────────────────

create table if not exists video_verification_sessions (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references projects(id),
  inspection_id   uuid references inspections(id),
  initiated_by    uuid not null references profiles(id),
  participant_ids uuid[] default '{}',
  status          text not null default 'pending'
                    check (status in ('pending','active','completed','failed','cancelled')),
  started_at      timestamptz,
  ended_at        timestamptz,
  recording_path  text,           -- Supabase Storage path if recorded
  notes           text,
  is_demo_stream  boolean default false,  -- if true, labeled DEMO STREAM in UI
  created_at      timestamptz default now()
);

-- ─── Notifications ────────────────────────────────────────────────────────────

create table if not exists notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  type        text not null,   -- 'assignment','reminder','anomaly','report_reviewed','vc_request'
  title       text not null,
  body        text,
  data        jsonb default '{}',
  is_read     boolean default false,
  read_at     timestamptz,
  created_at  timestamptz default now()
);

-- ─── Audit Logs ──────────────────────────────────────────────────────────────

create table if not exists audit_logs (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references profiles(id),
  actor_name   text,             -- denormalized for display even if profile deleted
  action       text not null,
  resource     text,             -- table or entity name
  resource_id  uuid,
  project_id   uuid references projects(id),
  metadata     jsonb default '{}',
  ip_address   text,
  user_agent   text,
  created_at   timestamptz default now()
);

-- ─── Sync Operations (offline queue tracking) ────────────────────────────────

create table if not exists sync_operations (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id),
  operation     text not null check (operation in ('insert','update','delete')),
  table_name    text not null,
  local_id      text,             -- Dexie local ID
  remote_id     uuid,
  payload       jsonb not null,
  status        text not null default 'pending'
                  check (status in ('pending','synced','failed','conflict')),
  error_message text,
  retry_count   integer default 0,
  synced_at     timestamptz,
  created_at    timestamptz default now()
);

-- ─── Biometric Enrollments ───────────────────────────────────────────────────

create table if not exists biometric_enrollments (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references profiles(id) on delete cascade,
  embedding_encrypted  bytea not null,   -- on-device embedding, encrypted at rest
  enrolled_at          timestamptz default now(),
  consent_given_at     timestamptz not null,
  consent_version      text not null
);

-- ─── Verification Events ─────────────────────────────────────────────────────

create table if not exists verification_events (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references profiles(id),
  checkpoint_type         text not null
                            check (checkpoint_type in ('LOGIN','MISSION_START','EVIDENCE_CAPTURE','MISSION_END')),
  match_confidence        numeric,
  match_result            text check (match_result in ('VERIFIED','UNCERTAIN','FAILED')),
  latitude                double precision,
  longitude               double precision,
  location_accuracy_m     numeric,
  device_id               text,
  related_inspection_id   uuid references inspections(id),
  created_at              timestamptz default now()
);

-- ─── Verification Log Access (who viewed whose verification history) ──────────

create table if not exists verification_log_access (
  id              uuid primary key default gen_random_uuid(),
  viewed_by       uuid not null references profiles(id),
  subject_user_id uuid not null references profiles(id),
  viewed_at       timestamptz default now()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

create index if not exists idx_user_roles_user_id        on user_roles(user_id);
create index if not exists idx_inspections_project_id    on inspections(project_id);
create index if not exists idx_inspections_assigned_to   on inspections(assigned_to);
create index if not exists idx_evidence_inspection_id    on evidence(inspection_id);
create index if not exists idx_anomalies_project_id      on anomalies(project_id);
create index if not exists idx_audit_logs_actor_id       on audit_logs(actor_id);
create index if not exists idx_audit_logs_created_at     on audit_logs(created_at desc);
create index if not exists idx_notifications_user_id     on notifications(user_id);
create index if not exists idx_verification_events_user  on verification_events(user_id);
create index if not exists idx_projects_state_district   on projects(state, district);

-- Full-text search on projects
create index if not exists idx_projects_name_trgm
  on projects using gin (name gin_trgm_ops);

-- ─── Updated_at trigger function ─────────────────────────────────────────────

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

create trigger trg_projects_updated_at
  before update on projects
  for each row execute function update_updated_at();

create trigger trg_inspections_updated_at
  before update on inspections
  for each row execute function update_updated_at();

create trigger trg_organizations_updated_at
  before update on organizations
  for each row execute function update_updated_at();

-- ─── Profile auto-creation on auth.users insert ──────────────────────────────

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
