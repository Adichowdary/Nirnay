-- Migration: Face Recognition System tables
-- INSIGHT Platform FRS

-- Face enrollment records
CREATE TABLE IF NOT EXISTS face_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'REVOKED')),
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  revocation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Face templates (biometric data — restricted access)
CREATE TABLE IF NOT EXISTS face_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES face_enrollments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model_name TEXT NOT NULL,
  model_version TEXT NOT NULL,
  embedding NUMERIC[] NOT NULL,
  quality_score NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REVOKED')),
  created_at TIMESTAMPTZ DEFAULT now(),
  revoked_at TIMESTAMPTZ
);

-- Verification sessions (for login attempts)
CREATE TABLE IF NOT EXISTS face_verification_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'EXPIRED')),
  location_required BOOLEAN NOT NULL DEFAULT false,
  device_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '5 minutes'),
  completed_at TIMESTAMPTZ
);

-- Verification results (audit trail — no raw embeddings stored here)
CREATE TABLE IF NOT EXISTS face_verification_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES face_verification_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  result TEXT NOT NULL CHECK (result IN (
    'VERIFIED', 'NOT_VERIFIED', 'RETRY_REQUIRED', 'LOW_QUALITY',
    'LIVENESS_FAILED', 'MODEL_UNAVAILABLE', 'ACCOUNT_NOT_ENROLLED'
  )),
  similarity NUMERIC,
  threshold NUMERIC NOT NULL,
  quality_status TEXT NOT NULL,
  liveness_status TEXT NOT NULL,
  model_name TEXT NOT NULL,
  model_version TEXT NOT NULL,
  location_status TEXT,
  location_accuracy NUMERIC,
  location_lat NUMERIC,
  location_lng NUMERIC,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Login attempts (rate limiting + audit)
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  method TEXT NOT NULL CHECK (method IN ('password', 'face', 'otp')),
  result TEXT NOT NULL CHECK (result IN ('SUCCESS', 'FAILED', 'LOCKED', 'RATE_LIMITED')),
  ip_address TEXT,
  user_agent TEXT,
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Biometric audit events (never store raw images/embeddings in audit)
CREATE TABLE IF NOT EXISTS biometric_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'FACE_ENROLLMENT_ATTEMPT', 'FACE_ENROLLMENT_SUCCESS', 'FACE_ENROLLMENT_FAILURE',
    'FACE_LOGIN_ATTEMPT', 'FACE_LOGIN_SUCCESS', 'FACE_LOGIN_FAILURE',
    'FACE_VERIFICATION_SESSION_CREATED', 'FACE_TEMPLATE_REVOKED',
    'LOCATION_VERIFICATION_ATTEMPT', 'LOCATION_VERIFICATION_RESULT',
    'RATE_LIMIT_TRIGGERED', 'ACCOUNT_LOCKED', 'ACCOUNT_UNLOCKED'
  )),
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Verification threshold config
CREATE TABLE IF NOT EXISTS frs_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name TEXT NOT NULL,
  model_version TEXT NOT NULL,
  threshold NUMERIC NOT NULL DEFAULT 0.65,
  calibration_version TEXT NOT NULL DEFAULT '1.0',
  max_login_attempts INTEGER NOT NULL DEFAULT 5,
  lockout_duration_minutes INTEGER NOT NULL DEFAULT 15,
  session_timeout_minutes INTEGER NOT NULL DEFAULT 5,
  location_required BOOLEAN NOT NULL DEFAULT false,
  location_max_accuracy_meters NUMERIC NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_face_enrollments_user_id ON face_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_face_templates_user_id ON face_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_face_templates_enrollment_id ON face_templates(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_face_verification_sessions_user_id ON face_verification_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_face_verification_results_session_id ON face_verification_results(session_id);
CREATE INDEX IF NOT EXISTS idx_face_verification_results_user_id ON face_verification_results(user_id);
CREATE INDEX IF NOT EXISTS idx_login_attempts_user_id ON login_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON login_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_biometric_audit_events_user_id ON biometric_audit_events(user_id);
CREATE INDEX IF NOT EXISTS idx_biometric_audit_events_event_type ON biometric_audit_events(event_type);

-- RLS policies
ALTER TABLE face_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE face_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE face_verification_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE face_verification_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE frs_config ENABLE ROW LEVEL SECURITY;

-- face_enrollments: users can read their own, admins can read all
CREATE POLICY "Users can read own enrollment"
  ON face_enrollments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage enrollments"
  ON face_enrollments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_id = 'ADMIN'
    )
  );

-- face_templates: very restricted — only via service role or direct API
CREATE POLICY "Users cannot access templates directly"
  ON face_templates FOR SELECT
  USING (false);

CREATE POLICY "Service role can manage templates"
  ON face_templates FOR ALL
  USING (true);

-- face_verification_sessions
CREATE POLICY "Users can read own sessions"
  ON face_verification_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions"
  ON face_verification_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON face_verification_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- face_verification_results
CREATE POLICY "Users can read own results"
  ON face_verification_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own results"
  ON face_verification_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- login_attempts: service role only for writes
CREATE POLICY "No direct access to login attempts"
  ON login_attempts FOR ALL
  USING (true);

-- biometric_audit_events: service role only
CREATE POLICY "No direct access to audit events"
  ON biometric_audit_events FOR ALL
  USING (true);

-- frs_config: readable by authenticated, writable by admin
CREATE POLICY "Authenticated users can read config"
  ON frs_config FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage config"
  ON frs_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_id = 'ADMIN'
    )
  );

-- Insert default FRS config
INSERT INTO frs_config (model_name, model_version, threshold, calibration_version, location_required)
VALUES ('MediaPipe FaceLandmarker', '1.0.1', 0.65, '1.0', false)
ON CONFLICT DO NOTHING;
