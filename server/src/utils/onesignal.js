const axios = require("axios");

const ONESIGNAL_API_URL = "https://api.onesignal.com/notifications?c=push";
const ONESIGNAL_LEGACY_API_URL = "https://onesignal.com/api/v1/notifications";

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
        include_aliases: {
          external_id: [String(userId)],
        },
        target_channel: "push",
        headings: { en: "VoiceBox" },
        contents: { en: message },
      },
      {
        headers: {
          Authorization: `Key ${process.env.ONESIGNAL_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return { sent: true, id: response.data?.id || null };
  } catch (modernError) {
    const modernDetails = modernError.response?.data || modernError.message;
    console.warn("[OneSignal] Modern targeted send failed, trying legacy fallback:", modernDetails);

    try {
      const fallbackResponse = await axios.post(
        ONESIGNAL_LEGACY_API_URL,
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

      return { sent: true, id: fallbackResponse.data?.id || null, via: "legacy-fallback" };
    } catch (legacyError) {
      const legacyDetails = legacyError.response?.data || legacyError.message;
      console.error("[OneSignal] Targeted notification error (modern + legacy failed):", {
        modern: modernDetails,
        legacy: legacyDetails,
      });
      return { sent: false, skipped: false, error: { modern: modernDetails, legacy: legacyDetails } };
    }
  }
}

module.exports = {
  sendNotificationToAll,
  sendNotificationToUser,
};
