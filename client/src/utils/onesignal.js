import OneSignal from "react-onesignal";

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID;

function hasBrowserContext() {
  return typeof window !== "undefined";
}

let initPromise = null;

export function initOneSignal() {
  if (!hasBrowserContext()) return Promise.resolve(false);
  if (initPromise) return initPromise;

  if (!ONESIGNAL_APP_ID) {
    console.warn("[OneSignal] Missing VITE_ONESIGNAL_APP_ID in client environment.");
    return Promise.resolve(false);
  }

  initPromise = (async () => {
    try {
      await OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        notifyButton: { enable: true },
        allowLocalhostAsSecureOrigin: true,
        autoResubscribe: true,
        serviceWorkerParam: { scope: "/" },
        serviceWorkerPath: "/OneSignalSDKWorker.js",
        serviceWorkerUpdaterPath: "/OneSignalSDKUpdaterWorker.js",
      });
      return true;
    } catch (error) {
      console.error("[OneSignal] SDK initialization failed:", error);
      return false;
    }
  })();

  return initPromise;
}

export async function syncOneSignalUser(userId) {
  const initialized = await initOneSignal();
  if (!initialized) return false;

  try {
    if (!userId) {
      await OneSignal.logout();
      return true;
    }

    await OneSignal.login(String(userId));
    return true;
  } catch (error) {
    console.error("[OneSignal] Failed to sync user identity:", error);
    return false;
  }
}

export async function promptOneSignalPermission() {
  const initialized = await initOneSignal();
  if (!initialized) return false;

  try {
    if (OneSignal.Notifications?.permission === true) {
      return true;
    }

    if (typeof OneSignal.showSlidedownPrompt === "function") {
      await OneSignal.showSlidedownPrompt();
    } else if (OneSignal.Slidedown?.promptPush) {
      await OneSignal.Slidedown.promptPush();
    } else {
      await OneSignal.Notifications.requestPermission();
    }

    return OneSignal.Notifications?.permission === true;
  } catch (error) {
    console.error("[OneSignal] Failed to show permission prompt:", error);
    return false;
  }
}

export async function getOneSignalPlayerId() {
  const initialized = await initOneSignal();
  if (!initialized) return null;

  try {
    const fromSubscription = OneSignal.User?.PushSubscription?.id;
    if (fromSubscription) return String(fromSubscription);

    if (typeof OneSignal.getUserId === "function") {
      const legacyId = await OneSignal.getUserId();
      if (legacyId) return String(legacyId);
    }

    return null;
  } catch (error) {
    console.error("[OneSignal] Failed to read player id:", error);
    return null;
  }
}
