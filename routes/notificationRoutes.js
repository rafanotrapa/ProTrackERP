const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/notificationController');

/* Sengaja HANYA memakai `protect`, tanpa authorizeRoles.
 *
 * Kepemilikan sudah dijamin di lapisan query: setiap handler menyaring
 * { recipient: req.user.id }, jadi tidak ada cara membaca notifikasi orang lain
 * sekalipun ID-nya ditebak.
 *
 * Memasang authorizeRoles justru merusak: untuk peran lihat-saja, fungsi itu
 * mencari nama modul di MODULE_MAP dan menolak kalau tidak terdaftar — sehingga
 * akun Viewer akan kehilangan loncengnya sendiri.
 *
 * Urutan rute penting: '/unread-count' dan '/read-all' harus didaftarkan
 * sebelum pola ber-parameter, kalau tidak keduanya akan tertangkap sebagai :id.
 */
router.use(protect);

router.get('/', ctrl.getMine);
router.get('/unread-count', ctrl.getUnreadCount);
router.patch('/read-all', ctrl.markAllRead);
router.patch('/:id/read', ctrl.markRead);

// Web Push. subscribe/unsubscribe adalah operasi tulis, tapi ikut pengecualian
// rutePribadi di middleware/auth.js — yang berubah hanya langganan perangkat
// milik akun itu sendiri, bukan data perusahaan.
router.get('/vapid-key', ctrl.getVapidKey);
router.post('/push/subscribe', ctrl.subscribePush);
router.post('/push/unsubscribe', ctrl.unsubscribePush);

module.exports = router;
