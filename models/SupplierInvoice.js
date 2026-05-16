const mongoose = require('mongoose');

const SupplierInvoiceSchema = new mongoose.Schema({
  submissionId: { type: String }, 
  invoiceNumber: { type: String, required: true, unique: true },
  
  poId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder' },
  poNumber: { type: String },
  projectId: { type: String },
  vendorName: { type: String, required: true },
  
  // --- FITUR BARU: CURRENCY & TERMIN ---
  currency: { type: String, default: 'IDR' },
  terminName: { type: String, default: 'Full Payment' }, // ex: "DP 30%" atau "Pelunasan"
  amount: { type: Number, required: true }, 
  
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