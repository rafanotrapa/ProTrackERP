const express = require('express');
const router  = express.Router();
const {
  submitExpense,
  getAllExpenses,
  getExpenseById,
  getExpensesByProject,
  reviewExpense,
  deleteExpense,
  getPendingExpenses,
} = require('../controllers/expenseSubmissionController');

const { protect, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
  .post(protect, upload.single('file'), submitExpense)
  .get(protect, authorizeRoles('Marketing','Procurement','Finance','Management','Owner','Admin'), getAllExpenses);

router.get('/pending', protect, authorizeRoles('Finance','Admin'), getPendingExpenses);

router.get('/project/:projectId', protect, getExpensesByProject);

router.get('/:id', protect, getExpenseById);

router.patch('/:id/review', protect, authorizeRoles('Finance','Admin'), reviewExpense);

// Tidak ada rute edit. Pengajuan bersifat sekali kirim; setelah diajukan hanya
// Finance yang boleh mengubah keadaannya, lewat /:id/review.

router.delete('/:id', protect, deleteExpense);

module.exports = router;