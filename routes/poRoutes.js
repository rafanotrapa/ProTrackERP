const express = require('express');
const router = express.Router();


// authorizeRoles dulu didefinisikan ulang di file ini dan di inventoryRoutes.
// Sekarang dipakai bersama dari middleware/auth.js.
const { protect, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');

const { createPO, getAllPOs, financeApprovePO, qcCheckPO, updateDelivery } = require('../controllers/poController');


router.post('/', protect, authorizeRoles('Admin', 'Procurement'), createPO);

router.get('/', protect, authorizeRoles('Admin', 'Procurement', 'Finance', 'Management', 'Owner'), getAllPOs);

router.put('/:id/finance-approve', protect, authorizeRoles('Admin', 'Finance'), financeApprovePO);

router.put('/:id/qc-check', protect, authorizeRoles('Admin', 'Procurement'), qcCheckPO);

router.put('/:id/delivery', protect, authorizeRoles('Admin', 'Procurement'), upload.single('deliveryPhoto'), updateDelivery);

module.exports = router;