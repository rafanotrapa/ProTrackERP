const mongoose = require('mongoose');

/* Langganan Web Push milik satu PERANGKAT, bukan satu akun.
 *
 * Satu orang bisa membuka ProTrack di laptop kantor, laptop rumah, dan HP —
 * masing-masing menghasilkan endpoint push sendiri dari browser. Karena itu
 * kuncinya endpoint, dan satu user boleh punya banyak baris.
 *
 * Langganan bisa mati sewaktu-waktu: user mencabut izin, membersihkan data
 * browser, atau perangkatnya tidak dipakai berbulan-bulan. Layanan push
 * menjawab 404/410 untuk endpoint yang sudah tidak berlaku, dan utils/notify.js
 * menghapus barisnya saat itu terjadi — tanpa itu koleksi ini akan terus
 * menumpuk langganan mati dan setiap notifikasi membuang waktu mengirim ke
 * alamat yang tidak ada.
 */
const PushSubscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  endpoint: { type: String, required: true, unique: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
  userAgent: { type: String },
}, {
  collection: 'push_subscription',
  timestamps: true,
});

module.exports = mongoose.model('PushSubscription', PushSubscriptionSchema);
