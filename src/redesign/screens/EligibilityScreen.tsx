import { useState } from 'react';
import { Icon } from '../Icon';

interface EligibilityScreenProps {
  onNavigate: (screen: string, providerId?: string) => void;
}

export function EligibilityScreen({ onNavigate }: EligibilityScreenProps) {
  const [income, setIncome] = useState(180000);

  const tier = income < 90000
    ? { pct: '100% tuition credit', cost: '$0/mo', note: 'You fall well under 150% AMI. ELFA covers your full tuition.' }
    : income < 200000
      ? { pct: '100% tuition credit', cost: '$0/mo', note: 'At 4 people / $180K, you fall under 150% AMI. ELFA covers your full tuition at any approved provider.' }
      : income < 280000
        ? { pct: 'Partial tuition credit', cost: 'About $400/mo', note: 'You may qualify for partial coverage on a sliding scale.' }
        : { pct: 'Above ELFA threshold', cost: 'List rate', note: 'Above 220% AMI. ELFA may not apply, but other programs might — check Children\'s Council.' };

  return (
    <div className="rd-content" style={{ background: 'var(--paper)' }}>
      <div className="rd-scroll" style={{ padding: '20px 22px 30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <button
            type="button"
            onClick={() => onNavigate('home')}
            style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--line)', background: 'var(--paper)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}
          >
            <Icon name="chevron-left" size={18} />
          </button>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ width: 24, height: 4, borderRadius: 2, background: i <= 2 ? 'var(--coral)' : 'var(--paper-3)' }}/>
            ))}
          </div>
          <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--ink-3)' }}>2 / 3</span>
        </div>

        <div className="eyebrow" style={{ marginBottom: 8 }}>STEP 2 · INCOME</div>
        <h1 className="h-display" style={{ fontSize: 28, margin: 0, marginBottom: 8, letterSpacing: '-0.02em' }}>
          What's your household income before taxes?
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.5, margin: 0, marginBottom: 24 }}>
          We use this only to estimate your tier. Nothing is sent or saved.
        </p>

        <div className="card" style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Household income</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span className="h-display" style={{ fontSize: 30, color: 'var(--ink-3)' }}>$</span>
            <span className="h-display" style={{ fontSize: 36, fontWeight: 600 }}>{income.toLocaleString()}</span>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--ink-3)' }}>/year</span>
          </div>
          <input
            type="range"
            min={0}
            max={350000}
            step={5000}
            value={income}
            onChange={e => setIncome(Number(e.target.value))}
            style={{ width: '100%', marginTop: 12, accentColor: 'var(--coral)' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
            <span>$0</span><span>$350K+</span>
          </div>
        </div>

        <div style={{ background: 'var(--sage-soft)', borderRadius: 16, padding: 18, marginTop: 18, marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: 'oklch(35% 0.07 155)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)' }}>Your estimated tier</div>
          <div className="h-display" style={{ fontSize: 32, fontWeight: 600, color: 'oklch(30% 0.10 155)', margin: '6px 0', letterSpacing: '-0.02em' }}>
            {tier.pct}
          </div>
          <div style={{ fontSize: 13, color: 'oklch(35% 0.07 155)', lineHeight: 1.45 }}>
            {tier.note}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
            <span className="chip" style={{ background: 'white', borderColor: 'transparent', color: 'oklch(35% 0.07 155)' }}>Effective cost: {tier.cost}</span>
          </div>
        </div>

        <div style={{ fontSize: 12, color: 'var(--ink-3)', textAlign: 'center', lineHeight: 1.5, padding: '0 12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Icon name="shield" size={12}/>
          <span>Estimate only. To enroll you'll apply through Children's Council or Wu Yee.</span>
        </div>

        <button type="button" className="btn btn-coral" style={{ width: '100%', marginBottom: 8 }} onClick={() => onNavigate('results')}>
          See 14 ELFA homes near me <Icon name="arrow-right" size={16}/>
        </button>
        <button type="button" className="btn btn-ghost" style={{ width: '100%' }}>
          How to apply (1 phone call)
        </button>
      </div>
    </div>
  );
}
