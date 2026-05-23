const express = require('express');
const router = express.Router();
const { 
  submitInvoice, 
  getAllInvoices, 
  updateStatus,
  getPendingPayments,    
  confirmPayment, 
  getInvoiceById     
} = require('../controllers/supplierInvoiceController');

const { protect } = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');

// --- ROUTE UTAMA ---
router.route('/')
  .post(protect, upload.single('file'), submitInvoice)
  .get(protect, getAllInvoices); // Endpoint ini dipanggil buat tabel Track Record!

router.route('/:id').patch(protect, updateStatus);

// --- ROUTE UNTUK SUPPLIER PAYMENT ---
router.get('/pending', protect, getPendingPayments);
router.get('/:id', protect, getInvoiceById);
router.patch('/:id/confirm', protect, confirmPayment);

module.exports = router;