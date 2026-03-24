import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const oneSignalAppId = import.meta.env.VITE_ONESIGNAL_APP_ID;
if (oneSignalAppId && typeof window !== 'undefined') {
  window.OneSignal = window.OneSignal || [];
  window.__voiceboxOneSignalInitPromise = new Promise((resolve) => {
    const OneSignal = window.OneSignal;
    OneSignal.push(async function () {
      try {
        await OneSignal.init({
          appId: oneSignalAppId,
          notifyButton: {
            enable: true,
          },
          allowLocalhostAsSecureOrigin: true,
        });

        if (OneSignal.Notifications?.on) {
          OneSignal.Notifications.on('permissionChange', function (permission) {
            console.log('Permission changed:', permission);
          });
        }

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
