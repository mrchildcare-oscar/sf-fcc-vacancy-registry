-- Page views tracking table for daily report metrics
CREATE TABLE page_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'listing_view', 'contact_click')),
  page TEXT,              -- for page_view events (e.g. 'public', 'auth')
  provider_id UUID,      -- for listing_view and contact_click events
  contact_type TEXT,      -- for contact_click events ('phone', 'email', 'website')
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for daily report queries
CREATE INDEX idx_page_views_created_at ON page_views (created_at);
CREATE INDEX idx_page_views_event_type ON page_views (event_type, created_at);

-- RLS: anyone can insert (visitors are anonymous), no one reads from client
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert page views"
  ON page_views FOR INSERT
  WITH CHECK (true);

-- Only service role can read (for daily report edge function)
-- No SELECT policy for anon = no client-side reads
