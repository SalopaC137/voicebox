const nodemailer = require("nodemailer");

let transporter = null;

function getTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
}

const sendResetEmail = async (email, link) => {
  const mailer = getTransporter();
  if (!mailer) {
    console.warn("[Email] Skipping reset email: EMAIL_USER or EMAIL_PASS is not set.");
    return;
  }

  console.log("Sending reset email to:", email, "with link:", link);

  await mailer.sendMail({
    from: `VoiceBox <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset your password",
    text: `You requested a VoiceBox password reset. Use this link to set a new password: ${link}\n\nThis reset link expires in 15 minutes.\nIf you did not request a password reset, please ignore this email.`,
    html: `
      <body style="font-family:Arial,sans-serif;background:#f9fafb;">
        <div style="max-width:480px;margin:0 auto;padding:24px 16px;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;">
          <p style="margin:0 0 10px;font-size:16px;font-weight:700;color:#111827;">VoiceBox Password Reset</p>
          <p style="margin:0 0 16px;font-size:14px;color:#111827;">This email was sent to you by VoiceBox because a password reset was requested for your account.</p>
          <div style="margin:0 0 16px;">
            <a href="${link}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:8px 14px;border-radius:6px;font-size:14px;">Reset Password</a>
          </div>
          <p style="margin:0 0 8px;font-size:12px;color:#6b7280;">This link expires in 15 minutes.</p>
          <p style="margin:0 0 8px;font-size:12px;color:#6b7280;">If the button does not work, use this link:</p>
          <p style="margin:0 0 10px;font-size:12px;word-break:break-all;"><a href="${link}" style="color:#2563eb;">${link}</a></p>
          <p style="margin:0;font-size:12px;color:#6b7280;">If you did not request this reset, you can safely ignore this email.</p>
        </div>
      </body>
    `
  });
};

module.exports = { sendResetEmail };