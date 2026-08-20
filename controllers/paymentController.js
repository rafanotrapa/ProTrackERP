const mongoose = require('mongoose');
const { kirimDiamDiam } = require('../utils/notify');
const { picMarketing, usersByRole, gabung } = require('../utils/notifyTargets');
const Payment = require('../models/Payment');
const ClientInvoice = require('../models/CreateInvoice');
const Project = require('../models/Project');
const ClientQuotation = require('../models/ClientQuotation');
const { totalTerbayar, sudahLunas } = require('../utils/clientPaymentStatus');

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

    // Kelebihan bayar dihitung terhadap sisa tagihan invoice ini (nilai invoice
    // dikurangi pembayaran yang sudah terverifikasi sebelumnya).
    const priorVerified = await Payment.aggregate([
      { $match: { invoiceId: new mongoose.Types.ObjectId(String(invoiceId)), status: 'Verified' } },
      { $group: { _id: null, total: { $sum: '$amountPaid' } } },
    ]);
    const alreadyPaid   = priorVerified[0]?.total || 0;
    const invoiceDue    = Math.max(Number(invoice?.amount || 0) - alreadyPaid, 0);
    const excessAmount  = Math.max(Number(amountPaid || 0) - invoiceDue, 0);

    const newPayment = new Payment({
      invoiceId,
      amountPaid,
      excessAmount,
      paymentDate,
      remarks,
      evidencePath: req.file.filename,
      createdBy: req.user?.id
    });

    await newPayment.save();
    res.status(201).json({ msg: "Payment submitted successfully" });

    kirimDiamDiam({ penerima: gabung([await usersByRole('Finance')], req.user?.id),
      jenis: 'paymentSubmitted',
      params: { nomor: invoice?.invoiceNumber || '', oleh: req.user?.username },
      targetTipe: 'verifyPayment', actor: req.user?.id });
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

    // Status invoice diturunkan dari uang yang benar-benar masuk, bukan dipasang
    // begitu saja. Sebelumnya baris ini menyetel 'Paid' tanpa syarat, sehingga
    // bayar sebagian sudah cukup untuk menutup tagihan penuh — layar verifikasi
    // bahkan menampilkan "Kurang Bayar" berwarna merah, lalu tetap dilunaskan.
    //
    // Dihitung ulang untuk status apa pun, bukan hanya 'Verified', supaya
    // pembayaran yang dibatalkan ikut menurunkan status invoicenya.
    const invoice = await ClientInvoice.findById(payment.invoiceId);
    if (invoice) {
      const masuk = await totalTerbayar(invoice._id);
      const lunas = sudahLunas(masuk, invoice.amount);
      invoice.status = lunas ? 'Paid' : 'Unpaid';
      await invoice.save();

      // Project hanya boleh dinyatakan selesai kalau seluruh tagihannya lunas.
      if (lunas && invoice.projectId) {
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

    // invoice sudah dimuat di atas untuk menghitung ulang statusnya.
    if (invoice) {
      const pPay = { nomor: invoice.invoiceNumber, oleh: req.user?.username };
      kirimDiamDiam({ penerima: gabung([await picMarketing(invoice.projectId)], req.user?.id),
        jenis: status === 'Verified' ? 'paymentVerified' : 'paymentRejected', params: pPay,
        targetTipe: 'timeline', targetId: invoice.projectId, actor: req.user?.id });

      // Project yang tuntas dikabarkan ke Management dan Owner sebagai
      // penutup alur, bukan sebagai perintah.
      const projek = await Project.findOne({ projectId: invoice.projectId }).select('status').lean();
      if (projek?.status === 'Completed') {
        const [mg, ow] = await Promise.all([usersByRole('Management'), usersByRole('Owner')]);
        kirimDiamDiam({ penerima: gabung([mg, ow], req.user?.id), jenis: 'projectCompleted',
          params: { nomor: invoice.projectId, oleh: req.user?.username },
          targetTipe: 'projectLog', actor: req.user?.id });
      }
    }
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};