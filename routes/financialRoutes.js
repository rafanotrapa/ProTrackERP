const express = require('express');
const router = express.Router();
const { getProjectProfitability } = require('../controllers/financialController');
const { protect } = require('../middleware/auth');

// Ini alamat yang bikin 404 tadi. Sekarang kita aktifin!
router.get('/project-report', protect, getProjectProfitability);

module.exports = router;