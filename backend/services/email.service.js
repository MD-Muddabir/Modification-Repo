const nodemailer = require('nodemailer');

// Create transporter once — reused for all emails
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,       // false for port 587 (STARTTLS)
    requireTLS: true,    // force TLS upgrade
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,  // fixes certificate issues in dev
    },
  });
};

exports.sendOtpEmail = async (to, otp, type) => {
  const isReset = type === 'password_reset';

  const subject = isReset
    ? 'Password Reset OTP — ZF Solution'
    : 'Verify Your Email — ZF Solution';

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;
         padding:32px;border:1px solid #e2e8f0;border-radius:12px;">
      <h2 style="color:#1E3A5F;margin-bottom:8px;">
        ${isReset ? '🔐 Reset Your Password' : '✅ Verify Your Email'}
      </h2>
      <p style="color:#374151;">Your One-Time Password (OTP) is:</p>
      <div style="font-size:40px;font-weight:bold;letter-spacing:12px;
           color:#2563EB;text-align:center;padding:24px;
           background:#EFF6FF;border-radius:8px;margin:20px 0;">
        ${otp}
      </div>
      <p style="color:#6B7280;font-size:14px;">
        ⏰ This code expires in <strong>10 minutes</strong>.<br/>
        🚫 Do not share this OTP with anyone.<br/>
        If you did not request this, please ignore this email.
      </p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;"/>
      <p style="color:#9CA3AF;font-size:12px;text-align:center;">
        ZF Solution Platform — Automated Email
      </p>
    </div>
  `;

  const transporter = createTransporter();

  // Verify connection before sending
  await transporter.verify();

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });

  console.log(`✅ Real email sent to ${to} | ID: ${info.messageId}`);
  return info;
};