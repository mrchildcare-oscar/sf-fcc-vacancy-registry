-- Hybrid intake Phase 2: staging table for submissions that need admin or on-file-provider confirmation.
-- Additive only — no existing queries change, no data mutated.

CREATE TABLE IF NOT EXISTS pending_intakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id text,
  submission_id text,
  reason text NOT NULL,
  payload jsonb NOT NULL,
  target_provider_id uuid REFERENCES providers(id) ON DELETE CASCADE,
  token text UNIQUE,
  token_expires_at timestamptz,
  resolved_at timestamptz,
  resolved_action text CHECK (resolved_action IN ('applied','denied','manual')),
  resolved_by uuid,
  created_at timestamptz DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pending_intakes_token_idx
  ON pending_intakes (token)
  WHERE token IS NOT NULL AND resolved_at IS NULL;

CREATE INDEX IF NOT EXISTS pending_intakes_target_idx
  ON pending_intakes (target_provider_id)
  WHERE resolved_at IS NULL;

ALTER TABLE pending_intakes ENABLE ROW LEVEL SECURITY;

-- No public policies; only service_role (used by edge functions) can read/write.
-- If/when an admin UI reads this, add a policy restricting to admin emails.

-- Track how a providers row entered the system so future analytics and admin tooling can segment.
ALTER TABLE providers
  ADD COLUMN IF NOT EXISTS intake_source text
    CHECK (intake_source IN ('self_signup','admin','jotform'))
    DEFAULT 'self_signup';
