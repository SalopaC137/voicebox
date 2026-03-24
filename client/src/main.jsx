import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const oneSignalAppId = import.meta.env.VITE_ONESIGNAL_APP_ID;
if (oneSignalAppId && typeof window !== 'undefined') {
  window.OneSignal = window.OneSignal || [];
  window.__voiceboxOneSignalInitPromise = new Promise((resolve) => {
    window.OneSignal.push(async function () {
      try {
        await window.OneSignal.init({
          appId: oneSignalAppId,
          notifyButton: {
            enable: true,
          },
          allowLocalhostAsSecureOrigin: true,
        });
        resolve(true);
      } catch (error) {
        console.error('[OneSignal] SDK initialization failed:', error);
        resolve(false);
      }
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
