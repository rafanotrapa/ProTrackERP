const express = require('express');
const router  = express.Router();
const {
  submitExpense,
  getAllExpenses,
  getExpenseById,
  getExpensesByProject,
  reviewExpense,
  updateExpense,
  deleteExpense,
  getPendingExpenses,
} = require('../controllers/expenseSubmissionController');

const { protect } = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
  .post(protect, upload.single('file'), submitExpense)
  .get(protect, getAllExpenses);

router.get('/pending', protect, getPendingExpenses);

router.get('/project/:projectId', protect, getExpensesByProject);

router.get('/:id', protect, getExpenseById);

router.patch('/:id/review', protect, reviewExpense);

router.patch('/:id', protect, upload.single('file'), updateExpense);

router.delete('/:id', protect, deleteExpense);

module.exports = router;