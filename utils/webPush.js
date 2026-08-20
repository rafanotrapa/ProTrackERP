const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

/* Web Push: notifikasi tingkat sistem operasi di laptop dan HP.
 *
 * Beda dari email, ini tidak lewat pihak ketiga berbayar — browser sendiri yang
 * menyediakan layanan pengantarnya (Google untuk Chrome, Mozilla untuk Firefox,
 * Apple untuk Safari). VAPID adalah sepasang kunci yang membuktikan bahwa push
 * itu benar datang dari server kita, dan kuncinya dibuat sendiri.
 *
 * Catatan yang perlu diketahui sejak awal: di iPhone, Web Push HANYA berfungsi
 * kalau situsnya sudah ditambahkan ke Home Screen sebagai PWA. Itu batasan
 * Apple, bukan sesuatu yang bisa disiasati dari sisi kode. Di laptop
 * Chrome/Edge/Firefox berjalan tanpa syarat tambahan.
 */

const aktif = () => Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

let siap = false;
const siapkan = () => {
  if (siap || !aktif()) return aktif();
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@bataviajayakreasindo.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  siap = true;
  return true;
};

/**
 * Kirim satu notifikasi ke SEMUA perangkat milik penerima.
 * Tidak pernah melempar — kegagalan push tidak boleh menjatuhkan apa pun.
 *
 * @param {Array} penerima array ObjectId user
 * @param {object} isi { judul, pesan, tautan }
 */
async function kirimPush(penerima = [], { judul, pesan, tautan }) {
  if (!siapkan() || penerima.length === 0) return;

  const langganan = await PushSubscription.find({ user: { $in: penerima } }).lean();
  if (langganan.length === 0) return;

  const muatan = JSON.stringify({ judul, pesan, tautan });

  await Promise.all(langganan.map(async (l) => {
    try {
      await webpush.sendNotification(
        { endpoint: l.endpoint, keys: l.keys },
        muatan
      );
    } catch (err) {
      // 404/410 berarti langganannya sudah tidak berlaku — perangkatnya
      // mencabut izin atau membersihkan data browser. Dibuang supaya koleksi
      // ini tidak menumpuk alamat mati.
      if (err.statusCode === 404 || err.statusCode === 410) {
        await PushSubscription.deleteOne({ endpoint: l.endpoint }).catch(() => {});
      } else {
        console.error('Push gagal:', err.statusCode || '', err.message);
      }
    }
  }));
}

module.exports = { kirimPush, aktifWebPush: aktif };
