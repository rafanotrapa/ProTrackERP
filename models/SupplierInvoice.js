const mongoose = require('mongoose');

const SupplierInvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  quotationId: { type: mongoose.Schema.Types.ObjectId, ref: 'SupplierQuotation' },
  vendorName: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  invoiceDate: { type: Date, default: Date.now },
  dueDate: { type: Date },
  status: { type: String, default: 'Pending' }, // Pending, Approved, Paid
  paymentDate: { type: Date },
  bankInfo: { type: String },
  remarks: { type: String },
  submittedBy: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('SupplierInvoice', SupplierInvoiceSchema, 'supplier_invoice');