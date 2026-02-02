import { createClient } from '@supabase/supabase-js';
import { Provider, Vacancy, PublicListing, ParentInquiry, ParentInquiryFormData, InquiryStatus } from '../types/registry';
import { ProviderFormData } from '../components/registry/ProviderOnboarding';
import { VacancyFormData } from '../components/registry/VacancyForm';
import { checkElfaStatus } from './elfa';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

console.log('[Supabase] Initializing...', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  urlPrefix: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'MISSING',
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[Supabase] CRITICAL: Credentials not configured! Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth helpers
export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Subscribe to auth changes
export function onAuthStateChange(callback: (event: string, session: unknown) => void) {
  return supabase.auth.onAuthStateChange(callback);
}

// Provider operations
export async function getProvider(userId: string): Promise<Provider | null> {
  console.log('[Supabase] getProvider called for:', userId);
  try {
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      // PGRST116 means no rows found - this is expected for new users
      if (error.code === 'PGRST116') {
        console.log('[Supabase] getProvider: No provider found (new user)');
        return null;
      }
      console.error('[Supabase] getProvider error:', error);
      return null;
    }
    console.log('[Supabase] getProvider success:', data?.business_name);
    return data;
  } catch (err) {
    console.error('[Supabase] getProvider exception:', err);
    return null;
  }
}

export async function createProvider(userId: string, providerData: ProviderFormData): Promise<{ error?: string }> {
  try {
    // Check if provider is in ELFA network
    console.log('Starting provider creation for:', userId);
    const isElfa = await checkElfaStatus(providerData.license_number);
    console.log(`ELFA check for ${providerData.license_number}: ${isElfa}`);

    const insertData = {
      id: userId,
      email: providerData.contact_email,
      license_number: providerData.license_number,
      license_verified: true,
      business_name: providerData.business_name,
      owner_name: providerData.owner_name,
      program_type: providerData.program_type,
      licensed_capacity: providerData.licensed_capacity,
      zip_code: providerData.zip_code,
      neighborhood: providerData.neighborhood || null,
      phone: providerData.phone || null,
      contact_email: providerData.contact_email,
      website: providerData.website || null,
      languages: providerData.languages,
      is_elfa_network: isElfa,
      is_active: true,
      is_approved: true,
    };

    console.log('Inserting provider data:', insertData);

    const { error } = await supabase
      .from('providers')
      .insert(insertData);

    if (error) {
      console.error('Error creating provider:', error);
      return { error: error.message };
    }

    console.log('Provider created successfully');
    return {};
  } catch (err) {
    console.error('Exception in createProvider:', err);
    return { error: err instanceof Error ? err.message : 'Unknown error occurred' };
  }
}

export async function updateProvider(userId: string, updates: Partial<Provider>): Promise<{ error?: string }> {
  const { error } = await supabase
    .from('providers')
    .update(updates)
    .eq('id', userId);

  if (error) {
    console.error('Error updating provider:', error);
    return { error: error.message };
  }
  return {};
}

// Vacancy operations
export async function getVacancy(providerId: string): Promise<Vacancy | null> {
  const { data, error } = await supabase
    .from('vacancies')
    .select('*')
    .eq('provider_id', providerId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error fetching vacancy:', error);
  }
  return data || null;
}

export async function upsertVacancy(providerId: string, vacancyData: VacancyFormData): Promise<{ error?: string }> {
  const now = new Date().toISOString();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // Expire after 30 days

  const { error } = await supabase
    .from('vacancies')
    .upsert({
      provider_id: providerId,
      infant_spots: vacancyData.infant_spots,
      toddler_spots: vacancyData.toddler_spots,
      preschool_spots: vacancyData.preschool_spots,
      school_age_spots: vacancyData.school_age_spots,
      accepting_infants: vacancyData.accepting_infants,
      accepting_toddlers: vacancyData.accepting_toddlers,
      accepting_preschool: vacancyData.accepting_preschool,
      accepting_school_age: vacancyData.accepting_school_age,
      available_date: vacancyData.available_date,
      full_time_available: vacancyData.full_time_available,
      part_time_available: vacancyData.part_time_available,
      waitlist_available: vacancyData.waitlist_available,
      notes: vacancyData.notes || null,
      updated_at: now,
      expires_at: expiresAt.toISOString(),
    }, {
      onConflict: 'provider_id',
    });

  if (error) {
    console.error('Error upserting vacancy:', error);
    return { error: error.message };
  }
  return {};
}

// Public listings
export async function getPublicListings(): Promise<PublicListing[]> {
  console.log('[Supabase] getPublicListings called');
  try {
    const { data, error } = await supabase
      .from('public_listings')
      .select('*')
      .gt('expires_at', new Date().toISOString())
      .order('last_updated', { ascending: false });

    if (error) {
      // Ignore AbortError - happens in React 18 StrictMode double-mount
      if (error.message?.includes('AbortError')) {
        console.log('[Supabase] getPublicListings aborted (StrictMode re-mount)');
        return [];
      }
      console.error('[Supabase] getPublicListings error:', error);
      return [];
    }
    console.log('[Supabase] getPublicListings success, count:', data?.length || 0);
    return data || [];
  } catch (err) {
    console.error('[Supabase] getPublicListings exception:', err);
    return [];
  }
}

// Re-export ELFA check for external use
export { checkElfaStatus } from './elfa';

// Admin: Refresh ELFA status for all providers (via Edge Function to bypass RLS)
export async function refreshAllElfaStatus(): Promise<{ updated: number; total: number; errors: string[] }> {
  console.log('[Supabase] refreshAllElfaStatus started (calling Edge Function)');

  try {
    const { data, error } = await supabase.functions.invoke('refresh-elfa', {
      body: { admin_password: 'fccasf2024' },
    });

    if (error) {
      console.error('[Supabase] refreshAllElfaStatus error:', error);
      return { updated: 0, total: 0, errors: [error.message] };
    }

    console.log('[Supabase] refreshAllElfaStatus result:', data);

    if (!data.success) {
      return { updated: 0, total: 0, errors: [data.error || 'Unknown error'] };
    }

    // Log changes
    if (data.changes?.length > 0) {
      console.log('[Supabase] ELFA changes:', data.changes);
    }

    return {
      updated: data.updated || 0,
      total: data.total || 0,
      errors: data.errors || [],
    };
  } catch (err) {
    console.error('[Supabase] refreshAllElfaStatus exception:', err);
    return { updated: 0, total: 0, errors: [err instanceof Error ? err.message : 'Unknown error'] };
  }
}

// Organization types
export interface Organization {
  id: string;
  name: string;
  slug: string;
  website_url?: string;
  owner_user_id: string;
  created_at: string;
}

// Get organization owned by user
export async function getOrganizationByOwner(userId: string): Promise<Organization | null> {
  console.log('[Supabase] getOrganizationByOwner called for:', userId);
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('owner_user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('[Supabase] No organization found for user');
        return null;
      }
      console.error('[Supabase] getOrganizationByOwner error:', error);
      return null;
    }
    console.log('[Supabase] getOrganizationByOwner success:', data?.name);
    return data;
  } catch (err) {
    console.error('[Supabase] getOrganizationByOwner exception:', err);
    return null;
  }
}

// Get all providers in an organization
export async function getProvidersByOrganization(organizationId: string): Promise<Provider[]> {
  console.log('[Supabase] getProvidersByOrganization called for:', organizationId);
  try {
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .eq('organization_id', organizationId)
      .order('business_name');

    if (error) {
      console.error('[Supabase] getProvidersByOrganization error:', error);
      return [];
    }
    console.log('[Supabase] getProvidersByOrganization success, count:', data?.length || 0);
    return data || [];
  } catch (err) {
    console.error('[Supabase] getProvidersByOrganization exception:', err);
    return [];
  }
}

// Get vacancies for multiple providers
export async function getVacanciesByProviderIds(providerIds: string[]): Promise<Record<string, Vacancy>> {
  console.log('[Supabase] getVacanciesByProviderIds called for:', providerIds.length, 'providers');
  try {
    const { data, error } = await supabase
      .from('vacancies')
      .select('*')
      .in('provider_id', providerIds);

    if (error) {
      console.error('[Supabase] getVacanciesByProviderIds error:', error);
      return {};
    }

    // Convert to map by provider_id
    const vacancyMap: Record<string, Vacancy> = {};
    for (const v of data || []) {
      vacancyMap[v.provider_id] = v;
    }
    console.log('[Supabase] getVacanciesByProviderIds success, count:', Object.keys(vacancyMap).length);
    return vacancyMap;
  } catch (err) {
    console.error('[Supabase] getVacanciesByProviderIds exception:', err);
    return {};
  }
}

// Update vacancy for a specific provider (used by org owner)
export async function updateProviderVacancy(providerId: string, vacancyData: VacancyFormData): Promise<{ error?: string }> {
  const now = new Date().toISOString();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const { error } = await supabase
    .from('vacancies')
    .upsert({
      provider_id: providerId,
      infant_spots: vacancyData.infant_spots,
      toddler_spots: vacancyData.toddler_spots,
      preschool_spots: vacancyData.preschool_spots,
      school_age_spots: vacancyData.school_age_spots,
      accepting_infants: vacancyData.accepting_infants,
      accepting_toddlers: vacancyData.accepting_toddlers,
      accepting_preschool: vacancyData.accepting_preschool,
      accepting_school_age: vacancyData.accepting_school_age,
      available_date: vacancyData.available_date,
      full_time_available: vacancyData.full_time_available,
      part_time_available: vacancyData.part_time_available,
      waitlist_available: vacancyData.waitlist_available,
      notes: vacancyData.notes || null,
      updated_at: now,
      expires_at: expiresAt.toISOString(),
    }, {
      onConflict: 'provider_id',
    });

  if (error) {
    console.error('Error updating provider vacancy:', error);
    return { error: error.message };
  }
  return {};
}

// Parent Inquiry operations

// Submit a new inquiry (public - no auth required)
export async function submitInquiry(
  providerId: string,
  inquiryData: ParentInquiryFormData
): Promise<{ data?: ParentInquiry; error?: string }> {
  console.log('[Supabase] submitInquiry called for provider:', providerId);
  try {
    // Rate limit: Check if this email already contacted this provider in last 24 hours
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const { data: existingInquiry } = await supabase
      .from('parent_inquiries')
      .select('id')
      .eq('provider_id', providerId)
      .eq('parent_email', inquiryData.parent_email.toLowerCase().trim())
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .limit(1)
      .single();

    if (existingInquiry) {
      console.log('[Supabase] Rate limit hit: duplicate inquiry within 24 hours');
      return { error: 'You have already sent an inquiry to this provider recently. Please wait 24 hours before sending another.' };
    }

    const { data, error } = await supabase
      .from('parent_inquiries')
      .insert({
        provider_id: providerId,
        parent_name: inquiryData.parent_name,
        parent_email: inquiryData.parent_email.toLowerCase().trim(),
        parent_phone: inquiryData.parent_phone || null,
        message: inquiryData.message,
        age_group_interested: inquiryData.age_group_interested,
        status: 'new',
      })
      .select()
      .single();

    if (error) {
      console.error('[Supabase] submitInquiry error:', error);
      return { error: error.message };
    }

    console.log('[Supabase] submitInquiry success:', data?.id);

    // Trigger email notification via Edge Function
    try {
      await supabase.functions.invoke('send-inquiry-notification', {
        body: { inquiry_id: data.id },
      });
    } catch (emailErr) {
      // Don't fail the inquiry submission if email fails
      console.error('[Supabase] Email notification failed:', emailErr);
    }

    return { data };
  } catch (err) {
    console.error('[Supabase] submitInquiry exception:', err);
    return { error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Get inquiries for a provider
export async function getInquiries(providerId: string): Promise<ParentInquiry[]> {
  console.log('[Supabase] getInquiries called for provider:', providerId);
  try {
    const { data, error } = await supabase
      .from('parent_inquiries')
      .select('*')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase] getInquiries error:', error);
      return [];
    }

    console.log('[Supabase] getInquiries success, count:', data?.length || 0);
    return data || [];
  } catch (err) {
    console.error('[Supabase] getInquiries exception:', err);
    return [];
  }
}

// Get inquiry count (for badge display)
export async function getInquiryCount(providerId: string): Promise<{ total: number; unread: number }> {
  try {
    const { data, error } = await supabase
      .from('parent_inquiries')
      .select('status')
      .eq('provider_id', providerId);

    if (error || !data) {
      return { total: 0, unread: 0 };
    }

    return {
      total: data.length,
      unread: data.filter(i => i.status === 'new').length,
    };
  } catch {
    return { total: 0, unread: 0 };
  }
}

// Update inquiry status
export async function updateInquiryStatus(
  inquiryId: string,
  status: InquiryStatus
): Promise<{ error?: string }> {
  console.log('[Supabase] updateInquiryStatus:', inquiryId, status);
  try {
    const updates: Record<string, unknown> = { status };

    // Set timestamps based on status
    if (status === 'read') {
      updates.read_at = new Date().toISOString();
    } else if (status === 'replied') {
      updates.replied_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('parent_inquiries')
      .update(updates)
      .eq('id', inquiryId);

    if (error) {
      console.error('[Supabase] updateInquiryStatus error:', error);
      return { error: error.message };
    }

    return {};
  } catch (err) {
    console.error('[Supabase] updateInquiryStatus exception:', err);
    return { error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
