const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getInventory, updateUsage } = require('../controllers/inventoryController');

const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ msg: `Akses ditolak! Khusus: ${roles.join(' / ')}.` });
  }
  next();
};

router.get('/', protect, authorizeRoles('Procurement', 'Admin', 'Management', 'Owner'), getInventory);
router.patch('/use', protect, authorizeRoles('Procurement', 'Admin'), updateUsage);

module.exports = router;
