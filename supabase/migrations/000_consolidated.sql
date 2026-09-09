-- ============================================================
-- INSIGHT Platform — Consolidated Migration
-- Run this in Supabase SQL Editor to set up all tables
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- 001: Core Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO roles (id, name, description) VALUES
  ('CENTRAL_ADMIN', 'Central Admin', 'National-level directorate oversight'),
  ('STATE_ADMIN', 'State Admin', 'State-level administration and district oversight'),
  ('DOSJE_OFFICIAL', 'DoSJE Official', 'Ministry oversight officer'),
  ('INSPECTION_OFFICER', 'Inspection Officer', 'Field inspection squad'),
  ('NGO_INSTITUTE', 'NGO/Institute', 'Grantee organization contact'),
  ('ADMIN', 'Administrator', 'System governance admin')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  official_id TEXT UNIQUE,
  phone TEXT,
  organization_id UUID,
  state TEXT,
  district TEXT,
  avatar_url TEXT,
  biometric_status TEXT DEFAULT 'not_enrolled',
  consent_given BOOLEAN DEFAULT false,
  consent_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role_id TEXT REFERENCES roles(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('NGO','INSTITUTE','GOVERNMENT','PRIVATE')),
  registration_number TEXT,
  state TEXT,
  district TEXT,
  address TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  compliance_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  scheme_name TEXT,
  description TEXT,
  organization_id UUID REFERENCES organizations(id),
  state TEXT NOT NULL,
  district TEXT NOT NULL,
  block TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','under-inspection','completed','flagged','suspended')),
  ai_risk_score INTEGER DEFAULT 0,
  health_overall INTEGER DEFAULT 0,
  health_compliance INTEGER DEFAULT 0,
  health_attendance INTEGER DEFAULT 0,
  health_inspection INTEGER DEFAULT 0,
  health_evidence INTEGER DEFAULT 0,
  health_cctv INTEGER DEFAULT 0,
  cctv_total INTEGER DEFAULT 0,
  cctv_online INTEGER DEFAULT 0,
  registered_beneficiaries INTEGER DEFAULT 0,
  expected_attendance INTEGER DEFAULT 0,
  incharge_name TEXT,
  incharge_phone TEXT,
  last_inspection_date TIMESTAMPTZ,
  next_inspection_due TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  geofence_radius_meters INTEGER DEFAULT 200,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  facility_id UUID,
  type TEXT CHECK (type IN ('surprise','scheduled','video','follow_up')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','assigned','acknowledged','in_progress','arrived','submitted','under_review','approved','rejected','returned','paused','cancelled','closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low','normal','high','critical')),
  inspector_id UUID,
  inspector_name TEXT,
  scheduled_for TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  gps_verified BOOLEAN DEFAULT false,
  gps_lat DOUBLE PRECISION,
  gps_lon DOUBLE PRECISION,
  gps_accuracy_m DOUBLE PRECISION,
  current_step TEXT,
  attendance_reported INTEGER DEFAULT 0,
  attendance_observed INTEGER DEFAULT 0,
  beneficiaries_met INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inspection_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID REFERENCES inspections(id),
  inspector_id UUID,
  inspector_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','reassigned')),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID REFERENCES inspections(id),
  project_id UUID REFERENCES projects(id),
  type TEXT CHECK (type IN ('photo','video','audio','document')),
  file_name TEXT,
  file_url TEXT,
  sha256_hash TEXT,
  mime_type TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location_accuracy_m DOUBLE PRECISION,
  captured_at TIMESTAMPTZ,
  is_verified BOOLEAN DEFAULT false,
  is_tampered BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  inspection_id UUID REFERENCES inspections(id),
  date DATE NOT NULL,
  enrolled INTEGER DEFAULT 0,
  present INTEGER DEFAULT 0,
  absent INTEGER DEFAULT 0,
  variance_percent DOUBLE PRECISION DEFAULT 0,
  is_anomaly BOOLEAN DEFAULT false,
  gps_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  type TEXT CHECK (type IN ('attendance_drop','cctv_offline','gps_mismatch','document_forgery','repeated_photo','ghost_beneficiary')),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  title TEXT,
  description TEXT,
  ai_explanation JSONB DEFAULT '{}',
  confidence INTEGER DEFAULT 0,
  risk_score INTEGER DEFAULT 0,
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  type TEXT,
  title TEXT,
  body TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  actor_name TEXT DEFAULT 'System',
  action TEXT NOT NULL,
  resource TEXT,
  resource_id TEXT,
  project_id TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sync_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  operation_type TEXT,
  entity_type TEXT,
  entity_id TEXT,
  payload JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','synced','conflict','failed')),
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  synced_at TIMESTAMPTZ
);

-- ============================================================
-- 004: Backend Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  module TEXT NOT NULL,
  description TEXT
);

INSERT INTO permissions (id, module, description) VALUES
  ('projects.view', 'project', 'View projects'),
  ('projects.edit', 'project', 'Edit projects'),
  ('inspections.view', 'inspection', 'View inspections'),
  ('inspections.create', 'inspection', 'Create inspections'),
  ('inspections.execute', 'inspection', 'Execute inspections'),
  ('inspections.review', 'inspection', 'Review inspections'),
  ('cctv.view', 'cctv', 'View CCTV feeds'),
  ('cctv.manage', 'cctv', 'Manage CCTV sources'),
  ('video.initiate', 'video', 'Initiate video calls'),
  ('video.join', 'video', 'Join video calls'),
  ('reports.view', 'report', 'View reports'),
  ('reports.generate', 'report', 'Generate reports'),
  ('reports.approve', 'report', 'Approve reports'),
  ('admin.manage_users', 'admin', 'Manage users'),
  ('admin.manage_roles', 'admin', 'Manage roles'),
  ('admin.system_config', 'admin', 'System configuration'),
  ('audit.view', 'audit', 'View audit logs'),
  ('dashboard.view_all', 'dashboard', 'View all dashboards')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id TEXT REFERENCES roles(id),
  permission_id TEXT REFERENCES permissions(id),
  PRIMARY KEY (role_id, permission_id)
);

-- Seed role permissions
INSERT INTO role_permissions (role_id, permission_id) VALUES
  ('ADMIN', 'admin.manage_users'), ('ADMIN', 'admin.manage_roles'), ('ADMIN', 'admin.system_config'),
  ('ADMIN', 'audit.view'), ('ADMIN', 'dashboard.view_all'), ('ADMIN', 'projects.view'), ('ADMIN', 'projects.edit'),
  ('ADMIN', 'inspections.view'), ('ADMIN', 'inspections.create'), ('ADMIN', 'inspections.review'),
  ('ADMIN', 'cctv.view'), ('ADMIN', 'cctv.manage'), ('ADMIN', 'reports.view'), ('ADMIN', 'reports.approve'),
  ('DOSJE_OFFICIAL', 'dashboard.view_all'), ('DOSJE_OFFICIAL', 'projects.view'), ('DOSJE_OFFICIAL', 'projects.edit'),
  ('DOSJE_OFFICIAL', 'inspections.view'), ('DOSJE_OFFICIAL', 'inspections.create'), ('DOSJE_OFFICIAL', 'inspections.review'),
  ('DOSJE_OFFICIAL', 'cctv.view'), ('DOSJE_OFFICIAL', 'reports.view'), ('DOSJE_OFFICIAL', 'reports.generate'),
  ('DOSJE_OFFICIAL', 'reports.approve'), ('DOSJE_OFFICIAL', 'audit.view'),
  ('INSPECTION_OFFICER', 'projects.view'), ('INSPECTION_OFFICER', 'inspections.view'),
  ('INSPECTION_OFFICER', 'inspections.execute'), ('INSPECTION_OFFICER', 'cctv.view'),
  ('INSPECTION_OFFICER', 'video.initiate'), ('INSPECTION_OFFICER', 'video.join'),
  ('NGO_INSTITUTE', 'projects.view'), ('NGO_INSTITUTE', 'inspections.view'), ('NGO_INSTITUTE', 'reports.view'),
  ('DISTRICT_AUTHORITY', 'dashboard.view_all'), ('DISTRICT_AUTHORITY', 'projects.view'),
  ('DISTRICT_AUTHORITY', 'inspections.view'), ('DISTRICT_AUTHORITY', 'inspections.review'),
  ('DISTRICT_AUTHORITY', 'cctv.view'), ('DISTRICT_AUTHORITY', 'reports.view')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  project_id UUID REFERENCES projects(id),
  organization_id UUID REFERENCES organizations(id),
  type TEXT CHECK (type IN ('hostel','office','field','warehouse','other')),
  address TEXT,
  state TEXT,
  district TEXT,
  block TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  geofence_radius INTEGER DEFAULT 200,
  contact_name TEXT,
  contact_phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cctv_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID REFERENCES facilities(id),
  project_id UUID REFERENCES projects(id),
  name TEXT NOT NULL,
  stream_url TEXT,
  stream_type TEXT DEFAULT 'rtsp' CHECK (stream_type IN ('rtsp','rtmp','webrtc','hls')),
  status TEXT DEFAULT 'unknown' CHECK (status IN ('online','offline','maintenance','unknown')),
  last_heartbeat TIMESTAMPTZ,
  resolution TEXT,
  location_description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS risk_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID REFERENCES facilities(id),
  project_id UUID REFERENCES projects(id),
  signal_type TEXT NOT NULL,
  severity TEXT DEFAULT 'medium',
  risk_score INTEGER DEFAULT 0,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS video_signal_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  signal_type TEXT CHECK (signal_type IN ('offer','answer','ice-candidate')),
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS location_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID REFERENCES inspections(id),
  inspector_id UUID,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  facility_id UUID REFERENCES facilities(id),
  facility_latitude DOUBLE PRECISION,
  facility_longitude DOUBLE PRECISION,
  distance_meters DOUBLE PRECISION,
  geofence_radius DOUBLE PRECISION,
  verification_status TEXT CHECK (verification_status IN ('VERIFIED','OUTSIDE_GEOFENCE','LOW_ACCURACY','LOCATION_UNAVAILABLE','POTENTIAL_LOCATION_ANOMALY')),
  device_id TEXT,
  is_mock_location BOOLEAN DEFAULT false,
  captured_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_projects_state ON projects(state);
CREATE INDEX IF NOT EXISTS idx_projects_district ON projects(district);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON inspections(status);
CREATE INDEX IF NOT EXISTS idx_inspections_project ON inspections(project_id);
CREATE INDEX IF NOT EXISTS idx_facilities_project ON facilities(project_id);
CREATE INDEX IF NOT EXISTS idx_cctv_sources_facility ON cctv_sources(facility_id);
CREATE INDEX IF NOT EXISTS idx_risk_signals_facility ON risk_signals(facility_id);
CREATE INDEX IF NOT EXISTS idx_location_verifications_inspection ON location_verifications(inspection_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
    CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_projects_updated_at') THEN
    CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_inspections_updated_at') THEN
    CREATE TRIGGER update_inspections_updated_at BEFORE UPDATE ON inspections FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_facilities_updated_at') THEN
    CREATE TRIGGER update_facilities_updated_at BEFORE UPDATE ON facilities FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
  END IF;
END $$;

-- ============================================================
-- 002: RLS Policies
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE cctv_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_signals ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION auth_role()
RETURNS TEXT AS $$
  SELECT role_id FROM user_roles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role_id = 'ADMIN');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_dosje_or_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role_id IN ('DOSJE_OFFICIAL','ADMIN'));
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (is_admin());
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (is_admin());

-- Projects
CREATE POLICY "DOSJE/Admin can view all projects" ON projects FOR SELECT USING (is_dosje_or_admin());
CREATE POLICY "Authenticated can view projects" ON projects FOR SELECT USING (auth.role() IS NOT NULL);

-- Inspections
CREATE POLICY "DOSJE/Admin can view all inspections" ON inspections FOR SELECT USING (is_dosje_or_admin());
CREATE POLICY "Officers can view own inspections" ON inspections FOR SELECT USING (inspector_id = auth.uid());
CREATE POLICY "Authenticated can view inspections" ON inspections FOR SELECT USING (auth.role() IS NOT NULL);
CREATE POLICY "Officers can update own inspections" ON inspections FOR UPDATE USING (inspector_id = auth.uid());

-- Facilities
CREATE POLICY "Authenticated can view facilities" ON facilities FOR SELECT USING (auth.role() IS NOT NULL);

-- CCTV
CREATE POLICY "Authenticated can view CCTV" ON cctv_sources FOR SELECT USING (auth.role() IS NOT NULL);

-- Evidence
CREATE POLICY "Officers can insert evidence" ON evidence FOR INSERT WITH CHECK (auth.role() = 'INSPECTION_OFFICER');
CREATE POLICY "Authenticated can view evidence" ON evidence FOR SELECT USING (auth.role() IS NOT NULL);

-- Risk signals
CREATE POLICY "Authenticated can view risk signals" ON risk_signals FOR SELECT USING (auth.role() IS NOT NULL);

-- Notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- Audit logs
CREATE POLICY "DOSJE/Admin can view audit logs" ON audit_logs FOR SELECT USING (is_dosje_or_admin());
CREATE POLICY "System can insert audit logs" ON audit_logs FOR INSERT WITH CHECK (true);

-- Anomalies
CREATE POLICY "DOSJE/Admin can view anomalies" ON anomalies FOR SELECT USING (is_dosje_or_admin());
CREATE POLICY "Authenticated can view anomalies" ON anomalies FOR SELECT USING (auth.role() IS NOT NULL);
