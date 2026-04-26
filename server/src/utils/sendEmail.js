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

const sendVerificationEmail = async (email, token) => {
  const resendClient = getResendClient();
  if (!resendClient) {
    console.warn("[Email] Skipping verification email: RESEND_API_KEY is not set.");
    return;
  }

  const verificationLink = `https://voicebox.qzz.io/verify/${token}`;

  console.log("Sending verification email to:", email, "with link:", verificationLink);

  await resendClient.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Confirm your VoiceBox email",
    text: `Welcome to VoiceBox. Confirm your email by opening this link: ${verificationLink}\n\nIf you did not create this account, you can ignore this email.`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#111827;max-width:560px;margin:0 auto;padding:16px;">
        <h2 style="margin:0 0 12px;">Confirm your email</h2>
        <p style="margin:0 0 14px;">Welcome to VoiceBox. Please confirm your email address to complete your account setup.</p>
        <p style="margin:0 0 16px;">
          <a href="${verificationLink}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:6px;">Confirm Email</a>
        </p>
        <p style="margin:0 0 10px;">If the button does not work, copy and paste this URL into your browser:</p>
        <p style="margin:0 0 12px;word-break:break-all;"><a href="${verificationLink}" style="color:#2563eb;">${verificationLink}</a></p>
        <p style="margin:0;color:#6b7280;font-size:12px;">If you did not request this, you can ignore this email.</p>
      </div>
    `
  });
};

module.exports = { sendVerificationEmail };