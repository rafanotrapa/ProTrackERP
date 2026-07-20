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

router.route('/')
  .post(protect, upload.fields([{ name: 'file', maxCount: 1 }, { name: 'itemPhoto', maxCount: 1 }]), submitInvoice)
  .get(protect, getAllInvoices);

router.route('/:id').patch(protect, updateStatus);

router.get('/pending', protect, getPendingPayments);
router.get('/:id', protect, getInvoiceById);
router.patch('/:id/confirm', protect, upload.single('paymentProof'), confirmPayment);

module.exports = router;