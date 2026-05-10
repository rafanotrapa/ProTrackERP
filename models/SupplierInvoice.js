const mongoose = require('mongoose');

const SupplierInvoiceSchema = new mongoose.Schema({
  submissionId: { type: String }, // ID unik dari Frontend
  invoiceNumber: { type: String, required: true, unique: true },
  
  // UBAH DARI QUOTATION JADI PO
  poId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder' },
  poNumber: { type: String },
  projectId: { type: String },
  
  vendorName: { type: String, required: true },
  amount: { type: Number, required: true }, // Ubah dari totalAmount jadi amount biar cocok sama Frontend
  
  file: { type: String }, // Untuk simpan nama file scan
  remarks: { type: String },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Siapa yang upload
  
  invoiceDate: { type: Date, default: Date.now },
  dueDate: { type: Date },
  status: { type: String, default: 'Pending Verification' }, 
  paymentDate: { type: Date },
  bankInfo: { type: String }
}, { timestamps: true, collection: 'supplier_invoice' }); // Set nama collection biar rapi

module.exports = mongoose.model('SupplierInvoice', SupplierInvoiceSchema);