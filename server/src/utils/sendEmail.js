const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendVerificationEmail = async (email, token) => {
  const verificationLink = `${process.env.CLIENT_URL}/verify/${token}`;

  await resend.emails.send({
    from: "VoiceBox <noreply@voicebox.com>",
    to: email,
    subject: "Verify your VoiceBox account",
    html: `
      <h2>Welcome to VoiceBox</h2>
      <p>Click below to verify your account:</p>
      <a href="${verificationLink}">Verify Account</a>
    `
  });
};

module.exports = { sendVerificationEmail };