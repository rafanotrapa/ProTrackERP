const ExpenseSubmission = require('../models/ExpenseSubmission');

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

/**
 * Peran yang boleh melihat pengajuan milik semua orang.
 *
 * Finance memverifikasinya; Administrator, Owner, Management, dan Super Admin
 * mengawasi. Sisanya — Marketing dan Procurement — adalah pihak pengaju, dan
 * hanya boleh melihat pengajuannya sendiri.
 *
 * 'Admin' ikut disebut karena nama peran lama itu masih dipakai di sebagian
 * rute; lihat catatan di middleware/auth.js.
 */
const PERAN_LIHAT_SEMUA = [
  'Finance', 'Administrator', 'Admin', 'Owner', 'Management', 'Super Admin',
];

const bolehLihatSemua = (user) => PERAN_LIHAT_SEMUA.includes(user?.role);

exports.getAllExpenses = async (req, res) => {
  try {
    const { status, projectId } = req.query;
    const filter = {};
    if (status)    filter.status    = status;
    if (projectId) filter.projectId = { $regex: projectId, $options: 'i' };

    // Penyaringan dilakukan di query, bukan di frontend, supaya pengajuan orang
    // lain tidak pernah ikut terkirim ke browser pengaju.
    if (!bolehLihatSemua(req.user)) {
      filter.submittedBy = req.user.id;
    }

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

exports.getExpenseById = async (req, res) => {
  try {
    const expense = await ExpenseSubmission.findById(req.params.id)
      .populate('submittedBy', 'name username')
      .populate('reviewedBy', 'name username');

    if (!expense) return res.status(404).json({ msg: 'Submission tidak ditemukan' });

    // Menyaring daftar saja tidak cukup: tanpa pemeriksaan ini, pengaju masih
    // bisa membuka milik orang lain dengan menebak/menyalin ID-nya.
    if (!bolehLihatSemua(req.user) && String(expense.submittedBy?._id || expense.submittedBy) !== String(req.user.id)) {
      return res.status(403).json({ msg: 'Anda hanya bisa melihat pengajuan sendiri.' });
    }

    res.json(expense);
  } catch (err) {
    console.error('Error get expense by id:', err);
    if (err.name === 'CastError') return res.status(400).json({ msg: 'Format ID tidak valid' });
    res.status(500).json({ msg: err.message });
  }
};

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

// updateExpense sengaja dihapus. Pengajuan biaya bersifat sekali kirim: setelah
// diajukan, satu-satunya perubahan yang sah datang dari Finance lewat
// reviewExpense (Approved / Rejected). Mengizinkan pengaju menyunting isinya
// membuat jejak audit tidak bisa dipercaya — nominal yang disetujui Finance bisa
// berbeda dengan yang dilihatnya saat memutuskan.

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