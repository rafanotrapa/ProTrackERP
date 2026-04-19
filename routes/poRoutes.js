const express = require('express');
const router = express.Router();

// Import middleware 
const { protect, admin } = require('../middleware/auth'); 

// Import fungsi dari controller PO yang udah kita update sebelumnya
const { createPO, getAllPOs, financeApprovePO, qcCheckPO } = require('../controllers/poController');

// 1. Rute Dasar PO
router.post('/', protect, admin, createPO);
router.get('/', protect, admin, getAllPOs);

// 2. Rute Cross-Validation (Ini yang gantiin placeholder lama lu)
// Rute untuk Finance (Approve DP)
router.put('/:id/finance-approve', protect, admin, financeApprovePO);

// Rute untuk Procurement (Pass QC atau Return Barang)
router.put('/:id/qc-check', protect, admin, qcCheckPO);

module.exports = router;