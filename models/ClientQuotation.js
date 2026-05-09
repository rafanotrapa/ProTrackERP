const mongoose = require('mongoose');

const ClientQuotationSchema = new mongoose.Schema({
  quotationId: { type: String, required: true, unique: true },
  projectId: { type: String, required: true },
  clientName: { type: String },
  
  // GANTI String JADI Array of Objects BIAR SAMA KAYAK SUPPLIER
  items: [{ 
    itemName: String,
    quantity: Number,
    unit: String,
    cogs: Number
  }],

  currency: { type: String, default: 'IDR' },
  clientPrice: { type: Number, required: true },
  topOption: { type: String },
  remarks: { type: String },
  timestamp: { type: Date, default: Date.now }
}, { collection: 'client_quotation' });

module.exports = mongoose.model('ClientQuotation', ClientQuotationSchema);