const express = require('express');
const router = express.Router();
// IMPORT KEDUA FUNGSI INI DARI CONTROLLER
const { createNewInvoice, getQuotationForInvoice } = require('../controllers/createInvoiceController');
const { protect } = require('../middleware/auth');

// Route POST untuk simpan invoice
router.post('/', protect, createNewInvoice);

// Route GET untuk tarik data quotation
router.get('/quotations', protect, getQuotationForInvoice);

module.exports = router;