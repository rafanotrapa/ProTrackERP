const Payment = require('../models/Payment');
const ClientInvoice = require('../models/CreateInvoice');
const Project = require('../models/Project');
const ClientQuotation = require('../models/ClientQuotation');
 
exports.getInvoicesForPayment = async (req, res) => {
  try {
    const invoices = await ClientInvoice.find({ status: 'Unpaid' });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ msg: "Gagal memuat data invoice unpaid" });
  }
};

exports.createPayment = async (req, res) => {
  try {
    const { invoiceId, amountPaid, paymentDate, remarks } = req.body;
    if (!req.file) return res.status(400).json({ msg: "Bukti transfer wajib diunggah" });

    const invoice = await ClientInvoice.findById(invoiceId);
    if (invoice?.projectId && paymentDate) {
      const projectInvoiceIds = (await ClientInvoice.find({ projectId: invoice.projectId }, '_id')).map(i => i._id);
      const lastPayment = await Payment.findOne({ invoiceId: { $in: projectInvoiceIds } }).sort({ paymentDate: -1 });
      if (lastPayment && new Date(paymentDate) < new Date(lastPayment.paymentDate)) {
        return res.status(400).json({ msg: `Tanggal pembayaran tidak boleh lebih awal dari pembayaran sebelumnya (${new Date(lastPayment.paymentDate).toLocaleDateString('id-ID')})` });
      }
    }

    const newPayment = new Payment({
      invoiceId,
      amountPaid,
      paymentDate,
      remarks,
      evidencePath: req.file.filename
    });

    await newPayment.save();
    res.status(201).json({ msg: "Payment submitted successfully" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

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

exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('invoiceId');
    if (!payment) return res.status(404).json({ msg: "Data payment tidak ditemukan" });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ msg: "Server Error saat ambil detail" });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { paymentId, status } = req.body; 
    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ msg: "Data tidak ditemukan" });

    payment.status = status;
    await payment.save();

    if (status === 'Verified') {
      const invoice = await ClientInvoice.findByIdAndUpdate(
        payment.invoiceId,
        { status: 'Paid' },
        { new: true }
      );

      if (invoice?.projectId) {
        const quote = await ClientQuotation.findOne({
          projectId: invoice.projectId,
          approvalStatus: 'Approved',
        });
        if (quote) {
          const grandTotal =
            Number(quote.clientPrice || 0) + Number(quote.shippingFee || 0) + Number(quote.taxAmount || 0);
          const paidInvoices = await ClientInvoice.find({ projectId: invoice.projectId, status: 'Paid' });
          const totalPaid = paidInvoices.reduce((s, i) => s + Number(i.amount || 0), 0);
          if (grandTotal > 0 && totalPaid >= grandTotal - 1) {
            await Project.findOneAndUpdate({ projectId: invoice.projectId }, { status: 'Completed' });
          }
        }
      }
    }

    res.json({ msg: `Payment marked as ${status}` });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};