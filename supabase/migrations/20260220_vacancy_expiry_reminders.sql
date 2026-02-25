-- Vacancy Expiry Overhaul: Dynamic TTL, Reminder Emails, One-Click Confirm
-- Changes default TTL from 30 to 45 days, adds reminder tracking columns,
-- and creates DB functions for token-based vacancy confirmation.

-- 1. Change default expiry from 30 to 45 days
ALTER TABLE vacancies ALTER COLUMN expires_at SET DEFAULT (NOW() + INTERVAL '45 days');

-- 2. Add columns for reminder tracking and confirmation tokens
ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS confirmation_token TEXT;
ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ;
ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS reminder_30_sent_at TIMESTAMPTZ;
ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS reminder_40_sent_at TIMESTAMPTZ;

-- Waitlist flag (may already exist, so IF NOT EXISTS)
ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS waitlist_available BOOLEAN DEFAULT FALSE;

-- 3. Unique partial index on confirmation_token (only non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_vacancies_confirmation_token
  ON vacancies (confirmation_token)
  WHERE confirmation_token IS NOT NULL;

-- 4. DB function: compute TTL days (mirrors src/lib/vacancyTtl.ts)
CREATE OR REPLACE FUNCTION compute_vacancy_ttl_days(
  p_waitlist_available BOOLEAN,
  p_total_spots INTEGER
) RETURNS INTEGER AS $$
BEGIN
  IF p_waitlist_available AND p_total_spots = 0 THEN
    RETURN 90;
  ELSE
    RETURN 45;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5. DB function: generate a confirmation token for a vacancy
CREATE OR REPLACE FUNCTION generate_confirmation_token(p_vacancy_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_token TEXT;
BEGIN
  v_token := encode(gen_random_bytes(32), 'hex');

  UPDATE vacancies
  SET confirmation_token = v_token,
      token_expires_at = NOW() + INTERVAL '21 days'
  WHERE id = p_vacancy_id;

  RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. DB function: confirm a vacancy via token (one-click renewal)
CREATE OR REPLACE FUNCTION confirm_vacancy(p_token TEXT)
RETURNS JSONB AS $$
DECLARE
  v_vacancy RECORD;
  v_ttl_days INTEGER;
  v_new_expires_at TIMESTAMPTZ;
  v_business_name TEXT;
BEGIN
  -- Find the vacancy by token
  SELECT v.*, p.business_name INTO v_vacancy
  FROM vacancies v
  JOIN providers p ON p.id = v.provider_id
  WHERE v.confirmation_token = p_token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_token');
  END IF;

  -- Check token expiry
  IF v_vacancy.token_expires_at < NOW() THEN
    RETURN jsonb_build_object('success', false, 'error', 'token_expired');
  END IF;

  v_business_name := v_vacancy.business_name;

  -- Compute dynamic TTL
  v_ttl_days := compute_vacancy_ttl_days(
    v_vacancy.waitlist_available,
    COALESCE(v_vacancy.infant_spots, 0) + COALESCE(v_vacancy.toddler_spots, 0) +
    COALESCE(v_vacancy.preschool_spots, 0) + COALESCE(v_vacancy.school_age_spots, 0)
  );

  v_new_expires_at := NOW() + (v_ttl_days || ' days')::INTERVAL;

  -- Reset expiry and clear reminder/token state
  UPDATE vacancies
  SET expires_at = v_new_expires_at,
      updated_at = NOW(),
      confirmation_token = NULL,
      token_expires_at = NULL,
      reminder_30_sent_at = NULL,
      reminder_40_sent_at = NULL
  WHERE id = v_vacancy.id;

  RETURN jsonb_build_object(
    'success', true,
    'business_name', v_business_name,
    'new_expires_at', v_new_expires_at,
    'ttl_days', v_ttl_days
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Update public_listings view to explicitly filter expired vacancies
CREATE OR REPLACE VIEW public_listings AS
SELECT
  p.id AS provider_id,
  p.business_name,
  p.license_number,
  p.neighborhood,
  p.zip_code,
  p.phone,
  p.phone_accepts_text,
  p.website,
  p.program_type,
  p.is_elfa_network,
  p.languages,

  -- Vacancy info
  COALESCE(v.infant_spots, 0) + COALESCE(v.toddler_spots, 0) +
  COALESCE(v.preschool_spots, 0) + COALESCE(v.school_age_spots, 0) AS total_spots_available,
  COALESCE(v.infant_spots, 0) AS infant_spots,
  COALESCE(v.toddler_spots, 0) AS toddler_spots,
  COALESCE(v.preschool_spots, 0) AS preschool_spots,
  COALESCE(v.school_age_spots, 0) AS school_age_spots,

  COALESCE(v.accepting_infants, FALSE) AS accepting_infants,
  COALESCE(v.accepting_toddlers, FALSE) AS accepting_toddlers,
  COALESCE(v.accepting_preschool, FALSE) AS accepting_preschool,
  COALESCE(v.accepting_school_age, FALSE) AS accepting_school_age,

  COALESCE(v.full_time_available, TRUE) AS full_time_available,
  COALESCE(v.part_time_available, FALSE) AS part_time_available,
  COALESCE(v.waitlist_available, FALSE) AS waitlist_available,
  v.notes,

  COALESCE(v.available_date, CURRENT_DATE) AS available_date,
  COALESCE(v.updated_at, p.created_at) AS last_updated,
  v.expires_at

FROM providers p
LEFT JOIN vacancies v ON p.id = v.provider_id
WHERE
  p.is_active = TRUE
  AND p.is_approved = TRUE
  AND v.expires_at IS NOT NULL
  AND v.expires_at > NOW()
  AND (
    v.accepting_infants = TRUE OR
    v.accepting_toddlers = TRUE OR
    v.accepting_preschool = TRUE OR
    v.accepting_school_age = TRUE OR
    v.waitlist_available = TRUE OR
    COALESCE(v.infant_spots, 0) + COALESCE(v.toddler_spots, 0) +
    COALESCE(v.preschool_spots, 0) + COALESCE(v.school_age_spots, 0) > 0
  );
