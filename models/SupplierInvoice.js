const mongoose = require('mongoose');

const SupplierInvoiceSchema = new mongoose.Schema({
  submissionId: { type: String }, 
  invoiceNumber: { type: String, required: true, unique: true },
  
  poId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder' },
  poNumber: { type: String },
  projectId: { type: String },
  vendorName: { type: String, required: true },
  
  currency: { type: String, default: 'IDR' },
  terminName: { type: String, default: 'Full Payment' }, 
  amount: { type: Number, required: true }, 

  // --- FITUR BARU: PAJAK & BEA CUKAI ---
  isTaxEnabled: { type: Boolean, default: false },
  taxAmount: { type: Number, default: 0 },
  isImportEnabled: { type: Boolean, default: false },
  importDutyAmount: { type: Number, default: 0 },
  
  file: { type: String }, 
  remarks: { type: String },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
  
  invoiceDate: { type: Date, default: Date.now },
  dueDate: { type: Date },
  status: { type: String, default: 'Pending Verification' }, 
  paymentDate: { type: Date },
  bankInfo: { type: String }
}, { timestamps: true, collection: 'supplier_invoice' }); 

module.exports = mongoose.model('SupplierInvoice', SupplierInvoiceSchema);