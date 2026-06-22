import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { getPublicListings } from '../lib/supabase';
import { PublicListing } from '../types/registry';

export interface RedesignListing {
  id: string;
  name: string;
  neigh: string;
  spots: number;
  tags: string[];
  lang: string[];
  elfa: boolean;
  type: string;
  license: string;
  updated: string;
  schedule: string;
  phone?: string;
}

export interface ListingsBucket {
  loading: boolean;
  error: string | null;
  raw: PublicListing[];
  withOpenings: RedesignListing[];
  totalSpots: number;
  homesWithOpenings: number;
  lastUpdatedRelative: string | null;
}

const PROGRAM_TYPE_LABEL: Record<PublicListing['program_type'], string> = {
  small_family: 'Small Family · Up to 8',
  large_family: 'Large Family · Up to 14',
};

function buildSchedule(l: PublicListing): string {
  const parts: string[] = [];
  if (l.full_time_available) parts.push('Full-time');
  if (l.part_time_available) parts.push('Part-time');
  if (l.evening_available) parts.push('Evenings');
  if (l.weekend_available) parts.push('Weekends');
  if (parts.length === 0) return 'Schedule on request';
  return parts.join(' + ');
}

function buildTags(l: PublicListing): string[] {
  const tags: string[] = [];
  if (l.accepting_infants && l.infant_spots > 0) tags.push('Infant');
  if (l.accepting_toddlers && l.toddler_spots > 0) tags.push('Toddler');
  if (l.accepting_preschool && l.preschool_spots > 0) tags.push('Preschool');
  if (l.accepting_school_age && l.school_age_spots > 0) tags.push('School Age');
  return tags;
}

function adapt(l: PublicListing): RedesignListing {
  const updatedDate = new Date(l.last_updated);
  return {
    id: l.provider_id,
    name: l.business_name,
    neigh: l.neighborhood || l.zip_code,
    spots: l.total_spots_available,
    tags: buildTags(l),
    lang: l.languages?.length ? l.languages : ['English'],
    elfa: l.is_elfa_network,
    type: PROGRAM_TYPE_LABEL[l.program_type] || 'Family Child Care',
    license: l.license_number ? `#${l.license_number}` : '',
    updated: formatDistanceToNow(updatedDate, { addSuffix: true }),
    schedule: buildSchedule(l),
    phone: l.phone,
  };
}

export function useListings(): ListingsBucket {
  const [state, setState] = useState<ListingsBucket>({
    loading: true,
    error: null,
    raw: [],
    withOpenings: [],
    totalSpots: 0,
    homesWithOpenings: 0,
    lastUpdatedRelative: null,
  });

  useEffect(() => {
    let cancelled = false;
    getPublicListings()
      .then(rows => {
        if (cancelled) return;
        const open = rows.filter(r => r.total_spots_available > 0);
        const adapted = open.map(adapt);
        const totalSpots = open.reduce((sum, r) => sum + r.total_spots_available, 0);
        const newest = rows.length
          ? rows.reduce((max, r) => (new Date(r.last_updated) > new Date(max) ? r.last_updated : max), rows[0].last_updated)
          : null;
        setState({
          loading: false,
          error: null,
          raw: rows,
          withOpenings: adapted,
          totalSpots,
          homesWithOpenings: open.length,
          lastUpdatedRelative: newest ? formatDistanceToNow(new Date(newest), { addSuffix: true }) : null,
        });
      })
      .catch(err => {
        if (cancelled) return;
        setState(s => ({ ...s, loading: false, error: err?.message || 'Failed to load listings' }));
      });
    return () => { cancelled = true; };
  }, []);

  return state;
}
