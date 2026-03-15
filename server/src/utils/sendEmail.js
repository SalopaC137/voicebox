const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendVerificationEmail = async (email, token) => {
  const verificationLink = `https://voicebox.qzz.io/verify/${token}`;

  console.log("Sending verification email to:", email, "with link:", verificationLink);

  await resend.emails.send({
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