const express = require('express');
const router = express.Router();


const { protect } = require('../middleware/auth'); 

const { createPO, getAllPOs, financeApprovePO, qcCheckPO, updateDelivery } = require('../controllers/poController');

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {

    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        msg: `Akses ditolak! Fitur ini khusus divisi: ${allowedRoles.join(' / ')}.` 
      });
    }
    next();
  };
};


router.post('/', protect, authorizeRoles('Admin', 'Procurement'), createPO);

router.get('/', protect, authorizeRoles('Admin', 'Procurement', 'Finance', 'Management', 'Owner'), getAllPOs);

router.put('/:id/finance-approve', protect, authorizeRoles('Admin', 'Finance'), financeApprovePO);

router.put('/:id/qc-check', protect, authorizeRoles('Admin', 'Procurement'), qcCheckPO);

router.put('/:id/delivery', protect, authorizeRoles('Admin', 'Procurement'), updateDelivery);

module.exports = router;