import { Icon } from '../Icon';

export function MomentNotify() {
  return (
    <div className="rd-content" style={{ background: 'var(--ink)', color: 'white' }}>
      <div style={{ padding: '60px 30px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
        <div className="eyebrow" style={{ color: 'var(--coral)' }}>SAVED SEARCH · 94110</div>
        <h2 className="h-display" style={{ fontSize: 28, margin: '8px 0 14px', letterSpacing: '-0.02em' }}>
          A spot just opened near you.
        </h2>
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 14, border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Casa de los Niños</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>Mission · Spanish-speaking · 1 toddler spot</div>
        </div>
        <button type="button" className="btn btn-coral" style={{ marginTop: 18 }}>See it before others</button>
        <div style={{ fontSize: 11, opacity: 0.5, textAlign: 'center', marginTop: 14, fontFamily: 'var(--font-mono)' }}>
          We email you the moment a match appears. Unsubscribe in one tap.
        </div>
      </div>
    </div>
  );
}

export function MomentMultiLang() {
  const langs = [
    { lang: 'English', sub: '14 homes with openings near you' },
    { lang: 'Español', sub: '6 hogares con cupo · proveedores que hablan español' },
    { lang: '中文 (繁/简)', sub: '5 個有空位的家庭托兒中心 · 粵語/普通話' },
    { lang: 'Tagalog', sub: 'Nasa Excelsior at Daly City' },
  ];
  return (
    <div className="rd-content" style={{ background: 'var(--paper)' }}>
      <div style={{ padding: '50px 26px 30px', flex: 1 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>SELECT YOUR LANGUAGE</div>
        <h2 className="h-display" style={{ fontSize: 26, margin: '0 0 24px' }}>
          Welcome.<br/>Bienvenido.<br/>欢迎.
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {langs.map(l => (
            <button
              key={l.lang}
              type="button"
              className="card press"
              style={{ padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', cursor: 'pointer' }}
            >
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-display)' }}>{l.lang}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{l.sub}</div>
              </div>
              <Icon name="chevron-right" size={16} color="var(--ink-3)"/>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MomentTrust() {
  const rows: Array<{ t: string; s: string; i: 'shield' | 'check-circle' | 'clock' | 'dollar' }> = [
    { t: 'License #384004210', s: 'Active since 2017 · Checked against CA database 4 hrs ago', i: 'shield' },
    { t: 'Sharon Wong, owner', s: 'Verified by FCCASF · Has been a member 6 years', i: 'check-circle' },
    { t: 'Last spot update', s: 'Sharon confirmed openings today at 2:41 PM', i: 'clock' },
    { t: 'No deposits allowed', s: 'ELFA providers cannot charge to hold spots', i: 'dollar' },
  ];
  return (
    <div className="rd-content" style={{ background: 'var(--paper)' }}>
      <div style={{ padding: '40px 22px 30px', flex: 1 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>VERIFIED FOR YOU</div>
        <h2 className="h-display" style={{ fontSize: 24, margin: '0 0 14px', letterSpacing: '-0.02em' }}>
          Why you can trust this listing.
        </h2>
        {rows.map((row, i) => (
          <div
            key={row.t}
            style={{
              display: 'flex',
              gap: 12,
              padding: '14px 0',
              borderBottom: i < rows.length - 1 ? '1px solid var(--line)' : 'none',
            }}
          >
            <div style={{ width: 32, height: 32, borderRadius: 999, background: 'var(--trust-soft)', display: 'grid', placeItems: 'center', color: 'var(--trust)', flexShrink: 0 }}>
              <Icon name={row.i} size={16}/>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-display)' }}>{row.t}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2, lineHeight: 1.4 }}>{row.s}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
