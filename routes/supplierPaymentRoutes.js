const express = require('express');
const router = express.Router();
const { getSupplierPayments, updateToPaid } = require('../controllers/supplierpaymentcontroller');
const { protect } = require('../middleware/auth');

// GET all pending supplier invoices
router.get('/', protect, getSupplierPayments);

// PUT update status to paid
router.put('/:id', protect, updateToPaid);

module.exports = router;