const mongoose = require('mongoose');

const SupplierQuotationSchema = new mongoose.Schema({
  quotationId: { type: String, required: true, unique: true },
  projectId: { type: String, required: true, trim: true },
  vendorId: { type: String, required: true },
  
  items: [{ 
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    unit: { type: String, required: true },
    cogs: { type: Number, required: true }
  }],
  
  additionalFee: { type: Number, default: 0 },
  additionalFeeRemarks: { type: String }, 
  
  // --- UBAHAN PAJAK ---
  isTaxIncluded: { type: Boolean, default: false }, 
  taxPercentage: { type: Number, default: 0 }, // Inputan user (ex: 11)
  taxAmount: { type: Number, default: 0 },     // Hasil hitungan (Subtotal * taxPercentage / 100)
  
  topOption: { type: String },
  remarks: { type: String },
  documentUrl: { type: String }, 
  timestamp: { type: Date, default: Date.now }
}, { 
  collection: 'supplier_quotation' 
});

module.exports = mongoose.model('SupplierQuotation', SupplierQuotationSchema);