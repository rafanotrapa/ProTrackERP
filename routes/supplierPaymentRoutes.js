const express = require('express');
const router = express.Router();
const { getSupplierPayments, updateToPaid } = require('../controllers/supplierPaymentController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.get('/', protect, authorizeRoles('Finance','Admin','Management','Owner'), getSupplierPayments);

router.put('/:id', protect, authorizeRoles('Finance','Admin'), updateToPaid);

module.exports = router;