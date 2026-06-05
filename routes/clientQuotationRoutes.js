const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createQuotation,
  getAllQuotations,
  getQuotationById,
  getQuotationByProject,
  getPendingApprovals,
  approveQuotation,
  updateQuotationItems,
  getDraftByProject,
  submitQuotation,
  updateApprovedQuotation,
  getMyQuotations  
} = require('../controllers/clientQuotationController');


router.post('/', protect, createQuotation);
router.patch('/:id/items', protect, updateQuotationItems);
router.put('/:id/submit', protect, submitQuotation);


router.get('/my-quotations', protect, getMyQuotations);  
router.get('/pending', protect, getPendingApprovals);
router.get('/project/:projectId', protect, getQuotationByProject);
router.get('/draft/:projectId', protect, getDraftByProject);
router.get('/', protect, getAllQuotations);
router.get('/:id', protect, getQuotationById);
router.patch('/:id/approve', protect, approveQuotation);
router.patch('/:id/revision', protect, updateApprovedQuotation);

module.exports = router;