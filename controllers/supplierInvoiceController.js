const SupplierInvoice = require('../models/SupplierInvoice');

// @desc    1. Submit Tagihan (Procurement Side)
exports.submitInvoice = async (req, res) => {
    try {
        const submission = await SupplierInvoice.create({
            ...req.body,
            file: req.file ? req.file.filename : null,
            user: req.user.id // Diambil dari middleware protect
        });
        res.status(201).json({ 
            success: true, 
            msg: 'Tagihan berhasil di-submit ke Finance',
            data: submission 
        });
    } catch (error) {
        console.error("Error Submit:", error);
        res.status(400).json({ msg: 'Gagal simpan invoice ke database' });
    }
};

// @desc    2. List Antrean Pembayaran (Finance Side)
exports.getAllInvoices = async (req, res) => {
    try {
        const invoices = await SupplierInvoice.find()
            .populate('user', 'name role') // Munculin siapa yang input
            .sort({ createdAt: -1 });
        res.status(200).json(invoices);
    } catch (error) {
        console.error("Error Get List:", error);
        res.status(500).json({ msg: 'Gagal ambil data antrean' });
    }
};

// @desc    3. Update Status (Approve/Reject by Finance)
exports.updateStatus = async (req, res) => {
    try {
        const invoice = await SupplierInvoice.findByIdAndUpdate(
            req.params.id, 
            { status: req.body.status }, 
            { new: true }
        );
        
        if (!invoice) {
            return res.status(404).json({ msg: 'Data tagihan tidak ditemukan' });
        }

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