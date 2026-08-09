const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/auth');
const { getInventory, updateUsage } = require('../controllers/inventoryController');

router.get('/', protect, authorizeRoles('Procurement', 'Admin', 'Management', 'Owner'), getInventory);
router.patch('/use', protect, authorizeRoles('Procurement', 'Admin'), updateUsage);

module.exports = router;
