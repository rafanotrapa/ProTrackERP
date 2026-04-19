const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth'); 

// Jangan lupa tambahin updateDelivery di import ini
const { createPO, getAllPOs, financeApprovePO, qcCheckPO, updateDelivery } = require('../controllers/poController');

router.post('/', protect, admin, createPO);
router.get('/', protect, admin, getAllPOs);

router.put('/:id/finance-approve', protect, admin, financeApprovePO);
router.put('/:id/qc-check', protect, admin, qcCheckPO);

// --- NEW ROUTE: LOGISTICS ---
router.put('/:id/delivery', protect, admin, updateDelivery);

module.exports = router;