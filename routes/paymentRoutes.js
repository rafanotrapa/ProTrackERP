const express = require('express');
const router = express.Router();
const multer = require('multer');
const { 
  getInvoicesForPayment, 
  createPayment, 
  getAllPayments, 
  getPaymentById, 
  verifyPayment 
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth'); // ← DIUBAH: ambil protect dari named export

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

// JALUR MARKETING (Input Payment)
router.get('/invoices', protect, getInvoicesForPayment);           // ← auth diganti protect
router.post('/', protect, upload.single('evidence'), createPayment); // ← auth diganti protect

// JALUR FINANCE (Verification)
router.get('/all', protect, getAllPayments);                       // ← auth diganti protect
router.get('/detail/:id', protect, getPaymentById);                // ← auth diganti protect
router.patch('/verify', protect, verifyPayment);                   // ← auth diganti protect

module.exports = router;