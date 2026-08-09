const express = require('express');
const router = express.Router();
const {
  getInvoicesForPayment,
  createPayment,
  getAllPayments,
  getPaymentById,
  verifyPayment
} = require('../controllers/paymentController');
const { protect, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');

// Marketing menginput pembayaran termin pertama, Finance untuk termin berikutnya.
const DAPAT_INPUT  = ['Marketing', 'Finance', 'Admin'];
// Verifikasi adalah kontrol uang: hanya Finance yang boleh menyatakan lunas.
const DAPAT_VERIF  = ['Finance', 'Admin'];
const DAPAT_LIHAT  = ['Marketing', 'Finance', 'Admin', 'Management', 'Owner'];

router.get('/invoices', protect, authorizeRoles(...DAPAT_INPUT), getInvoicesForPayment);
router.post('/', protect, authorizeRoles(...DAPAT_INPUT), upload.single('evidence'), createPayment);
router.get('/all', protect, authorizeRoles(...DAPAT_LIHAT), getAllPayments);
router.get('/detail/:id', protect, authorizeRoles(...DAPAT_LIHAT), getPaymentById);
router.patch('/verify', protect, authorizeRoles(...DAPAT_VERIF), verifyPayment);

module.exports = router;