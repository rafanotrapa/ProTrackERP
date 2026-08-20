const Notification = require('../models/Notification');
const PushSubscription = require('../models/PushSubscription');

// Batas pengambilan daftar. Lonceng hanya menampilkan yang terbaru; riwayat
// panjang tidak berguna di panel sekecil itu dan hanya memberatkan query yang
// dijalankan tiap menit.
const BATAS = 30;

/** Daftar notifikasi milik pemanggil, terbaru dulu. */
exports.getMine = async (req, res) => {
  try {
    const data = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(BATAS)
      .lean();
    res.json(data);
  } catch (err) {
    console.error('Error get notifications:', err.message);
    res.status(500).json({ msg: 'Gagal mengambil notifikasi' });
  }
};

/** Hitungan belum dibaca. Dipanggil berkala, jadi sengaja hanya mengembalikan angka. */
exports.getUnreadCount = async (req, res) => {
  try {
    const jumlah = await Notification.countDocuments({ recipient: req.user.id, dibaca: false });
    res.json({ jumlah });
  } catch (err) {
    console.error('Error unread count:', err.message);
    res.status(500).json({ msg: 'Gagal menghitung notifikasi' });
  }
};

/** Tandai satu notifikasi dibaca. Filter recipient sekaligus jadi penjaga kepemilikan. */
exports.markRead = async (req, res) => {
  try {
    const hasil = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { dibaca: true, dibacaPada: new Date() },
      { returnDocument: 'after' }
    );
    if (!hasil) return res.status(404).json({ msg: 'Notifikasi tidak ditemukan' });
    res.json(hasil);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ msg: 'ID tidak valid' });
    console.error('Error mark read:', err.message);
    res.status(500).json({ msg: 'Gagal menandai notifikasi' });
  }
};

/** Tandai semua milik pemanggil sebagai dibaca. */
exports.markAllRead = async (req, res) => {
  try {
    const hasil = await Notification.updateMany(
      { recipient: req.user.id, dibaca: false },
      { dibaca: true, dibacaPada: new Date() }
    );
    res.json({ diubah: hasil.modifiedCount });
  } catch (err) {
    console.error('Error mark all read:', err.message);
    res.status(500).json({ msg: 'Gagal menandai notifikasi' });
  }
};

/* --- Web Push --------------------------------------------------------- */

/** Kunci publik VAPID, dibutuhkan browser untuk mendaftar. Bukan rahasia. */
exports.getVapidKey = (req, res) => {
  res.json({ kunci: process.env.VAPID_PUBLIC_KEY || null });
};

/**
 * Daftarkan satu perangkat. Endpoint dipakai sebagai kunci unik, sehingga
 * mendaftar ulang dari perangkat yang sama hanya memperbarui barisnya —
 * browser bisa memperbarui langganan kapan saja tanpa memberi tahu user.
 */
exports.subscribePush = async (req, res) => {
  try {
    const { endpoint, keys } = req.body || {};
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ msg: 'Data langganan tidak lengkap' });
    }
    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { user: req.user.id, endpoint, keys, userAgent: req.headers['user-agent'] },
      { upsert: true, returnDocument: 'after' }
    );
    res.status(201).json({ msg: 'Perangkat terdaftar' });
  } catch (err) {
    console.error('Error subscribe push:', err.message);
    res.status(500).json({ msg: 'Gagal mendaftarkan perangkat' });
  }
};

/** Cabut langganan perangkat ini. */
exports.unsubscribePush = async (req, res) => {
  try {
    const { endpoint } = req.body || {};
    if (!endpoint) return res.status(400).json({ msg: 'Endpoint wajib diisi' });
    await PushSubscription.deleteOne({ endpoint, user: req.user.id });
    res.json({ msg: 'Langganan dicabut' });
  } catch (err) {
    console.error('Error unsubscribe push:', err.message);
    res.status(500).json({ msg: 'Gagal mencabut langganan' });
  }
};
