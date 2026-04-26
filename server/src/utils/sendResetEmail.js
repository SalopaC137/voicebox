const { Resend } = require("resend");

let resend = null;
const FROM_EMAIL = "VoiceBox <onboarding@resend.dev>";

function getResendClient() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const sendResetEmail = async (email, link) => {
  const resendClient = getResendClient();
  if (!resendClient) {
    console.warn("[Email] Skipping reset email: RESEND_API_KEY is not set.");
    return;
  }

  console.log("Sending reset email to:", email, "with link:", link);

  await resendClient.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Reset your password",
    text: `Reset your password: ${link}\n\nThis link expires in 15 minutes. If you did not request this, ignore this email.`,
    html: `
      <body style="font-family:Arial,sans-serif;background:#f9fafb;">
        <div style="max-width:480px;margin:0 auto;padding:24px 16px;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;">
          <p style="margin:0 0 16px;font-size:14px;color:#111827;">Reset your password:</p>
          <div style="margin:0 0 16px;">
            <a href="${link}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:8px 14px;border-radius:6px;font-size:14px;">Reset Password</a>
          </div>
          <p style="margin:0;font-size:12px;color:#6b7280;">Link expires in 15 minutes. Ignore if not requested.</p>
        </div>
      </body>
    `
  });
};

module.exports = { sendResetEmail };