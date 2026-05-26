const mongoose = require('mongoose');

// Skema untuk log riwayat status
const StatusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  changedByName: { type: String },
  note: { type: String },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const SupplierInvoiceSchema = new mongoose.Schema({
  submissionId: { type: String }, 
  invoiceNumber: { type: String, required: true, unique: true },
  
  poId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder' },
  poNumber: { type: String },
  projectId: { type: String },
  vendorName: { type: String, required: true },
  
  currency: { type: String, default: 'IDR' },
  terminName: { type: String, default: 'Full Payment' }, 
  
  // --- NOMINAL TAGIHAN ---
  amount: { type: Number, required: true }, // Base amount
  totalAmount: { type: Number, default: 0 }, // Grand total (Base + Tax + Import Duty)

  // --- FITUR BARU: PAJAK & BEA CUKAI ---
  isTaxEnabled: { type: Boolean, default: false },
  taxAmount: { type: Number, default: 0 },
  isImportEnabled: { type: Boolean, default: false },
  importDutyAmount: { type: Number, default: 0 },
  customsDutyNote: { type: String },
  
  file: { type: String }, 
  remarks: { type: String },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
  
  invoiceDate: { type: Date, default: Date.now },
  dueDate: { type: Date },
  status: { type: String, default: 'Pending Verification' }, 
  
  // Array untuk menyimpan track record / log
  statusHistory: [StatusHistorySchema],

  paymentDate: { type: Date },
  bankInfo: { type: String }
}, { timestamps: true, collection: 'supplier_invoice' }); 

module.exports = mongoose.model('SupplierInvoice', SupplierInvoiceSchema);