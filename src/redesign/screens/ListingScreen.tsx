import { formatDistanceToNow } from 'date-fns';
import { Icon } from '../Icon';
import { PublicListing } from '../../types/registry';

interface ListingScreenProps {
  onNavigate: (screen: string, providerId?: string) => void;
  listing: PublicListing | null;
}

interface DetailVM {
  name: string;
  neigh: string;
  zip: string;
  spots: number;
  ages: string;
  type: string;
  license: string;
  licenseUrl: string | null;
  languages: string[];
  elfa: boolean;
  phone: string | null;
  website: string | null;
  acceptsText: boolean;
  schedule: Array<[string, boolean]>;
  notes: string | null;
  updatedRelative: string;
  isMock: boolean;
}

const MOCK: DetailVM = {
  name: "Sharon's Family Child Care",
  neigh: 'Outer Sunset',
  zip: '94122',
  spots: 2,
  ages: 'Infant · Toddler',
  type: 'Small Family · Up to 8',
  license: '#384004210',
  licenseUrl: null,
  languages: ['English', 'Cantonese'],
  elfa: true,
  phone: null,
  website: null,
  acceptsText: false,
  schedule: [
    ['Full-time', true],
    ['Part-time', false],
    ['Evenings', false],
    ['Weekends', false],
  ],
  notes: 'Mock data — open Results and tap View on a real listing to see live data here.',
  updatedRelative: 'just now',
  isMock: true,
};

function buildAges(l: PublicListing): string {
  const ages: string[] = [];
  if (l.accepting_infants && l.infant_spots > 0) ages.push('Infant');
  if (l.accepting_toddlers && l.toddler_spots > 0) ages.push('Toddler');
  if (l.accepting_preschool && l.preschool_spots > 0) ages.push('Preschool');
  if (l.accepting_school_age && l.school_age_spots > 0) ages.push('School Age');
  return ages.length ? ages.join(' · ') : 'Ages on request';
}

function adapt(l: PublicListing): DetailVM {
  return {
    name: l.business_name,
    neigh: l.neighborhood || l.zip_code,
    zip: l.zip_code,
    spots: l.total_spots_available,
    ages: buildAges(l),
    type: l.program_type === 'large_family' ? 'Large Family · Up to 14' : 'Small Family · Up to 8',
    license: l.license_number ? `#${l.license_number}` : '—',
    licenseUrl: l.license_number
      ? `https://www.cdss.ca.gov/inforesources/community-care-licensing/look-up-a-licensed-care-facility-or-childcare-program`
      : null,
    languages: l.languages?.length ? l.languages : ['English'],
    elfa: l.is_elfa_network,
    phone: l.phone || null,
    website: l.website || null,
    acceptsText: !!l.phone_accepts_text,
    schedule: [
      ['Full-time', l.full_time_available],
      ['Part-time', l.part_time_available],
      ['Evenings', l.evening_available],
      ['Weekends', l.weekend_available],
    ],
    notes: l.notes || null,
    updatedRelative: formatDistanceToNow(new Date(l.last_updated), { addSuffix: true }),
    isMock: false,
  };
}

export function ListingScreen({ onNavigate, listing }: ListingScreenProps) {
  const vm: DetailVM = listing ? adapt(listing) : MOCK;
  const initial = vm.name.charAt(0).toUpperCase();

  return (
    <div className="rd-content" style={{ background: 'var(--paper)' }}>
      <div style={{ position: 'relative' }}>
        <div className="placeholder-img" style={{ height: 220 }}>
          {vm.isMock ? 'HOME PHOTO 1 / 4' : `${vm.neigh.toUpperCase()} · ${vm.zip}`}
        </div>
        <div style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', justifyContent: 'space-between' }}>
          <button
            type="button"
            onClick={() => onNavigate('results')}
            style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.95)', border: 'none', display: 'grid', placeItems: 'center', cursor: 'pointer' }}
          >
            <Icon name="chevron-left" size={18}/>
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.95)', border: 'none', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
              <Icon name="heart" size={18}/>
            </button>
          </div>
        </div>
        {vm.isMock && (
          <div style={{ position: 'absolute', bottom: 12, left: 12, display: 'flex', gap: 4 }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{ width: 18, height: 3, borderRadius: 2, background: i === 0 ? 'white' : 'rgba(255,255,255,0.5)' }}/>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '18px 20px 14px' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
          {vm.elfa && <span className="chip gold"><Icon name="star" size={11}/> ELFA Network</span>}
          <span className="chip green"><Icon name="check" size={11}/> License verified</span>
          {vm.isMock && <span className="chip" style={{ background: 'var(--paper-2)', borderColor: 'transparent', color: 'var(--ink-3)' }}>Mock data</span>}
        </div>
        <h1 className="h-display" style={{ fontSize: 26, margin: 0, marginBottom: 4 }}>{vm.name}</h1>
        <div style={{ fontSize: 14, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="pin" size={14}/> {vm.neigh} · {vm.zip}
        </div>
      </div>

      <div style={{ margin: '0 16px 16px', padding: 16, background: 'var(--sage-soft)', borderRadius: 16, border: '1px solid transparent' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="h-display" style={{ fontSize: 36, color: 'oklch(35% 0.07 155)', fontWeight: 600, lineHeight: 1 }}>
              {vm.spots} spot{vm.spots === 1 ? '' : 's'}
            </div>
            <div style={{ fontSize: 12, color: 'oklch(35% 0.07 155)', marginTop: 2 }}>open now · updated {vm.updatedRelative}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="eyebrow" style={{ color: 'oklch(35% 0.07 155)' }}>For ages</div>
            <div style={{ fontSize: 14, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'oklch(30% 0.07 155)' }}>{vm.ages}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 20px 20px' }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>What you'd pay</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div className="card" style={{ padding: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 2 }}>List rate</div>
            <div className="h-display" style={{ fontSize: 18 }}>Ask provider</div>
            <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>Varies by age &amp; schedule</div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('eligibility')}
            className="card press"
            style={{ padding: 12, background: 'var(--coral-soft)', borderColor: 'transparent', textAlign: 'left', cursor: 'pointer' }}
          >
            <div style={{ fontSize: 11, color: 'oklch(40% 0.10 35)', marginBottom: 2 }}>
              {vm.elfa ? 'With ELFA, you may pay' : 'Check subsidies'}
            </div>
            <div className="h-display" style={{ fontSize: 22, color: 'oklch(40% 0.14 35)' }}>
              {vm.elfa ? '$0–$240' : 'See your tier'}
            </div>
            <div style={{ fontSize: 10, color: 'oklch(40% 0.10 35)', marginTop: 2, textDecoration: 'underline' }}>
              {vm.elfa ? 'Check your tier →' : 'Run eligibility check →'}
            </div>
          </button>
        </div>
      </div>

      <div style={{ padding: '0 20px 20px' }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Schedule available</div>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {vm.schedule.map(([label, on], i, arr) => (
            <div
              key={label}
              style={{
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : 'none',
              }}
            >
              <span style={{ fontSize: 13, color: on ? 'var(--ink)' : 'var(--ink-4)' }}>{label}</span>
              {on
                ? <Icon name="check" size={16} color="var(--sage)"/>
                : <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>—</span>}
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 20px 20px' }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>The basics</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
          <div>
            <div style={{ color: 'var(--ink-3)', fontSize: 11, marginBottom: 2 }}>Languages</div>
            <div>{vm.languages.join(', ')}</div>
          </div>
          <div>
            <div style={{ color: 'var(--ink-3)', fontSize: 11, marginBottom: 2 }}>Program type</div>
            <div>{vm.type}</div>
          </div>
          <div>
            <div style={{ color: 'var(--ink-3)', fontSize: 11, marginBottom: 2 }}>License</div>
            {vm.licenseUrl ? (
              <a href={vm.licenseUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--trust)', textDecoration: 'none' }}>
                {vm.license} ↗
              </a>
            ) : (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{vm.license}</div>
            )}
          </div>
          <div>
            <div style={{ color: 'var(--ink-3)', fontSize: 11, marginBottom: 2 }}>Contact</div>
            {vm.phone ? (
              <a href={`tel:${vm.phone}`} style={{ color: 'var(--trust)', textDecoration: 'none' }}>
                {vm.phone}{vm.acceptsText ? ' · texts ok' : ''}
              </a>
            ) : (
              <div style={{ color: 'var(--ink-3)' }}>via inquiry form</div>
            )}
          </div>
        </div>
      </div>

      {vm.notes && (
        <div style={{ padding: '0 20px 20px' }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>From the provider</div>
          <div className="card" style={{ padding: 14, background: 'var(--paper-2)', borderColor: 'transparent' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 999, background: 'var(--coral-soft)', display: 'grid', placeItems: 'center', color: 'var(--coral)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>{initial}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{vm.name}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Updated {vm.updatedRelative}</div>
              </div>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--ink-2)', whiteSpace: 'pre-wrap' }}>
              {vm.notes}
            </div>
          </div>
        </div>
      )}

      {vm.website && (
        <div style={{ padding: '0 20px 20px' }}>
          <a href={vm.website} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ width: '100%', textDecoration: 'none' }}>
            Visit provider website ↗
          </a>
        </div>
      )}

      <div className="rd-cta">
        {vm.phone ? (
          <a className="btn btn-ghost" style={{ flex: '0 0 auto', padding: '14px', textDecoration: 'none' }} href={`tel:${vm.phone}`}>
            <Icon name="phone" size={18}/>
          </a>
        ) : (
          <button type="button" className="btn btn-ghost" style={{ flex: '0 0 auto', padding: '14px' }} disabled>
            <Icon name="phone" size={18}/>
          </button>
        )}
        <button type="button" className="btn btn-coral" style={{ flex: 1 }}>
          Message {vm.name.split(/['\s]/)[0]}{vm.elfa ? ' · It\'s free' : ''}
        </button>
      </div>
    </div>
  );
}
