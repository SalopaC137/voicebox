const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID;

function hasBrowserContext() {
  return typeof window !== "undefined";
}

function queueOneSignalTask(task) {
  if (!hasBrowserContext()) return;
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(task);
}

async function clearStaleOneSignalBrowserState() {
  if (!hasBrowserContext()) return;

  try {
    // Remove OneSignal-like local storage entries from old app registrations.
    for (let i = localStorage.length - 1; i >= 0; i -= 1) {
      const key = localStorage.key(i);
      if (key && key.toLowerCase().includes("onesignal")) {
        localStorage.removeItem(key);
      }
    }
  } catch (_error) {
    // Ignore storage cleanup failures.
  }

  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations
          .filter((reg) => {
            const scriptURL = reg.active?.scriptURL || reg.waiting?.scriptURL || reg.installing?.scriptURL || "";
            return scriptURL.includes("OneSignal") || scriptURL.includes("onesignal") || reg.scope.includes("OneSignal");
          })
          .map((reg) => reg.unregister())
      );
    }
  } catch (_error) {
    // Ignore service worker cleanup failures.
  }
}

function isAppIdMismatchError(error) {
  const msg = String(error?.message || error || "").toLowerCase();
  return msg.includes("appid doesn't match") || msg.includes("app id doesn't match");
}

export function initOneSignal() {
  if (!hasBrowserContext()) return Promise.resolve(false);

  if (window.__voiceboxOneSignalInitPromise) {
    return window.__voiceboxOneSignalInitPromise;
  }

  if (!ONESIGNAL_APP_ID) {
    console.warn("[OneSignal] Missing VITE_ONESIGNAL_APP_ID in client environment.");
    return Promise.resolve(false);
  }

  window.__voiceboxOneSignalInitPromise = new Promise((resolve) => {
    queueOneSignalTask(async (OneSignal) => {
      try {
        await OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          serviceWorkerPath: "/OneSignalSDKWorker.js",
          serviceWorkerUpdaterPath: "/OneSignalSDKUpdaterWorker.js",
          allowLocalhostAsSecureOrigin: true,
          notifyButton: { enable: true },
        });
        resolve(true);
      } catch (error) {
        if (isAppIdMismatchError(error)) {
          console.warn("[OneSignal] Detected stale OneSignal app state. Clearing and retrying init once...");
          await clearStaleOneSignalBrowserState();
          try {
            await OneSignal.init({
              appId: ONESIGNAL_APP_ID,
              serviceWorkerPath: "/OneSignalSDKWorker.js",
              serviceWorkerUpdaterPath: "/OneSignalSDKUpdaterWorker.js",
              allowLocalhostAsSecureOrigin: true,
              notifyButton: { enable: true },
            });
            resolve(true);
            return;
          } catch (retryError) {
            console.error("[OneSignal] SDK retry initialization failed:", retryError);
            resolve(false);
            return;
          }
        }

        console.error("[OneSignal] SDK initialization failed:", error);
        resolve(false);
      }
    });
  });

  return window.__voiceboxOneSignalInitPromise;
}

export async function syncOneSignalUser(userId) {
  const initialized = await initOneSignal();
  if (!initialized) return false;

  return new Promise((resolve) => {
    queueOneSignalTask(async (OneSignal) => {
      try {
        if (!userId) {
          await OneSignal.logout();
          resolve(true);
          return;
        }

        await OneSignal.login(String(userId));
        resolve(true);
      } catch (error) {
        console.error("[OneSignal] Failed to sync user identity:", error);
        resolve(false);
      }
    });
  });
}

export async function enableBrowserNotifications() {
  const initialized = await initOneSignal();
  if (!initialized) {
    return { enabled: false, reason: "not_initialized" };
  }

  return new Promise((resolve) => {
    queueOneSignalTask(async (OneSignal) => {
      try {
        const alreadyGranted = OneSignal.Notifications?.permission === true;
        if (alreadyGranted) {
          if (OneSignal.User?.PushSubscription?.optIn) {
            await OneSignal.User.PushSubscription.optIn();
          }
          resolve({ enabled: true, reason: "already_granted" });
          return;
        }

        await OneSignal.Notifications.requestPermission();

        if (OneSignal.Notifications?.permission === true) {
          if (OneSignal.User?.PushSubscription?.optIn) {
            await OneSignal.User.PushSubscription.optIn();
          }
          resolve({ enabled: true, reason: "granted" });
          return;
        }

        resolve({ enabled: false, reason: "blocked_or_dismissed" });
      } catch (error) {
        console.error("[OneSignal] Failed to enable browser notifications:", error);
        resolve({ enabled: false, reason: "error" });
      }
    });
  });
}
