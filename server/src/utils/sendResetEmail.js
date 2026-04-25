const { Resend } = require("resend");

let resend = null;

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
    from: "VoiceBox <noreply@voicebox.qzz.io>",
    to: email,
    subject: "Reset your password",
    html: `
      <h2>Password Reset</h2>
      <p>Click the link below to reset your password</p>
      <a href="${link}">Reset Password</a>
      <p>This link expires in 15 minutes.</p>
      <p>This is an automated email from VoiceBox. Please do not reply to this message.</p>
    `
  });
};

module.exports = { sendResetEmail };