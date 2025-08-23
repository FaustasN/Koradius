import { useEffect, useRef, useState, useCallback } from 'react';

declare global {
  interface Window {
    nova_iframe_options?: {
      baseUrl: string;
      lang: string;
      containerId: string;
      target: string;
      domain: string;
      wid: string;
    };
  }
}

const SearchPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [reloadKey, setReloadKey] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    

    // Reset
    setIsLoading(true);
    setError(null);
    container.innerHTML = '';

    // Pašalinam likusius iframe
    const existingIframes = container.querySelectorAll('iframe');
    existingIframes.forEach((iframe, idx) => {
      console.warn(`🗑️ Removing existing iframe ${idx + 1}`);
      iframe.remove();
    });

    // Pašalinam senus script tagus
    const existingScripts = document.querySelectorAll('script[src*="novaturas.lt"]');
    existingScripts.forEach((script, idx) => {
      console.warn(`🗑️ Removing existing script ${idx + 1}:`, (script as HTMLScriptElement).src);
      script.remove();
    });
    scriptRef.current = null;

    // Nustatom konfigūraciją
    window.nova_iframe_options = {
      baseUrl: 'https://koradius-travel.com',
      lang: 'lt',
      containerId: 'nova-container', // NAUJAS ID!
      target: 'search',
      domain: 'https://www.novaturas.lt',
      wid: 'kelkoradius111',
    };

    

    setTimeout(() => {
      const isScriptAlreadyPresent = !!document.querySelector('script[src="https://www.novaturas.lt/static/js/iframe.js"]');
      if (isScriptAlreadyPresent) {
        console.warn('⚠️ iframe.js already present, skipping script injection.');
        return;
      }

     
      const script = document.createElement('script');
      scriptRef.current = script;
      script.src = 'https://www.novaturas.lt/static/js/iframe.js';
      script.type = 'text/javascript';

      timeoutRef.current = setTimeout(() => {
        console.warn('⚠️ Timeout waiting for iframe to appear...');
        setError('Nepavyko įkelti paieškos formos. Bandome iš naujo...');
        setReloadKey(Date.now());
      }, 6000);

      script.onload = () => {
    

        // Tikrinam ar iframe atsirado
        setTimeout(() => {
          const iframes = container.querySelectorAll('iframe');
          if (iframes.length === 0) {
            console.warn('❌ No iframe found in container!');
            setReloadKey(Date.now());
            return;
          }
      
          setIsLoading(false);
        }, 1000);

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };

      script.onerror = (e) => {
        console.error('❌ Script load error:', e);
        setError('Nepavyko įkelti paieškos formos. Patikrinkite interneto ryšį.');
        setIsLoading(false);

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };

      document.head.appendChild(script);
    }, 300); // Truputį ilgesnis delay – DOM'ui stabilizuotis

    return () => {
   
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (scriptRef.current) scriptRef.current.remove();
      if (container) container.innerHTML = '';
    };
  }, [reloadKey]);

  const handleRetry = useCallback(() => {
    if (!isLoading) {
     
      setReloadKey(Date.now());
    }
  }, [isLoading]);

  return (
    <div className="search-page-container" style={{ minHeight: '100vh', position: 'relative', width: '100%', backgroundColor: '#f8fafc' }}>
      <style>{`
        .search-page-container {
          position: relative !important;
          z-index: 1 !important;
        }
        .loading-spinner {
          border: 4px solid #e2e8f0;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {isLoading && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: '#f8fafc', zIndex: 100
        }}>
          <div style={{ textAlign: 'center', padding: '24px' }}>
            <div className="loading-spinner" />
            <p style={{ color: '#64748b', fontSize: '16px', fontWeight: '500' }}>Kraunama paieškos forma...</p>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Jungiamasi prie Novaturas sistemos</p>
          </div>
        </div>
      )}

      {error && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: '#fef2f2', zIndex: 100
        }}>
          <div style={{
            textAlign: 'center', padding: '32px', backgroundColor: 'white',
            borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            maxWidth: '400px', margin: '0 16px'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{ color: '#dc2626', fontSize: '18px', fontWeight: '600' }}>Klaida įkeliant paieškos formą</h3>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>{error}</p>
            <button onClick={handleRetry} style={{
              padding: '12px 24px', backgroundColor: '#3b82f6',
              color: 'white', border: 'none', borderRadius: '8px',
              cursor: 'pointer', fontSize: '14px', fontWeight: '500'
            }}>
              🔄 Bandyti iš naujo
            </button>
          </div>
        </div>
      )}

      <div
        id="nova-container" // <- 👈 Svarbus pakeitimas čia
        ref={containerRef}
        style={{ width: '100%', minHeight: '100vh', position: 'relative', zIndex: 1 }}
      />
    </div>
  );
};

export default SearchPage;
