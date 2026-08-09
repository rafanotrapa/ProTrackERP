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

const { protect, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
  .post(protect, authorizeRoles('Procurement','Admin'), upload.fields([{ name: 'file', maxCount: 1 }, { name: 'itemPhoto', maxCount: 1 }]), submitInvoice)
  .get(protect, authorizeRoles('Procurement','Finance','Admin','Management','Owner'), getAllInvoices);

router.route('/:id').patch(protect, authorizeRoles('Finance','Admin'), updateStatus);

router.get('/pending', protect, authorizeRoles('Finance','Admin'), getPendingPayments);
router.get('/:id', protect, authorizeRoles('Procurement','Finance','Admin','Management','Owner'), getInvoiceById);
router.patch('/:id/confirm', protect, authorizeRoles('Finance','Admin'), upload.single('paymentProof'), confirmPayment);

module.exports = router;