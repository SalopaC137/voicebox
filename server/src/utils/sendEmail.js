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
    text: `Welcome to VoiceBox. Confirm your email by opening this link: ${verificationLink}\n\nThis verification link expires in 24 hours.\nIf you do not see this email in your inbox, check your spam or junk folder.\n\nIf you did not create this account, you can ignore this email.`,
    html: `
      <body style="font-family:Arial,sans-serif;background:#f9fafb;">
        <div style="max-width:480px;margin:0 auto;padding:24px 16px;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;">
          <p style="margin:0 0 10px;font-size:16px;font-weight:700;color:#111827;">Welcome to VoiceBox</p>
          <p style="margin:0 0 16px;font-size:14px;color:#111827;">Please confirm your email address to complete your account setup.</p>
          <div style="margin:0 0 16px;">
            <a href="${verificationLink}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:8px 14px;border-radius:6px;font-size:14px;">Confirm Email</a>
          </div>
          <p style="margin:0 0 8px;font-size:12px;color:#6b7280;">This verification link expires in 24 hours.</p>
          <p style="margin:0 0 8px;font-size:12px;color:#6b7280;">If the button does not work, use this link:</p>
          <p style="margin:0 0 10px;font-size:12px;word-break:break-all;"><a href="${verificationLink}" style="color:#2563eb;">${verificationLink}</a></p>
          <p style="margin:0;font-size:12px;color:#6b7280;">If you did not create this account, you can ignore this email. If missing from inbox, check spam/junk.</p>
        </div>
      </body>
    `
  });
};

module.exports = { sendVerificationEmail };