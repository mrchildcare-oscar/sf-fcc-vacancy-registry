import { Icon } from '../Icon';
import { ListingsBucket } from '../useListings';

interface HomeScreenProps {
  onNavigate: (screen: string, providerId?: string) => void;
  listings: ListingsBucket;
}

export function HomeScreen({ onNavigate, listings }: HomeScreenProps) {
  const { loading, error, totalSpots, homesWithOpenings, lastUpdatedRelative, withOpenings } = listings;

  const neighborhoodCounts: Record<string, number> = {};
  for (const l of withOpenings) {
    const key = l.neigh.toLowerCase().includes('sunset') ? 'Sunset'
      : l.neigh.toLowerCase().includes('richmond') ? 'Richmond'
      : l.neigh;
    neighborhoodCounts[key] = (neighborhoodCounts[key] || 0) + l.spots;
  }
  const topNeighborhoods = (
    [
      { name: 'Sunset', hint: 'Cantonese · Mandarin' },
      { name: 'Mission', hint: 'Spanish-speaking' },
      { name: 'Excelsior', hint: 'Spanish · Tagalog' },
      { name: 'Richmond', hint: 'Chinese · Russian' },
      { name: 'Bayview', hint: 'Growing ELFA network' },
    ] as Array<{ name: string; hint: string }>
  ).map(n => ({ ...n, count: neighborhoodCounts[n.name] || 0 }));
  return (
    <div className="rd-content">
      <div style={{ background: 'var(--coral)', color: 'white' }}>
        <div style={{ padding: '20px 22px 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, letterSpacing: '-0.01em' }}>
              Family Child Care SF
            </div>
            <div style={{ display: 'flex', gap: 6, fontSize: 12, fontFamily: 'var(--font-mono)' }}>
              <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: 6, fontWeight: 500 }}>EN</span>
              <span style={{ opacity: 0.7, padding: '4px 8px' }}>ES</span>
              <span style={{ opacity: 0.7, padding: '4px 8px' }}>中文</span>
            </div>
          </div>

          <div style={{ marginBottom: 22 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.75, marginBottom: 14 }}>
              A service of FCCASF · Updated daily
            </div>
            <h1 className="h-display" style={{ fontSize: 36, margin: 0, marginBottom: 12, fontWeight: 600 }}>
              Real openings. Today. Free for most SF families.
            </h1>
            <p style={{ fontSize: 15, lineHeight: 1.45, opacity: 0.85, margin: 0 }}>
              Real openings at licensed family child care providers in San Francisco. Most families qualify for free care.
            </p>
          </div>

          <div style={{ background: 'white', borderRadius: 14, padding: 6, display: 'flex', alignItems: 'center', boxShadow: '0 8px 28px -12px rgba(0,0,0,0.3)' }}>
            <div style={{ paddingLeft: 12, color: 'var(--ink-3)' }}>
              <Icon name="search" size={18} />
            </div>
            <input
              placeholder="ZIP, neighborhood, or address"
              style={{ flex: 1, border: 'none', outline: 'none', padding: '12px 10px', fontSize: 15, fontFamily: 'var(--font-body)', background: 'transparent', minWidth: 0 }}
              readOnly
            />
            <button
              type="button"
              className="btn btn-primary"
              style={{ padding: '10px 14px', fontSize: 14, borderRadius: 10 }}
              onClick={() => onNavigate('results')}
            >
              Search
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            <span className="chip" style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.25)', color: 'white' }}>
              <Icon name="baby" size={12} /> Infant
            </span>
            <span className="chip" style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.25)', color: 'white' }}>Toddler</span>
            <span className="chip" style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.25)', color: 'white' }}>Preschool</span>
            <span className="chip" style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.25)', color: 'white' }}>Spanish-speaking</span>
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--paper)', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -16, padding: '24px 22px 22px', position: 'relative', zIndex: 1 }}>
        {loading ? (
          <>
            <div className="h-display" style={{ fontSize: 38, fontWeight: 600, color: 'var(--ink-3)' }}>
              <span style={{ color: 'var(--paper-3)' }}>—</span>{' '}
              <span style={{ fontSize: 14, color: 'var(--ink-3)', fontWeight: 500 }}>loading openings…</span>
            </div>
            <div className="eyebrow" style={{ marginTop: 4 }}>Fetching real listings</div>
          </>
        ) : error ? (
          <>
            <div className="h-display" style={{ fontSize: 22, fontWeight: 600, color: 'var(--warn)' }}>
              Couldn't load listings
            </div>
            <div className="eyebrow" style={{ marginTop: 4 }}>{error}</div>
          </>
        ) : (
          <>
            <div className="h-display" style={{ fontSize: 38, fontWeight: 600 }}>
              <span style={{ color: 'var(--sage)' }}>{totalSpots}</span>{' '}
              <span style={{ fontSize: 14, color: 'var(--ink-3)', fontWeight: 500 }}>spots open right now</span>
            </div>
            <div className="eyebrow" style={{ marginTop: 4 }}>
              Across {homesWithOpenings} home{homesWithOpenings === 1 ? '' : 's'}
              {lastUpdatedRelative ? ` · Updated ${lastUpdatedRelative}` : ''}
            </div>
          </>
        )}
      </div>

      <div style={{ padding: '0 22px 18px', background: 'var(--paper)' }}>
        <button
          type="button"
          onClick={() => onNavigate('eligibility')}
          className="card press"
          style={{ padding: 16, background: 'var(--coral-soft)', borderColor: 'transparent', display: 'flex', gap: 12, width: '100%', textAlign: 'left', cursor: 'pointer' }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'white', display: 'grid', placeItems: 'center', flexShrink: 0, color: 'var(--coral)' }}>
            <Icon name="dollar" size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: 'oklch(35% 0.10 35)' }}>
              See if your care is free
            </div>
            <div style={{ fontSize: 13, color: 'oklch(35% 0.06 35)', lineHeight: 1.4, marginTop: 2 }}>
              Most SF families now qualify for $0 care via ELFA. 60-second check, no info saved.
            </div>
          </div>
          <Icon name="chevron-right" size={20} color="var(--coral)" />
        </button>
      </div>

      <div style={{ padding: '6px 22px 18px', background: 'var(--paper)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <h2 className="h-display" style={{ fontSize: 18, margin: 0 }}>By neighborhood</h2>
          <span style={{ fontSize: 12, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>5 GUIDES</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            ...topNeighborhoods.map(n => ({ ...n, all: false })),
            { name: 'All neighborhoods', count: totalSpots, hint: `See all ${homesWithOpenings} home${homesWithOpenings === 1 ? '' : 's'}`, all: true },
          ].map(n => (
            <button
              key={n.name}
              type="button"
              onClick={() => onNavigate('results')}
              className="card press"
              style={{
                padding: 12,
                borderColor: n.all ? 'var(--ink)' : 'var(--line)',
                background: n.all ? 'var(--ink)' : 'var(--paper)',
                color: n.all ? 'var(--paper)' : 'var(--ink)',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14 }}>{n.name}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: n.all ? 'var(--paper)' : 'var(--sage)', fontWeight: 600 }}>{n.count}</span>
              </div>
              <div style={{ fontSize: 11, color: n.all ? 'rgba(255,255,255,0.6)' : 'var(--ink-3)', marginTop: 2 }}>{n.hint}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '8px 22px 22px', background: 'var(--paper)' }}>
        <div className="card" style={{ padding: 14, background: 'var(--paper-2)', borderColor: 'transparent' }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Why this works</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.4 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <Icon name="shield" size={16} color="var(--trust)" />
              <span>Every license verified against the CA state database.</span>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <Icon name="clock" size={16} color="var(--trust)" />
              <span>Listings expire after 45 days unless re-confirmed by the provider.</span>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <Icon name="building" size={16} color="var(--trust)" />
              <span>Run by FCCASF — the providers themselves, not a 3rd party.</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ height: 24, background: 'var(--paper)' }} />
    </div>
  );
}
