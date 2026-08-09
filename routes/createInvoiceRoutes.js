const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/auth');
const {
  createNewInvoice,
  getQuotationForInvoice,
  getAllInvoices,
  getInvoiceById,
  updateInvoiceStatus,
  getInvoicesByProject
} = require('../controllers/createInvoiceController');

router.post('/', protect, authorizeRoles('Marketing','Finance','Admin'), createNewInvoice);
router.get('/quotations', protect, authorizeRoles('Marketing','Finance','Admin'), getQuotationForInvoice);
router.get('/quotations/available', protect, authorizeRoles('Marketing','Finance','Admin'), getQuotationForInvoice);

router.get('/', protect, authorizeRoles('Marketing','Finance','Admin','Management','Owner'), getAllInvoices);
router.get('/project/:projectId', protect, authorizeRoles('Marketing','Finance','Admin','Management','Owner'), getInvoicesByProject);
router.get('/:id', protect, authorizeRoles('Marketing','Finance','Admin','Management','Owner'), getInvoiceById);
router.patch('/:id/status', protect, authorizeRoles('Finance','Admin'), updateInvoiceStatus);

module.exports = router;