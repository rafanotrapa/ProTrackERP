const mongoose = require('mongoose');

/* Notifikasi untuk SATU akun penerima.
 *
 * Sengaja terpisah dari models/Log.js, bukan menumpang di sana. Tiga alasannya:
 *
 *   1. Log punya `expires: '7d'` — notifikasi yang belum dibaca akan lenyap
 *      sendiri setelah seminggu, dan kerusakan seperti itu tidak meninggalkan
 *      jejak apa pun untuk dilacak.
 *   2. Log.user bertipe String username, sedangkan penyaringan per akun butuh
 *      ObjectId supaya bisa dicocokkan dengan req.user.id dan tetap benar walau
 *      username diganti.
 *   3. Yang paling mendasar: Log mencatat SIAPA YANG MELAKUKAN, notifikasi
 *      mencatat SIAPA YANG HARUS TAHU. Keduanya justru tidak pernah sama —
 *      notifikasi baru berguna ketika penerimanya bukan pelakunya.
 *
 * Isinya disimpan sebagai kode jenis + parameter, BUKAN kalimat jadi. Notifikasi
 * dibuat server saat kejadian, sementara pilihan bahasa hidup di browser
 * penerima (src/i18n/index.jsx). Kalimat yang sudah jadi akan mengunci bahasa
 * pada saat kejadian, sehingga lonceng tetap berbahasa lama walau seluruh
 * antarmuka sudah diganti — persis gejala yang sistem i18n ini dibangun untuk
 * memberantas. Kalimatnya dirakit saat render lewat t(`notif.${jenis}`, params).
 */
const NotificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Kunci kamus, tanpa awalan 'notif.' — mis. 'supplierQuotationApproved'.
  jenis: { type: String, required: true },

  // Nilai yang disisipkan ke kalimat, mis. { nomor: 'SQ-202608-0001', oleh: 'Rina' }.
  // `oleh` sengaja berupa snapshot nama saat kejadian, mengikuti cara
  // ExpenseSubmission.submittedByName menyimpan nama — historis, bukan tautan hidup.
  params: { type: mongoose.Schema.Types.Mixed, default: {} },

  // targetTipe menentukan POLA url, targetId menyimpan nilai yang siap ditempel.
  // Ini bukan pemisahan yang berlebihan: /timeline/:projectId dan
  // /project-billing/:projectId memakai kode bisnis ('BJK-202608-0001'),
  // sedangkan /quotation-approval/:id dan sejenisnya memakai _id Mongo.
  // Menyimpan _id untuk semuanya akan mematikan dua rute pertama.
  targetTipe: { type: String },
  targetId: { type: String },

  dibaca: { type: Boolean, default: false },
  dibacaPada: { type: Date },
}, {
  collection: 'notification',
  timestamps: true,
});

// Query lonceng selalu berbentuk "milik saya, belum dibaca, terbaru dulu".
NotificationSchema.index({ recipient: 1, dibaca: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
