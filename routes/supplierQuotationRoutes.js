const express = require('express');
const router = express.Router();
const supplierQuotationController = require('../controllers/supplierQuotationController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');

router.post('/', protect, upload.single('document'), supplierQuotationController.createQuotation);

router.get('/', protect, supplierQuotationController.getAllQuotations);

router.get('/pending', protect, supplierQuotationController.getPendingApprovals);

router.get('/project/:projectId', protect, supplierQuotationController.getQuotationByProject);

router.get('/:id', protect, supplierQuotationController.getQuotationById);

router.patch('/:id/approve', protect, supplierQuotationController.approveQuotation);

module.exports = router;