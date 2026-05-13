const Payment = require('../models/Payment');
const ClientInvoice = require('../models/CreateInvoice');

// 1. Ambil data Invoice Unpaid (Marketing dropdown)
exports.getInvoicesForPayment = async (req, res) => {
  try {
    const invoices = await ClientInvoice.find({ status: 'Unpaid' });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ msg: "Gagal memuat data invoice unpaid" });
  }
};

// 2. Submit Bukti Pembayaran Baru (Marketing side)
exports.createPayment = async (req, res) => {
  try {
    const { invoiceId, amountPaid, paymentDate, remarks } = req.body;
    if (!req.file) return res.status(400).json({ msg: "Bukti transfer wajib diunggah" });

    const newPayment = new Payment({
      invoiceId,
      amountPaid,
      paymentDate,
      remarks,
      evidencePath: req.file.path
    });

    await newPayment.save();
    res.status(201).json({ msg: "Payment submitted successfully" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// 3. List Semua Payment (Finance list page)
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('invoiceId')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ msg: "Gagal mengambil data verifikasi" });
  }
};

// 4. Detail Satu Payment (Finance detail page)
exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('invoiceId');
    if (!payment) return res.status(404).json({ msg: "Data payment tidak ditemukan" });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ msg: "Server Error saat ambil detail" });
  }
};

// 5. Verifikasi & Update Status Invoice (Finance save button)
exports.verifyPayment = async (req, res) => {
  try {
    const { paymentId, status } = req.body; 
    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ msg: "Data tidak ditemukan" });

    payment.status = status;
    await payment.save();

    if (status === 'Verified') {
      await ClientInvoice.findByIdAndUpdate(payment.invoiceId, { status: 'Paid' });
    }

    res.json({ msg: `Payment marked as ${status}` });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};