import { useEffect } from 'react';

declare global {
  interface Window {
    nova_iframe_options: any;
  }
}

export default function NovaturIframe() {
    return (
      <iframe
        src="https://www.novaturas.lt/iframe/kelkoradius111/lt/search"
        title="Novaturo paieška"
        width="100%"
        height="800"
        style={{ border: 'none' }}
      />
    );
  }
  
