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

router.get('/summary',        protect, getFinancialSummary);

router.get('/project-report', protect, getProjectProfitability);

router.get('/cash-flow',      protect, getCashFlow);

router.get('/receivables',    protect, getReceivables);

router.get('/monthly-trend',  protect, getMonthlyTrend);

module.exports = router;