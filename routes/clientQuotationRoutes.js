const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createQuotation,
  getAllQuotations,
  getQuotationById,
  getQuotationByProject,
  getPendingApprovals,
  approveQuotation
} = require('../controllers/clientQuotationController');

// --- ROUTES YANG SUDAH ADA (DIUPDATE) ---
// 1. POST: Create Quotation (Marketing)
router.post('/', protect, createQuotation);

// 2. GET: List All Quotations (Untuk Management)
router.get('/', protect, getAllQuotations);

// --- ROUTES BARU UNTUK APPROVAL SYSTEM ---
// 3. GET: Pending Approvals (Khusus Management)
router.get('/pending', protect, getPendingApprovals);

// 4. GET: Get by Project ID (Untuk Auto-fill di Create Invoice) - HANYA YANG APPROVED
router.get('/project/:projectId', protect, getQuotationByProject);

// 5. GET: Get by ID UNIK (Untuk Detail Review)
router.get('/:id', protect, getQuotationById);

// 6. PATCH: Approve/Reject Quotation (Management Action)
router.patch('/:id/approve', protect, approveQuotation);

module.exports = router;