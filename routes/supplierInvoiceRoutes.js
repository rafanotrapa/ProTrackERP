const express = require('express');
const router = express.Router();
const { 
    submitInvoice, 
    getAllInvoices, 
    updateStatus 
} = require('../controllers/supplierInvoiceController');


const { protect } = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');

// @route   POST & GET /api/invoice_submission
router.route('/')
    .post(protect, upload.single('file'), submitInvoice)
    .get(protect, getAllInvoices);

// @route   PATCH /api/invoice_submission/:id
router.route('/:id').patch(protect, updateStatus);

module.exports = router;