-- SF FCC Vacancy Registry Database Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Providers table (FCC businesses)
CREATE TABLE providers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,

  -- License Info
  license_number TEXT NOT NULL UNIQUE,
  license_verified BOOLEAN DEFAULT FALSE,
  license_verified_at TIMESTAMPTZ,

  -- Program Info
  business_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  program_type TEXT NOT NULL CHECK (program_type IN ('small_family', 'large_family')),
  licensed_capacity INTEGER NOT NULL,

  -- Location
  address TEXT,
  neighborhood TEXT,
  zip_code TEXT NOT NULL,

  -- Contact
  phone TEXT,
  phone_accepts_text BOOLEAN DEFAULT FALSE,
  contact_email TEXT NOT NULL,
  website TEXT,

  -- ELFA Status
  is_elfa_network BOOLEAN DEFAULT FALSE,
  elfa_verified_at TIMESTAMPTZ,

  -- Languages (stored as JSON array)
  languages JSONB DEFAULT '["English"]'::JSONB,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_approved BOOLEAN DEFAULT TRUE
);

-- Vacancies table (current openings)
CREATE TABLE vacancies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE UNIQUE,

  -- Vacancy Info by Age Group
  infant_spots INTEGER DEFAULT 0,
  toddler_spots INTEGER DEFAULT 0,
  preschool_spots INTEGER DEFAULT 0,
  school_age_spots INTEGER DEFAULT 0,

  -- Accepting flags
  accepting_infants BOOLEAN DEFAULT FALSE,
  accepting_toddlers BOOLEAN DEFAULT FALSE,
  accepting_preschool BOOLEAN DEFAULT FALSE,
  accepting_school_age BOOLEAN DEFAULT FALSE,

  -- Availability
  available_date DATE DEFAULT CURRENT_DATE,
  full_time_available BOOLEAN DEFAULT TRUE,
  part_time_available BOOLEAN DEFAULT FALSE,

  -- Notes
  notes TEXT,

  -- Waitlist
  waitlist_available BOOLEAN DEFAULT FALSE,

  -- Timestamps
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '45 days'),

  -- Expiry reminder tracking
  confirmation_token TEXT,
  token_expires_at TIMESTAMPTZ,
  reminder_30_sent_at TIMESTAMPTZ,  -- Friendly reminder (~15 days before expiry)
  reminder_40_sent_at TIMESTAMPTZ   -- Urgent reminder (~5 days before expiry)
);

-- Public listings view (combines provider and vacancy data for public display)
CREATE VIEW public_listings AS
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
  AND (v.expires_at IS NULL OR v.expires_at > NOW())
  AND (
    v.accepting_infants = TRUE OR
    v.accepting_toddlers = TRUE OR
    v.accepting_preschool = TRUE OR
    v.accepting_school_age = TRUE OR
    v.waitlist_available = TRUE OR
    COALESCE(v.infant_spots, 0) + COALESCE(v.toddler_spots, 0) +
    COALESCE(v.preschool_spots, 0) + COALESCE(v.school_age_spots, 0) > 0
  );

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacancies ENABLE ROW LEVEL SECURITY;

-- Providers: Users can only read/update their own profile
CREATE POLICY "Users can view own provider profile" ON providers
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own provider profile" ON providers
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own provider profile" ON providers
  FOR UPDATE USING (auth.uid() = id);

-- Vacancies: Users can only manage their own vacancies
CREATE POLICY "Users can view own vacancies" ON vacancies
  FOR SELECT USING (auth.uid() = provider_id);

CREATE POLICY "Users can insert own vacancies" ON vacancies
  FOR INSERT WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Users can update own vacancies" ON vacancies
  FOR UPDATE USING (auth.uid() = provider_id);

-- Public access to the listings view
-- Note: Views inherit from base table RLS by default
-- We need to grant public read access
CREATE POLICY "Public can view listings" ON providers
  FOR SELECT USING (is_active = TRUE AND is_approved = TRUE);

CREATE POLICY "Public can view vacancy data" ON vacancies
  FOR SELECT USING (
    expires_at > NOW() AND
    EXISTS (
      SELECT 1 FROM providers p
      WHERE p.id = provider_id
      AND p.is_active = TRUE
      AND p.is_approved = TRUE
    )
  );

-- Indexes for performance
CREATE INDEX idx_providers_zip ON providers(zip_code);
CREATE INDEX idx_providers_neighborhood ON providers(neighborhood);
CREATE INDEX idx_providers_active ON providers(is_active, is_approved);
CREATE INDEX idx_vacancies_provider ON vacancies(provider_id);
CREATE INDEX idx_vacancies_expires ON vacancies(expires_at);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for vacancies
CREATE TRIGGER update_vacancies_updated_at
  BEFORE UPDATE ON vacancies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Parent Inquiries table (inquiries from parents to providers)
CREATE TABLE parent_inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,

  -- Parent info
  parent_name TEXT NOT NULL,
  parent_email TEXT NOT NULL,
  parent_phone TEXT,

  -- Inquiry
  message TEXT NOT NULL,
  age_group_interested TEXT NOT NULL CHECK (age_group_interested IN ('infant', 'toddler', 'preschool', 'school_age', 'multiple')),

  -- Status
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ
);

-- RLS for parent_inquiries
ALTER TABLE parent_inquiries ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public form submission)
CREATE POLICY "Anyone can submit inquiry" ON parent_inquiries
  FOR INSERT WITH CHECK (true);

-- Providers can view their own inquiries
CREATE POLICY "Providers can view own inquiries" ON parent_inquiries
  FOR SELECT USING (
    auth.uid() = provider_id OR
    EXISTS (
      SELECT 1 FROM providers p
      WHERE p.id = provider_id
      AND p.organization_id IN (
        SELECT id FROM organizations WHERE owner_user_id = auth.uid()
      )
    )
  );

-- Providers can update their own inquiries (mark as read, replied, archived)
CREATE POLICY "Providers can update own inquiries" ON parent_inquiries
  FOR UPDATE USING (
    auth.uid() = provider_id OR
    EXISTS (
      SELECT 1 FROM providers p
      WHERE p.id = provider_id
      AND p.organization_id IN (
        SELECT id FROM organizations WHERE owner_user_id = auth.uid()
      )
    )
  );

-- Indexes for performance
CREATE INDEX idx_inquiries_provider ON parent_inquiries(provider_id);
CREATE INDEX idx_inquiries_status ON parent_inquiries(status);
CREATE INDEX idx_inquiries_created ON parent_inquiries(created_at DESC);
