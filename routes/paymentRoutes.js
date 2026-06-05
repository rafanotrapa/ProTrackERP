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
const { protect } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

router.get('/invoices', protect, getInvoicesForPayment);    
router.post('/', protect, upload.single('evidence'), createPayment); 
router.get('/all', protect, getAllPayments);                       
router.get('/detail/:id', protect, getPaymentById);               
router.patch('/verify', protect, verifyPayment);                

module.exports = router;