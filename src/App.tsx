import { useEffect } from 'react';
import { RegistryApp } from './components/registry';
import { InAppBrowserBanner } from './components/registry/InAppBrowserBanner';
import { AudienceTopBar } from './components/registry/AudienceTopBar';
import { initAnalytics } from './lib/analytics';

function App() {
  useEffect(() => { initAnalytics(); }, []);
  return (
    <>
      <AudienceTopBar />
      <div className="pt-11">
        <InAppBrowserBanner />
        <RegistryApp />
      </div>
    </>
  );
}

export default App;
