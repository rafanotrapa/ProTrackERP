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
  
  // FIELD BARU: Biaya tambahan (Opsional)
  additionalFee: { type: Number, default: 0 },
  
  topOption: { type: String },
  remarks: { type: String },
  documentUrl: { type: String }, 
  timestamp: { type: Date, default: Date.now }
}, { 
  collection: 'supplier_quotation' 
});

module.exports = mongoose.model('SupplierQuotation', SupplierQuotationSchema);