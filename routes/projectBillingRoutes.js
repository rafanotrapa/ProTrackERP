const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getAllProjectsBilling,
  getProjectBillingDetail,
  generateNextInvoice
} = require('../controllers/projectBillingController');

router.get('/', protect, getAllProjectsBilling);
router.get('/:projectId', protect, getProjectBillingDetail);
router.post('/:projectId/generate-next', protect, generateNextInvoice);

module.exports = router;