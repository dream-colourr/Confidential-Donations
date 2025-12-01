import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Dev helper: proxy S3 public key requests through the Vite server to avoid CORS issues
if (typeof window !== 'undefined' && window.fetch) {
  try {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      try {
        const url = typeof input === 'string' ? input : input?.url;
        if (typeof url === 'string' && url.includes('zama-mpc-testnet-public') && url.includes('/PublicKey/')) {
          const proxyUrl = `/__s3proxy?url=${encodeURIComponent(url)}`;
          return originalFetch(proxyUrl, init);
        }
      } catch (e) {
        // swallow and fallback to original fetch
      }
      return originalFetch(input, init);
    };
  } catch (e) {
    // no-op
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)