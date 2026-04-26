const { Resend } = require("resend");

let resend = null;
const FROM_EMAIL = "VoiceBox <noreply@voicebox.qzz.io>";

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
    text: `You requested a password reset for VoiceBox. Open this link to set a new password: ${link}\n\nThis link expires in 15 minutes. If you did not request this, you can ignore this email.`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#111827;max-width:560px;margin:0 auto;padding:16px;">
        <h2 style="margin:0 0 12px;">Reset your password</h2>
        <p style="margin:0 0 14px;">We received a request to reset your VoiceBox password.</p>
        <p style="margin:0 0 16px;">
          <a href="${link}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:6px;">Reset Password</a>
        </p>
        <p style="margin:0 0 10px;">If the button does not work, copy and paste this URL into your browser:</p>
        <p style="margin:0 0 12px;word-break:break-all;"><a href="${link}" style="color:#2563eb;">${link}</a></p>
        <p style="margin:0 0 8px;color:#6b7280;font-size:12px;">This link expires in 15 minutes.</p>
        <p style="margin:0;color:#6b7280;font-size:12px;">If you did not request this, you can ignore this email.</p>
      </div>
    `
  });
};

module.exports = { sendResetEmail };