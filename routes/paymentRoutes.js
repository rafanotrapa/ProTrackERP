const express = require('express');
const router = express.Router();
const {
  getInvoicesForPayment,
  createPayment,
  getAllPayments,
  getPaymentById,
  verifyPayment
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');

router.get('/invoices', protect, getInvoicesForPayment);    
router.post('/', protect, upload.single('evidence'), createPayment); 
router.get('/all', protect, getAllPayments);                       
router.get('/detail/:id', protect, getPaymentById);               
router.patch('/verify', protect, verifyPayment);                

module.exports = router;