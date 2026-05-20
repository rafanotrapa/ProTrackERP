const SupplierInvoice = require('../models/SupplierInvoice');
const PurchaseOrder = require('../models/PurchaseOrder');

// 1. Submit Tagihan (Procurement Side)
exports.submitInvoice = async (req, res) => {
    try {
        const userId = req.user ? (req.user._id || req.user.id) : null;

        const existingInvoice = await SupplierInvoice.findOne({ invoiceNumber: req.body.invoiceNumber });
        if (existingInvoice) {
            return res.status(400).json({ msg: `Nomor Tagihan ${req.body.invoiceNumber} sudah ada di sistem!` });
        }

        const newInvoice = new SupplierInvoice({
            submissionId: req.body.submissionId,
            poId: req.body.poId,
            poNumber: req.body.poNumber,
            projectId: req.body.projectId,
            vendorName: req.body.vendorName,
            
            // --- INI DIA YANG KETINGGALAN! ---
            invoiceNumber: req.body.invoiceNumber, 
            
            // --- DATA BARU DARI FRONTEND ---
            currency: req.body.currency || 'IDR',
            terminName: req.body.terminName || 'Full Payment',
            
            amount: Number(req.body.amount) || 0,
            remarks: req.body.remarks,
            file: req.file ? req.file.filename : null,
            user: userId,
            status: 'Pending Verification'
        });

        const submission = await newInvoice.save();
        
        // --- UPDATE STATUS TERMIN DI TABEL PO JIKA INI PEMBAYARAN TERMIN ---
        if (req.body.terminName && req.body.terminName !== 'Full Payment') {
            await PurchaseOrder.findOneAndUpdate(
                { _id: req.body.poId, "paymentTerms.description": req.body.terminName },
                { $set: { "paymentTerms.$.status": "Invoiced" } } 
            );
        }

        res.status(201).json({ 
            success: true, 
            msg: 'Tagihan berhasil di-submit ke Finance',
            data: submission 
        });
    } catch (error) {
        res.status(500).json({ msg: `Gagal simpan invoice: ${error.message}` });
    }
};

//  2. List Antrean Pembayaran (Finance Side)
exports.getAllInvoices = async (req, res) => {
    try {
        const invoices = await SupplierInvoice.find()
            .populate('user', 'name role')
            .sort({ createdAt: -1 });
        res.status(200).json(invoices);
    } catch (error) {
        console.error("Error Get List:", error);
        res.status(500).json({ msg: 'Gagal ambil data antrean' });
    }
};

// 3. Update Status (Approve/Reject by Finance)
exports.updateStatus = async (req, res) => {
    try {
        const invoice = await SupplierInvoice.findByIdAndUpdate(
            req.params.id, 
            { status: req.body.status }, 
            { new: true }
        );
        
        if (!invoice) return res.status(404).json({ msg: 'Data tagihan tidak ditemukan' });

        res.status(200).json({ 
            success: true, 
            msg: `Status berhasil diupdate menjadi ${req.body.status}`,
            data: invoice 
        });
    } catch (error) {
        console.error("Error Update Status:", error);
        res.status(500).json({ msg: 'Gagal update status' });
    }
};

exports.getPendingPayments = async (req, res) => {
  try {
    const pendingInvoices = await SupplierInvoice.find({ 
      status: 'Pending Verification' 
    }).sort({ createdAt: 1 });
    res.json(pendingInvoices);
  } catch (err) {
    console.error("Error get pending payments:", err);
    res.status(500).json({ msg: err.message });
  }
};

// 5. CONFIRM PAYMENT (Finance mark as Paid)
exports.confirmPayment = async (req, res) => {
  try {
    const invoice = await SupplierInvoice.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'Paid', 
        paymentDate: new Date() 
      },
      { new: true }
    );
    
    if (!invoice) {
      return res.status(404).json({ msg: 'Invoice tidak ditemukan' });
    }
    
    res.json({ 
      success: true, 
      msg: 'Payment confirmed successfully', 
      data: invoice 
    });
  } catch (err) {
    console.error("Error confirm payment:", err);
    res.status(500).json({ msg: err.message });
  }
};

exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await SupplierInvoice.findById(req.params.id).populate('user', 'name');
    if (!invoice) {
      return res.status(404).json({ msg: 'Invoice tidak ditemukan' });
    }
    res.json(invoice);
  } catch (err) {
    console.error("Error get invoice by id:", err);
    res.status(500).json({ msg: err.message });
  }
};