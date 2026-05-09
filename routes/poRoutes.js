const express = require('express');
const router = express.Router();

// Cukup panggil protect, HAPUS 'admin'
const { protect } = require('../middleware/auth'); 

const { createPO, getAllPOs, financeApprovePO, qcCheckPO, updateDelivery } = require('../controllers/poController');

// --- CUSTOM MIDDLEWARE: DINAMIS CEK ROLE ---
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // Kalau role user yang login gak ada di dalam daftar yang diizinkan, tendang!
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        msg: `Akses ditolak! Fitur ini khusus divisi: ${allowedRoles.join(' / ')}.` 
      });
    }
    next();
  };
};

// --- MAPPING ROUTES & HAK AKSES DIVISI ---

// 1. CREATE PO: Hanya boleh dieksekusi oleh Procurement & Admin
router.post('/', protect, authorizeRoles('Admin', 'Procurement'), createPO);

// 2. GET ALL PO: Bisa dilihat oleh banyak divisi untuk keperluan monitoring
router.get('/', protect, authorizeRoles('Admin', 'Procurement', 'Finance', 'Management', 'Owner'), getAllPOs);

// 3. FINANCE APPROVAL: Gembok! Cuma orang Finance (atau Admin) yang bisa setujuin DP
router.put('/:id/finance-approve', protect, authorizeRoles('Admin', 'Finance'), financeApprovePO);

// 4. QC CHECK & RETURN GOODS: Wewenang Procurement
router.put('/:id/qc-check', protect, authorizeRoles('Admin', 'Procurement'), qcCheckPO);

// 5. DELIVERY / LOGISTICS: Wewenang Procurement (atau Logistik jika ada rolenya)
router.put('/:id/delivery', protect, authorizeRoles('Admin', 'Procurement'), updateDelivery);

module.exports = router;