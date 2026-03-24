// OneSignal is now initialized in index.html
// This module handles user identity sync only

function hasBrowserContext() {
  return typeof window !== "undefined";
}

function queueOneSignalTask(task) {
  if (!hasBrowserContext()) return;
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(task);
}

export function initOneSignal() {
  // Initialization now happens in index.html
  return Promise.resolve(true);
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
