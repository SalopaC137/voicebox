const axios = require("axios");

const ONESIGNAL_API_URL = "https://onesignal.com/api/v1/notifications";

function getMissingConfig() {
  const missing = [];
  if (!process.env.ONESIGNAL_APP_ID) missing.push("ONESIGNAL_APP_ID");
  if (!process.env.ONESIGNAL_API_KEY) missing.push("ONESIGNAL_API_KEY");
  return missing;
}

async function sendNotificationToAll(message) {
  const missingConfig = getMissingConfig();
  if (missingConfig.length > 0) {
    console.warn(`[OneSignal] Skipped send: missing ${missingConfig.join(", ")}`);
    return { sent: false, skipped: true };
  }

  try {
    const response = await axios.post(
      ONESIGNAL_API_URL,
      {
        app_id: process.env.ONESIGNAL_APP_ID,
        included_segments: ["All"],
        headings: { en: "VoiceBox" },
        contents: { en: message },
      },
      {
        headers: {
          Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return { sent: true, id: response.data?.id || null };
  } catch (error) {
    const details = error.response?.data || error.message;
    console.error("[OneSignal] Notification error:", details);
    return { sent: false, skipped: false, error: details };
  }
}

async function sendNotificationToUser(userId, message) {
  const missingConfig = getMissingConfig();
  if (missingConfig.length > 0) {
    console.warn(`[OneSignal] Skipped targeted send: missing ${missingConfig.join(", ")}`);
    return { sent: false, skipped: true };
  }

  if (!userId) {
    console.warn("[OneSignal] Skipped targeted send: missing userId");
    return { sent: false, skipped: true };
  }

  try {
    const response = await axios.post(
      ONESIGNAL_API_URL,
      {
        app_id: process.env.ONESIGNAL_APP_ID,
        include_external_user_ids: [String(userId)],
        channel_for_external_user_ids: "push",
        headings: { en: "VoiceBox" },
        contents: { en: message },
      },
      {
        headers: {
          Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return { sent: true, id: response.data?.id || null };
  } catch (error) {
    const details = error.response?.data || error.message;
    console.error("[OneSignal] Targeted notification error:", details);
    return { sent: false, skipped: false, error: details };
  }
}

module.exports = {
  sendNotificationToAll,
  sendNotificationToUser,
};
