const mongoose = require('mongoose');

const SupplierInvoiceSchema = new mongoose.Schema({
    submissionId: { type: String, required: true, unique: true },
    projectId: { type: String, required: true },
    projectName: { type: String },
    vendorName: { type: String, required: true },
    invoiceNumber: { type: String, required: true },
    amount: { type: Number, required: true },
    remarks: { type: String },
    file: { type: String, required: true }, 
    status: { 
        type: String, 
        enum: ['Pending Verification', 'Approved', 'Rejected'], 
        default: 'Pending Verification' 
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } 
}, { timestamps: true });

module.exports = mongoose.model('SupplierInvoice', SupplierInvoiceSchema);