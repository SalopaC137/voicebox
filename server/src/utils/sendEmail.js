const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendVerificationEmail = async (email, token) => {
  const verificationLink = `${process.env.CLIENT_URL}/verify/${token}`;

  console.log("Sending verification email to:", email, "with link:", verificationLink);

  await resend.emails.send({
    from: "VoiceBox <onboarding@resend.dev>", // Use Resend's test domain
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