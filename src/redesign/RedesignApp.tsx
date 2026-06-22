import { useState, useEffect } from 'react';
import './tokens.css';
import { Icon } from './Icon';
import { HomeScreen } from './screens/HomeScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { ListingScreen } from './screens/ListingScreen';
import { EligibilityScreen } from './screens/EligibilityScreen';
import { MomentNotify, MomentMultiLang, MomentTrust } from './screens/Moments';
import { useListings } from './useListings';

type Screen =
  | 'home'
  | 'results'
  | 'listing'
  | 'eligibility'
  | 'moment-notify'
  | 'moment-lang'
  | 'moment-trust';

const SCREENS: Array<{ id: Screen; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'results', label: 'Results' },
  { id: 'listing', label: 'Listing' },
  { id: 'eligibility', label: 'Eligibility' },
  { id: 'moment-notify', label: 'Notify' },
  { id: 'moment-lang', label: 'Language' },
  { id: 'moment-trust', label: 'Trust' },
];

const MAIN_SCREENS: Screen[] = ['home', 'results', 'listing', 'eligibility'];

function readHashScreen(): Screen {
  const hash = window.location.hash.replace('#', '');
  const part = hash.split('/')[1] as Screen | undefined;
  if (part && SCREENS.some(s => s.id === part)) return part;
  return 'home';
}

export default function RedesignApp() {
  const [screen, setScreen] = useState<Screen>(readHashScreen);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const listings = useListings();

  useEffect(() => {
    const onHash = () => setScreen(readHashScreen());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = (s: string, providerId?: string) => {
    const next = s as Screen;
    setScreen(next);
    if (providerId !== undefined) setSelectedId(providerId);
    window.location.hash = `redesign/${next}`;
    const scrollEl = document.querySelector('.rd-scroll');
    if (scrollEl) scrollEl.scrollTop = 0;
  };

  const selectedListing = selectedId
    ? listings.raw.find(r => r.provider_id === selectedId) || null
    : null;

  const showTabBar = MAIN_SCREENS.includes(screen);

  return (
    <div className="fccsf-redesign">
      <div className="rd-app">
        <div className="rd-subnav">
          <span className="rd-subnav-label">Mockup</span>
          {SCREENS.map(s => (
            <button
              key={s.id}
              type="button"
              className={s.id === screen ? 'active' : ''}
              onClick={() => navigate(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="rd-scroll">
          {screen === 'home' && <HomeScreen onNavigate={navigate} listings={listings} />}
          {screen === 'results' && <ResultsScreen onNavigate={navigate} listings={listings} />}
          {screen === 'listing' && <ListingScreen onNavigate={navigate} listing={selectedListing} />}
          {screen === 'eligibility' && <EligibilityScreen onNavigate={navigate} />}
          {screen === 'moment-notify' && <MomentNotify />}
          {screen === 'moment-lang' && <MomentMultiLang />}
          {screen === 'moment-trust' && <MomentTrust />}
        </div>

        {showTabBar && (
          <div className="tabbar">
            <button
              type="button"
              className={`tab ${screen === 'home' || screen === 'results' || screen === 'listing' ? 'active' : ''}`}
              onClick={() => navigate('home')}
            >
              <Icon name="search" size={20}/> Find
            </button>
            <button
              type="button"
              className={`tab ${screen === 'eligibility' ? 'active' : ''}`}
              onClick={() => navigate('eligibility')}
            >
              <Icon name="dollar" size={20}/> Costs
            </button>
            <button type="button" className="tab">
              <Icon name="info" size={20}/> Guide
            </button>
            <button type="button" className="tab">
              <Icon name="heart" size={20}/> Saved
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
