const SupplierInvoice = require('../models/SupplierInvoice');
const PurchaseOrder   = require('../models/PurchaseOrder');

// ─────────────────────────────────────────────────────────────────────────────
// 1. SUBMIT TAGIHAN (Procurement Side)
// ─────────────────────────────────────────────────────────────────────────────
exports.submitInvoice = async (req, res) => {
  try {
    const userId   = req.user ? (req.user._id || req.user.id) : null;
    const userName = req.user ? (req.user.name || req.user.username || 'System') : 'System';

    const existingInvoice = await SupplierInvoice.findOne({ invoiceNumber: req.body.invoiceNumber });
    if (existingInvoice) {
      return res.status(400).json({ msg: `Nomor Tagihan ${req.body.invoiceNumber} sudah ada di sistem!` });
    }

    const isImportEnabled  = req.body.isImportEnabled === 'true' || req.body.isImportEnabled === true;
    const importDutyAmount = isImportEnabled ? (Number(req.body.importDutyAmount) || 0) : 0;
    const isTaxEnabled     = req.body.isTaxEnabled === 'true' || req.body.isTaxEnabled === true;
    const taxAmount        = isTaxEnabled ? (Number(req.body.taxAmount) || 0) : 0;
    const baseAmount       = Number(req.body.amount) || 0;
    const totalAmount      = baseAmount + importDutyAmount + taxAmount;

    const newInvoice = new SupplierInvoice({
      submissionId:    req.body.submissionId,
      poId:            req.body.poId,
      poNumber:        req.body.poNumber,
      projectId:       req.body.projectId,
      vendorName:      req.body.vendorName,
      invoiceNumber:   req.body.invoiceNumber,
      currency:        req.body.currency || 'IDR',
      terminName:      req.body.terminName || 'Full Payment',
      amount:          baseAmount,
      totalAmount,
      isTaxEnabled,
      taxAmount,
      isImportEnabled,
      importDutyAmount,
      customsDutyNote: req.body.customsDutyNote || '',
      remarks:         req.body.remarks,
      file:            req.file ? req.file.filename : null,
      user:            userId,
      status:          'Pending Verification',
      statusHistory: [{
        status:        'Pending Verification',
        changedBy:     userId,
        changedByName: userName,
        note:          'Invoice submitted by Procurement',
        timestamp:     new Date()
      }]
    });

    const submission = await newInvoice.save();

    if (req.body.terminName && req.body.terminName !== 'Full Payment') {
      await PurchaseOrder.findOneAndUpdate(
        { _id: req.body.poId, 'paymentTerms.description': req.body.terminName },
        { $set: { 'paymentTerms.$.status': 'Invoiced' } }
      );
    }

    res.status(201).json({ success: true, msg: 'Tagihan berhasil di-submit ke Finance', data: submission });
  } catch (error) {
    res.status(500).json({ msg: `Gagal simpan invoice: ${error.message}` });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. LIST SEMUA INVOICE (Finance Side)
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllInvoices = async (req, res) => {
  try {
    const invoices = await SupplierInvoice.find()
      .populate('user', 'name role')
      .sort({ createdAt: -1 });
    res.status(200).json(invoices);
  } catch (error) {
    console.error('Error Get List:', error);
    res.status(500).json({ msg: 'Gagal ambil data antrean' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. UPDATE STATUS (Approve / Reject by Finance)
// ─────────────────────────────────────────────────────────────────────────────
exports.updateStatus = async (req, res) => {
  try {
    const userId   = req.user ? (req.user._id || req.user.id) : null;
    const userName = req.user ? (req.user.name || req.user.username || 'System') : 'System';

    const historyEntry = {
      status:        req.body.status,
      changedBy:     userId,
      changedByName: userName,
      note:          req.body.note || '',
      timestamp:     new Date()
    };

    const invoice = await SupplierInvoice.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status, $push: { statusHistory: historyEntry } },
      { new: true }
    );

    if (!invoice) return res.status(404).json({ msg: 'Data tagihan tidak ditemukan' });

    res.status(200).json({
      success: true,
      msg:  `Status berhasil diupdate menjadi ${req.body.status}`,
      data: invoice
    });
  } catch (error) {
    console.error('Error Update Status:', error);
    res.status(500).json({ msg: 'Gagal update status' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. PENDING PAYMENTS
// ─────────────────────────────────────────────────────────────────────────────
exports.getPendingPayments = async (req, res) => {
  try {
    const pendingInvoices = await SupplierInvoice.find({ status: 'Pending Verification' })
      .sort({ createdAt: 1 });
    res.json(pendingInvoices);
  } catch (err) {
    console.error('Error get pending payments:', err);
    res.status(500).json({ msg: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. CONFIRM PAYMENT (Finance mark as Paid)
// ─────────────────────────────────────────────────────────────────────────────
exports.confirmPayment = async (req, res) => {
  try {
    const userId   = req.user ? (req.user._id || req.user.id) : null;
    const userName = req.user ? (req.user.name || req.user.username || 'System') : 'System';

    const historyEntry = {
      status:        'Paid',
      changedBy:     userId,
      changedByName: userName,
      note:          req.body.note || 'Payment confirmed by Finance',
      timestamp:     new Date()
    };

    const invoice = await SupplierInvoice.findByIdAndUpdate(
      req.params.id,
      { status: 'Paid', paymentDate: new Date(), $push: { statusHistory: historyEntry } },
      { new: true }
    );

    if (!invoice) return res.status(404).json({ msg: 'Invoice tidak ditemukan' });

    res.json({ success: true, msg: 'Payment confirmed successfully', data: invoice });
  } catch (err) {
    console.error('Error confirm payment:', err);
    res.status(500).json({ msg: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. GET BY ID
// FIX: hapus populate('statusHistory.changedBy') → StrictPopulateError
//      karena changedBy di statusHistory bukan ObjectId ref di schema
// ─────────────────────────────────────────────────────────────────────────────
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await SupplierInvoice.findById(req.params.id)
      .populate('user', 'name username'); // hanya populate 'user' yang ada di schema

    if (!invoice) return res.status(404).json({ msg: 'Invoice tidak ditemukan' });
    res.json(invoice);
  } catch (err) {
    console.error('Error get invoice by id:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ msg: 'Format ID tidak valid' });
    }
    res.status(500).json({ msg: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. GET TRACK RECORD
// ─────────────────────────────────────────────────────────────────────────────
exports.getInvoiceRecord = async (req, res) => {
  try {
    const { status, vendorName, projectId } = req.query;
    const filter = {};
    if (status)     filter.status     = status;
    if (vendorName) filter.vendorName = { $regex: vendorName, $options: 'i' };
    if (projectId)  filter.projectId  = { $regex: projectId,  $options: 'i' };

    const records = await SupplierInvoice.find(filter)
      .populate('user', 'name role')
      .sort({ createdAt: -1 });

    res.json(records);
  } catch (err) {
    console.error('Error get invoice record:', err);
    res.status(500).json({ msg: err.message });
  }
};