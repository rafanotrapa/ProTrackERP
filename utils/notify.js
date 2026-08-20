const Notification = require('../models/Notification');

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

  return Notification.insertMany(baris, { ordered: false });
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
