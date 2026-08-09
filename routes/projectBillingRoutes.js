const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/auth');
const {
  getAllProjectsBilling,
  getProjectBillingDetail,
  generateNextInvoice
} = require('../controllers/projectBillingController');

router.get('/', protect, authorizeRoles('Finance','Admin','Marketing','Management','Owner'), getAllProjectsBilling);
router.get('/:projectId', protect, authorizeRoles('Finance','Admin','Marketing','Management','Owner'), getProjectBillingDetail);
router.post('/:projectId/generate-next', protect, authorizeRoles('Finance','Admin'), generateNextInvoice);

module.exports = router;