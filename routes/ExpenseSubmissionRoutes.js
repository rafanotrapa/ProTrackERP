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

// ⚠️ Route STATIS harus di atas route DINAMIS (:id)

// POST   /api/expense-submission          → submit biaya baru (semua role)
// GET    /api/expense-submission          → list semua (Log page)
router.route('/')
  .post(protect, upload.single('file'), submitExpense)
  .get(protect, getAllExpenses);

// GET    /api/expense-submission/pending          → list pending (Finance review)
router.get('/pending', protect, getPendingExpenses);

// GET    /api/expense-submission/project/:projectId → approved expenses per project
//        (dipakai Financial Report untuk agregasi)
router.get('/project/:projectId', protect, getExpensesByProject);

// GET    /api/expense-submission/:id      → detail by ID
router.get('/:id', protect, getExpenseById);

// PATCH  /api/expense-submission/:id/review → approve / reject (Finance)
router.patch('/:id/review', protect, reviewExpense);

// PATCH  /api/expense-submission/:id      → edit submission (jika belum Approved)
router.patch('/:id', protect, upload.single('file'), updateExpense);

// DELETE /api/expense-submission/:id      → hapus submission (jika belum Approved)
router.delete('/:id', protect, deleteExpense);

module.exports = router;