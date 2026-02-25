drop extension if exists "pg_net";


  create table "public"."organizations" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "slug" text not null,
    "website_url" text,
    "created_at" timestamp with time zone default now(),
    "owner_user_id" uuid
      );


alter table "public"."organizations" enable row level security;


  create table "public"."providers" (
    "id" uuid not null,
    "email" text not null,
    "created_at" timestamp with time zone default now(),
    "last_login" timestamp with time zone,
    "license_number" text not null,
    "license_verified" boolean default false,
    "license_verified_at" timestamp with time zone,
    "business_name" text not null,
    "owner_name" text not null,
    "program_type" text not null,
    "licensed_capacity" integer not null,
    "address" text,
    "neighborhood" text,
    "zip_code" text not null,
    "phone" text,
    "contact_email" text not null,
    "website" text,
    "is_elfa_network" boolean default false,
    "elfa_verified_at" timestamp with time zone,
    "languages" jsonb default '["English"]'::jsonb,
    "is_active" boolean default true,
    "is_approved" boolean default true,
    "organization_id" uuid
      );


alter table "public"."providers" enable row level security;


  create table "public"."vacancies" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "provider_id" uuid not null,
    "infant_spots" integer default 0,
    "toddler_spots" integer default 0,
    "preschool_spots" integer default 0,
    "school_age_spots" integer default 0,
    "accepting_infants" boolean default false,
    "accepting_toddlers" boolean default false,
    "accepting_preschool" boolean default false,
    "accepting_school_age" boolean default false,
    "available_date" date default CURRENT_DATE,
    "full_time_available" boolean default true,
    "part_time_available" boolean default false,
    "notes" text,
    "reported_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "expires_at" timestamp with time zone default (now() + '30 days'::interval),
    "waitlist_available" boolean default false
      );


alter table "public"."vacancies" enable row level security;

CREATE INDEX idx_providers_active ON public.providers USING btree (is_active, is_approved);

CREATE INDEX idx_providers_neighborhood ON public.providers USING btree (neighborhood);

CREATE INDEX idx_providers_organization ON public.providers USING btree (organization_id);

CREATE INDEX idx_providers_zip ON public.providers USING btree (zip_code);

CREATE INDEX idx_vacancies_expires ON public.vacancies USING btree (expires_at);

CREATE INDEX idx_vacancies_provider ON public.vacancies USING btree (provider_id);

CREATE UNIQUE INDEX organizations_pkey ON public.organizations USING btree (id);

CREATE UNIQUE INDEX organizations_slug_key ON public.organizations USING btree (slug);

CREATE UNIQUE INDEX providers_license_number_key ON public.providers USING btree (license_number);

CREATE UNIQUE INDEX providers_pkey ON public.providers USING btree (id);

CREATE UNIQUE INDEX vacancies_pkey ON public.vacancies USING btree (id);

CREATE UNIQUE INDEX vacancies_provider_id_key ON public.vacancies USING btree (provider_id);

alter table "public"."organizations" add constraint "organizations_pkey" PRIMARY KEY using index "organizations_pkey";

alter table "public"."providers" add constraint "providers_pkey" PRIMARY KEY using index "providers_pkey";

alter table "public"."vacancies" add constraint "vacancies_pkey" PRIMARY KEY using index "vacancies_pkey";

alter table "public"."organizations" add constraint "organizations_owner_user_id_fkey" FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) not valid;

alter table "public"."organizations" validate constraint "organizations_owner_user_id_fkey";

alter table "public"."organizations" add constraint "organizations_slug_key" UNIQUE using index "organizations_slug_key";

alter table "public"."providers" add constraint "providers_license_number_key" UNIQUE using index "providers_license_number_key";

alter table "public"."providers" add constraint "providers_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) not valid;

alter table "public"."providers" validate constraint "providers_organization_id_fkey";

alter table "public"."providers" add constraint "providers_program_type_check" CHECK ((program_type = ANY (ARRAY['small_family'::text, 'large_family'::text]))) not valid;

alter table "public"."providers" validate constraint "providers_program_type_check";

alter table "public"."vacancies" add constraint "vacancies_provider_id_fkey" FOREIGN KEY (provider_id) REFERENCES public.providers(id) ON DELETE CASCADE not valid;

alter table "public"."vacancies" validate constraint "vacancies_provider_id_fkey";

alter table "public"."vacancies" add constraint "vacancies_provider_id_key" UNIQUE using index "vacancies_provider_id_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_org_vacancies(org_slug text)
 RETURNS TABLE(organization_slug text, business_name text, neighborhood text, zip_code text, infant_spots integer, toddler_spots integer, preschool_spots integer, school_age_spots integer, waitlist_available boolean, available_date date, last_updated timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
  $function$
;

CREATE OR REPLACE FUNCTION public.get_provider_vacancy(license_num text)
 RETURNS TABLE(business_name text, neighborhood text, zip_code text, infant_spots integer, toddler_spots integer, preschool_spots integer, school_age_spots integer, waitlist_available boolean, available_date date, last_updated timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
  $function$
;

create or replace view "public"."public_listings" as  SELECT p.id AS provider_id,
    p.business_name,
    p.license_number,
    p.neighborhood,
    p.zip_code,
    p.phone,
    p.contact_email,
    p.website,
    p.program_type,
    p.is_elfa_network,
    p.languages,
    v.infant_spots,
    v.toddler_spots,
    v.preschool_spots,
    v.school_age_spots,
    v.accepting_infants,
    v.accepting_toddlers,
    v.accepting_preschool,
    v.accepting_school_age,
    v.full_time_available,
    v.part_time_available,
    v.waitlist_available,
    v.notes,
    v.available_date,
    v.updated_at AS last_updated,
    v.expires_at,
    (((COALESCE(v.infant_spots, 0) + COALESCE(v.toddler_spots, 0)) + COALESCE(v.preschool_spots, 0)) + COALESCE(v.school_age_spots, 0)) AS total_spots_available
   FROM (public.providers p
     JOIN public.vacancies v ON ((p.id = v.provider_id)))
  WHERE ((p.is_active = true) AND (p.is_approved = true));


create or replace view "public"."public_org_vacancies" as  SELECT o.slug AS organization_slug,
    p.business_name,
    p.neighborhood,
    p.zip_code,
    COALESCE(v.infant_spots, 0) AS infant_spots,
    COALESCE(v.toddler_spots, 0) AS toddler_spots,
    COALESCE(v.preschool_spots, 0) AS preschool_spots,
    COALESCE(v.school_age_spots, 0) AS school_age_spots,
    COALESCE(v.waitlist_available, false) AS waitlist_available,
    v.available_date,
    v.updated_at AS last_updated
   FROM ((public.providers p
     JOIN public.organizations o ON ((p.organization_id = o.id)))
     LEFT JOIN public.vacancies v ON ((v.provider_id = p.id)))
  WHERE (p.is_active = true);


CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."organizations" to "anon";

grant insert on table "public"."organizations" to "anon";

grant references on table "public"."organizations" to "anon";

grant select on table "public"."organizations" to "anon";

grant trigger on table "public"."organizations" to "anon";

grant truncate on table "public"."organizations" to "anon";

grant update on table "public"."organizations" to "anon";

grant delete on table "public"."organizations" to "authenticated";

grant insert on table "public"."organizations" to "authenticated";

grant references on table "public"."organizations" to "authenticated";

grant select on table "public"."organizations" to "authenticated";

grant trigger on table "public"."organizations" to "authenticated";

grant truncate on table "public"."organizations" to "authenticated";

grant update on table "public"."organizations" to "authenticated";

grant delete on table "public"."organizations" to "service_role";

grant insert on table "public"."organizations" to "service_role";

grant references on table "public"."organizations" to "service_role";

grant select on table "public"."organizations" to "service_role";

grant trigger on table "public"."organizations" to "service_role";

grant truncate on table "public"."organizations" to "service_role";

grant update on table "public"."organizations" to "service_role";

grant delete on table "public"."providers" to "anon";

grant insert on table "public"."providers" to "anon";

grant references on table "public"."providers" to "anon";

grant select on table "public"."providers" to "anon";

grant trigger on table "public"."providers" to "anon";

grant truncate on table "public"."providers" to "anon";

grant update on table "public"."providers" to "anon";

grant delete on table "public"."providers" to "authenticated";

grant insert on table "public"."providers" to "authenticated";

grant references on table "public"."providers" to "authenticated";

grant select on table "public"."providers" to "authenticated";

grant trigger on table "public"."providers" to "authenticated";

grant truncate on table "public"."providers" to "authenticated";

grant update on table "public"."providers" to "authenticated";

grant delete on table "public"."providers" to "service_role";

grant insert on table "public"."providers" to "service_role";

grant references on table "public"."providers" to "service_role";

grant select on table "public"."providers" to "service_role";

grant trigger on table "public"."providers" to "service_role";

grant truncate on table "public"."providers" to "service_role";

grant update on table "public"."providers" to "service_role";

grant delete on table "public"."vacancies" to "anon";

grant insert on table "public"."vacancies" to "anon";

grant references on table "public"."vacancies" to "anon";

grant select on table "public"."vacancies" to "anon";

grant trigger on table "public"."vacancies" to "anon";

grant truncate on table "public"."vacancies" to "anon";

grant update on table "public"."vacancies" to "anon";

grant delete on table "public"."vacancies" to "authenticated";

grant insert on table "public"."vacancies" to "authenticated";

grant references on table "public"."vacancies" to "authenticated";

grant select on table "public"."vacancies" to "authenticated";

grant trigger on table "public"."vacancies" to "authenticated";

grant truncate on table "public"."vacancies" to "authenticated";

grant update on table "public"."vacancies" to "authenticated";

grant delete on table "public"."vacancies" to "service_role";

grant insert on table "public"."vacancies" to "service_role";

grant references on table "public"."vacancies" to "service_role";

grant select on table "public"."vacancies" to "service_role";

grant trigger on table "public"."vacancies" to "service_role";

grant truncate on table "public"."vacancies" to "service_role";

grant update on table "public"."vacancies" to "service_role";


  create policy "Public can view organizations"
  on "public"."organizations"
  as permissive
  for select
  to public
using (true);



  create policy "Users can read own organization"
  on "public"."organizations"
  as permissive
  for select
  to public
using ((owner_user_id = auth.uid()));



  create policy "Allow insert providers"
  on "public"."providers"
  as permissive
  for insert
  to public
with check (true);



  create policy "Public can read approved providers"
  on "public"."providers"
  as permissive
  for select
  to public
using (((is_active = true) AND (is_approved = true)));



  create policy "Public can view listings"
  on "public"."providers"
  as permissive
  for select
  to public
using (((is_active = true) AND (is_approved = true)));



  create policy "Users can insert own provider profile"
  on "public"."providers"
  as permissive
  for insert
  to public
with check ((auth.uid() = id));



  create policy "Users can insert own provider"
  on "public"."providers"
  as permissive
  for insert
  to public
with check ((auth.uid() = id));



  create policy "Users can read own provider"
  on "public"."providers"
  as permissive
  for select
  to public
using ((auth.uid() = id));



  create policy "Users can update own provider profile"
  on "public"."providers"
  as permissive
  for update
  to public
using ((auth.uid() = id));



  create policy "Users can update own provider"
  on "public"."providers"
  as permissive
  for update
  to public
using ((auth.uid() = id));



  create policy "Users can view own provider profile"
  on "public"."providers"
  as permissive
  for select
  to public
using ((auth.uid() = id));



  create policy "Allow insert vacancies"
  on "public"."vacancies"
  as permissive
  for insert
  to public
with check (true);



  create policy "Org owners can manage provider vacancies"
  on "public"."vacancies"
  as permissive
  for all
  to public
using ((provider_id IN ( SELECT p.id
   FROM (public.providers p
     JOIN public.organizations o ON ((p.organization_id = o.id)))
  WHERE (o.owner_user_id = auth.uid()))));



  create policy "Public can view vacancy data"
  on "public"."vacancies"
  as permissive
  for select
  to public
using (((expires_at > now()) AND (EXISTS ( SELECT 1
   FROM public.providers p
  WHERE ((p.id = vacancies.provider_id) AND (p.is_active = true) AND (p.is_approved = true))))));



  create policy "Users can insert own vacancies"
  on "public"."vacancies"
  as permissive
  for insert
  to public
with check ((auth.uid() = provider_id));



  create policy "Users can update own vacancies"
  on "public"."vacancies"
  as permissive
  for update
  to public
using ((auth.uid() = provider_id));



  create policy "Users can view own vacancies"
  on "public"."vacancies"
  as permissive
  for select
  to public
using ((auth.uid() = provider_id));


CREATE TRIGGER update_vacancies_updated_at BEFORE UPDATE ON public.vacancies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


