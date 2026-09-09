-- ─────────────────────────────────────────────────────────────────────────────
-- INSIGHT — Demo Seed Data Migration 003
-- Creates 5 demo accounts (one per role) + sample projects + organizations
-- ALL demo data is clearly marked with is_demo flags / naming conventions
-- ─────────────────────────────────────────────────────────────────────────────
-- NOTE: Run this AFTER creating the auth users in Supabase Auth manually
-- or via the Supabase dashboard → Authentication → Add User for each email.
-- Then paste the returned UUIDs into the variables below.
--
-- Demo accounts:
--   official@dosje.gov.in    / Demo@Insight2025  → DOSJE_OFFICIAL
--   inspector@dosje.gov.in   / Demo@Insight2025  → INSPECTION_OFFICER
--   contact@samplengo.org    / Demo@Insight2025  → NGO_INSTITUTE
--   collector@rajasthan.gov  / Demo@Insight2025  → DISTRICT_AUTHORITY
--   admin@insight.gov.in     / Demo@Insight2025  → ADMIN
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Step 1: Create these users in Supabase Auth Dashboard first, then use their UUIDs below

-- Placeholder UUIDs — replace with actual UUIDs after creating auth users
do $$
declare
  v_official_id     uuid := '00000000-0000-0000-0000-000000000001';
  v_inspector_id    uuid := '00000000-0000-0000-0000-000000000002';
  v_ngo_id          uuid := '00000000-0000-0000-0000-000000000003';
  v_district_id     uuid := '00000000-0000-0000-0000-000000000004';
  v_admin_id        uuid := '00000000-0000-0000-0000-000000000005';
  v_org_id          uuid;
begin

  -- ── Organizations ────────────────────────────────────────────────────────
  insert into organizations (id, name, type, registration_no, state, district, is_verified)
  values
    ('a0000000-0000-0000-0000-000000000001', 'Aadarsh Seva Sansthan [DEMO]',    'NGO',       'RAJ/NGO/2018/001', 'Rajasthan', 'Jaipur',    true),
    ('a0000000-0000-0000-0000-000000000002', 'National Institute of Excellence [DEMO]', 'INSTITUTE', 'NI/2019/422',      'Maharashtra','Mumbai',    true),
    ('a0000000-0000-0000-0000-000000000003', 'Disha Foundation [DEMO]',          'NGO',       'MP/NGO/2020/077',  'Madhya Pradesh','Bhopal', false)
  on conflict do nothing;

  v_org_id := 'a0000000-0000-0000-0000-000000000001';

  -- ── Profiles ─────────────────────────────────────────────────────────────
  insert into profiles (id, full_name, official_id, state, district, organization_id, is_active)
  values
    (v_official_id,  'Rajesh Kumar Sharma [DEMO]',  'IAS/2010/RJ/001', 'Rajasthan',      'Jaipur',    null,        true),
    (v_inspector_id, 'Priya Mehta [DEMO]',          'PMU/2022/DL/044', 'Delhi',           'New Delhi', null,        true),
    (v_ngo_id,       'Anjali Verma [DEMO]',         null,              'Rajasthan',      'Jaipur',    v_org_id,    true),
    (v_district_id,  'Suresh Chand Gupta [DEMO]',   'IAS/2015/RJ/022', 'Rajasthan',      'Jaipur',    null,        true),
    (v_admin_id,     'Admin User [DEMO]',            'SYS/ADMIN/001',   null,              null,        null,        true)
  on conflict (id) do nothing;

  -- ── User Roles ───────────────────────────────────────────────────────────
  insert into user_roles (user_id, role_id, granted_by)
  values
    (v_official_id,  'DOSJE_OFFICIAL',     v_admin_id),
    (v_inspector_id, 'INSPECTION_OFFICER', v_admin_id),
    (v_ngo_id,       'NGO_INSTITUTE',      v_admin_id),
    (v_district_id,  'DISTRICT_AUTHORITY', v_admin_id),
    (v_admin_id,     'ADMIN',              v_admin_id)
  on conflict do nothing;

  -- ── Projects ─────────────────────────────────────────────────────────────
  insert into projects (
    id, name, scheme_name, state, district, status,
    ai_risk_score, health_overall, cctv_total, cctv_online, beneficiary_count,
    organization_id, created_by
  ) values
    (
      'b0000000-0000-0000-0000-000000000001',
      'Jaipur Girls Hostel Renovation [DEMO]',
      'Post Matric Scholarship Scheme',
      'Rajasthan', 'Jaipur', 'active',
      72.4, 68.0, 6, 4, 120,
      'a0000000-0000-0000-0000-000000000001', v_official_id
    ),
    (
      'b0000000-0000-0000-0000-000000000002',
      'Bhopal SC/ST Residential School [DEMO]',
      'Eklavya Model Residential School',
      'Madhya Pradesh', 'Bhopal', 'flagged',
      89.1, 42.0, 4, 0, 340,
      'a0000000-0000-0000-0000-000000000003', v_official_id
    ),
    (
      'b0000000-0000-0000-0000-000000000003',
      'Mumbai Skill Development Centre [DEMO]',
      'National Scheme for SC/ST',
      'Maharashtra', 'Mumbai', 'active',
      31.2, 91.0, 8, 8, 85,
      'a0000000-0000-0000-0000-000000000002', v_official_id
    ),
    (
      'b0000000-0000-0000-0000-000000000004',
      'Alwar Tribal Welfare Hostel [DEMO]',
      'Pre Matric Scholarship',
      'Rajasthan', 'Alwar', 'under-inspection',
      55.6, 77.0, 3, 2, 60,
      'a0000000-0000-0000-0000-000000000001', v_official_id
    ),
    (
      'b0000000-0000-0000-0000-000000000005',
      'Delhi Divyang Rehabilitation Centre [DEMO]',
      'ADIP Scheme',
      'Delhi', 'New Delhi', 'completed',
      18.9, 95.0, 5, 5, 210,
      null, v_official_id
    )
  on conflict do nothing;

  -- ── Project Locations ────────────────────────────────────────────────────
  insert into project_locations (project_id, label, latitude, longitude, radius_m, is_primary)
  values
    ('b0000000-0000-0000-0000-000000000001', 'Main Hostel Building', 26.9124, 75.7873, 200, true),
    ('b0000000-0000-0000-0000-000000000002', 'School Campus',        23.2599, 77.4126, 300, true),
    ('b0000000-0000-0000-0000-000000000003', 'Training Centre',      19.0760, 72.8777, 150, true),
    ('b0000000-0000-0000-0000-000000000004', 'Hostel Block',         27.5530, 76.6346, 200, true),
    ('b0000000-0000-0000-0000-000000000005', 'Centre Building',      28.6139, 77.2090, 250, true)
  on conflict do nothing;

  -- ── Anomalies (demo signals) ─────────────────────────────────────────────
  insert into anomalies (
    project_id, type, severity, signal_source, title, description, is_resolved
  ) values
    (
      'b0000000-0000-0000-0000-000000000001',
      'attendance_drop', 'high', 'SIMULATED',
      'Attendance dropped 34% in 7 days [DEMO SIGNAL]',
      'Reported attendance fell from 118 to 78 in the past 7 days without explanation. Pattern suggests possible falsification.',
      false
    ),
    (
      'b0000000-0000-0000-0000-000000000002',
      'cctv_offline', 'critical', 'SIMULATED',
      'All 4 CCTV cameras offline for 48h [DEMO SIGNAL]',
      'Complete CCTV outage at Bhopal SC/ST School. No maintenance ticket filed. Coincides with scheduled inspection.',
      false
    ),
    (
      'b0000000-0000-0000-0000-000000000004',
      'gps_mismatch', 'medium', 'SIMULATED',
      'Inspector GPS did not match project geofence [DEMO SIGNAL]',
      'GPS fix during last inspection was 1.2 km from project boundary. Inspector reported being on-site.',
      false
    )
  on conflict do nothing;

  -- ── Sample Inspection ─────────────────────────────────────────────────────
  insert into inspections (
    id, project_id, inspection_type, status, assigned_to, assigned_by,
    assignment_reason, priority
  ) values
    (
      'c0000000-0000-0000-0000-000000000001',
      'b0000000-0000-0000-0000-000000000001',
      'surprise', 'assigned',
      v_inspector_id, v_official_id,
      'Highest anomaly score in Rajasthan district (72.4). Attendance drop signal triggered auto-dispatch.',
      'high'
    )
  on conflict do nothing;

  -- ── Audit Log (seed) ─────────────────────────────────────────────────────
  insert into audit_logs (actor_id, actor_name, action, resource, project_id, metadata)
  values
    (v_official_id, 'Rajesh Kumar Sharma [DEMO]', 'inspection_assigned', 'inspections',
     'b0000000-0000-0000-0000-000000000001',
     '{"inspection_id":"c0000000-0000-0000-0000-000000000001","reason":"anomaly_triggered"}'::jsonb),
    (v_official_id, 'Rajesh Kumar Sharma [DEMO]', 'anomaly_created', 'anomalies',
     'b0000000-0000-0000-0000-000000000002',
     '{"type":"cctv_offline","severity":"critical"}'::jsonb)
  on conflict do nothing;

end $$;
