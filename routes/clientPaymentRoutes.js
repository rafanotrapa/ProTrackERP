const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { verifyPayment } = require('../controllers/clientPaymentController');
const { protect } = require('../middleware/auth');

// Konfigurasi Multer - SESUAI STRUKTUR FOLDER LO
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Karena folder lo: uploads > documents > payments
        cb(null, 'uploads/documents/payments/'); 
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } 
});

router.post('/', protect, upload.single('file'), verifyPayment);

module.exports = router;