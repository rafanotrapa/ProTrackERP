const ClientInvoice = require('../models/ClientInvoice');
const Log = require('../models/Log');

exports.verifyPayment = async (req, res) => {
    try {
        const { invoiceId, bankName, amountPaid } = req.body;
        const file = req.file; 

        if (!invoiceId) {
            return res.status(400).json({ msg: "ID Invoice tidak ditemukan!" });
        }

        const invoice = await ClientInvoice.findByIdAndUpdate(
            invoiceId,
            {
                status: 'Paid',
                paymentEvidence: file ? file.filename : null,
                paymentDate: new Date()
            },
            { new: true }
        );

        if (!invoice) {
            return res.status(404).json({ msg: "Invoice tidak ditemukan!" });
        }

        try {
            await Log.create({
                user: req.user?.name || "Finance System",
                action: `Verified Payment for Invoice #${invoice.invoiceNumber} via ${bankName || 'Bank'}`,
                category: 'FINANCE',
                type: 'APPROVE'
            });
        } catch (logErr) {
            console.error("Log Error:", logErr.message);
        }

        res.status(200).json({ success: true, msg: "Payment Verified!", data: invoice });
    } catch (error) {
        console.error("SERVER ERROR:", error.message);
        res.status(500).json({ msg: "Terjadi kesalahan server", error: error.message });
    }
};