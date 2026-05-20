const express = require('express');
const router = express.Router();
const { 
  submitInvoice, 
  getAllInvoices, 
  updateStatus,
  getPendingPayments,    // 🆕
  confirmPayment, 
  getInvoiceById     // 🆕
} = require('../controllers/supplierInvoiceController');

const { protect } = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');

// --- ROUTE LAMA ---
router.route('/')
  .post(protect, upload.single('file'), submitInvoice)
  .get(protect, getAllInvoices);

router.route('/:id').patch(protect, updateStatus);

// --- 🆕 ROUTE BARU UNTUK SUPPLIER PAYMENT ---
router.get('/pending', protect, getPendingPayments);
router.get('/:id', protect, getInvoiceById);
router.patch('/:id/confirm', protect, confirmPayment);
router.get('/:id', protect, getInvoiceById);

module.exports = router;