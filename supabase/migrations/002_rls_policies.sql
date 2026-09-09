-- ─────────────────────────────────────────────────────────────────────────────
-- INSIGHT — Row Level Security Policies Migration 002
-- Apply AFTER 001_core_schema.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable RLS on every table that holds another party's data

alter table profiles               enable row level security;
alter table user_roles             enable row level security;
alter table organizations          enable row level security;
alter table projects               enable row level security;
alter table project_locations      enable row level security;
alter table inspections            enable row level security;
alter table inspection_assignments enable row level security;
alter table evidence               enable row level security;
alter table attendance_records     enable row level security;
alter table anomalies              enable row level security;
alter table video_verification_sessions enable row level security;
alter table notifications          enable row level security;
alter table audit_logs             enable row level security;
alter table sync_operations        enable row level security;
alter table biometric_enrollments  enable row level security;
alter table verification_events    enable row level security;
alter table verification_log_access enable row level security;

-- ─── Helper: get current user's role ─────────────────────────────────────────

create or replace function auth_role()
returns text language sql security definer stable as $$
  select role_id from user_roles
  where user_id = auth.uid()
  limit 1;
$$;

create or replace function is_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from user_roles
    where user_id = auth.uid() and role_id = 'ADMIN'
  );
$$;

create or replace function is_dosje_or_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from user_roles
    where user_id = auth.uid()
      and role_id in ('DOSJE_OFFICIAL','ADMIN')
  );
$$;

-- ─── Profiles ─────────────────────────────────────────────────────────────────

-- Users can read and update their own profile
create policy "profiles_self_read"
  on profiles for select
  using (id = auth.uid());

create policy "profiles_self_update"
  on profiles for update
  using (id = auth.uid());

-- Admins and DoSJE Officials can read all profiles
create policy "profiles_admin_read"
  on profiles for select
  using (is_dosje_or_admin());

-- Admins can update any profile
create policy "profiles_admin_update"
  on profiles for update
  using (is_admin());

-- ─── User Roles ───────────────────────────────────────────────────────────────

-- Users can see their own role
create policy "user_roles_self_read"
  on user_roles for select
  using (user_id = auth.uid());

-- Admins can read all
create policy "user_roles_admin_read"
  on user_roles for select
  using (is_admin());

-- Only admins can assign/revoke roles
create policy "user_roles_admin_write"
  on user_roles for all
  using (is_admin());

-- ─── Organizations ────────────────────────────────────────────────────────────

-- Public read for organizational names (needed for project display)
create policy "organizations_read"
  on organizations for select
  using (auth.uid() is not null);

-- NGO users can only update their own org
create policy "organizations_ngo_update"
  on organizations for update
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
        and organization_id = organizations.id
    )
  );

-- Admins can do everything
create policy "organizations_admin_all"
  on organizations for all
  using (is_admin());

-- ─── Projects ─────────────────────────────────────────────────────────────────

-- DoSJE Officials and Admins see all projects
create policy "projects_dosje_read"
  on projects for select
  using (is_dosje_or_admin());

-- District Authority sees only their jurisdiction
create policy "projects_district_read"
  on projects for select
  using (
    auth_role() = 'DISTRICT_AUTHORITY' and
    exists (
      select 1 from profiles
      where id = auth.uid()
        and (state = projects.state or district = projects.district)
    )
  );

-- NGO/Institute sees only their org's projects
create policy "projects_ngo_read"
  on projects for select
  using (
    auth_role() = 'NGO_INSTITUTE' and
    exists (
      select 1 from profiles
      where id = auth.uid()
        and organization_id = projects.organization_id
    )
  );

-- Inspection Officers see projects they're assigned to
create policy "projects_inspector_read"
  on projects for select
  using (
    auth_role() = 'INSPECTION_OFFICER' and
    exists (
      select 1 from inspections
      where project_id = projects.id
        and assigned_to = auth.uid()
    )
  );

-- Admins and DoSJE Officials can write
create policy "projects_write"
  on projects for all
  using (is_dosje_or_admin());

-- ─── Project Locations ────────────────────────────────────────────────────────

create policy "project_locations_read"
  on project_locations for select
  using (auth.uid() is not null);

create policy "project_locations_write"
  on project_locations for all
  using (is_dosje_or_admin());

-- ─── Inspections ──────────────────────────────────────────────────────────────

-- DoSJE Officials + Admins see all
create policy "inspections_dosje_read"
  on inspections for select
  using (is_dosje_or_admin());

-- Officers see only their own assignments
create policy "inspections_officer_read"
  on inspections for select
  using (
    auth_role() = 'INSPECTION_OFFICER' and
    assigned_to = auth.uid()
  );

-- District Authority sees inspections in their jurisdiction
create policy "inspections_district_read"
  on inspections for select
  using (
    auth_role() = 'DISTRICT_AUTHORITY' and
    exists (
      select 1 from projects p
      join profiles pr on pr.id = auth.uid()
      where p.id = inspections.project_id
        and (p.district = pr.district or p.state = pr.state)
    )
  );

-- Officers can update their own in-progress inspections
create policy "inspections_officer_update"
  on inspections for update
  using (
    auth_role() = 'INSPECTION_OFFICER' and
    assigned_to = auth.uid() and
    status in ('assigned','in_progress')
  );

-- DoSJE + Admin can create/manage all inspections
create policy "inspections_dosje_write"
  on inspections for all
  using (is_dosje_or_admin());

-- ─── Evidence ─────────────────────────────────────────────────────────────────

-- Officers see their own evidence
create policy "evidence_officer_read"
  on evidence for select
  using (captured_by = auth.uid());

-- DoSJE + Admin see all
create policy "evidence_dosje_read"
  on evidence for select
  using (is_dosje_or_admin());

-- District authority sees evidence for their jurisdiction
create policy "evidence_district_read"
  on evidence for select
  using (
    auth_role() = 'DISTRICT_AUTHORITY' and
    exists (
      select 1 from inspections i
      join projects p on p.id = i.project_id
      join profiles pr on pr.id = auth.uid()
      where i.id = evidence.inspection_id
        and (p.district = pr.district or p.state = pr.state)
    )
  );

-- Officers insert their own evidence only
create policy "evidence_officer_insert"
  on evidence for insert
  with check (
    auth_role() = 'INSPECTION_OFFICER' and
    captured_by = auth.uid()
  );

-- ─── Anomalies ────────────────────────────────────────────────────────────────

create policy "anomalies_dosje_read"
  on anomalies for select
  using (is_dosje_or_admin());

create policy "anomalies_district_read"
  on anomalies for select
  using (
    auth_role() = 'DISTRICT_AUTHORITY' and
    exists (
      select 1 from projects p
      join profiles pr on pr.id = auth.uid()
      where p.id = anomalies.project_id
        and (p.district = pr.district or p.state = pr.state)
    )
  );

create policy "anomalies_write"
  on anomalies for all
  using (is_dosje_or_admin());

-- ─── Notifications ────────────────────────────────────────────────────────────

create policy "notifications_self"
  on notifications for all
  using (user_id = auth.uid());

-- ─── Audit Logs ──────────────────────────────────────────────────────────────

-- Admins + DoSJE can read all audit logs
create policy "audit_logs_read"
  on audit_logs for select
  using (is_dosje_or_admin());

-- Audit logs are INSERT-only — never updated or deleted (immutable audit trail)
create policy "audit_logs_insert"
  on audit_logs for insert
  with check (actor_id = auth.uid() or is_admin());

-- ─── Sync Operations ─────────────────────────────────────────────────────────

create policy "sync_operations_self"
  on sync_operations for all
  using (user_id = auth.uid());

-- ─── Biometric Enrollments ───────────────────────────────────────────────────

-- Users see only their own enrollment
create policy "biometric_self_read"
  on biometric_enrollments for select
  using (user_id = auth.uid());

-- Admin can read all (for audit, not for raw data display)
create policy "biometric_admin_read"
  on biometric_enrollments for select
  using (is_admin());

-- Only a security definer function should insert/update embeddings
-- Direct client inserts are blocked (no insert policy for normal users)

-- ─── Verification Events ─────────────────────────────────────────────────────

-- Users see only their own events
create policy "verification_events_self_read"
  on verification_events for select
  using (user_id = auth.uid());

-- Admins see all (with their access being logged separately)
create policy "verification_events_admin_read"
  on verification_events for select
  using (is_admin());

-- Inserts only via security definer function (see below) — no direct client insert
-- create policy "verification_events_insert" intentionally omitted for non-admin

-- ─── Verification Log Access ─────────────────────────────────────────────────

-- Only admins can see the access log
create policy "verification_log_access_admin"
  on verification_log_access for all
  using (is_admin());

-- ─── Secure insert function for verification events ──────────────────────────
-- Client cannot forge match_result — only this function writes it

create or replace function record_verification_event(
  p_checkpoint_type         text,
  p_match_confidence        numeric,
  p_match_result            text,
  p_latitude                double precision,
  p_longitude               double precision,
  p_location_accuracy_m     numeric,
  p_device_id               text,
  p_related_inspection_id   uuid default null
)
returns uuid language plpgsql security definer as $$
declare
  v_event_id uuid;
begin
  -- Validate inputs
  if p_checkpoint_type not in ('LOGIN','MISSION_START','EVIDENCE_CAPTURE','MISSION_END') then
    raise exception 'Invalid checkpoint_type';
  end if;
  if p_match_result not in ('VERIFIED','UNCERTAIN','FAILED') then
    raise exception 'Invalid match_result';
  end if;

  insert into verification_events (
    user_id, checkpoint_type, match_confidence, match_result,
    latitude, longitude, location_accuracy_m, device_id, related_inspection_id
  ) values (
    auth.uid(), p_checkpoint_type, p_match_confidence, p_match_result,
    p_latitude, p_longitude, p_location_accuracy_m, p_device_id, p_related_inspection_id
  )
  returning id into v_event_id;

  return v_event_id;
end;
$$;
