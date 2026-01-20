# SF FCC Vacancy Registry - Database Design

## Overview

This document describes the multi-tenant database architecture for managing childcare providers, organizations, and vacancy data. The design supports both individual providers and organizations managing multiple locations.

---

## Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  auth.users     │       │  organizations  │       │   providers     │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK/FK)      │──┐
│ email           │       │ name            │       │ organization_id │──│──► organizations.id
│ created_at      │       │ slug (unique)   │       │ license_number  │  │
│ ...             │       │ website_url     │       │ business_name   │  │
└────────┬────────┘       │ owner_user_id   │──┐    │ neighborhood    │  │
         │                │ created_at      │  │    │ zip_code        │  │
         │                └─────────────────┘  │    │ is_active       │  │
         │                                     │    │ ...             │  │
         │                                     │    └────────┬────────┘  │
         │                                     │             │           │
         └─────────────────────────────────────┴─────────────┘           │
                          │                                              │
                          │         ┌─────────────────┐                  │
                          │         │   vacancies     │                  │
                          │         ├─────────────────┤                  │
                          │         │ id (PK)         │                  │
                          │         │ provider_id(FK) │──────────────────┘
                          │         │ infant_spots    │
                          │         │ toddler_spots   │
                          │         │ preschool_spots │
                          │         │ school_age_spots│
                          │         │ waitlist_avail  │
                          │         │ available_date  │
                          │         │ updated_at      │
                          │         │ expires_at      │
                          │         └─────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │ public_org_vacancies  │  (View/Function for widget)
              │ - Joins providers +   │
              │   organizations +     │
              │   vacancies           │
              │ - Public read access  │
              └───────────────────────┘
```

---

## Tables

### 1. organizations

Represents a business entity that can own multiple provider locations.

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- Display name: "Modern Education Family Childcare"
  slug TEXT UNIQUE NOT NULL,             -- URL-safe identifier: "modern-education"
  website_url TEXT,                      -- Organization's website
  owner_user_id UUID REFERENCES auth.users(id),  -- Who can manage this org
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookup by owner
CREATE INDEX idx_organizations_owner ON organizations(owner_user_id);
```

**Key Design Decisions:**
- `slug` is unique and URL-safe for use in widgets and APIs
- `owner_user_id` links to Supabase auth.users for single sign-on management
- One user can own one organization (1:1 relationship)

---

### 2. providers

Individual childcare provider locations. Can be standalone or part of an organization.

```sql
CREATE TABLE providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Organization relationship (optional)
  organization_id UUID REFERENCES organizations(id),

  -- Identity & Verification
  email TEXT NOT NULL,
  license_number TEXT UNIQUE NOT NULL,   -- State license number
  license_verified BOOLEAN DEFAULT false,

  -- Business Info
  business_name TEXT NOT NULL,
  owner_name TEXT,
  program_type TEXT CHECK (program_type IN ('small_family', 'large_family')),
  licensed_capacity INTEGER,

  -- Location
  zip_code TEXT,
  neighborhood TEXT,                      -- Used for widget links: "Hayes Valley"

  -- Contact
  phone TEXT,
  contact_email TEXT,
  website TEXT,

  -- Metadata
  languages TEXT[],                       -- Array: ['English', 'Spanish', 'Mandarin']
  is_elfa_network BOOLEAN DEFAULT false,  -- ELFA network membership
  is_active BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_providers_organization ON providers(organization_id);
CREATE INDEX idx_providers_license ON providers(license_number);
CREATE INDEX idx_providers_active ON providers(is_active) WHERE is_active = true;
```

**Key Design Decisions:**
- `organization_id` is nullable - providers can exist independently or under an org
- `license_number` is unique and used as external identifier for widgets
- `neighborhood` is used for generating URL slugs in the widget
- `is_active` allows soft-delete without losing data

---

### 3. vacancies

Current availability status for each provider. One vacancy record per provider.

```sql
CREATE TABLE vacancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID UNIQUE REFERENCES providers(id) ON DELETE CASCADE,

  -- Available spots by age group
  infant_spots INTEGER DEFAULT 0,        -- 0-24 months
  toddler_spots INTEGER DEFAULT 0,       -- 2-3 years
  preschool_spots INTEGER DEFAULT 0,     -- 3-5 years
  school_age_spots INTEGER DEFAULT 0,    -- 5+ years

  -- Accepting flags (can accept even with 0 spots for future)
  accepting_infants BOOLEAN DEFAULT false,
  accepting_toddlers BOOLEAN DEFAULT false,
  accepting_preschool BOOLEAN DEFAULT false,
  accepting_school_age BOOLEAN DEFAULT false,

  -- Availability details
  available_date DATE,                    -- When spots open (for "upcoming" status)
  full_time_available BOOLEAN DEFAULT true,
  part_time_available BOOLEAN DEFAULT false,
  waitlist_available BOOLEAN DEFAULT false,

  -- Notes
  notes TEXT,

  -- Timestamps
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ                  -- Auto-expire old listings
);

-- Unique constraint ensures one vacancy per provider
CREATE UNIQUE INDEX idx_vacancies_provider ON vacancies(provider_id);
```

**Key Design Decisions:**
- One-to-one relationship with providers (enforced by UNIQUE on provider_id)
- Spots are integers, not booleans, to show exact availability
- `available_date` enables "Opening in March" status display
- `expires_at` allows automatic cleanup of stale listings

---

## Public API Functions

For the embeddable widget, we use PostgreSQL functions with `SECURITY DEFINER` to bypass RLS while maintaining controlled access.

### get_org_vacancies

Returns all vacancies for an organization (multi-location widget).

```sql
CREATE OR REPLACE FUNCTION get_org_vacancies(org_slug TEXT)
RETURNS TABLE (
  organization_slug TEXT,
  business_name TEXT,
  neighborhood TEXT,
  zip_code TEXT,
  infant_spots INTEGER,
  toddler_spots INTEGER,
  preschool_spots INTEGER,
  school_age_spots INTEGER,
  waitlist_available BOOLEAN,
  available_date DATE,
  last_updated TIMESTAMPTZ
)
SECURITY DEFINER  -- Runs with creator's permissions, bypassing RLS
AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.slug::TEXT,
    p.business_name::TEXT,
    p.neighborhood::TEXT,
    p.zip_code::TEXT,
    COALESCE(v.infant_spots, 0)::INTEGER,
    COALESCE(v.toddler_spots, 0)::INTEGER,
    COALESCE(v.preschool_spots, 0)::INTEGER,
    COALESCE(v.school_age_spots, 0)::INTEGER,
    COALESCE(v.waitlist_available, false),
    v.available_date,
    v.updated_at
  FROM providers p
  JOIN organizations o ON p.organization_id = o.id
  LEFT JOIN vacancies v ON v.provider_id = p.id
  WHERE p.is_active = true AND o.slug = org_slug;
END;
$$ LANGUAGE plpgsql;

-- Allow anonymous access for widget
GRANT EXECUTE ON FUNCTION get_org_vacancies(TEXT) TO anon;
```

### get_provider_vacancy

Returns vacancy for a single provider (individual widget).

```sql
CREATE OR REPLACE FUNCTION get_provider_vacancy(license_num TEXT)
RETURNS TABLE (
  business_name TEXT,
  neighborhood TEXT,
  zip_code TEXT,
  infant_spots INTEGER,
  toddler_spots INTEGER,
  preschool_spots INTEGER,
  school_age_spots INTEGER,
  waitlist_available BOOLEAN,
  available_date DATE,
  last_updated TIMESTAMPTZ
)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.business_name::TEXT,
    p.neighborhood::TEXT,
    p.zip_code::TEXT,
    COALESCE(v.infant_spots, 0)::INTEGER,
    COALESCE(v.toddler_spots, 0)::INTEGER,
    COALESCE(v.preschool_spots, 0)::INTEGER,
    COALESCE(v.school_age_spots, 0)::INTEGER,
    COALESCE(v.waitlist_available, false),
    v.available_date,
    v.updated_at
  FROM providers p
  LEFT JOIN vacancies v ON v.provider_id = p.id
  WHERE p.is_active = true AND p.license_number = license_num;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_provider_vacancy(TEXT) TO anon;
```

---

## Row Level Security (RLS)

### Organizations

```sql
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Public can view organizations (for widget)
CREATE POLICY "Public can view organizations"
  ON organizations FOR SELECT
  USING (true);

-- Only owner can update their organization
CREATE POLICY "Owner can update organization"
  ON organizations FOR UPDATE
  USING (auth.uid() = owner_user_id);
```

### Providers

```sql
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

-- Providers can view/edit their own record
CREATE POLICY "Users can view own provider"
  ON providers FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own provider"
  ON providers FOR UPDATE
  USING (auth.uid() = id);

-- Organization owners can manage all their providers
CREATE POLICY "Org owners can view org providers"
  ON providers FOR SELECT
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Org owners can update org providers"
  ON providers FOR UPDATE
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_user_id = auth.uid()
    )
  );
```

### Vacancies

```sql
ALTER TABLE vacancies ENABLE ROW LEVEL SECURITY;

-- Providers can manage their own vacancy
CREATE POLICY "Providers can manage own vacancy"
  ON vacancies FOR ALL
  USING (provider_id = auth.uid());

-- Organization owners can manage vacancies for their providers
CREATE POLICY "Org owners can manage org vacancies"
  ON vacancies FOR ALL
  USING (
    provider_id IN (
      SELECT p.id FROM providers p
      JOIN organizations o ON p.organization_id = o.id
      WHERE o.owner_user_id = auth.uid()
    )
  );
```

---

## Access Patterns

### 1. Individual Provider Flow
```
User signs up → Creates provider record (id = auth.uid)
             → Can manage their own vacancy
             → Appears in public listings
```

### 2. Organization Owner Flow
```
User signs up → Organization created with owner_user_id = auth.uid
             → Multiple providers linked via organization_id
             → Owner can manage ALL linked providers and vacancies
             → Single dashboard shows all locations
```

### 3. Public Widget Flow
```
Widget loads → Calls get_org_vacancies(slug) or get_provider_vacancy(license)
            → Function bypasses RLS with SECURITY DEFINER
            → Returns only active providers with vacancy data
            → No authentication required
```

---

## Widget Integration

### Organization Widget (Multi-location)
```html
<div id="fcc-vacancy-widget"
     data-org="modern-education"
     data-link-base="https://www.daycaresf.com">
</div>
<script src="https://beta.familychildcaresf.com/widget.js"></script>
```

**Attributes:**
- `data-org`: Organization slug (matches organizations.slug)
- `data-link-base`: Base URL for location links (creates /neighborhood.html links)

### Individual Widget (Single location)
```html
<div id="fcc-vacancy-widget"
     data-provider="384004210">
</div>
<script src="https://beta.familychildcaresf.com/widget.js"></script>
```

**Attributes:**
- `data-provider`: License number (matches providers.license_number)

---

## Vacancy Status Logic

The widget calculates display status based on vacancy data:

```javascript
function getVacancyStatus(vacancy) {
  const totalSpots = infant_spots + toddler_spots + preschool_spots + school_age_spots;

  // 1. Has open spots → "X spots open" (green)
  if (totalSpots > 0) {
    return { status: 'open', text: `${totalSpots} spots open` };
  }

  // 2. Future availability within 6 months → "Opening Mar 2025" (amber)
  if (available_date && isWithin6Months(available_date)) {
    return { status: 'upcoming', text: `Opening ${formatDate(available_date)}` };
  }

  // 3. Accepting waitlist → "Waitlist Open" (blue)
  if (waitlist_available) {
    return { status: 'waitlist', text: 'Waitlist Open' };
  }

  // 4. Otherwise → "Currently Full" (gray)
  return { status: 'full', text: 'Currently Full' };
}
```

**Sort Order:** open → upcoming → waitlist → full

---

## Data Model Benefits

1. **Flexibility**: Supports both independent providers and multi-location organizations
2. **Single Sign-On**: Organization owners manage all locations with one login
3. **Public API**: Widget works without authentication via SECURITY DEFINER functions
4. **Scalability**: Organizations can add unlimited locations
5. **Privacy**: RLS ensures users only see/edit their own data
6. **Soft Delete**: `is_active` flag preserves data while hiding inactive providers

---

## Future Considerations

- **Multi-owner organizations**: Add `organization_members` junction table
- **Audit logging**: Track vacancy changes over time
- **Analytics**: Page views, widget impressions
- **Notifications**: Alert providers when listings expire
- **Booking integration**: Allow families to request tours/enrollment

---

*Last updated: January 2025*
