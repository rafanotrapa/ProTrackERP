const nodemailer = require('nodemailer');

const SMTP_PORT = Number(process.env.EMAIL_PORT) || 587;

/**
 * Transporter SMTP Brevo.
 * - EMAIL_USER : login Brevo (format: angka@smtp-brevo.com), BUKAN email pengirim
 * - EMAIL_PASS : SMTP Key Value (diawali xsmtpsib-)
 * - EMAIL_FROM : alamat pengirim yang sudah diverifikasi di dashboard Brevo
 */
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const verifyMailer = async () => {
  const missing = ['EMAIL_USER', 'EMAIL_PASS', 'EMAIL_FROM'].filter(
    (key) => !process.env[key] || process.env[key].startsWith('your_')
  );

  if (missing.length) {
    console.error(`⚠️  SMTP belum dikonfigurasi. Isi dulu di .env: ${missing.join(', ')}`);
    return false;
  }

  try {
    await transporter.verify();
    console.log(`📧 SMTP Brevo siap kirim email dari ${process.env.EMAIL_FROM}`);
    return true;
  } catch (err) {
    console.error('⚠️  SMTP Brevo gagal terhubung:', err.message);
    return false;
  }
};

const sendEmail = async ({ to, subject, html, text, attachments = [] }) => {
  return transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME || 'ProTrack ERP'}" <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    html,
    text,
    attachments
  });
};

module.exports = { transporter, sendEmail, verifyMailer };
