const express = require('express');
const router  = express.Router();
const {
  getFinancialSummary,
  getProjectProfitability,
  getCashFlow,
  getReceivables,
  getMonthlyTrend,
} = require('../controllers/financialController');
const { protect, authorizeRoles } = require('../middleware/auth');

// Laba rugi, arus kas, dan piutang seluruh perusahaan. Sebelumnya semua peran
// bisa membacanya, termasuk Marketing dan Procurement.
const KEUANGAN = ['Finance', 'Owner', 'Management', 'Admin'];

router.get('/summary',        protect, authorizeRoles(...KEUANGAN), getFinancialSummary);

router.get('/project-report', protect, authorizeRoles(...KEUANGAN), getProjectProfitability);

router.get('/cash-flow',      protect, authorizeRoles(...KEUANGAN), getCashFlow);

router.get('/receivables',    protect, authorizeRoles(...KEUANGAN), getReceivables);

router.get('/monthly-trend',  protect, authorizeRoles(...KEUANGAN), getMonthlyTrend);

module.exports = router;