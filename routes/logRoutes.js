const express = require('express');
const router = express.Router();
const Log = require('../models/Log');
const { protect } = require('../middleware/auth');

const canViewLogs = (req, res, next) => {
  if (req.user && ['Admin', 'Management', 'Owner'].includes(req.user.role)) return next();
  return res.status(403).json({ msg: 'Akses ditolak! Khusus Admin / Management / Owner.' });
};

router.get('/', protect, canViewLogs, async (req, res) => {
  try {
    const logs = await Log.find().sort({ timestamp: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ msg: 'Gagal tarik logs' });
  }
});

module.exports = router;