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

const sendVerificationEmail = async (email, token) => {
  const mailer = getTransporter();
  if (!mailer) {
    console.warn("[Email] Skipping verification email: EMAIL_USER or EMAIL_PASS is not set.");
    return;
  }

  const verificationLink = `https://voicebox.qzz.io/verify/${token}`;

  console.log("Sending verification email to:", email, "with link:", verificationLink);

  await mailer.sendMail({
    from: `VoiceBox <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify your VoiceBox account",
    text: `Confirm your email: ${verificationLink}\n\nThis link expires in 24 hours. If you did not create this account, ignore this email.`,
    html: `
      <body style="font-family:Arial,sans-serif;background:#f9fafb;">
        <div style="max-width:480px;margin:0 auto;padding:24px 16px;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;">
          <p style="margin:0 0 16px;font-size:14px;color:#111827;">Confirm your email address:</p>
          <div style="margin:0 0 16px;">
            <a href="${verificationLink}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:8px 14px;border-radius:6px;font-size:14px;">Confirm Email</a>
          </div>
          <p style="margin:0;font-size:12px;color:#6b7280;">Link expires in 24 hours. Ignore if not requested.</p>
        </div>
      </body>
    `
  });
};

module.exports = { sendVerificationEmail };