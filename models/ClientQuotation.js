const mongoose = require('mongoose');

const ClientQuotationSchema = new mongoose.Schema({
  // --- IDENTITAS ---
  quotationId:  { type: String, required: true, unique: true },
  projectId:    { type: String, required: true },
  projectName:  { type: String },
  clientName:   { type: String },

  // --- DAFTAR BARANG ---
  items: [{
    itemName:   String,
    quantity:   Number,
    unit:       String,
    cogs:       Number,
    salesPrice: Number,
  }],

  // --- KOMERSIAL ---
  currency:    { type: String, default: 'IDR' },
  clientPrice: { type: Number, required: true },
  topOption:   { type: String },
  remarks:     { type: String },

  // --- PAJAK & BIAYA ---
  shippingFee:   { type: Number, default: 0 },
  taxPercentage: { type: Number, default: 0 },   // 0 = Non-PPN, >0 = kena pajak
  taxAmount:     { type: Number, default: 0 },

  // --- REKENING BANK (hanya relevan jika kena pajak / PPN) ---
  // Kosong string = non-PPN, diisi = kena PPN
  bankAccount: { type: String, default: '' },

  // --- SISTEM APPROVAL ---
  approvalStatus: {
    type:    String,
    enum:    ['Draft', 'Pending', 'Approved', 'Rejected'],
    default: 'Draft',
  },
  approvalDate:    { type: Date },
  approvedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: { type: String },

  // --- QUOTATION MODE ---
  quotationMode: { type: String, enum: ['auto', 'manual'], default: 'auto' },

  // --- LOG WAKTU ---
  timestamp: { type: Date, default: Date.now },
}, {
  collection: 'client_quotation',
  timestamps: true,
});

module.exports = mongoose.model('ClientQuotation', ClientQuotationSchema);