const ExpenseSubmission = require('../models/ExpenseSubmission');

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: parse & validasi items[] dari request body
// (items dikirim sebagai JSON string lewat FormData karena ada file upload)
// ─────────────────────────────────────────────────────────────────────────────
const parseItems = (rawItems) => {
  let items = rawItems;
  if (typeof rawItems === 'string') {
    try {
      items = JSON.parse(rawItems);
    } catch {
      items = [];
    }
  }
  if (!Array.isArray(items)) return [];
  return items
    .filter((it) => it && it.name && it.name.trim() && Number(it.amount) > 0)
    .map((it) => ({
      name:        it.name.trim(),
      description: it.description || '',
      amount:      Number(it.amount),
    }));
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. SUBMIT EXPENSE — bisa dilakukan semua role, kapan saja, terlepas
//    dari status project. Mendukung multi-item dalam satu submission.
// ─────────────────────────────────────────────────────────────────────────────
exports.submitExpense = async (req, res) => {
  try {
    const userId   = req.user ? (req.user._id || req.user.id) : null;
    const userName = req.user ? (req.user.name || req.user.username || 'System') : 'System';

    const {
      submissionId,
      projectId,
      projectName,
      currency,
      remarks,
    } = req.body;

    if (!projectId) {
      return res.status(400).json({ msg: 'Project wajib dipilih' });
    }

    const items = parseItems(req.body.items);
    if (items.length === 0) {
      return res.status(400).json({ msg: 'Minimal satu item biaya wajib diisi (nama & nominal)' });
    }

    const totalAmount = items.reduce((sum, it) => sum + it.amount, 0);

    const newExpense = new ExpenseSubmission({
      submissionId:    submissionId || `EXP-${Date.now()}`,
      projectId,
      projectName:     projectName || '',
      items,
      amount:          totalAmount,
      currency:        currency || 'IDR',
      file:            req.file ? req.file.filename : null,
      submittedBy:     userId,
      submittedByName: userName,
      remarks:         remarks || '',
      status:          'Pending Verification',
      statusHistory: [{
        status:        'Pending Verification',
        changedBy:     userId,
        changedByName: userName,
        note:          `Submission diajukan (${items.length} item)`,
        timestamp:     new Date(),
      }],
    });

    const saved = await newExpense.save();

    res.status(201).json({
      success: true,
      msg:     'Pengajuan biaya berhasil dikirim untuk verifikasi Finance',
      data:    saved,
    });
  } catch (err) {
    console.error('Error submit expense:', err);
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'Submission ID sudah ada, coba lagi.' });
    }
    res.status(500).json({ msg: `Gagal simpan submission: ${err.message}` });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. GET ALL — untuk Log page
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllExpenses = async (req, res) => {
  try {
    const { status, projectId } = req.query;
    const filter = {};
    if (status)    filter.status    = status;
    if (projectId) filter.projectId = { $regex: projectId, $options: 'i' };

    const expenses = await ExpenseSubmission.find(filter)
      .populate('submittedBy', 'name username')
      .populate('reviewedBy', 'name username')
      .sort({ createdAt: -1 });

    res.status(200).json(expenses);
  } catch (err) {
    console.error('Error get all expenses:', err);
    res.status(500).json({ msg: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. GET BY ID
// ─────────────────────────────────────────────────────────────────────────────
exports.getExpenseById = async (req, res) => {
  try {
    const expense = await ExpenseSubmission.findById(req.params.id)
      .populate('submittedBy', 'name username')
      .populate('reviewedBy', 'name username');

    if (!expense) return res.status(404).json({ msg: 'Submission tidak ditemukan' });
    res.json(expense);
  } catch (err) {
    console.error('Error get expense by id:', err);
    if (err.name === 'CastError') return res.status(400).json({ msg: 'Format ID tidak valid' });
    res.status(500).json({ msg: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. GET BY PROJECT — dipakai Financial Report & Project Timeline
//    Hanya yang sudah Approved yang dihitung sebagai expense riil.
// ─────────────────────────────────────────────────────────────────────────────
exports.getExpensesByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const expenses = await ExpenseSubmission.find({
      projectId,
      status: 'Approved',
    }).sort({ createdAt: -1 });
    res.json(expenses);
  } catch (err) {
    console.error('Error get expenses by project:', err);
    res.status(500).json({ msg: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. APPROVE / REJECT (Finance)
// ─────────────────────────────────────────────────────────────────────────────
exports.reviewExpense = async (req, res) => {
  try {
    const { status, rejectionReason, note } = req.body;
    const { id } = req.params;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ msg: 'Status review tidak valid' });
    }

    const userId   = req.user ? (req.user._id || req.user.id) : null;
    const userName = req.user ? (req.user.name || req.user.username || 'System') : 'System';

    const historyEntry = {
      status,
      changedBy:     userId,
      changedByName: userName,
      note:          note || (status === 'Approved' ? 'Disetujui oleh Finance' : 'Ditolak oleh Finance'),
      timestamp:     new Date(),
    };

    const updateData = {
      status,
      reviewedBy:     userId,
      reviewedByName: userName,
      reviewDate:     new Date(),
      $push: { statusHistory: historyEntry },
    };

    if (status === 'Rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    const updated = await ExpenseSubmission.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) return res.status(404).json({ msg: 'Submission tidak ditemukan' });

    res.json({
      success: true,
      msg:     `Submission berhasil di-${status}`,
      data:    updated,
    });
  } catch (err) {
    console.error('Error review expense:', err);
    res.status(500).json({ msg: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. UPDATE (edit) — hanya untuk submission yang belum Approved.
//    Sekarang bisa update seluruh items[] sekaligus.
// ─────────────────────────────────────────────────────────────────────────────
exports.updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await ExpenseSubmission.findById(id);
    if (!existing) return res.status(404).json({ msg: 'Submission tidak ditemukan' });

    if (existing.status === 'Approved') {
      return res.status(400).json({ msg: 'Submission yang sudah Approved tidak bisa diedit' });
    }

    const { currency, remarks, projectId, projectName } = req.body;

    const userId   = req.user ? (req.user._id || req.user.id) : null;
    const userName = req.user ? (req.user.name || req.user.username || 'System') : 'System';

    const updateData = {
      currency:    currency    || existing.currency,
      remarks:     remarks     !== undefined ? remarks : existing.remarks,
      projectId:   projectId   || existing.projectId,
      projectName: projectName || existing.projectName,
      // Reset ke Pending Verification jika sebelumnya Rejected dan diedit ulang
      status: existing.status === 'Rejected' ? 'Pending Verification' : existing.status,
      $push: {
        statusHistory: {
          status:        existing.status === 'Rejected' ? 'Pending Verification' : existing.status,
          changedBy:     userId,
          changedByName: userName,
          note:          'Submission diedit',
          timestamp:     new Date(),
        },
      },
    };

    // Jika items dikirim, parse ulang & hitung total baru
    if (req.body.items !== undefined) {
      const items = parseItems(req.body.items);
      if (items.length === 0) {
        return res.status(400).json({ msg: 'Minimal satu item biaya wajib diisi (nama & nominal)' });
      }
      updateData.items  = items;
      updateData.amount = items.reduce((sum, it) => sum + it.amount, 0);
    }

    if (req.file) updateData.file = req.file.filename;

    const updated = await ExpenseSubmission.findByIdAndUpdate(id, updateData, { new: true });
    res.json({ success: true, msg: 'Submission berhasil diupdate', data: updated });
  } catch (err) {
    console.error('Error update expense:', err);
    res.status(500).json({ msg: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. DELETE — hanya untuk submission yang belum Approved
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await ExpenseSubmission.findById(id);
    if (!existing) return res.status(404).json({ msg: 'Submission tidak ditemukan' });

    if (existing.status === 'Approved') {
      return res.status(400).json({ msg: 'Submission yang sudah Approved tidak bisa dihapus' });
    }

    await ExpenseSubmission.findByIdAndDelete(id);
    res.json({ success: true, msg: 'Submission berhasil dihapus' });
  } catch (err) {
    console.error('Error delete expense:', err);
    res.status(500).json({ msg: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. PENDING APPROVALS
// ─────────────────────────────────────────────────────────────────────────────
exports.getPendingExpenses = async (req, res) => {
  try {
    const pending = await ExpenseSubmission.find({ status: 'Pending Verification' })
      .populate('submittedBy', 'name username')
      .sort({ createdAt: 1 });
    res.json(pending);
  } catch (err) {
    console.error('Error get pending expenses:', err);
    res.status(500).json({ msg: err.message });
  }
};