const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/auth');

// Marketing yang menyusun quotation, Management yang menyetujui — pemisahan
// tugas ini sebelumnya hanya ditegakkan di frontend.
const PENYUSUN = ['Marketing', 'Admin'];
const PENYETUJU = ['Management', 'Admin'];
const PEMBACA = ['Marketing', 'Management', 'Owner', 'Finance', 'Admin'];
const {
  createQuotation,
  getAllQuotations,
  getQuotationById,
  getQuotationByProject,
  getPendingApprovals,
  approveQuotation,
  updateQuotationItems,
  getDraftByProject,
  submitQuotation,
  updateApprovedQuotation,
  getMyQuotations  
} = require('../controllers/clientQuotationController');


router.post('/', protect, authorizeRoles(...PENYUSUN), createQuotation);
router.patch('/:id/items', protect, authorizeRoles(...PENYUSUN), updateQuotationItems);
router.put('/:id/submit', protect, authorizeRoles(...PENYUSUN), submitQuotation);

router.get('/my-quotations', protect, authorizeRoles(...PEMBACA), getMyQuotations);
router.get('/pending', protect, authorizeRoles(...PENYETUJU), getPendingApprovals);
router.get('/project/:projectId', protect, authorizeRoles(...PEMBACA), getQuotationByProject);
router.get('/draft/:projectId', protect, authorizeRoles(...PENYUSUN), getDraftByProject);
router.get('/', protect, authorizeRoles(...PEMBACA), getAllQuotations);
router.get('/:id', protect, authorizeRoles(...PEMBACA), getQuotationById);
router.patch('/:id/approve', protect, authorizeRoles(...PENYETUJU), approveQuotation);
router.patch('/:id/revision', protect, authorizeRoles(...PENYETUJU), updateApprovedQuotation);

module.exports = router;