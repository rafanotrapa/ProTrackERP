const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createNewInvoice,
  getQuotationForInvoice,
  getAllInvoices,
  getInvoiceById,
  updateInvoiceStatus,
  getInvoicesByProject
} = require('../controllers/createInvoiceController');

// --- CREATE ---
router.post('/', protect, createNewInvoice);

// --- GET QUOTATIONS (for invoice creation) ---
router.get('/quotations', protect, getQuotationForInvoice);
router.get('/quotations/available', protect, getQuotationForInvoice);

// --- GET INVOICES ---
router.get('/', protect, getAllInvoices);
router.get('/project/:projectId', protect, getInvoicesByProject);
router.get('/:id', protect, getInvoiceById);

// --- UPDATE ---
router.patch('/:id/status', protect, updateInvoiceStatus);

module.exports = router;