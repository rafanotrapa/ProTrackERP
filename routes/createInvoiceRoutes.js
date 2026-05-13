const express = require('express');
const router = express.Router();
const { createNewInvoice, getQuotationForInvoice } = require('../controllers/createInvoiceController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createNewInvoice);
router.get('/quotations', protect, getQuotationForInvoice);
router.get('/quotations/available', protect, getQuotationForInvoice);

module.exports = router;