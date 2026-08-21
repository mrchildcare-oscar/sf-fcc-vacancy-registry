import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { PublicListing, SearchFilters } from '../../types/registry';
import {
  Search,
  MapPin,
  Phone,
  Star,
  Filter,
  X,
  Baby,
  Clock,
  ChevronDown,
  ChevronUp,
  Globe,
  ClipboardList,
  MessageSquare,
  Shuffle,
  ExternalLink,
  AlertTriangle,
  Link2,
  Check,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useLanguage } from '../../i18n/LanguageContext';
import { ParentInquiryForm } from './ParentInquiryForm';
import { ParentToolbox } from './ParentToolbox';
import {
  trackListingView,
  trackContactClick,
  trackFilterUsed,
  trackSearchUsed,
} from '../../lib/analytics';
import { shuffleListingsForUser } from '../../lib/randomOrder';
import { getListingFreshness } from '../../lib/vacancyTtl';

// True SF neighborhood borders (reviewed with Oscar). Used ONLY as a fallback:
// when a selected neighborhood has few/no openings we surface openings in
// bordering neighborhoods. Keyed by canonical filter names; Inner/Outer Sunset
// & Richmond collapse to Sunset/Richmond via NEIGHBORHOOD_ALIASES.
const NEIGHBORHOOD_ADJACENCY: Record<string, string[]> = {
  // West / Ocean
  'Sunset': ['Richmond', 'Forest Hill', 'West Portal', 'Lake Merced'],
  'Richmond': ['Sunset', 'Pacific Heights'],
  'Lake Merced': ['Sunset', 'Oceanview', 'Ingleside'],
  'West Portal': ['Forest Hill', 'Sunset', 'Sunnyside', 'Ingleside'],
  'Forest Hill': ['West Portal', 'Sunset', 'Diamond Heights', 'Sunnyside'],
  'Sunnyside': ['Glen Park', 'Ingleside', 'West Portal', 'Forest Hill'],
  'Oceanview': ['Ingleside', 'Lake Merced', 'Outer Mission'],
  'Ingleside': ['Oceanview', 'Outer Mission', 'Sunnyside', 'West Portal', 'Lake Merced'],
  // Southeast
  'Outer Mission': ['Excelsior', 'Crocker Amazon', 'Ingleside', 'Oceanview', 'Glen Park'],
  'Excelsior': ['Portola', 'Outer Mission', 'Crocker Amazon', 'Visitacion Valley', 'Ingleside', 'Bernal Heights'],
  'Crocker Amazon': ['Excelsior', 'Outer Mission', 'Visitacion Valley'],
  'Visitacion Valley': ['Portola', 'Bayview', 'Excelsior', 'Crocker Amazon'],
  'Portola': ['Bernal Heights', 'Bayview', 'Excelsior', 'Visitacion Valley'],
  'Bayview': ['Potrero Hill', 'Portola', 'Visitacion Valley', 'Mission Bay', 'Bernal Heights'],
  'Mission Bay': ['SoMa', 'Potrero Hill', 'Bayview'],
  'Potrero Hill': ['Mission', 'SoMa', 'Mission Bay', 'Bayview'],
  // Mission / Central
  'Mission': ['Castro', 'Noe Valley', 'Bernal Heights', 'Potrero Hill', 'SoMa', 'Hayes Valley'],
  'Bernal Heights': ['Mission', 'Noe Valley', 'Glen Park', 'Portola', 'Bayview', 'Excelsior'],
  'Noe Valley': ['Castro', 'Mission', 'Glen Park', 'Diamond Heights', 'Bernal Heights'],
  'Glen Park': ['Noe Valley', 'Diamond Heights', 'Bernal Heights', 'Sunnyside', 'Outer Mission'],
  'Diamond Heights': ['Glen Park', 'Noe Valley', 'Castro', 'Forest Hill'],
  'Castro': ['Noe Valley', 'Mission', 'Haight-Ashbury', 'Diamond Heights'],
  'Haight-Ashbury': ['Castro', 'Sunset', 'Western Addition', 'Hayes Valley'],
  // Downtown / North
  'Hayes Valley': ['Western Addition', 'SoMa', 'Tenderloin', 'Mission', 'Haight-Ashbury'],
  'Western Addition': ['Pacific Heights', 'Hayes Valley', 'Haight-Ashbury', 'Tenderloin'],
  'SoMa': ['Mission', 'Financial District', 'Mission Bay', 'Potrero Hill', 'Tenderloin', 'Hayes Valley'],
  'Tenderloin': ['Nob Hill', 'SoMa', 'Hayes Valley', 'Western Addition'],
  'Nob Hill': ['Chinatown', 'Russian Hill', 'Tenderloin', 'Financial District'],
  'Financial District': ['Chinatown', 'North Beach', 'SoMa', 'Nob Hill'],
  'Chinatown': ['North Beach', 'Financial District', 'Nob Hill'],
  'North Beach': ['Russian Hill', 'Chinatown', 'Financial District', 'Marina'],
  'Russian Hill': ['Nob Hill', 'North Beach', 'Marina', 'Pacific Heights'],
  'Pacific Heights': ['Marina', 'Western Addition', 'Richmond', 'Russian Hill'],
  'Marina': ['Pacific Heights', 'Russian Hill', 'North Beach'],
};

// Nearby-fallback tuning:
// - THRESHOLD: the selected neighborhood must have FEWER than this many openings
//   to trigger the nearby section (so a thin one like Noe Valley still helps).
// - TARGET: reach outward ring by ring until we've gathered at least this many
//   nearby openings (expand-when-dry — closest neighborhoods shown first)...
// - MAX_RINGS: ...but never hop more than this far from the selected neighborhood.
const NEARBY_THRESHOLD = 3;
const NEARBY_TARGET = 4;
const NEARBY_MAX_RINGS = 3;

interface PublicListingsProps {
  listings: PublicListing[];
  loading?: boolean;
  onSignIn?: () => void;
  isProvider?: boolean; // Whether viewer is a signed-in provider
}

export function PublicListings({ listings, loading, isProvider = false }: PublicListingsProps) {
  const { t, language } = useLanguage();
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [expandedListing, setExpandedListing] = useState<string | null>(null);
  const [showWaitlistSection, setShowWaitlistSection] = useState(false);
  const [inquiryListing, setInquiryListing] = useState<PublicListing | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Render freshness-aware "last updated" timestamp
  const renderLastUpdated = useCallback((listing: PublicListing) => {
    const freshness = getListingFreshness(listing.last_updated, listing.expires_at);
    const timeAgo = formatDistanceToNow(new Date(listing.last_updated), { addSuffix: true });
    if (freshness === 'stale') {
      const updatedDate = new Date(listing.last_updated).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      return (
        <p className="text-xs text-gray-400">
          {t('publicListings.lastUpdated')} {updatedDate}
        </p>
      );
    }
    if (freshness === 'aging') {
      return (
        <p className="flex items-center gap-1 text-xs text-amber-500">
          <Clock size={12} />
          {t('publicListings.agingBadge')}
        </p>
      );
    }
    return (
      <p className="text-xs text-gray-400">
        {t('publicListings.lastUpdated')} {timeAgo}
      </p>
    );
  }, [t]);

  // Map URL slugs from /neighborhoods/{slug}/ landing pages to canonical
  // neighborhood values in the listing data. Sunset and Richmond are split
  // into Inner/Outer in the dataset; we also accept the bare form so any
  // provider labeled just "Sunset" or "Richmond" still groups correctly.
  const NEIGHBORHOOD_ALIASES: Record<string, string[]> = {
    sunset: ['Inner Sunset', 'Outer Sunset', 'Sunset'],
    richmond: ['Inner Richmond', 'Outer Richmond', 'Richmond'],
    bayview: ['Bayview'],
    excelsior: ['Excelsior'],
    mission: ['Mission'],
  };

  // Convert any DB neighborhood value to its canonical display name.
  // "Outer Richmond" / "Inner Richmond" / "Richmond" → "Richmond"
  // "Portola" (no alias) → "Portola"
  const canonicalNeighborhood = (dbName: string): string => {
    for (const [slug, aliases] of Object.entries(NEIGHBORHOOD_ALIASES)) {
      if (aliases.includes(dbName)) {
        return slug[0].toUpperCase() + slug.slice(1);
      }
    }
    return dbName;
  };

  // Short trilingual hint + label for the 5 neighborhoods with landing pages.
  // Used to decorate group headers in the listings with a "learn more" link
  // that's contextually adjacent to where parents are evaluating that area.
  const NEIGHBORHOOD_ARTICLES: Record<string, {
    label: { en: string; es: string; zh: string };
    hint: { en: string; es: string; zh: string };
  }> = {
    sunset: {
      label: { en: 'Sunset', es: 'Sunset', zh: 'Sunset' },
      hint: {
        en: 'High density of Cantonese/Mandarin bilingual homes',
        es: 'Alta densidad de hogares bilingües en cantonés/mandarín',
        zh: '粵語及普通話雙語托兒密度最高',
      },
    },
    richmond: {
      label: { en: 'Richmond', es: 'Richmond', zh: 'Richmond' },
      hint: {
        en: 'Chinese and Russian bilingual providers',
        es: 'Proveedores bilingües en chino y ruso',
        zh: '中文及俄語雙語服務提供者',
      },
    },
    excelsior: {
      label: { en: 'Excelsior', es: 'Excelsior', zh: 'Excelsior' },
      hint: {
        en: 'Diverse Spanish, Tagalog, and Chinese FCC community',
        es: 'Comunidad FCC diversa en español, tagalo y chino',
        zh: '多元西班牙語、他加祿語及中文FCC社群',
      },
    },
    bayview: {
      label: { en: 'Bayview', es: 'Bayview', zh: 'Bayview' },
      hint: {
        en: 'Growing ELFA network in southeastern SF',
        es: 'Red ELFA en crecimiento en el sureste de SF',
        zh: '三藩市東南ELFA網絡持續擴展',
      },
    },
    mission: {
      label: { en: 'Mission', es: 'Mission', zh: 'Mission' },
      hint: {
        en: 'Highest concentration of Spanish-speaking FCC',
        es: 'Mayor concentración de FCC en español',
        zh: '西班牙語FCC密度最高',
      },
    },
  };

  // Map a DB neighborhood value (e.g. "Inner Sunset") to its article slug
  // (e.g. "sunset"), or null if no article exists for that neighborhood.
  const getArticleSlug = (dbNeighborhood: string): string | null => {
    const lowered = dbNeighborhood.toLowerCase();
    if (NEIGHBORHOOD_ARTICLES[lowered]) return lowered;
    for (const [slug, aliases] of Object.entries(NEIGHBORHOOD_ALIASES)) {
      if (aliases.includes(dbNeighborhood)) return slug;
    }
    return null;
  };

  // Is the given slug chip currently active (matches filters.neighborhood)?
  const isChipActive = (slug: string): boolean => {
    if (!filters.neighborhood) return false;
    const f = filters.neighborhood.toLowerCase();
    if (f === slug) return true;
    const aliases = NEIGHBORHOOD_ALIASES[slug] || [];
    return aliases.some(a => a.toLowerCase() === f);
  };

  // Handle chip click: toggle filter (clicking an active chip clears it).
  // Always store the canonical Title-Case name (e.g. 'Richmond') so the
  // dropdown selection mirrors the chip and applyFilters' alias lookup
  // matches every DB variant (Inner/Outer/bare).
  const handleNeighborhoodChipClick = (slug: string) => {
    if (isChipActive(slug)) {
      setFilters(prev => ({ ...prev, neighborhood: undefined }));
      return;
    }
    const value = slug[0].toUpperCase() + slug.slice(1);
    setFilters(prev => ({ ...prev, neighborhood: value }));
    setShowFilters(true);
  };

  // On mount, hydrate filters from the URL hash query so a shared link like
  //   #public?neighborhood=excelsior&age=infant&language=Cantonese&schedule=full_time&elfa=1&q=94112
  // opens the registry already filtered. (Previously only `neighborhood` was
  // read.) Unknown or invalid values are ignored.
  useEffect(() => {
    const queryString = window.location.hash.split('?').slice(1).join('?');
    if (!queryString) return;
    const params = new URLSearchParams(queryString);
    const next: SearchFilters = {};

    const neighborhood = params.get('neighborhood');
    if (neighborhood) {
      const fLower = neighborhood.trim().toLowerCase();
      // Known slug (excelsior) → canonical Title-Case ("Excelsior"); any other
      // neighborhood value passes through as-is.
      next.neighborhood = NEIGHBORHOOD_ALIASES[fLower]
        ? fLower[0].toUpperCase() + fLower.slice(1)
        : neighborhood;
    }

    const age = params.get('age') || params.get('age_group');
    if (age && ['infant', 'toddler', 'preschool', 'school_age'].includes(age)) {
      next.age_group = age as SearchFilters['age_group'];
    }

    const language = params.get('language');
    if (language) next.language = language;

    const schedule = params.get('schedule');
    if (schedule && ['full_time', 'part_time', 'weekend', 'evening', 'overnight'].includes(schedule)) {
      next.schedule = schedule as SearchFilters['schedule'];
    }

    const elfa = params.get('elfa');
    if (elfa && ['1', 'true', 'yes'].includes(elfa.toLowerCase())) next.elfa_only = true;

    const q = params.get('q') || params.get('search');
    if (q) next.search = q;

    if (Object.keys(next).length > 0) {
      setFilters(prev => ({ ...prev, ...next }));
      // Open the filter panel when a panel-based filter is active so the
      // applied filters are visible (search has its own always-visible box).
      if (next.neighborhood || next.age_group || next.language || next.schedule) {
        setShowFilters(true);
      }
    }
  }, []);

  // Mirror active filters back into the URL hash so the address bar itself is a
  // shareable link and "Copy link" just copies location.href. replaceState =
  // no history spam and no hashchange event, so RegistryApp's hash router is
  // untouched (it only reads the part before '?'). The first run is skipped so
  // it never strips the params the effect above is still hydrating.
  const didInitUrlSync = useRef(false);
  useEffect(() => {
    if (!didInitUrlSync.current) {
      didInitUrlSync.current = true;
      return;
    }
    const params = new URLSearchParams();
    if (filters.neighborhood) params.set('neighborhood', filters.neighborhood);
    if (filters.age_group) params.set('age', filters.age_group);
    if (filters.language) params.set('language', filters.language);
    if (filters.schedule) params.set('schedule', filters.schedule);
    if (filters.elfa_only) params.set('elfa', '1');
    if (filters.search) params.set('q', filters.search);
    const qs = params.toString();
    window.history.replaceState(null, '', qs ? `#public?${qs}` : '#public');
  }, [filters]);

  // Handle listing click with analytics tracking
  const handleListingClick = useCallback((listing: PublicListing) => {
    const isExpanding = expandedListing !== listing.provider_id;
    setExpandedListing(isExpanding ? listing.provider_id : null);
    // Track listing view when expanding
    if (isExpanding) {
      trackListingView(listing.provider_id, listing.business_name);
    }
  }, [expandedListing]);

  // Handle contact click with analytics tracking
  const handleContactClick = useCallback((listing: PublicListing, contactType: 'phone' | 'email' | 'website') => {
    trackContactClick(listing.provider_id, listing.business_name, contactType);
  }, []);

  // Auto-close the filter panel when the user scrolls away from it, so it
  // doesn't keep eating screen real estate while browsing listings.
  // Threshold: ~120px of scroll past the position where it was opened.
  useEffect(() => {
    if (!showFilters) return;
    const openY = window.scrollY;
    const onScroll = () => {
      if (window.scrollY > openY + 120) setShowFilters(false);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [showFilters]);

  // Track filter changes
  const prevFilters = useRef<SearchFilters>({});

  // Compute available filter options from actual listings
  const availableNeighborhoods = useMemo(() => {
    const neighborhoods = new Set<string>();
    listings.forEach(listing => {
      if (listing.neighborhood) {
        neighborhoods.add(canonicalNeighborhood(listing.neighborhood));
      }
    });
    return Array.from(neighborhoods).sort();
  }, [listings]);

  const availableLanguages = useMemo(() => {
    const languages = new Set<string>();
    listings.forEach(listing => {
      const langs = Array.isArray(listing.languages)
        ? listing.languages
        : JSON.parse(listing.languages as unknown as string);
      langs.forEach((lang: string) => languages.add(lang));
    });
    return Array.from(languages).sort();
  }, [listings]);

  // Count of ELFA programs that currently have openings. Drives the
  // always-visible ELFA quick toggle so it self-gates: parents see up front
  // how many ELFA programs to expect. Independent of the other active filters
  // so the number stays stable as you narrow by neighborhood/age/etc.
  const elfaOpenCount = useMemo(
    () => listings.filter(l => l.is_elfa_network && l.total_spots_available > 0).length,
    [listings]
  );

  // Does a listing pass the active filters? `ignoreNeighborhood` lets the
  // nearby-neighborhood fallback reuse the same search/ELFA/language/age/schedule
  // logic while relaxing only the neighborhood constraint.
  const matchesFilters = (listing: PublicListing, opts: { ignoreNeighborhood?: boolean } = {}) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const digitsOnly = filters.search.replace(/\D/g, '');
      const matchesZip = listing.zip_code.startsWith(filters.search);
      const matchesNeighborhood = listing.neighborhood?.toLowerCase().includes(q);
      const matchesName = listing.business_name.toLowerCase().includes(q);
      const matchesLicense =
        digitsOnly.length >= 4 && listing.license_number?.includes(digitsOnly);
      if (!matchesZip && !matchesNeighborhood && !matchesName && !matchesLicense) return false;
    }
    if (!opts.ignoreNeighborhood && filters.neighborhood) {
      const fLower = filters.neighborhood.trim().toLowerCase();
      const aliasList = NEIGHBORHOOD_ALIASES[fLower];
      if (aliasList) {
        if (!listing.neighborhood || !aliasList.includes(listing.neighborhood)) return false;
      } else if ((listing.neighborhood?.toLowerCase() ?? '') !== fLower) {
        return false;
      }
    }
    if (filters.elfa_only && !listing.is_elfa_network) {
      return false;
    }
    if (filters.language) {
      const langs = Array.isArray(listing.languages)
        ? listing.languages
        : JSON.parse(listing.languages as unknown as string);
      if (!langs.includes(filters.language)) {
        return false;
      }
    }
    if (filters.age_group) {
      switch (filters.age_group) {
        case 'infant':
          if (!listing.accepting_infants) return false;
          break;
        case 'toddler':
          if (!listing.accepting_toddlers) return false;
          break;
        case 'preschool':
          if (!listing.accepting_preschool) return false;
          break;
        case 'school_age':
          if (!listing.accepting_school_age) return false;
          break;
      }
    }
    if (filters.schedule === 'full_time' && !listing.full_time_available) {
      return false;
    }
    if (filters.schedule === 'part_time' && !listing.part_time_available) {
      return false;
    }
    if (filters.schedule === 'weekend' && !listing.weekend_available) {
      return false;
    }
    if (filters.schedule === 'evening' && !listing.evening_available) {
      return false;
    }
    if (filters.schedule === 'overnight' && !listing.overnight_available) {
      return false;
    }
    return true;
  };

  // Separate listings: with openings vs full with waitlist
  // Memoize allFiltered so expand/collapse doesn't re-filter + re-shuffle
  const allFiltered = useMemo(() => listings.filter(l => matchesFilters(l)), [listings, filters]);
  const listingsWithOpenings = useMemo(() => {
    const filtered = allFiltered.filter(l => l.total_spots_available > 0);
    return shuffleListingsForUser(filtered);
  }, [allFiltered]);
  const fullWithWaitlist = useMemo(() => allFiltered.filter(l => l.total_spots_available === 0 && l.waitlist_available), [allFiltered]);

  // Nearby-neighborhood fallback: when the selected neighborhood is thin
  // (fewer than NEARBY_THRESHOLD openings), reach outward through the adjacency
  // graph — closest ring first, expanding only when the closer neighborhoods
  // are dry — until we've gathered NEARBY_TARGET openings or hit NEARBY_MAX_RINGS
  // hops. Every result still matches the OTHER active filters (age/language/ELFA).
  const nearbyListings = useMemo(() => {
    if (!filters.neighborhood || listingsWithOpenings.length >= NEARBY_THRESHOLD) return [];
    const selected = canonicalNeighborhood(filters.neighborhood);
    const startKey = Object.keys(NEIGHBORHOOD_ADJACENCY).find(k => k.toLowerCase() === selected.toLowerCase());
    if (!startKey) return [];

    // Index open, filter-matching listings by canonical neighborhood.
    const openByHood = new Map<string, PublicListing[]>();
    listings.forEach(l => {
      if (l.total_spots_available <= 0 || !l.neighborhood) return;
      if (!matchesFilters(l, { ignoreNeighborhood: true })) return;
      const canon = canonicalNeighborhood(l.neighborhood).toLowerCase();
      const arr = openByHood.get(canon);
      if (arr) arr.push(l); else openByHood.set(canon, [l]);
    });

    // Breadth-first outward from the selected neighborhood.
    const visited = new Set<string>([selected.toLowerCase()]);
    let frontier: string[] = NEIGHBORHOOD_ADJACENCY[startKey];
    const collected: PublicListing[] = [];
    for (let ring = 0; ring < NEARBY_MAX_RINGS && collected.length < NEARBY_TARGET && frontier.length; ring++) {
      const next: string[] = [];
      for (const hood of frontier) {
        const hoodLower = hood.toLowerCase();
        if (visited.has(hoodLower)) continue;
        visited.add(hoodLower);
        const here = openByHood.get(hoodLower);
        if (here) collected.push(...here);
        next.push(...(NEIGHBORHOOD_ADJACENCY[hood] ?? []));
      }
      frontier = next;
    }
    return shuffleListingsForUser(collected);
  }, [listings, filters, listingsWithOpenings.length]);

  // Split listings into fresh/aging (shown normally) vs stale (shown in separate section)
  const [freshListings, staleListings] = useMemo(() => {
    const fresh: PublicListing[] = [];
    const stale: PublicListing[] = [];
    listingsWithOpenings.forEach(l => {
      if (getListingFreshness(l.last_updated, l.expires_at) === 'stale') {
        stale.push(l);
      } else {
        fresh.push(l);
      }
    });
    return [fresh, stale];
  }, [listingsWithOpenings]);

  const [showStaleSection, setShowStaleSection] = useState(false);

  // Auto-expand the older listings section when there are no fresh listings
  // but stale ones exist (e.g., a neighborhood filter with only older results).
  useEffect(() => {
    if (freshListings.length === 0 && staleListings.length > 0) {
      setShowStaleSection(true);
    }
  }, [freshListings.length, staleListings.length]);

  // Group listings by neighborhood for display (only fresh + aging)
  const groupedListings = useMemo(() => {
    const groups = new Map<string, PublicListing[]>();
    freshListings.forEach(listing => {
      const hood = listing.neighborhood ? canonicalNeighborhood(listing.neighborhood) : 'Other';
      if (!groups.has(hood)) groups.set(hood, []);
      groups.get(hood)!.push(listing);
    });
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [freshListings]);

  // Calculate vacancy statistics
  const vacancyStats = useMemo(() => {
    const stats = {
      totalSlots: 0,
      infantSlots: 0,
      toddlerSlots: 0,
      preschoolSlots: 0,
      schoolAgeSlots: 0,
      // ELFA-specific stats
      elfaPrograms: 0,
      elfaTotalSlots: 0,
      elfaInfantSlots: 0,
      elfaToddlerSlots: 0,
      elfaPreschoolSlots: 0,
      elfaSchoolAgeSlots: 0,
    };

    listingsWithOpenings.forEach(listing => {
      stats.totalSlots += listing.total_spots_available;
      stats.infantSlots += listing.infant_spots || 0;
      stats.toddlerSlots += listing.toddler_spots || 0;
      stats.preschoolSlots += listing.preschool_spots || 0;
      stats.schoolAgeSlots += listing.school_age_spots || 0;

      // ELFA stats
      if (listing.is_elfa_network) {
        stats.elfaPrograms += 1;
        stats.elfaTotalSlots += listing.total_spots_available;
        stats.elfaInfantSlots += listing.infant_spots || 0;
        stats.elfaToddlerSlots += listing.toddler_spots || 0;
        stats.elfaPreschoolSlots += listing.preschool_spots || 0;
        stats.elfaSchoolAgeSlots += listing.school_age_spots || 0;
      }
    });

    return stats;
  }, [listingsWithOpenings]);

  // Track filter changes
  useEffect(() => {
    // Track each filter that changed
    if (filters.neighborhood !== prevFilters.current.neighborhood && filters.neighborhood) {
      trackFilterUsed('neighborhood', filters.neighborhood);
    }
    if (filters.age_group !== prevFilters.current.age_group && filters.age_group) {
      trackFilterUsed('age_group', filters.age_group);
    }
    if (filters.language !== prevFilters.current.language && filters.language) {
      trackFilterUsed('language', filters.language);
    }
    if (filters.schedule !== prevFilters.current.schedule && filters.schedule) {
      trackFilterUsed('schedule', filters.schedule);
    }
    if (filters.elfa_only !== prevFilters.current.elfa_only && filters.elfa_only) {
      trackFilterUsed('elfa_only', 'true');
    }
    if (filters.search !== prevFilters.current.search && filters.search && filters.search.length >= 3) {
      trackSearchUsed(filters.search, listingsWithOpenings.length);
    }
    prevFilters.current = { ...filters };
  }, [filters, listingsWithOpenings.length]);

  const clearFilters = () => {
    setFilters({});
  };

  // Copy the current (filter-synced) URL so it can be shared as a pre-filtered link.
  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // Clipboard blocked (rare) — the URL bar still holds the shareable link.
    }
  }, []);

  const hasActiveFilters = Object.values(filters).some(v => v);

  // A single "has openings" listing card. Shared by the main grouped results
  // and the nearby-neighborhood fallback so both render identically.
  const renderOpeningCard = (listing: PublicListing) => (
    <div
      key={listing.provider_id}
      data-provider-id={listing.provider_id}
      className="bg-white rounded-xl shadow hover:shadow-md transition-shadow mb-3"
    >
      <div
        className="p-4 cursor-pointer"
        onClick={() => handleListingClick(listing)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900">{listing.business_name}</h3>
              {listing.is_elfa_network && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                  <Star size={12} />
                  ELFA
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600 flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin size={14} />
                {listing.neighborhood || listing.zip_code}
              </span>
              <span>
                {listing.program_type === 'small_family' ? t('publicListings.smallFamily') : t('publicListings.largeFamily')}
              </span>
              <span className="text-gray-400">
                {t('publicListings.license')} #{listing.license_number}
              </span>
            </div>
          </div>

          <div className="text-right flex items-center gap-4">
            <div>
              {isProvider ? (
                <>
                  <p className="text-2xl font-bold text-green-600">
                    {listing.total_spots_available}
                  </p>
                  <p className="text-xs text-gray-500">{t('publicListings.spotsOpen')}</p>
                </>
              ) : (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                  {t('publicListings.hasOpenings')}
                </span>
              )}
            </div>
            {expandedListing === listing.provider_id ? (
              <ChevronUp size={20} className="text-gray-400" />
            ) : (
              <ChevronDown size={20} className="text-gray-400" />
            )}
          </div>
        </div>

        {/* Quick spots overview - counts only shown to providers */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {listing.accepting_infants && (
            <span className="px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded">
              {t('vacancy.infant')}{isProvider && listing.infant_spots > 0 && ` (${listing.infant_spots})`}
            </span>
          )}
          {listing.accepting_toddlers && (
            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
              {t('vacancy.toddler')}{isProvider && listing.toddler_spots > 0 && ` (${listing.toddler_spots})`}
            </span>
          )}
          {listing.accepting_preschool && (
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
              {t('vacancy.preschool')}{isProvider && listing.preschool_spots > 0 && ` (${listing.preschool_spots})`}
            </span>
          )}
          {listing.accepting_school_age && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
              {t('vacancy.schoolAge')}{isProvider && listing.school_age_spots > 0 && ` (${listing.school_age_spots})`}
            </span>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {expandedListing === listing.provider_id && (
        <div className="px-4 pb-4 pt-2 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(listing.phone || listing.website) && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">{t('publicListings.contact')}</h4>
                <div className="space-y-2 text-sm">
                  {listing.phone && (
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${listing.phone}`}
                        onClick={() => handleContactClick(listing, 'phone')}
                        className="flex items-center gap-2 text-blue-600 hover:underline"
                      >
                        <Phone size={14} />
                        {listing.phone}
                      </a>
                      {listing.phone_accepts_text === true && (
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                          {t('publicListings.textOk')}
                        </span>
                      )}
                      {listing.phone_accepts_text === false && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {t('publicListings.callOnly')}
                        </span>
                      )}
                    </div>
                  )}
                  {listing.website && (
                    <a
                      href={listing.website.startsWith('http') ? listing.website : `https://${listing.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleContactClick(listing, 'website')}
                      className="flex items-center gap-2 text-blue-600 hover:underline"
                    >
                      <Globe size={14} />
                      {t('publicListings.visitWebsite')}
                    </a>
                  )}
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">{t('publicListings.details')}</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p className="flex items-center gap-2">
                  <Clock size={14} />
                  {[
                    listing.full_time_available && t('vacancy.fullTime'),
                    listing.part_time_available && t('vacancy.partTime'),
                    listing.weekend_available && t('vacancy.weekend'),
                    listing.evening_available && t('vacancy.evening'),
                    listing.overnight_available && t('vacancy.overnight')
                  ].filter(Boolean).join(', ') || t('publicListings.contactForSchedule')}
                </p>
                {listing.languages.length > 0 && (
                  <p>{t('publicListings.languagesSpoken')}: {listing.languages.join(', ')}</p>
                )}
              </div>
            </div>
          </div>

          {listing.notes && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">{listing.notes}</p>
            </div>
          )}

          {/* Send Inquiry Button */}
          <div className="mt-4 pt-4 border-t flex items-center justify-between">
            {renderLastUpdated(listing)}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setInquiryListing(listing);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <MessageSquare size={16} />
              {t('inquiry.sendInquiry')}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div data-page-header className="bg-white border-b sticky top-11 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          {/* Title and Stats - stacked on mobile, side-by-side on desktop */}
          <div className="mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {t('publicListings.title')}
                </h1>
                <p className="text-gray-600 text-sm">
                  {t('publicListings.introSentence')}
                </p>
              </div>
              {/* Stats - horizontal on desktop, compact on mobile */}
              <div className="flex items-center gap-4 sm:gap-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-bold text-blue-600">{listingsWithOpenings.length + nearbyListings.length}</span>
                  <span className="text-xs sm:text-sm text-gray-500">
                    {nearbyListings.length > 0
                      ? t('publicListings.programsWithOpeningsNearby')
                      : t('publicListings.programsWithOpenings')}
                  </span>
                </div>
                {isProvider && (
                  <>
                    <span className="text-gray-300">•</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl sm:text-2xl font-bold text-green-600">{vacancyStats.totalSlots}</span>
                      <span className="text-xs sm:text-sm text-gray-500">{t('publicListings.totalSlots')}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            {/* Age group breakdown - only shown to providers */}
            {isProvider && (
              <div className="flex flex-wrap gap-2 sm:gap-3 mt-2 sm:justify-end text-xs">
                {vacancyStats.infantSlots > 0 && (
                  <span className="px-2 py-0.5 bg-pink-50 text-pink-600 rounded">
                    {t('vacancy.infant')}: {vacancyStats.infantSlots}
                  </span>
                )}
                {vacancyStats.toddlerSlots > 0 && (
                  <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded">
                    {t('vacancy.toddler')}: {vacancyStats.toddlerSlots}
                  </span>
                )}
                {vacancyStats.preschoolSlots > 0 && (
                  <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded">
                    {t('vacancy.preschool')}: {vacancyStats.preschoolSlots}
                  </span>
                )}
                {vacancyStats.schoolAgeSlots > 0 && (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded">
                    {t('vacancy.schoolAge')}: {vacancyStats.schoolAgeSlots}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t('publicListings.searchPlaceholder')}
                value={filters.search || ''}
                onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-colors ${
                hasActiveFilters
                  ? 'border-blue-500 bg-blue-100 text-blue-700'
                  : 'border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100'
              }`}
            >
              <Filter size={18} />
              {t('common.filters')}
              {hasActiveFilters && (
                <span className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                  {Object.values(filters).filter(v => v).length}
                </span>
              )}
            </button>
          </div>

          {/* Browse by neighborhood — clicking a chip filters the listings
              in-place; the "View all" link at the end goes to the neighborhood
              articles index for parents who want to read up before deciding. */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-gray-500 inline-flex items-center gap-1">
              <MapPin size={14} />
              {t('publicListings.browseByNeighborhood')}
            </span>
            {(['sunset', 'richmond', 'excelsior', 'bayview', 'mission'] as const).map(slug => {
              const langKey = language === 'zh-TW' ? 'zh' : language === 'es' ? 'es' : 'en';
              const label = NEIGHBORHOOD_ARTICLES[slug].label[langKey];
              const active = isChipActive(slug);
              return (
                <button
                  key={slug}
                  type="button"
                  onClick={() => handleNeighborhoodChipClick(slug)}
                  className={`px-3 py-1 rounded-full border transition-colors ${
                    active
                      ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                      : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* ELFA quick toggle — always visible (not buried in the filter
              panel) and count-aware. ELFA programs offer free / reduced-cost
              subsidized care, so surfacing this prominently lets subsidy
              families self-select. The count self-gates: a low number reads
              as "few right now," a high one pulls people in. */}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <button
              type="button"
              onClick={() => setFilters(prev => ({ ...prev, elfa_only: prev.elfa_only ? undefined : true }))}
              aria-pressed={!!filters.elfa_only}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border transition-colors ${
                filters.elfa_only
                  ? 'bg-yellow-500 text-white border-yellow-500 hover:bg-yellow-600'
                  : 'bg-yellow-50 text-yellow-800 border-yellow-300 hover:bg-yellow-100'
              }`}
            >
              <Star size={13} />
              {t('publicListings.onlyElfa')}
              <span
                className={`ml-0.5 px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                  filters.elfa_only ? 'bg-white/25 text-white' : 'bg-yellow-200 text-yellow-900'
                }`}
              >
                {elfaOpenCount}
              </span>
            </button>
            <span className="text-gray-500 text-xs">{t('publicListings.elfaFreeNote')}</span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors ml-auto"
              >
                {linkCopied ? <Check size={13} className="text-green-600" /> : <Link2 size={13} />}
                {linkCopied ? t('publicListings.linkCopied') : t('publicListings.copyLink')}
              </button>
            )}
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-gray-900">{t('publicListings.filterResults')}</h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <X size={14} />
                    {t('common.clearAll')}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Neighborhood */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {t('publicListings.neighborhood')}
                  </label>
                  <select
                    value={filters.neighborhood || ''}
                    onChange={e => setFilters(prev => ({ ...prev, neighborhood: e.target.value || undefined }))}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                  >
                    <option value="">{t('common.any')}</option>
                    {availableNeighborhoods.map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                {/* Age Group */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {t('publicListings.ageGroup')}
                  </label>
                  <select
                    value={filters.age_group || ''}
                    onChange={e => setFilters(prev => ({
                      ...prev,
                      age_group: (e.target.value || undefined) as SearchFilters['age_group']
                    }))}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                  >
                    <option value="">{t('publicListings.anyAge')}</option>
                    <option value="infant">{t('vacancy.infant')} ({t('vacancy.infantAge')})</option>
                    <option value="toddler">{t('vacancy.toddler')} ({t('vacancy.toddlerAge')})</option>
                    <option value="preschool">{t('vacancy.preschool')} ({t('vacancy.preschoolAge')})</option>
                    <option value="school_age">{t('vacancy.schoolAge')} ({t('vacancy.schoolAgeAge')})</option>
                  </select>
                </div>

                {/* Language */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {t('publicListings.language')}
                  </label>
                  <select
                    value={filters.language || ''}
                    onChange={e => setFilters(prev => ({ ...prev, language: e.target.value || undefined }))}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                  >
                    <option value="">{t('common.any')}</option>
                    {availableLanguages.map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>

                {/* Schedule */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {t('publicListings.schedule')}
                  </label>
                  <select
                    value={filters.schedule || ''}
                    onChange={e => setFilters(prev => ({
                      ...prev,
                      schedule: (e.target.value || undefined) as SearchFilters['schedule']
                    }))}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                  >
                    <option value="">{t('common.any')}</option>
                    <option value="full_time">{t('vacancy.fullTime')}</option>
                    <option value="part_time">{t('vacancy.partTime')}</option>
                    <option value="weekend">{t('vacancy.weekend')}</option>
                    <option value="evening">{t('vacancy.evening')}</option>
                    <option value="overnight">{t('vacancy.overnight')}</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Listings */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Parent Toolbox — unified entry for eligibility, license lookup, evaluate, about FCC */}
        <ParentToolbox
          listings={listings}
          vacancyStats={vacancyStats}
          onListingClick={(providerId) => {
            setFilters({});
            setExpandedListing(providerId);
            // After the filter-cleared re-render commits, measure the actual
            // on-screen bottom of the sticky page header so we can land the
            // card just below it regardless of header height.
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                const el = document.querySelector<HTMLElement>(`[data-provider-id="${providerId}"]`);
                if (!el) return;
                const header = document.querySelector<HTMLElement>('[data-page-header]');
                const stickyBottom = header ? 44 + header.offsetHeight : 110;
                const y = el.getBoundingClientRect().top + window.scrollY - stickyBottom - 8;
                window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
              });
            });
          }}
        />

        {/* Fairness Notice */}
        <div className="mb-4 flex items-center justify-center gap-2 text-xs text-gray-500">
          <Shuffle size={13} className="text-gray-400" />
          <span>{t('publicListings.fairnessNotice')}</span>
        </div>

        {/* Provider Listings */}
        <div id="provider-listings">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">{t('common.loading')}</p>
          </div>
        ) : listingsWithOpenings.length === 0 && fullWithWaitlist.length === 0 && nearbyListings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <Baby size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('publicListings.noMatches')}</h3>
            <p className="text-gray-600 mb-4">{t('publicListings.noMatchesHelp')}</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-blue-600 hover:underline"
              >
                {t('common.clearAll')}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {groupedListings.map(([neighborhood, groupListings]) => {
              const articleSlug = getArticleSlug(neighborhood);
              const langKey = language === 'zh-TW' ? 'zh' : language === 'es' ? 'es' : 'en';
              const langPrefix = language === 'zh-TW' ? '/zh' : language === 'es' ? '/es' : '';
              const article = articleSlug ? NEIGHBORHOOD_ARTICLES[articleSlug] : null;
              const learnMoreLabel = langKey === 'zh' ? '了解更多' : langKey === 'es' ? 'Más información' : 'Learn more';
              return (
              <div key={neighborhood}>
                <div className="flex items-center gap-2 mb-2 mt-2 flex-wrap">
                  <MapPin size={14} className="text-gray-400" />
                  <h2 className="text-sm font-semibold text-gray-700">{neighborhood}</h2>
                  <span className="text-xs text-gray-400">({groupListings.length})</span>
                  {article && (
                    <>
                      <span className="text-xs text-gray-500">· {article.hint[langKey]}</span>
                      <a
                        href={`${langPrefix}/neighborhoods/${articleSlug}/`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {learnMoreLabel} →
                      </a>
                    </>
                  )}
                </div>
                {groupListings.map(renderOpeningCard)}
              </div>
              );
            })}

            {/* Nearby-neighborhood fallback — openings in bordering areas when
                the selected neighborhood is thin (e.g. a Noe Valley search). */}
            {nearbyListings.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <MapPin size={14} className="text-blue-400" />
                  <h2 className="text-sm font-semibold text-gray-700">{t('publicListings.nearbyTitle')}</h2>
                  <span className="text-xs text-gray-400">({nearbyListings.length})</span>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  {t('publicListings.nearbyNote').replace('{neighborhood}', filters.neighborhood || '')}
                </p>
                {nearbyListings.map(renderOpeningCard)}
              </div>
            )}

            {/* Collapsed section for stale listings (30+ days old) */}
            {staleListings.length > 0 && (
              <div className="mt-8">
                <button
                  onClick={() => setShowStaleSection(!showStaleSection)}
                  className="w-full flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                >
                  <div className="flex items-center gap-2 text-amber-700">
                    <AlertTriangle size={18} />
                    <span className="font-medium">
                      {t('publicListings.olderListings')} ({staleListings.length})
                    </span>
                  </div>
                  {showStaleSection ? (
                    <ChevronUp size={20} className="text-amber-400" />
                  ) : (
                    <ChevronDown size={20} className="text-amber-400" />
                  )}
                </button>

                {showStaleSection && (
                  <div className="mt-2">
                    <p className="text-sm text-amber-600 mb-4 px-1">
                      {t('publicListings.olderListingsNote')}
                    </p>
                    <div className="space-y-3">
                      {staleListings.map(listing => (
                        <div
                          key={listing.provider_id}
                          data-provider-id={listing.provider_id}
                          className="bg-white rounded-xl shadow border-l-4 border-amber-300 opacity-80"
                        >
                          <div
                            className="p-4 cursor-pointer"
                            onClick={() => handleListingClick(listing)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-gray-900">{listing.business_name}</h3>
                                  {listing.is_elfa_network && (
                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                                      <Star size={12} />
                                      ELFA
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600 flex-wrap">
                                  <span className="flex items-center gap-1">
                                    <MapPin size={14} />
                                    {listing.neighborhood || listing.zip_code}
                                  </span>
                                  <span>
                                    {listing.program_type === 'small_family' ? t('publicListings.smallFamily') : t('publicListings.largeFamily')}
                                  </span>
                                  <span className="text-gray-400">
                                    {t('publicListings.license')} #{listing.license_number}
                                  </span>
                                  <span className="text-gray-400">
                                    {t('publicListings.lastUpdated')} {new Date(listing.last_updated).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                  </span>
                                </div>
                              </div>

                              <div className="text-right flex items-center gap-4">
                                <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded-full">
                                  {t('publicListings.hasOpenings')}
                                </span>
                                {expandedListing === listing.provider_id ? (
                                  <ChevronUp size={20} className="text-gray-400" />
                                ) : (
                                  <ChevronDown size={20} className="text-gray-400" />
                                )}
                              </div>
                            </div>

                            {/* Vacancy flags - matching active listings placement */}
                            <div className="flex gap-2 mt-3 flex-wrap">
                              {listing.accepting_infants && (
                                <span className="px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded">
                                  {t('vacancy.infant')}
                                </span>
                              )}
                              {listing.accepting_toddlers && (
                                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
                                  {t('vacancy.toddler')}
                                </span>
                              )}
                              {listing.accepting_preschool && (
                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                                  {t('vacancy.preschool')}
                                </span>
                              )}
                              {listing.accepting_school_age && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                  {t('vacancy.schoolAge')}
                                </span>
                              )}
                            </div>
                          </div>

                          {expandedListing === listing.provider_id && (
                            <div className="px-4 pb-4 pt-2 border-t">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(listing.phone || listing.website) && (
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">{t('publicListings.contact')}</h4>
                                    <div className="space-y-2 text-sm">
                                      {listing.phone && (
                                        <div className="flex items-center gap-2">
                                          <a
                                            href={`tel:${listing.phone}`}
                                            onClick={() => trackContactClick(listing.provider_id, listing.business_name, 'phone')}
                                            className="flex items-center gap-2 text-blue-600 hover:underline"
                                          >
                                            <Phone size={14} />
                                            {listing.phone}
                                          </a>
                                          {listing.phone_accepts_text && (
                                            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                                              {t('publicListings.textOk')}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                      {listing.website && (
                                        <a
                                          href={listing.website.startsWith('http') ? listing.website : `https://${listing.website}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={() => trackContactClick(listing.provider_id, listing.business_name, 'website')}
                                          className="flex items-center gap-1 text-blue-600 hover:underline"
                                        >
                                          <Globe size={14} />
                                          {t('publicListings.visitWebsite')}
                                          <ExternalLink size={12} />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                )}
                                <div>
                                  <h4 className="text-sm font-medium text-gray-700 mb-2">{t('publicListings.details')}</h4>
                                  <div className="space-y-1 text-sm text-gray-600">
                                    <p className="flex items-center gap-2">
                                      <Clock size={14} />
                                      {[
                                        listing.full_time_available && t('vacancy.fullTime'),
                                        listing.part_time_available && t('vacancy.partTime'),
                                        listing.weekend_available && t('vacancy.weekend'),
                                        listing.evening_available && t('vacancy.evening'),
                                        listing.overnight_available && t('vacancy.overnight')
                                      ].filter(Boolean).join(', ') || t('publicListings.contactForSchedule')}
                                    </p>
                                    {listing.languages.length > 0 && (
                                      <p>{t('publicListings.languagesSpoken')}: {listing.languages.join(', ')}</p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Send Inquiry Button */}
                              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                                {renderLastUpdated(listing)}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setInquiryListing(listing);
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                  <MessageSquare size={16} />
                                  {t('inquiry.sendInquiry')}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Collapsed section for full programs with waitlist */}
            {fullWithWaitlist.length > 0 && (
              <div className="mt-8">
                <button
                  onClick={() => setShowWaitlistSection(!showWaitlistSection)}
                  className="w-full flex items-center justify-between p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <div className="flex items-center gap-2 text-gray-700">
                    <ClipboardList size={18} />
                    <span className="font-medium">
                      {t('publicListings.currentlyFull')} ({fullWithWaitlist.length})
                    </span>
                    <span className="text-sm text-gray-500">
                      — {t('publicListings.waitlistAvailable')}
                    </span>
                  </div>
                  {showWaitlistSection ? (
                    <ChevronUp size={20} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={20} className="text-gray-400" />
                  )}
                </button>

                {showWaitlistSection && (
                  <div className="mt-4 space-y-4">
                    {fullWithWaitlist.map(listing => (
                      <div
                        key={listing.provider_id}
                        data-provider-id={listing.provider_id}
                        className="bg-white rounded-xl shadow border-l-4 border-amber-400"
                      >
                        <div
                          className="p-4 cursor-pointer"
                          onClick={() => setExpandedListing(
                            expandedListing === listing.provider_id ? null : listing.provider_id
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-gray-900">{listing.business_name}</h3>
                                {listing.is_elfa_network && (
                                  <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                                    <Star size={12} />
                                    ELFA
                                  </span>
                                )}
                                <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                                  <ClipboardList size={12} />
                                  {t('publicListings.waitlist')}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-gray-600 flex-wrap">
                                <span className="flex items-center gap-1">
                                  <MapPin size={14} />
                                  {listing.neighborhood || listing.zip_code}
                                </span>
                                <span>
                                  {listing.program_type === 'small_family' ? t('publicListings.smallFamily') : t('publicListings.largeFamily')}
                                </span>
                                <span className="text-gray-400">
                                  {t('publicListings.license')} #{listing.license_number}
                                </span>
                              </div>
                            </div>

                            <div className="text-right flex items-center gap-4">
                              <div>
                                <p className="text-lg font-medium text-amber-600">
                                  {t('publicListings.full')}
                                </p>
                                <p className="text-xs text-gray-500">{t('publicListings.joinWaitlist')}</p>
                              </div>
                              {expandedListing === listing.provider_id ? (
                                <ChevronUp size={20} className="text-gray-400" />
                              ) : (
                                <ChevronDown size={20} className="text-gray-400" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {expandedListing === listing.provider_id && (
                          <div className="px-4 pb-4 pt-2 border-t">
                            <div className="bg-amber-50 p-3 rounded-lg mb-4">
                              <p className="text-sm text-amber-800">
                                {t('publicListings.waitlistInfo')}
                              </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {(listing.phone || listing.website) && (
                                <div>
                                  <h4 className="text-sm font-medium text-gray-700 mb-2">{t('publicListings.contact')}</h4>
                                  <div className="space-y-2 text-sm">
                                    {listing.phone && (
                                      <div className="flex items-center gap-2">
                                        <a
                                          href={`tel:${listing.phone}`}
                                          onClick={() => handleContactClick(listing, 'phone')}
                                          className="flex items-center gap-2 text-blue-600 hover:underline"
                                        >
                                          <Phone size={14} />
                                          {listing.phone}
                                        </a>
                                        {listing.phone_accepts_text === true && (
                                          <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                                            {t('publicListings.textOk')}
                                          </span>
                                        )}
                                        {listing.phone_accepts_text === false && (
                                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                            {t('publicListings.callOnly')}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    {listing.website && (
                                      <a
                                        href={listing.website.startsWith('http') ? listing.website : `https://${listing.website}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={() => handleContactClick(listing, 'website')}
                                        className="flex items-center gap-2 text-blue-600 hover:underline"
                                      >
                                        <Globe size={14} />
                                        {t('publicListings.visitWebsite')}
                                      </a>
                                    )}
                                  </div>
                                </div>
                              )}

                              <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2">{t('publicListings.details')}</h4>
                                <div className="space-y-1 text-sm text-gray-600">
                                  <p className="flex items-center gap-2">
                                    <Clock size={14} />
                                    {[
                                      listing.full_time_available && t('vacancy.fullTime'),
                                      listing.part_time_available && t('vacancy.partTime'),
                                      listing.weekend_available && t('vacancy.weekend'),
                                      listing.evening_available && t('vacancy.evening'),
                                      listing.overnight_available && t('vacancy.overnight')
                                    ].filter(Boolean).join(', ') || t('publicListings.contactForSchedule')}
                                  </p>
                                  {listing.languages.length > 0 && (
                                    <p>{t('publicListings.languagesSpoken')}: {listing.languages.join(', ')}</p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {listing.notes && (
                              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                <p className="text-sm text-blue-800">{listing.notes}</p>
                              </div>
                            )}

                            {/* Send Inquiry Button for waitlist */}
                            <div className="mt-4 pt-4 border-t flex items-center justify-between">
                              {renderLastUpdated(listing)}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInquiryListing(listing);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                <MessageSquare size={16} />
                                {t('inquiry.sendInquiry')}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        </div>
      </div>

      {/* Parent Inquiry Form Modal */}
      {inquiryListing && (
        <ParentInquiryForm
          listing={inquiryListing}
          onClose={() => setInquiryListing(null)}
        />
      )}

      {/* Footer */}
      <div className="bg-white border-t mt-8 py-6">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-600">
          <p>
            {t('publicListings.footerPrefix')}{' '}
            <a
              href="https://fccasf.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {t('publicListings.footerOrgName')}
            </a>
            {t('publicListings.footerSuffix')}
          </p>
          <p className="mt-2">
            {t('landing.footer.moreProviders')}{' '}
            <a
              href={
                language === 'zh-TW'
                  ? 'https://mychildcareplan.org/zh-tw/provider-search/?address_0=San+Francisco&TypeOfCare%5B%5D=Family+Child+Care&page_number=4'
                  : language === 'es'
                  ? 'https://mychildcareplan.org/es/provider-search/?address_0=San+Francisco&TypeOfCare%5B%5D=Family+Child+Care&page_number=4'
                  : 'https://mychildcareplan.org/provider-search/?address_0=San+Francisco&TypeOfCare%5B%5D=Family+Child+Care&page_number=4'
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              {t('landing.footer.moreProvidersLink')}
              <ExternalLink size={12} />
            </a>
          </p>
          <p className="mt-2">
            <a
              href="#donate"
              className="text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 rounded"
            >
              {t('donate.navLabel')}
            </a>
          </p>
          <p className="mt-4 text-xs text-gray-400">
            v{__APP_VERSION__}
          </p>
        </div>
      </div>
    </div>
  );
}
