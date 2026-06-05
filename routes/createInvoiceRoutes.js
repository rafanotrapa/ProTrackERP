const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createNewInvoice,
  getQuotationForInvoice,
  getAllInvoices,
  getInvoiceById,
  updateInvoiceStatus,
  getInvoicesByProject
} = require('../controllers/createInvoiceController');

router.post('/', protect, createNewInvoice);
router.get('/quotations', protect, getQuotationForInvoice);
router.get('/quotations/available', protect, getQuotationForInvoice);

router.get('/', protect, getAllInvoices);
router.get('/project/:projectId', protect, getInvoicesByProject);
router.get('/:id', protect, getInvoiceById);
router.patch('/:id/status', protect, updateInvoiceStatus);

module.exports = router;