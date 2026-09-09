-- ─────────────────────────────────────────────────────────────────────────────
-- INSIGHT — GPS Verification & Video Signaling Migration 005
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Location Verifications ────────────────────────────────────────────────

create table if not exists location_verifications (
  id                    uuid primary key default gen_random_uuid(),
  inspection_id         uuid not null references inspections(id) on delete cascade,
  inspector_id          uuid not null references profiles(id),
  latitude              double precision not null,
  longitude             double precision not null,
  accuracy              numeric not null,
  facility_id           uuid references facilities(id),
  facility_latitude     double precision,
  facility_longitude    double precision,
  distance_meters       numeric,
  geofence_radius       integer,
  verification_status   text not null check (verification_status in (
    'VERIFIED','OUTSIDE_GEOFENCE','LOW_ACCURACY','LOCATION_UNAVAILABLE','POTENTIAL_LOCATION_ANOMALY'
  )),
  device_id             text,
  is_mock_location      boolean default false,
  captured_at           timestamptz not null,
  synced_at             timestamptz,
  created_at            timestamptz default now()
);

create index if not exists idx_location_verifications_inspection on location_verifications(inspection_id);
create index if not exists idx_location_verifications_inspector on location_verifications(inspector_id);
create index if not exists idx_location_verifications_status on location_verifications(verification_status);

-- ─── Video Signal Channels (WebRTC signaling via DB) ───────────────────────

create table if not exists video_signal_channels (
  id               uuid primary key default gen_random_uuid(),
  session_id       uuid not null references video_verification_sessions(id) on delete cascade,
  sender_id        uuid not null references profiles(id),
  signal_type      text not null check (signal_type in ('offer','answer','ice-candidate')),
  payload          jsonb not null,
  created_at       timestamptz default now()
);

create index if not exists idx_video_signal_channels_session on video_signal_channels(session_id);

-- ─── CCTV Stream Sessions (authorized access tokens) ───────────────────────

-- cctv_stream_sessions already exists in 004, adding token column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cctv_stream_sessions' AND column_name = 'stream_token'
  ) THEN
    ALTER TABLE cctv_stream_sessions ADD COLUMN stream_token text;
  END IF;
END $$;
