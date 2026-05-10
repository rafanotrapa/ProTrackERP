const SupplierInvoice = require('../models/SupplierInvoice');

// 1. Submit Tagihan (Procurement Side)
exports.submitInvoice = async (req, res) => {
    try {
        console.log("=========================================");
        console.log("📥 API SUBMIT INVOICE TERPANGGIL!");
        console.log("📦 1. Data dari Frontend (req.body):", req.body);
        console.log("📁 2. File Upload (req.file):", req.file ? req.file.filename : "TIDAK ADA FILE");


        const userId = req.user ? (req.user._id || req.user.id) : null;
        console.log("👤 3. User ID yang Submit:", userId);

        // CEK DUPLIKAT NOMOR INVOICE MANUAL BIAR ERRORNYA JELAS
        const existingInvoice = await SupplierInvoice.findOne({ invoiceNumber: req.body.invoiceNumber });
        if (existingInvoice) {
            console.log("⚠️ 4. ERROR: Nomor Invoice sudah pernah diinput!");
            return res.status(400).json({ msg: `Nomor Tagihan ${req.body.invoiceNumber} sudah ada di sistem. Gunakan nomor lain!` });
        }

        const newInvoice = new SupplierInvoice({
            submissionId: req.body.submissionId,
            poId: req.body.poId,
            poNumber: req.body.poNumber,
            projectId: req.body.projectId,
            vendorName: req.body.vendorName,
            invoiceNumber: req.body.invoiceNumber,
            amount: Number(req.body.amount) || 0,
            remarks: req.body.remarks,
            file: req.file ? req.file.filename : null,
            user: userId,
            status: req.body.status || 'Pending Verification'
        });

        console.log("🛡️ 5. Data FINAL yang akan disuntik ke Mongoose:", newInvoice);

        const submission = await newInvoice.save();
        
        console.log("🎉 6. SUKSES SAVE INVOICE KE DATABASE!");
        console.log("=========================================");

        res.status(201).json({ 
            success: true, 
            msg: 'Tagihan berhasil di-submit ke Finance',
            data: submission 
        });
    } catch (error) {
        console.error("❌ ERROR DARI MONGOOSE/SERVER:", error);
        // Tembak pesan error asli Mongoose ke Frontend biar lu bisa baca
        res.status(500).json({ msg: `Gagal simpan invoice: ${error.message}` });
    }
};

//  2. List Antrean Pembayaran (Finance Side)
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

// 3. Update Status (Approve/Reject by Finance)
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