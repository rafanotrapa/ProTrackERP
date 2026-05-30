const express = require('express');
const router  = express.Router();
const {
  getFinancialSummary,
  getProjectProfitability,
  getCashFlow,
  getReceivables,
  getMonthlyTrend,
} = require('../controllers/financialController');
const { protect } = require('../middleware/auth');

// ── Ringkasan total (summary cards)
router.get('/summary',        protect, getFinancialSummary);

// ── P&L per project dengan breakdown lengkap
router.get('/project-report', protect, getProjectProfitability);

// ── Cash flow (uang masuk & keluar)
router.get('/cash-flow',      protect, getCashFlow);

// ── Piutang (outstanding receivables)
router.get('/receivables',    protect, getReceivables);

// ── Trend bulanan
router.get('/monthly-trend',  protect, getMonthlyTrend);

module.exports = router;