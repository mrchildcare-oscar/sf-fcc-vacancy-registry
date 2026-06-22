import { useEffect, useState, lazy, Suspense } from 'react';
import { RegistryApp } from './components/registry';
import { InAppBrowserBanner } from './components/registry/InAppBrowserBanner';
import { Fair2026Banner } from './components/registry/Fair2026Banner';
import { AudienceTopBar } from './components/registry/AudienceTopBar';
import { initAnalytics } from './lib/analytics';

const RedesignApp = lazy(() => import('./redesign/RedesignApp'));

function isRedesignActive(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get('redesign') === '1') return true;
  return window.location.hash.startsWith('#redesign');
}

function App() {
  const [redesign, setRedesign] = useState<boolean>(isRedesignActive);

  useEffect(() => { initAnalytics(); }, []);
  useEffect(() => {
    const update = () => setRedesign(isRedesignActive());
    window.addEventListener('hashchange', update);
    window.addEventListener('popstate', update);
    return () => {
      window.removeEventListener('hashchange', update);
      window.removeEventListener('popstate', update);
    };
  }, []);

  if (redesign) {
    return (
      <Suspense fallback={<div style={{ padding: 32, fontFamily: 'system-ui' }}>Loading redesign mockup…</div>}>
        <RedesignApp />
      </Suspense>
    );
  }

  return (
    <>
      <AudienceTopBar />
      <div className="pt-11">
        <InAppBrowserBanner />
        <Fair2026Banner />
        <RegistryApp />
      </div>
    </>
  );
}

export default App;
