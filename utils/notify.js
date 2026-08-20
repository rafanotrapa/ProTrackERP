const Notification = require('../models/Notification');
const User = require('../models/User');
const { kalimat } = require('./notifTeks');

// Email notifikasi hanya aktif kalau SMTP benar-benar terkonfigurasi. Tanpa
// penjaga ini, setiap kejadian akan melempar error koneksi di server yang
// EMAIL_FROM-nya belum diisi — dan itu membuat log penuh tanpa ada yang rusak.
const emailAktif = () =>
  Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_FROM);

const RUTE_EMAIL = {
  clientQuote: () => '/client-quote',
  quotationApproval: (id) => `/quotation-approval/${id}`,
  clientQuotationApproval: (id) => `/client-quotation-approval/${id}`,
  projectBilling: (kode) => `/project-billing/${kode}`,
  timeline: (kode) => `/timeline/${kode}`,
  poRecord: () => '/po-record',
  deliveryManagement: () => '/delivery-management',
  supplierPayment: () => '/supplier-payment',
  supplierQuotationRecord: () => '/supplier-quotation-record',
  supplierInvoiceRecord: () => '/supplier-invoice-record',
  quotationLog: () => '/quotation-log',
  invoiceLog: () => '/invoice-log',
  verifyPayment: () => '/verify-payment',
  expenseLog: () => '/expense-submission-log',
  projectLog: () => '/project-log',
};

const tautanPenuh = (targetTipe, targetId) => {
  const buat = RUTE_EMAIL[targetTipe];
  if (!buat) return null;
  const basis = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
  return basis ? basis + buat(targetId) : null;
};

/* Pengirim notifikasi.
 *
 * ATURAN PENTING: fungsi ini TIDAK BOLEH di-await di jalur respons HTTP.
 * Panggil setelah res.json(), atau tanpa await sama sekali.
 *
 * Alasannya: notifikasi adalah efek samping, bukan hasil yang diminta. Kalau
 * pembuatannya gagal atau lambat, operasi bisnis yang SUDAH tersimpan di
 * database tidak boleh ikut terlihat gagal di layar. Ini berbeda dari email
 * reset password, di mana emailnya memang hasil yang diminta sehingga wajar
 * ditunggu. Nanti saat kanal email ditambahkan, perbedaan itu jadi makin
 * penting: SMTP yang menggantung tidak boleh menahan sebuah approval.
 *
 * Pola "kerjakan setelah respons terkirim" ini meniru hook pencatatan Log di
 * middleware/auth.js yang memakai res.on('finish').
 */

/**
 * @param {object} opsi
 * @param {Array} opsi.penerima array ObjectId; boleh kosong
 * @param {string} opsi.jenis kunci kamus tanpa awalan 'notif.'
 * @param {object} [opsi.params] nilai yang disisipkan ke kalimat
 * @param {string} [opsi.targetTipe] penentu pola URL
 * @param {string} [opsi.targetId] nilai siap tempel ke URL
 * @param {string} [opsi.actor] req.user.id
 */
async function kirimNotifikasi({ penerima = [], jenis, params = {}, targetTipe, targetId, actor }) {
  if (!jenis || penerima.length === 0) return [];

  const baris = penerima.map((recipient) => ({
    recipient,
    actor,
    jenis,
    params,
    targetTipe,
    targetId: targetId ? String(targetId) : undefined,
  }));

  const tersimpan = await Notification.insertMany(baris, { ordered: false });

  // Email menyusul setelah baris notifikasi tersimpan, dan sengaja TIDAK
  // ditunggu. Lonceng in-app adalah kanal utama yang harus selalu berhasil;
  // email hanya lapis kedua. Kalau SMTP mati atau lambat, notifikasi tetap
  // muncul di aplikasi dan kegagalannya berhenti di log server.
  kirimEmail({ penerima, jenis, params, targetTipe, targetId }).catch((err) =>
    console.error('Gagal mengirim email notifikasi:', jenis, err.message)
  );

  return tersimpan;
}

/** Kirim salinan notifikasi lewat email ke masing-masing penerima. */
async function kirimEmail({ penerima, jenis, params, targetTipe, targetId }) {
  if (!emailAktif()) return;

  const pesan = kalimat(jenis, params);
  if (!pesan) return;

  // Dimuat di dalam fungsi supaya berkas ini tetap bisa diuji dan dipakai di
  // lingkungan tanpa konfigurasi SMTP sama sekali.
  const { sendEmail } = require('./emailService');
  const { notifikasiTemplate } = require('./emailTemplates');

  const akun = await User.find({ _id: { $in: penerima } }).select('email username').lean();
  const tautan = tautanPenuh(targetTipe, targetId);

  for (const u of akun) {
    if (!u.email) continue;
    try {
      const isi = notifikasiTemplate({ username: u.username, pesan, tautan });
      await sendEmail({ to: u.email, ...isi });
    } catch (err) {
      // Satu penerima gagal tidak boleh menghentikan sisanya.
      console.error(`Email notifikasi ke ${u.email} gagal:`, err.message);
    }
  }
}

/**
 * Bungkus yang menelan errornya sendiri, untuk dipanggil tanpa await dari
 * controller. Tanpa ini, promise yang gagal akan jadi unhandled rejection dan
 * di Node versi baru itu mematikan proses.
 */
function kirimDiamDiam(opsi) {
  kirimNotifikasi(opsi).catch((err) =>
    console.error('Gagal membuat notifikasi:', opsi?.jenis, err.message)
  );
}

module.exports = { kirimNotifikasi, kirimDiamDiam };
