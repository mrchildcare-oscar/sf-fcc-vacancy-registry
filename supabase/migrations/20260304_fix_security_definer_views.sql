-- Fix SECURITY DEFINER views flagged by Supabase Security Advisor
-- Changes views to SECURITY INVOKER so they respect RLS policies
-- of the querying user instead of bypassing them as the view owner.
--
-- Impact:
--   public_listings: No change in returned data (view WHERE clause
--     is already more restrictive than RLS policies)
--   public_org_vacancies: Adds is_approved filter via RLS (providers
--     must be both is_active AND is_approved to appear)
--
-- Rollback:
--   ALTER VIEW public.public_listings SET (security_invoker = false);
--   ALTER VIEW public.public_org_vacancies SET (security_invoker = false);

ALTER VIEW public.public_listings SET (security_invoker = true);
ALTER VIEW public.public_org_vacancies SET (security_invoker = true);
