const mongoose = require('mongoose');

const SupplierQuotationSchema = new mongoose.Schema({
  quotationId: { type: String, required: true, unique: true },
  projectId: { type: String, required: true, trim: true }, // Ini ID BJK-xxx
  vendorId: { type: String, required: true },
  selectedItems: { type: String }, // Nama barang yang di-quote supplier
  cogs: { type: Number },
  topOption: { type: String },
  remarks: { type: String },
  timestamp: { type: Date, default: Date.now }
}, { 
  collection: 'supplier_quotation' 
});

module.exports = mongoose.model('SupplierQuotation', SupplierQuotationSchema);