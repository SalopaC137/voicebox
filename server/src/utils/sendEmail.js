const { Resend } = require("resend");

let resend = null;

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
    from: "VoiceBox <noreply@voicebox.qzz.io>",
    to: email,
    subject: "Verify your VoiceBox account",
    html: `
      <h2>Welcome to VoiceBox</h2>
      <p>Click below to verify your account:</p>
      <a href="${verificationLink}">Verify Account</a>
      <p>This is an automated email from VoiceBox. Please do not reply to this message.</p>
    `
  });
};

module.exports = { sendVerificationEmail };