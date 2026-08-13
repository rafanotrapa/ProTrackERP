const express = require('express');
const router = express.Router();
const Log = require('../models/Log');
const { protect, authorizeRoles } = require('../middleware/auth');

// Dulu berkas ini punya penjaga peran sendiri yang menghardcode
// ['Admin','Management','Owner']. Akibatnya dua hal terlewat: akun Administrator
// hasil penggantian nama peran kehilangan akses log, dan peran lihat-saja tidak
// pernah bisa membuka modul System Logs walau dicentang. authorizeRoles sudah
// menangani keduanya secara terpusat.
router.get('/', protect, authorizeRoles('Administrator', 'Management', 'Owner'), async (req, res) => {
  try {
    const logs = await Log.find().sort({ timestamp: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ msg: 'Gagal tarik logs' });
  }
});

module.exports = router;