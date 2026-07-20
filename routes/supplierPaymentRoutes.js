const express = require('express');
const router = express.Router();
const { getSupplierPayments, updateToPaid } = require('../controllers/supplierPaymentController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getSupplierPayments);

router.put('/:id', protect, updateToPaid);

module.exports = router;