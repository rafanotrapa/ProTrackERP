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
  },
  // Batas waktu eksplisit. Tanpa ini nodemailer memakai bawaannya, yang bisa
  // menahan koneksi sampai 2 menit dan socket diam sampai 10 menit — di
  // Passenger itu berarti satu proses Node tertahan selama itu. Sejak email
  // dipakai untuk notifikasi, jumlah pengiriman jauh lebih banyak daripada
  // sekadar reset password, jadi kegagalan harus cepat ketahuan.
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 20_000,
});

const verifyMailer = async () => {
  const missing = ['EMAIL_USER', 'EMAIL_PASS', 'EMAIL_FROM'].filter(
    (key) => !process.env[key] || process.env[key].startsWith('your_')
  );

  if (missing.length) {
    console.error(`⚠️  SMTP belum dikonfigurasi. Isi dulu di .env: ${missing.join(', ')}`);
    return false;
  }

  const host = process.env.EMAIL_HOST || 'smtp-relay.brevo.com';

  try {
    await transporter.verify();
    console.log(`📧 SMTP siap: host ${host}, pengirim ${process.env.EMAIL_FROM}`);

    // Server uji coba menerima semua email lalu menahannya, tidak pernah
    // meneruskan ke alamat tujuan. Tanpa peringatan ini, konfigurasi yang
    // salah terlihat sehat: pengiriman sukses, kotak masuk tetap kosong.
    if (/mailtrap|ethereal|sandbox/i.test(host)) {
      console.warn(
        `⚠️  ${host} adalah server uji coba. Email TIDAK akan sampai ke alamat asli. ` +
        `Ganti EMAIL_HOST ke smtp-relay.brevo.com untuk pengiriman sungguhan.`
      );
    }
    return true;
  } catch (err) {
    console.error(`⚠️  SMTP gagal terhubung ke ${host}:`, err.message);
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
