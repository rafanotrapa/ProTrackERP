const express = require('express');
const router = express.Router();
const Log = require('../models/Log');
const { protect, admin } = require('../middleware/auth');

router.get('/', protect, admin, async (req, res) => {
  try {
    const logs = await Log.find().sort({ timestamp: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ msg: 'Gagal tarik logs' });
  }
});

module.exports = router;