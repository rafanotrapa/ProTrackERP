const mongoose = require('mongoose');

const ClientQuotationSchema = new mongoose.Schema({
  // --- IDENTITAS ---
  quotationId: { type: String, required: true, unique: true },
  projectId: { type: String, required: true },
  projectName: { type: String },
  clientName: { type: String },
  
  // --- DAFTAR BARANG ---
  items: [{ 
    itemName: String,
    quantity: Number,
    unit: String,
    cogs: Number,
    salesPrice: Number
  }],

  // --- KOMERSIAL ---
  currency: { type: String, default: 'IDR' },
  clientPrice: { type: Number, required: true },
  topOption: { type: String },
  remarks: { type: String },
  
  // --- SISTEM APPROVAL ---
  approvalStatus: { 
    type: String, 
    enum: ['Draft', 'Pending', 'Approved', 'Rejected'], 
    default: 'Draft' 
  },
  approvalDate: { type: Date },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: { type: String },

  // --- QUOTATION MODE (Auto dari supplier / Manual input) ---
  quotationMode: { type: String, enum: ['auto', 'manual'], default: 'auto' },
  shippingFee: { type: Number, default: 0 },
  taxPercentage: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  
  // --- LOG WAKTU ---
  timestamp: { type: Date, default: Date.now }
}, { 
  collection: 'client_quotation',
  timestamps: true 
});

module.exports = mongoose.model('ClientQuotation', ClientQuotationSchema);