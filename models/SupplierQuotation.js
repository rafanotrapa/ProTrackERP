const mongoose = require('mongoose');

const SupplierQuotationSchema = new mongoose.Schema({
  quotationId: { type: String, required: true, unique: true },
  projectId: { type: String, required: true, trim: true },
  vendorId: { type: String, required: true },
  
  // NGGAK PAKE selectedItems LAGI, GANTI JADI ARRAY OF OBJECTS
  items: [{ 
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    unit: { type: String, required: true },
    cogs: { type: Number, required: true }
  }],
  
  topOption: { type: String },
  remarks: { type: String },
  documentUrl: { type: String }, // <-- Tambahan buat nyimpen path file PDF/IMG
  timestamp: { type: Date, default: Date.now }
}, { 
  collection: 'supplier_quotation' 
});

module.exports = mongoose.model('SupplierQuotation', SupplierQuotationSchema);