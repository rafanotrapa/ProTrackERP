const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
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
  updateApprovedQuotation  // 🆕 untuk revisi harga setelah approved
} = require('../controllers/clientQuotationController');

// --- CREATE & UPDATE DRAFT ---
router.post('/', protect, createQuotation);  // Create draft (status: Draft)
router.patch('/:id/items', protect, updateQuotationItems);  // Update draft items

// --- GET ROUTES ---
router.get('/', protect, getAllQuotations);
router.get('/pending', protect, getPendingApprovals);
router.get('/project/:projectId', protect, getQuotationByProject);  // Hanya Approved
router.get('/:id', protect, getQuotationById);

// --- APPROVAL ---
router.patch('/:id/approve', protect, approveQuotation);

// --- DRAFT & SUBMIT ---
router.get('/draft/:projectId', protect, getDraftByProject);  // Load draft by project
router.put('/:id/submit', protect, submitQuotation);  // Draft -> Pending

// --- REVISION AFTER APPROVED ---
router.patch('/:id/revision', protect, updateApprovedQuotation);  // Edit setelah approved

module.exports = router;