/**
 * Analytics tracking utility
 *
 * Centralized tracking. Fan-out to TruConversion (if present), PostHog, and
 * Supabase page_views. All calls are fire-and-forget.
 */

import posthog from 'posthog-js';
import { supabase } from './supabase';

declare global {
  interface Window {
    _tip?: unknown[][];
  }
}

let posthogReady = false;

export function initAnalytics() {
  const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
  if (!key || posthogReady || typeof window === 'undefined') return;
  posthog.init(key, {
    api_host: (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    autocapture: {
      dom_event_allowlist: ['click'],
      element_allowlist: ['a', 'button'],
    },
    mask_all_text: false,
    mask_personal_data_properties: true,
    session_recording: { maskAllInputs: true, maskTextSelector: 'input, textarea, [data-ph-mask]' },
    capture_pageview: true,
    capture_pageleave: true,
  });
  posthogReady = true;
}

function track(event: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  if (window._tip) window._tip.push(['track', event, properties || {}]);
  if (posthogReady) posthog.capture(event, properties);
}

// Log view events to Supabase for daily report (fire-and-forget)
function logView(eventType: 'page_view' | 'listing_view' | 'contact_click', data?: {
  page?: string;
  provider_id?: string;
  contact_type?: string;
}) {
  supabase.from('page_views').insert({
    event_type: eventType,
    page: data?.page || null,
    provider_id: data?.provider_id || null,
    contact_type: data?.contact_type || null,
  }).then(({ error }) => {
    if (error) console.warn('[Analytics] Failed to log view:', error.message);
  });
}

// View/Page tracking
export type ViewName =
  | 'public'
  | 'insights'
  | 'donate'
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
  logView('page_view', { page: view });
}

// Provider listing interactions
export function trackListingView(providerId: string, providerName: string) {
  track('listing_view', {
    provider_id: providerId,
    provider_name: providerName,
  });
  logView('listing_view', { provider_id: providerId });
}

export function trackContactClick(providerId: string, providerName: string, contactType: 'phone' | 'email' | 'website') {
  track('contact_click', {
    provider_id: providerId,
    provider_name: providerName,
    contact_type: contactType,
  });
  logView('contact_click', { provider_id: providerId, contact_type: contactType });
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

// Provider CTA clicks (funnel top)
export function trackListProgramClicked(source: 'public_listings' | 'empty_state' | 'auth_banner' | 'top_bar') {
  track('cta_list_program_clicked', { source });
}

export function trackJotformOpened(source: 'public_listings' | 'auth_banner' | 'auth_page') {
  track('jotform_opened', { source });
}

export function trackSigninClicked(source: 'public_listings' | 'header' | 'auth_banner' | 'top_bar') {
  track('signin_clicked', { source });
}

export function trackListingExpanded(providerId: string) {
  track('listing_expanded', { provider_id: providerId });
}

// Auth tracking
export function trackSignIn(method: 'email' | 'google') {
  track('sign_in', { method });
}

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (posthogReady && userId) posthog.identify(userId, traits);
}

export function resetUser() {
  if (posthogReady) posthog.reset();
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
