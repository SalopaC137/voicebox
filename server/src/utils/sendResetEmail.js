const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendResetEmail = async (email, link) => {
  await resend.emails.send({
    from: "VoiceBox <noreply@voicebox.com>",
    to: email,
    subject: "Reset your password",
    html: `
      <h2>Password Reset</h2>
      <p>Click the link below to reset your password</p>
      <a href="${link}">Reset Password</a>
      <p>This link expires in 15 minutes.</p>
    `
  });
};

module.exports = { sendResetEmail };