const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID;

function hasBrowserContext() {
  return typeof window !== "undefined";
}

let initPromise = null;

function getOneSignalQueue() {
  window.OneSignal = window.OneSignal || [];
  return window.OneSignal;
}

function queueOneSignalTask(task) {
  if (!hasBrowserContext()) return Promise.resolve(null);

  return new Promise((resolve) => {
    const oneSignalQueue = getOneSignalQueue();
    oneSignalQueue.push(async function (OneSignal) {
      try {
        const result = await task(OneSignal);
        resolve(result);
      } catch (error) {
        console.error("[OneSignal] Task failed:", error);
        resolve(null);
      }
    });
  });
}

export function initOneSignal() {
  if (!hasBrowserContext()) return Promise.resolve(false);
  if (initPromise) return initPromise;

  if (!ONESIGNAL_APP_ID) {
    console.warn("[OneSignal] Missing VITE_ONESIGNAL_APP_ID in client environment.");
    return Promise.resolve(false);
  }

  initPromise = queueOneSignalTask(async function (OneSignal) {
    try {
      await OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        allowLocalhostAsSecureOrigin: true,
      });
      return true;
    } catch (error) {
      console.error("[OneSignal] SDK initialization failed:", error);
      return false;
    }
  });

  return initPromise;
}

export async function syncOneSignalUser(userId) {
  const initialized = await initOneSignal();
  if (!initialized) return false;

  const result = await queueOneSignalTask(async function (OneSignal) {
    if (!userId) {
      if (typeof OneSignal.logout === "function") {
        await OneSignal.logout();
      } else if (typeof OneSignal.removeExternalUserId === "function") {
        await OneSignal.removeExternalUserId();
      }
      return true;
    }

    if (typeof OneSignal.login === "function") {
      await OneSignal.login(String(userId));
      return true;
    }

    if (typeof OneSignal.setExternalUserId === "function") {
      await OneSignal.setExternalUserId(String(userId));
      return true;
    }

    return false;
  });

  return result === true;
}

export async function promptOneSignalPermission() {
  const initialized = await initOneSignal();
  if (!initialized) return false;

  const result = await queueOneSignalTask(async function (OneSignal) {
    if (typeof OneSignal.showSlidedownPrompt === "function") {
      await OneSignal.showSlidedownPrompt();
    } else if (OneSignal.Slidedown?.promptPush) {
      await OneSignal.Slidedown.promptPush();
    } else if (OneSignal.Notifications?.requestPermission) {
      await OneSignal.Notifications.requestPermission();
    }

    if (typeof OneSignal.isPushNotificationsEnabled === "function") {
      return !!(await OneSignal.isPushNotificationsEnabled());
    }

    if (OneSignal.Notifications?.permission === true) {
      return true;
    }

    return false;
  });

  return result === true;
}

export async function getOneSignalPlayerId() {
  const initialized = await initOneSignal();
  if (!initialized) return null;

  const result = await queueOneSignalTask(async function (OneSignal) {
    if (typeof OneSignal.getUserId === "function") {
      const legacyId = await OneSignal.getUserId();
      if (legacyId) return String(legacyId);
    }

    const fromSubscription = OneSignal.User?.PushSubscription?.id;
    if (fromSubscription) return String(fromSubscription);

    return null;
  });

  return result || null;
}
