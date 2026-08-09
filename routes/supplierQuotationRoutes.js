const express = require('express');
const router = express.Router();
const supplierQuotationController = require('../controllers/supplierQuotationController');
const { protect, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');

const PENYUSUN  = ['Procurement', 'Admin'];
const PENYETUJU = ['Management', 'Admin'];
// Marketing ikut membaca karena Client Quotation mode AUTO mengambil item dari
// supplier quotation yang sudah disetujui.
const PEMBACA   = ['Procurement', 'Marketing', 'Management', 'Owner', 'Finance', 'Admin'];

router.post('/', protect, authorizeRoles(...PENYUSUN), upload.single('document'), supplierQuotationController.createQuotation);

router.get('/', protect, authorizeRoles(...PEMBACA), supplierQuotationController.getAllQuotations);

router.get('/pending', protect, authorizeRoles(...PENYETUJU), supplierQuotationController.getPendingApprovals);

router.get('/project/:projectId', protect, authorizeRoles(...PEMBACA), supplierQuotationController.getQuotationByProject);

router.get('/:id', protect, authorizeRoles(...PEMBACA), supplierQuotationController.getQuotationById);

router.patch('/:id/approve', protect, authorizeRoles(...PENYETUJU), supplierQuotationController.approveQuotation);

module.exports = router;