import { Icon } from '../Icon';
import { ListingsBucket, RedesignListing } from '../useListings';

interface ResultsScreenProps {
  onNavigate: (screen: string, providerId?: string) => void;
  listings: ListingsBucket;
}

export function ResultsScreen({ onNavigate, listings }: ResultsScreenProps) {
  const { loading, error, withOpenings, totalSpots, homesWithOpenings } = listings;
  const visible: RedesignListing[] = withOpenings;
  return (
    <div className="rd-content" style={{ background: 'var(--paper-2)' }}>
      <div style={{ background: 'var(--paper)', padding: '14px 16px 14px', borderBottom: '1px solid var(--line)', position: 'sticky', top: 0, zIndex: 5 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => onNavigate('home')}
            style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--line)', background: 'var(--paper)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}
          >
            <Icon name="chevron-left" size={18} />
          </button>
          <div style={{ flex: 1, background: 'var(--paper-2)', borderRadius: 10, padding: '8px 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
            <Icon name="search" size={16} color="var(--ink-3)" />
            <span style={{ fontSize: 14, color: 'var(--ink-2)' }}>94110 · within 2 mi</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginTop: 12, paddingBottom: 2 }}>
          <span className="chip active"><Icon name="filter" size={11}/> Filters · 2</span>
          <span className="chip">Infant ×</span>
          <span className="chip">Toddler ×</span>
          <span className="chip">+ Spanish</span>
          <span className="chip">+ ELFA only</span>
          <span className="chip">+ Full-time</span>
        </div>
      </div>

      <div style={{ padding: '14px 16px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <div className="h-display" style={{ fontSize: 20, fontWeight: 600 }}>
            {loading ? (
              <span style={{ color: 'var(--ink-3)' }}>Loading…</span>
            ) : (
              <>
                <span style={{ color: 'var(--sage)' }}>{homesWithOpenings} home{homesWithOpenings === 1 ? '' : 's'}</span>
                <span style={{ color: 'var(--ink-3)', fontWeight: 500, fontSize: 14, marginLeft: 6 }}>· {totalSpots} spot{totalSpots === 1 ? '' : 's'}</span>
              </>
            )}
          </div>
          <div className="eyebrow" style={{ marginTop: 2 }}>Sorted by · Recently updated</div>
        </div>
        <button
          type="button"
          style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--ink-3)', background: 'transparent', border: 'none', textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer' }}
        >
          Map ▸
        </button>
      </div>

      {error && (
        <div style={{ padding: '0 16px 16px' }}>
          <div className="card" style={{ padding: 14, background: 'var(--coral-soft)', borderColor: 'transparent', color: 'oklch(35% 0.10 35)', fontSize: 13 }}>
            Couldn't load listings: {error}
          </div>
        </div>
      )}

      {!loading && !error && visible.length === 0 && (
        <div style={{ padding: '8px 16px 24px' }}>
          <div className="card" style={{ padding: 18, background: 'var(--paper-2)', borderColor: 'transparent' }}>
            <div className="h-display" style={{ fontSize: 18, marginBottom: 6 }}>No openings right now.</div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5 }}>
              No live spots open today. Get notified the moment one opens, or check our neighborhood guides.
            </div>
            <button type="button" className="btn btn-coral" style={{ marginTop: 12, width: '100%' }}>
              Notify me when a spot opens
            </button>
          </div>
        </div>
      )}

      <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading && Array.from({ length: 3 }).map((_, i) => (
          <div key={`skel-${i}`} className="card" style={{ overflow: 'hidden', background: 'var(--paper)' }}>
            <div className="placeholder-img" style={{ height: 120, borderBottom: '1px solid var(--line)' }}>LOADING</div>
            <div style={{ padding: 14, color: 'var(--ink-3)', fontSize: 12 }}>Loading listing…</div>
          </div>
        ))}
        {visible.map(l => (
          <div key={l.id} className="card" style={{ overflow: 'hidden', background: 'var(--paper)' }}>
            <div className="placeholder-img" style={{ height: 120, borderBottom: '1px solid var(--line)' }}>
              HOME PHOTO
            </div>
            <div style={{ padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
                    {l.elfa && <span className="chip gold" style={{ padding: '2px 6px', fontSize: 10 }}><Icon name="star" size={9}/> ELFA</span>}
                    <span className="eyebrow">{l.neigh} · {l.schedule}</span>
                  </div>
                  <h3 className="h-display" style={{ fontSize: 17, margin: 0, marginBottom: 2 }}>{l.name}</h3>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{l.type}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 10 }}>
                  <div className="h-display" style={{ fontSize: 28, color: 'var(--sage)', fontWeight: 600, lineHeight: 1 }}>{l.spots}</div>
                  <div style={{ fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>spots open</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                {l.tags.map(t => <span key={t} className="chip green">{t}</span>)}
                {l.lang.slice(0, 2).map(lang => <span key={lang} className="chip trust"><Icon name="language" size={10}/> {lang}</span>)}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--line)', paddingTop: 10 }}>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="clock" size={11}/> Updated {l.updated}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {l.phone ? (
                    <a className="btn btn-quiet" style={{ padding: '8px 12px', fontSize: 13, borderRadius: 9, textDecoration: 'none' }} href={`tel:${l.phone}`}>
                      <Icon name="phone" size={13}/> Call
                    </a>
                  ) : (
                    <button type="button" className="btn btn-quiet" style={{ padding: '8px 12px', fontSize: 13, borderRadius: 9 }} disabled>
                      <Icon name="phone" size={13}/> Call
                    </button>
                  )}
                  <button type="button" className="btn btn-primary" style={{ padding: '8px 14px', fontSize: 13, borderRadius: 9 }} onClick={() => onNavigate('listing', l.id)}>
                    View
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '4px 16px 22px', textAlign: 'center', fontSize: 12, color: 'var(--ink-3)' }}>
        Don't see one in your area?{' '}
        <span style={{ color: 'var(--trust)', textDecoration: 'underline', fontWeight: 500 }}>Get notified when spots open</span>
      </div>
    </div>
  );
}
