/**
 * Analytics tracking utility
 *
 * Provides centralized tracking for user actions and page views.
 * Uses Vercel Analytics for tracking.
 *
 * Future considerations:
 * - Track inquiry form submissions (when implemented)
 * - Track tour scheduling (when implemented)
 * - Track conversion funnels (listing view → contact → inquiry)
 */

import { track } from '@vercel/analytics';

// View/Page tracking
export type ViewName =
  | 'public'
  | 'auth'
  | 'onboarding'
  | 'vacancies'
  | 'roster'
  | 'projections'
  | 'settings'
  | 'org-dashboard'
  | 'admin';

export function trackPageView(view: ViewName) {
  track('page_view', { page: view });
}

// Provider listing interactions
export function trackListingView(providerId: string, providerName: string) {
  track('listing_view', {
    provider_id: providerId,
    provider_name: providerName,
  });
}

export function trackContactClick(providerId: string, providerName: string, contactType: 'phone' | 'email' | 'website') {
  track('contact_click', {
    provider_id: providerId,
    provider_name: providerName,
    contact_type: contactType,
  });
}

// Filter and search tracking
export function trackFilterUsed(filterType: string, filterValue: string) {
  track('filter_used', {
    filter_type: filterType,
    filter_value: filterValue,
  });
}

export function trackSearchUsed(searchTerm: string, resultCount: number) {
  track('search_used', {
    search_term: searchTerm,
    result_count: resultCount,
  });
}

// Eligibility screener tracking
export function trackEligibilityScreenerOpened() {
  track('eligibility_screener_opened');
}

export function trackEligibilityCheck(householdSize: number, qualifiesForPrograms: boolean) {
  track('eligibility_check', {
    household_size: householdSize,
    qualifies: qualifiesForPrograms,
  });
}

// Provider actions
export function trackVacancyUpdated(providerId: string, totalSpots: number) {
  track('vacancy_updated', {
    provider_id: providerId,
    total_spots: totalSpots,
  });
}

export function trackAutoFillUsed(providerId: string) {
  track('auto_fill_used', {
    provider_id: providerId,
  });
}

export function trackRosterUpdated(providerId: string, childCount: number) {
  track('roster_updated', {
    provider_id: providerId,
    child_count: childCount,
  });
}

// Auth tracking
export function trackSignIn(method: 'email' | 'google') {
  track('sign_in', { method });
}

export function trackSignUp(method: 'email' | 'google') {
  track('sign_up', { method });
}

export function trackSignOut() {
  track('sign_out');
}

// Future: Inquiry tracking (for when inquiry form is implemented)
export function trackInquiryStarted(providerId: string) {
  track('inquiry_started', { provider_id: providerId });
}

export function trackInquirySubmitted(providerId: string) {
  track('inquiry_submitted', { provider_id: providerId });
}

// Future: Tour scheduling tracking
export function trackTourScheduleStarted(providerId: string) {
  track('tour_schedule_started', { provider_id: providerId });
}

export function trackTourScheduleCompleted(providerId: string) {
  track('tour_schedule_completed', { provider_id: providerId });
}
